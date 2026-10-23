const PartnerChat = require('../models/PartnerChat');
const PartnerMessage = require('../models/PartnerMessage');
const User = require('../models/User');
const { sendPushNotification } = require('../utils/push');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id));

// Helper: check if user is participant
const isParticipant = (chat, userId) => {
    const id1 = (chat.user_one_id?._id || chat.user_one_id || '').toString();
    const id2 = (chat.user_two_id?._id || chat.user_two_id || '').toString();
    return id1 === String(userId) || id2 === String(userId);
};

// GET or CREATE partner chat
exports.getOrCreatePartnerChat = async (req, res) => {
    try {
        const { partnerId } = req.params;
        const userId = (req.user._id || req.user.id).toString();

        if (!isValidObjectId(partnerId)) {
            return res.status(400).json({ message: 'Valid partner ID is required' });
        }

        if (userId === partnerId.toString()) {
            return res.status(400).json({ message: 'Cannot create partner chat with yourself' });
        }

        const partner = await User.findById(partnerId);
        if (!partner) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Sort IDs to ensure consistent lookup
        const [id1, id2] = [userId, partnerId.toString()].sort();

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
        const userId = (req.user._id || req.user.id).toString();

        if (!isValidObjectId(chatId)) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        const chat = await PartnerChat.findById(chatId);
        if (!chat) return res.status(404).json({ message: 'Chat not found' });
        if (!isParticipant(chat, userId)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const messages = await PartnerMessage.find({
            chat_id: chatId,
            expires_at: { $gt: new Date() }
        })
        .populate('sender_id', 'name avatarUrl')
        .populate({
            path: 'replyTo',
            populate: { path: 'sender_id', select: 'name' }
        })
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
        const { content, message_type, image_url, cloudinary_public_id, replyToId } = req.body;
        const userId = (req.user._id || req.user.id).toString();

        if (!isValidObjectId(chatId)) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        if (!String(content || '').trim() && !String(image_url || '').trim()) {
            return res.status(400).json({ message: 'Message must have text or media.' });
        }

        const chat = await PartnerChat.findById(chatId);
        if (!chat) return res.status(404).json({ message: 'Chat not found' });
        if (!isParticipant(chat, userId)) {
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
            cloudinary_public_id: cloudinary_public_id || '',
            replyTo: (replyToId && isValidObjectId(replyToId)) ? replyToId : null,
            created_at: now,
            expires_at: chat.expires_enabled ? expiresAt : new Date('9999-12-31')
        });

        const populated = await PartnerMessage.findById(message._id)
            .populate('sender_id', 'name avatarUrl')
            .populate({
                path: 'replyTo',
                populate: { path: 'sender_id', select: 'name' }
            });

        // Emit via Socket.io
        const io = req.app.get('io');
        if (io) {
            io.to(`partner_${chatId}`).emit('partner_new_message', populated);
        }

        // Try to trigger push notification if recipient exists in participants list (non-blocking)
        const recipientId = chat.user_one_id.toString() === userId.toString() ? chat.user_two_id : chat.user_one_id;
        if (recipientId) {
             Promise.resolve().then(async () => {
                 try {
                     const sender = req.user?.name ? req.user : await User.findById(userId).lean();
                     sendPushNotification(recipientId, {
                         title: 'Partner Chat: ' + (sender ? sender.name : 'Partner'),
                         body: content || 'Shared some media',
                         url: `/partner-chat/${chatId}`
                     });
                 } catch (err) {
                     // non-fatal
                 }
             }).catch(() => {});
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
        const userId = (req.user._id || req.user.id).toString();

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        if (!isValidObjectId(chatId)) {
            return res.status(400).json({ message: 'Valid chat ID is required' });
        }

        const chat = await PartnerChat.findById(chatId);
        if (!chat) return res.status(404).json({ message: 'Chat not found' });
        if (!isParticipant(chat, userId)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const fileUrl = (req.file.path && (req.file.path.startsWith('http://') || req.file.path.startsWith('https://')))
            ? req.file.path
            : `/uploads/${req.file.filename}`;

        res.json({ 
            image_url: fileUrl,
            url: fileUrl,
            cloudinary_public_id: req.file.filename,
            filename: req.file.filename
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// UPDATE theme
exports.updateTheme = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { theme_name, wallpaper_url } = req.body;
        const userId = (req.user._id || req.user.id).toString();

        if (!isValidObjectId(chatId)) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        const chat = await PartnerChat.findById(chatId);
        if (!chat) return res.status(404).json({ message: 'Chat not found' });
        if (!isParticipant(chat, userId)) {
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
        const userId = (req.user._id || req.user.id).toString();

        if (!isValidObjectId(req.params.chatId)) {
            return res.status(404).json({ message: 'Chat not found' });
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

exports.editPartnerMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;
        const userId = req.user._id || req.user.id;

        if (!isValidObjectId(messageId)) {
            return res.status(404).json({ message: 'Message not found' });
        }

        const message = await PartnerMessage.findById(messageId);
        if (!message) return res.status(404).json({ message: 'Message not found' });
        if (message.sender_id.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        message.content = content;
        message.isEdited = true;
        await message.save();

        const populated = await PartnerMessage.findById(message._id)
            .populate('sender_id', 'name avatarUrl')
            .populate({
                path: 'replyTo',
                populate: { path: 'sender_id', select: 'name' }
            });

        const io = req.app.get('io');
        if (io) {
            io.to(`partner_${message.chat_id}`).emit('partner_message_edited', populated);
        }

        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deletePartnerMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id || req.user.id;

        if (!isValidObjectId(messageId)) {
            return res.status(404).json({ message: 'Message not found' });
        }

        const message = await PartnerMessage.findById(messageId);
        if (!message) return res.status(404).json({ message: 'Message not found' });
        if (message.sender_id.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        message.isDeleted = true;
        message.content = 'This message was deleted';
        message.image_url = '';
        await message.save();

        const io = req.app.get('io');
        if (io) {
            io.to(`partner_${message.chat_id}`).emit('partner_message_deleted', { messageId });
        }

        res.json({ success: true, messageId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
