const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cron = require('node-cron');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { cleanupExpiredPartnerMessages } = require('./jobs/partnerCleanup');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Global state for health check
let dbConnected = false;

// Middleware to check DB status
const checkDbConnection = async (req, res, next) => {
    if (!dbConnected && !req.path.includes('/health')) {
        await connectDB();
    }
    if (!dbConnected && !req.path.includes('/health')) {
        return res.status(503).json({ 
            message: 'Database is currently unavailable. Please check the backend logs for network/whitelist issues.',
            status: 'error'
        });
    }
    next();
};

// Make io available to routes
app.set('io', io);

// Middleware
// Middleware
// TEMPORARY: Allow all origins to debug "Failed to Fetch"
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const reelRoutes = require('./routes/reelRoutes');
const chatRoutes = require('./routes/chatRoutes');
const partnerChatRoutes = require('./routes/partnerChatRoutes');
const aiRoutes = require('./routes/aiRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const searchRoutes = require('./routes/searchRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');
const groupRoutes = require('./routes/groupRoutes');

app.use(checkDbConnection);

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/reels', reelRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/partner-chat', partnerChatRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/groups', groupRoutes);

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ 
        status: dbConnected ? 'ok' : 'error', 
        database: dbConnected ? 'connected' : 'disconnected',
        timestamp: new Date()
    });
});

// MongoDB Connection
let mongodInstance = null;
let connectingPromise = null;

const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) {
        dbConnected = true;
        return;
    }
    if (connectingPromise) {
        return connectingPromise;
    }

    connectingPromise = (async () => {
        console.log('🔄 Attempting to connect to MongoDB...');
        const uri = process.env.MONGO_URI;

        // 1. If remote Atlas URI is provided, attempt connection directly
        if (uri && (uri.includes('mongodb+srv') || uri.includes('@'))) {
            try {
                await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
                console.log('✅ Connected to MongoDB Atlas successfully');
                dbConnected = true;
                return;
            } catch (err) {
                console.error('❌ CRITICAL: Remote MongoDB Connection Failed.');
                console.error('ERROR MESSAGE:', err.message);
                if (err.message.includes('IP address') || err.message.includes('buffering timed out')) {
                    console.error('👉 ACTION REQUIRED: Whitelist your IP in MongoDB Atlas (Network Access -> 0.0.0.0/0).');
                } else if (err.message.includes('Authentication failed')) {
                    console.error('👉 ACTION REQUIRED: Authentication failed. Please check your password in .env.');
                }
                dbConnected = false;
                return;
            }
        }

        // 2. Try local MongoDB first if running
        try {
            const localUri = uri || 'mongodb://127.0.0.1:27017/acn_plus';
            await mongoose.connect(localUri, { serverSelectionTimeoutMS: 2000 });
            console.log('✅ Connected to local MongoDB successfully');
            dbConnected = true;
        } catch (localErr) {
            // 3. Fallback to in-memory MongoDB server for local development
            if (process.env.VERCEL) {
                console.error('❌ MONGO_URI is required when running on Vercel.');
                dbConnected = false;
                return;
            }
            console.warn('⚠️ Local MongoDB not running on port 27017. Starting in-memory MongoDB server...');
            try {
                const { MongoMemoryServer } = require('mongodb-memory-server');
                if (!mongodInstance) {
                    mongodInstance = await MongoMemoryServer.create({
                        binary: { arch: 'x64', version: '7.0.14' }
                    });
                }
                const memUri = mongodInstance.getUri();
                await mongoose.connect(memUri);
                console.log('✅ Connected to in-memory MongoDB at', memUri);
                dbConnected = true;
            } catch (memErr) {
                console.error('❌ Failed to start in-memory MongoDB:', memErr.message);
                dbConnected = false;
            }
        }
    })().finally(() => {
        connectingPromise = null;
    });

    return connectingPromise;
};

connectDB();

// Initial Route
app.get('/', (req, res) => {
    res.send('ACN+ API is running');
});

// ==================== Socket.io ====================
const connectedUsers = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Handle user joining with their ID
    socket.on('join', (userId) => {
        connectedUsers.set(userId, socket.id);
        socket.userId = userId;
        // Broadcast online status
        io.emit('user_status', { userId, online: true });
        console.log(`User ${userId} joined with socket ${socket.id}`);
    });

    // Join partner chat room
    socket.on('join_partner_chat', (chatId) => {
        socket.join(`partner_${chatId}`);
        console.log(`User ${socket.userId} joined partner chat ${chatId}`);
    });

    // Leave partner chat room
    socket.on('leave_partner_chat', (chatId) => {
        socket.leave(`partner_${chatId}`);
    });

    // Handle private messages (regular chat)
    socket.on('private_message', async (data) => {
        const { receiverId, message, chatId } = data;
        const receiverSocketId = connectedUsers.get(receiverId);

        if (receiverSocketId) {
            io.to(receiverSocketId).emit('new_message', {
                type: 'new_message',
                message: message, // Pass the full message object with _id
                chatId
            });
        }
    });

    socket.on('edit_message', (data) => {
        const { receiverId, message, chatId } = data;
        const receiverSocketId = connectedUsers.get(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('message_edited', { message, chatId });
        }
    });

    socket.on('delete_message', (data) => {
        const { receiverId, messageId, chatId } = data;
        const receiverSocketId = connectedUsers.get(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('message_deleted', { messageId, chatId });
        }
    });

    // Partner Chat Events
    socket.on('partner_message', (data) => {
        const { chatId, message } = data;
        socket.to(`partner_${chatId}`).emit('partner_new_message', message);
    });

    socket.on('partner_message_edited', (data) => {
        const { chatId, message } = data;
        socket.to(`partner_${chatId}`).emit('partner_message_edited', message);
    });

    socket.on('partner_message_deleted', (data) => {
        const { chatId, messageId } = data;
        socket.to(`partner_${chatId}`).emit('partner_message_deleted', { messageId });
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
        const { receiverId, isTyping } = data;
        const receiverSocketId = connectedUsers.get(receiverId);

        if (receiverSocketId) {
            io.to(receiverSocketId).emit('user_typing', {
                userId: socket.userId,
                isTyping
            });
        }
    });

    // Partner typing
    socket.on('partner_typing', (data) => {
        const { chatId, isTyping } = data;
        socket.to(`partner_${chatId}`).emit('partner_user_typing', {
            userId: socket.userId,
            isTyping
        });
    });

    // Partner theme change
    socket.on('partner_theme_change', (data) => {
        const { chatId, theme } = data;
        socket.to(`partner_${chatId}`).emit('partner_theme_change', theme);
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
        if (socket.userId) {
            connectedUsers.delete(socket.userId);
            io.emit('user_status', { userId: socket.userId, online: false });
            console.log(`User ${socket.userId} disconnected`);
        }
    });
});

// Get online users endpoint
app.get('/api/online-users', (req, res) => {
    res.json(Array.from(connectedUsers.keys()));
});

// ==================== Cleanup Jobs ====================
if (require.main === module && !process.env.VERCEL) {
    cron.schedule('0 * * * *', () => {
        console.log('[CRON] Running partner message cleanup...');
        cleanupExpiredPartnerMessages();
    });
    setTimeout(() => cleanupExpiredPartnerMessages(), 5000);
}

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('❌ UNHANDLED ERROR:', err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'An internal server error occurred',
        status: 'error'
    });
});

const PORT = process.env.PORT || 5000;
if (require.main === module && !process.env.VERCEL) {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
