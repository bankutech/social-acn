const PartnerChat = require('../models/PartnerChat');
const PartnerMessage = require('../models/PartnerMessage');
const User = require('../models/User');
const { sendPushNotification } = require('../utils/push');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const getDemoPartnerStore = () => {
    if (!global.__acn_demo_partner_store) {
        global.__acn_demo_partner_store = {
            chatsByKey: new Map(), // key: sorted ids
            messagesByChatId: new Map(),
        };
    }
    return global.__acn_demo_partner_store;
};

const partnerKeyFor = (a, b) => [String(a), String(b)].sort().join('__');
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id));

// Helper: check if user is participant
const isParticipant = (chat, userId) => {
    return chat.user_one_id.toString() === userId || chat.user_two_id.toString() === userId;
};

// GET or CREATE partner chat
exports.getOrCreatePartnerChat = async (req, res) => {
    try {
        const { partnerId } = req.params;
        const userId = req.user._id || req.user.id;

        if (userId === partnerId) {
            return res.status(400).json({ message: 'Cannot create partner chat with yourself' });
        }

        // DEMO mode (or any non-ObjectId ids): use in-memory chat to avoid ObjectId casting crashes
        if (!isValidObjectId(userId) || !isValidObjectId(partnerId)) {
            const store = getDemoPartnerStore();
            const key = partnerKeyFor(userId, partnerId);
            if (!store.chatsByKey.has(key)) {
                const chatId = `demo_partner_${key}`;
                const chat = {
                    _id: chatId,
                    user_one_id: { _id: String(userId), name: req.user.name || 'Demo Student', avatarUrl: req.user.avatarUrl || 'https://i.pravatar.cc/150?u=mock', email: req.user.email || 'demo@acn.plus' },
                    user_two_id: { _id: String(partnerId), name: 'Demo User', avatarUrl: `https://i.pravatar.cc/150?u=${partnerId}`, email: `${partnerId}@demo.acn.plus` },
                    theme: { theme_name: 'purple_dark', wallpaper_url: '', updated_by: null, updated_at: new Date() },
                    expires_enabled: true,
                };
                store.chatsByKey.set(key, chat);
                store.messagesByChatId.set(chatId, []);
            }
            return res.json(store.chatsByKey.get(key));
        }

        // Sort IDs to ensure consistent lookup
        const [id1, id2] = [userId, partnerId].sort();

        let chat = await PartnerChat.findOne({
            user_one_id: id1,
            user_two_id: id2
        }).populate('user_one_id', 'name avatarUrl email')
          .populate('user_two_id', 'name avatarUrl email');

        if (!chat) {
            chat = await PartnerChat.create({
                user_one_id: id1,
                user_two_id: id2
            });
            chat = await PartnerChat.findById(chat._id)
                .populate('user_one_id', 'name avatarUrl email')
                .populate('user_two_id', 'name avatarUrl email');
        }

        res.json(chat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET partner messages
exports.getPartnerMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user._id || req.user.id;

        if (String(chatId).startsWith('demo_partner_') || !isValidObjectId(userId)) {
            const store = getDemoPartnerStore();
            const msgs = store.messagesByChatId.get(chatId) || [];
            return res.json(msgs);
        }

        const chat = await PartnerChat.findById(chatId);
        if (!chat) return res.status(404).json({ message: 'Chat not found' });
        if (!isParticipant(chat, userId.toString())) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const messages = await PartnerMessage.find({
            chat_id: chatId,
            expires_at: { $gt: new Date() }
        })
        .populate('sender_id', 'name avatarUrl')
        .sort({ created_at: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// SEND partner message
exports.sendPartnerMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { content, message_type, image_url } = req.body;
        const userId = req.user._id || req.user.id;

        if (String(chatId).startsWith('demo_partner_') || !isValidObjectId(userId)) {
            const store = getDemoPartnerStore();
            const now = new Date();
            const msg = {
                _id: `demo_partner_msg_${Date.now()}`,
                chat_id: chatId,
                sender_id: { _id: String(userId), name: req.user.name || 'Demo Student', avatarUrl: req.user.avatarUrl || 'https://i.pravatar.cc/150?u=mock' },
                message_type: message_type || 'text',
                content: content || '',
                image_url: image_url || '',
                created_at: now,
                expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000),
            };
            const arr = store.messagesByChatId.get(chatId) || [];
            arr.push(msg);
            store.messagesByChatId.set(chatId, arr);
            const io = req.app.get('io');
            if (io) io.to(`partner_${chatId}`).emit('partner_new_message', msg);
            return res.status(201).json(msg);
        }

        const chat = await PartnerChat.findById(chatId);
        if (!chat) return res.status(404).json({ message: 'Chat not found' });
        if (!isParticipant(chat, userId.toString())) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const now = new Date();
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

        const message = await PartnerMessage.create({
            chat_id: chatId,
            sender_id: userId,
            message_type: message_type || 'text',
            content: content || '',
            image_url: image_url || '',
            created_at: now,
            expires_at: chat.expires_enabled ? expiresAt : new Date('9999-12-31')
        });

        const populated = await PartnerMessage.findById(message._id)
            .populate('sender_id', 'name avatarUrl');

        // Emit via Socket.io
        const io = req.app.get('io');
        if (io) {
            const receiverId = chat.user_one_id.toString() === userId.toString() 
                ? chat.user_two_id.toString() 
                : chat.user_one_id.toString();
            io.to(`partner_${chatId}`).emit('partner_new_message', populated);
        }

        // Try to trigger push notification if recipient exists in participants list
        const recipientId = chat.user_one_id.toString() === userId.toString() ? chat.user_two_id : chat.user_one_id;
        if (recipientId) {
             const sender = await User.findById(userId);
             sendPushNotification(recipientId, {
                 title: 'Partner Chat: ' + (sender ? sender.name : 'Partner'),
                 body: content || 'Shared some media',
                 url: `/partner-chat/${chatId}`
             });
        }

        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// UPLOAD image for partner chat
exports.uploadPartnerImage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user._id || req.user.id;

        const chat = await PartnerChat.findById(chatId);
        if (!chat) return res.status(404).json({ message: 'Chat not found' });
        if (!isParticipant(chat, userId.toString())) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const imageUrl = `/uploads/partner/${req.file.filename}`;
        res.json({ image_url: imageUrl });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// UPDATE theme
exports.updateTheme = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { theme_name, wallpaper_url } = req.body;
        const userId = req.user._id || req.user.id;

        if (String(chatId).startsWith('demo_partner_') || !isValidObjectId(userId)) {
            const store = getDemoPartnerStore();
            const chat = store.chatsByKey.get(String(chatId).replace(/^demo_partner_/, '').split('__').sort().join('__')) ||
                (store.chatsByKey ? Array.from(store.chatsByKey.values()).find(c => c._id === chatId) : null);
            if (!chat) return res.status(404).json({ message: 'Chat not found' });
            chat.theme = {
                theme_name: theme_name || chat.theme.theme_name,
                wallpaper_url: wallpaper_url || chat.theme.wallpaper_url,
                updated_by: String(userId),
                updated_at: new Date()
            };
            const io = req.app.get('io');
            if (io) io.to(`partner_${chatId}`).emit('partner_theme_change', chat.theme);
            return res.json(chat);
        }

        const chat = await PartnerChat.findById(chatId);
        if (!chat) return res.status(404).json({ message: 'Chat not found' });
        if (!isParticipant(chat, userId.toString())) {
            return res.status(403).json({ message: 'Access denied' });
        }

        chat.theme = {
            theme_name: theme_name || chat.theme.theme_name,
            wallpaper_url: wallpaper_url || chat.theme.wallpaper_url,
            updated_by: userId,
            updated_at: new Date()
        };
        await chat.save();

        // Emit theme change in real-time
        const io = req.app.get('io');
        if (io) {
            io.to(`partner_${chatId}`).emit('partner_theme_change', chat.theme);
        }

        res.json(chat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET all partner chats for current user
exports.getMyPartnerChats = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        
        if (userId === 'mock_id_123' || !isValidObjectId(userId)) {
            const store = getDemoPartnerStore();
            const chats = Array.from(store.chatsByKey.values()).filter(c =>
                String(c.user_one_id?._id || c.user_one_id) === String(userId) ||
                String(c.user_two_id?._id || c.user_two_id) === String(userId)
            );
            return res.json(chats.map(c => ({ ...c, lastMessage: (store.messagesByChatId.get(c._id) || []).slice(-1)[0] || null })));
        }

        const chats = await PartnerChat.find({
            $or: [{ user_one_id: userId }, { user_two_id: userId }]
        })
        .populate('user_one_id', 'name avatarUrl email')
        .populate('user_two_id', 'name avatarUrl email');

        // Get last message for each chat
        const chatsWithLastMsg = await Promise.all(chats.map(async (chat) => {
            const lastMsg = await PartnerMessage.findOne({ 
                chat_id: chat._id,
                expires_at: { $gt: new Date() }
            }).sort({ created_at: -1 });
            return { ...chat.toObject(), lastMessage: lastMsg };
        }));

        res.json(chatsWithLastMsg);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deletePartnerChat = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        
        if (userId === 'mock_id_123' || !isValidObjectId(userId)) {
            return res.json({ success: true });
        }

        const chat = await PartnerChat.findOne({
            _id: req.params.chatId,
            $or: [{ user_one_id: userId }, { user_two_id: userId }]
        });

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        await PartnerChat.deleteOne({ _id: req.params.chatId });
        await PartnerMessage.deleteMany({ chat_id: req.params.chatId });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
