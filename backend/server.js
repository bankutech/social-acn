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
const checkDbConnection = (req, res, next) => {
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
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',').map(o => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        const isAllowed = allowedOrigins.some(ao => {
            if (ao.includes('*')) {
                const reg = new RegExp('^' + ao.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
                return reg.test(origin);
            }
            return ao === origin;
        });

        if (isAllowed) {
            callback(null, true);
        } else {
            console.warn(`Blocked by CORS: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const storyRoutes = require('./routes/storyRoutes');
const reelRoutes = require('./routes/reelRoutes');
const chatRoutes = require('./routes/chatRoutes');
const aiRoutes = require('./routes/aiRoutes');
const partnerChatRoutes = require('./routes/partnerChatRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

app.use(checkDbConnection);

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/reels', reelRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/partner-chat', partnerChatRoutes);
app.use('/api/upload', uploadRoutes);

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ 
        status: dbConnected ? 'ok' : 'error', 
        database: dbConnected ? 'connected' : 'disconnected',
        timestamp: new Date()
    });
});

// MongoDB Connection
const connectDB = async () => {
    console.log('🔄 Attempting to connect to MongoDB...');
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/acn_plus';
        if (!process.env.MONGO_URI) {
            console.warn('⚠️ WARNING: MONGO_URI is not set, falling back to localhost.');
        }
        await mongoose.connect(uri);
        console.log('✅ MongoDB Connected successfully');
        dbConnected = true;
    } catch (err) {
        console.error('❌ CRITICAL: MongoDB Connection Failed.');
        console.error('ERROR MESSAGE:', err.message);
        
        if (err.message.includes('IP address') || err.message.includes('buffering timed out')) {
            console.error('👉 ACTION REQUIRED: Your IP is likely not whitelisted. Go to MongoDB Atlas -> Network Access and add 0.0.0.0/0.');
        } else if (err.message.includes('Authentication failed')) {
            console.error('👉 ACTION REQUIRED: Authentication failed. Please check your password in .env.');
        }
        
        dbConnected = false;
        // Attempt to reconnect every 30 seconds
        console.log('🔄 Will retry connection in 30 seconds...');
        setTimeout(connectDB, 30000);
    }
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

    // Handle partner messages
    socket.on('partner_message', (data) => {
        const { chatId, message } = data;
        socket.to(`partner_${chatId}`).emit('partner_new_message', message);
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
// Run every hour to clean up expired partner messages & images
cron.schedule('0 * * * *', () => {
    console.log('[CRON] Running partner message cleanup...');
    cleanupExpiredPartnerMessages();
});

// Also run on startup
setTimeout(() => cleanupExpiredPartnerMessages(), 5000);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('❌ UNHANDLED ERROR:', err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'An internal server error occurred',
        status: 'error'
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
