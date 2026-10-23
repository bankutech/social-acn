const Notification = require('../models/Notification');
const mongoose = require('mongoose');

exports.getNotifications = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));

        const notifications = await Notification.find({ recipient: req.user.id })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('sender', 'name avatarUrl')
            .populate('relatedPost', 'content imageUrl')
            .populate('relatedUser', 'name avatarUrl');

        res.json(notifications);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching notifications' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user.id },
            { read: true },
            { returnDocument: 'after' }
        );
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        res.json(notification);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error marking notification as read' });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user.id, read: false },
            { read: true }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error marking all as read' });
    }
};
