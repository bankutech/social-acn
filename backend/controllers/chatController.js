const Chat = require('../models/Chat');
const User = require('../models/User');
const { sendPushNotification } = require('../utils/push');
const mongoose = require('mongoose');

exports.getChats = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;

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

        if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
            return res.status(400).json({ message: 'Valid user ID is required' });
        }
        if (req.params.userId.toString() === userId.toString()) {
            return res.status(400).json({ message: 'Cannot chat with yourself' });
        }

        const chat = await Chat.findOne({
            participants: { $all: [userId, req.params.userId] }
        })
        .populate('participants', 'name avatarUrl')
        .populate('messages.sender', 'name avatarUrl');

        if (!chat) {
            const recipient = await User.findById(req.params.userId);
            if (!recipient) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Create new chat if it doesn't exist
            const newChat = await Chat.create({
                participants: [userId, req.params.userId]
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

        if (!receiverId || !mongoose.Types.ObjectId.isValid(receiverId)) {
            return res.status(400).json({ message: 'Valid receiver ID is required' });
        }

        if (receiverId.toString() === userId.toString()) {
            return res.status(400).json({ message: 'Cannot chat with yourself' });
        }

        let chat = await Chat.findOne({
            participants: { $all: [userId, receiverId] }
        });

        if (!chat) {
            chat = await Chat.create({
                participants: [userId, receiverId]
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

        // Populate only the latest message to avoid querying and hydrating entire chat history
        const savedChat = await Chat.findById(chat._id, { messages: { $slice: -1 } })
            .populate('messages.sender', 'name avatarUrl')
            .lean();
        
        const newMessage = savedChat && savedChat.messages && savedChat.messages[0] 
            ? savedChat.messages[0] 
            : {
                ...message,
                _id: chat.messages[chat.messages.length - 1]._id,
                sender: {
                    _id: userId,
                    name: req.user.name,
                    avatarUrl: req.user.avatarUrl
                },
                createdAt: new Date()
            };

        // Emit real-time message to recipient's room
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${receiverId}`).emit('new_message', {
                type: 'new_message',
                message: newMessage,
                chatId: chat._id
            });
        }

        // Send Push Notification asynchronously in background (don't block response)
        const recipientStrId = chat.participants.find(p => p.toString() !== userId.toString());
        if (recipientStrId) {
            Promise.resolve().then(() => {
                sendPushNotification(recipientStrId, {
                    title: req.user?.name || 'New Message',
                    body: content || (normalizedType === 'image' ? 'Sent an image' : 'Sent a file'),
                    url: `/chat/${userId}`
                });
            }).catch(() => {});
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

        if (!mongoose.Types.ObjectId.isValid(chatId) || !mongoose.Types.ObjectId.isValid(messageId)) {
            return res.status(404).json({ message: 'Chat or message not found' });
        }

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

        const io = req.app.get('io');
        if (io) {
            const other = chat.participants.find(p => p.toString() !== userId.toString());
            if (other) {
                io.to(`user_${other}`).emit('message_edited', { message: updatedMessage, chatId: chat._id });
            }
        }

        res.json(updatedMessage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteMessage = async (req, res) => {
    try {
        const { chatId, messageId } = req.params;
        const userId = req.user.id || req.user._id;

        if (!mongoose.Types.ObjectId.isValid(chatId) || !mongoose.Types.ObjectId.isValid(messageId)) {
            return res.status(404).json({ message: 'Chat or message not found' });
        }

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

        const io = req.app.get('io');
        if (io) {
            const other = chat.participants.find(p => p.toString() !== userId.toString());
            if (other) {
                io.to(`user_${other}`).emit('message_deleted', { messageId, chatId: chat._id });
            }
        }

        res.json({ success: true, messageId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        if (!mongoose.Types.ObjectId.isValid(req.params.chatId)) {
            return res.status(404).json({ message: 'Chat not found' });
        }
        const chat = await Chat.findById(req.params.chatId);
        
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        if (!chat.participants.some(p => p.toString() === userId.toString())) {
            return res.status(403).json({ message: 'Not authorized to mark messages as read in this chat' });
        }

        // Mark all messages from other user as read
        chat.messages.forEach(message => {
            if (!message.sender.equals(userId)) {
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

        if (!mongoose.Types.ObjectId.isValid(req.params.chatId)) {
            return res.status(404).json({ message: 'Chat not found' });
        }

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
