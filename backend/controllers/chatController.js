const Chat = require('../models/Chat');
const User = require('../models/User');
const { sendPushNotification } = require('../utils/push');

const getDemoChatStore = () => {
    if (!global.__acn_demo_chat_store) {
        global.__acn_demo_chat_store = {
            users: [
                { _id: 'demo_user_1', name: 'Aisha', avatarUrl: 'https://i.pravatar.cc/150?u=demo_user_1', email: 'aisha@demo.acn.plus' },
                { _id: 'demo_user_2', name: 'Ben', avatarUrl: 'https://i.pravatar.cc/150?u=demo_user_2', email: 'ben@demo.acn.plus' },
                { _id: 'demo_user_3', name: 'Chen', avatarUrl: 'https://i.pravatar.cc/150?u=demo_user_3', email: 'chen@demo.acn.plus' },
            ],
            chatsByKey: new Map(),
        };
    }
    return global.__acn_demo_chat_store;
};

const demoKeyFor = (a, b) => [String(a), String(b)].sort().join('__');

exports.getChats = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        if (userId === 'mock_id_123') {
            const store = getDemoChatStore();
            const chats = Array.from(store.chatsByKey.values())
                .filter(c => c.participants.some(p => String(p._id || p) === 'mock_id_123'))
                .sort((a, b) => new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0));
            return res.json(chats);
        }

        const chats = await Chat.find({ 
            participants: { $in: [userId] }
        })
        .populate('participants', 'name avatarUrl')
        .populate('messages.sender', 'name avatarUrl')
        .sort({ lastMessageTime: -1 });

        res.json(chats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getChat = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        if (userId === 'mock_id_123') {
            const store = getDemoChatStore();
            const key = demoKeyFor(userId, req.params.userId);
            if (!store.chatsByKey.has(key)) {
                const partner = store.users.find(u => u._id === req.params.userId) || { _id: req.params.userId, name: 'Demo User', avatarUrl: 'https://i.pravatar.cc/150?u=' + req.params.userId };
                store.chatsByKey.set(key, {
                    _id: `demo_chat_${key}`,
                    participants: [
                        { _id: 'mock_id_123', name: 'Demo Student', avatarUrl: 'https://i.pravatar.cc/150?u=mock' },
                        partner,
                    ],
                    messages: [],
                    lastMessage: '',
                    lastMessageTime: null,
                });
            }
            return res.json(store.chatsByKey.get(key));
        }

        const chat = await Chat.findOne({
            participants: { $all: [userId, req.params.userId] }
        })
        .populate('participants', 'name avatarUrl')
        .populate('messages.sender', 'name avatarUrl');

        if (!chat) {
            // Create new chat if it doesn't exist
            const newChat = await Chat.create({
                participants: [req.user.id, req.params.userId]
            });
            
            const populatedChat = await Chat.findById(newChat._id)
                .populate('participants', 'name avatarUrl')
                .populate('messages.sender', 'name avatarUrl');
            
            return res.json(populatedChat);
        }

        res.json(chat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const { content, receiverId, message_type, mediaUrl, replyToId } = req.body;
        const userId = req.user.id || req.user._id;

        let chat = await Chat.findOne({
            participants: { $all: [userId, receiverId] }
        });

        if (!chat) {
            chat = await Chat.create({
                participants: [req.user.id, receiverId]
            });
        }

        const normalizedType = message_type || (mediaUrl ? 'image' : 'text');
        if (!String(content || '').trim() && !String(mediaUrl || '').trim()) {
            return res.status(400).json({ message: 'Message must have text or media.' });
        }

        const message = {
            sender: userId,
            message_type: normalizedType,
            content: content || '',
            mediaUrl: mediaUrl || '',
            replyTo: replyToId || null,
        };

        chat.messages.push(message);
        chat.lastMessage = content || (normalizedType === 'image' ? 'Sent an image' : 'Sent a file');
        chat.lastMessageTime = new Date();
        await chat.save();

        // Populate to return full object
        const savedChat = await Chat.findById(chat._id)
            .populate('messages.sender', 'name avatarUrl');
        
        const newMessage = savedChat.messages[savedChat.messages.length - 1];

        // Send Push Notification
        const sender = await User.findById(req.user.id);
        const recipientStrId = chat.participants.find(p => p.toString() !== req.user.id);
        if (recipientStrId) {
            sendPushNotification(recipientStrId, {
                title: sender.name,
                body: content || (normalizedType === 'image' ? 'Sent an image' : 'Sent a file'),
                url: `/chat/${req.user.id}`
            });
        }

        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.editMessage = async (req, res) => {
    try {
        const { chatId, messageId } = req.params;
        const { content } = req.body;
        const userId = req.user.id || req.user._id;

        const chat = await Chat.findOne({ _id: chatId, participants: userId });
        if (!chat) return res.status(404).json({ message: 'Chat not found' });

        const message = chat.messages.id(messageId);
        if (!message) return res.status(404).json({ message: 'Message not found' });
        if (message.sender.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        message.content = content;
        message.isEdited = true;
        await chat.save();

        const updatedMessage = await Chat.findById(chat._id)
            .populate('messages.sender', 'name avatarUrl')
            .populate({
                path: 'messages.replyTo',
                populate: { path: 'sender', select: 'name' }
            })
            .then(c => c.messages.id(messageId));

        res.json(updatedMessage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteMessage = async (req, res) => {
    try {
        const { chatId, messageId } = req.params;
        const userId = req.user.id || req.user._id;

        const chat = await Chat.findOne({ _id: chatId, participants: userId });
        if (!chat) return res.status(404).json({ message: 'Chat not found' });

        const message = chat.messages.id(messageId);
        if (!message) return res.status(404).json({ message: 'Message not found' });
        if (message.sender.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        message.isDeleted = true;
        message.content = 'This message was deleted';
        message.mediaUrl = '';
        await chat.save();

        res.json({ success: true, messageId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId);
        
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        // Mark all messages from other user as read
        chat.messages.forEach(message => {
            if (!message.sender.equals(req.user.id)) {
                message.read = true;
            }
        });

        await chat.save();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUsersForChat = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        if (userId === 'mock_id_123') {
            const store = getDemoChatStore();
            return res.json(store.users);
        }

        const currentUser = await User.findById(userId).populate('following');
        const followingIds = currentUser.following.map(user => user._id);

        const users = await User.find({
            _id: { $in: followingIds }
        }).select('name avatarUrl email');

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteChat = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        if (userId === 'mock_id_123') return res.json({ success: true });

        const chat = await Chat.findOne({
            _id: req.params.chatId,
            participants: userId
        });

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        await Chat.deleteOne({ _id: req.params.chatId });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
