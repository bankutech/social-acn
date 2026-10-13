const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getChats, getChat, sendMessage, markAsRead, getUsersForChat, deleteChat, editMessage, deleteMessage } = require('../controllers/chatController');

// Socket.io middleware to pass io instance to controllers
router.use((req, res, next) => {
    req.io = req.app.get('io');
    next();
});

router.get('/', protect, getChats);
router.get('/users', protect, getUsersForChat);
router.get('/:userId', protect, getChat);
router.post('/send', protect, sendMessage);
router.put('/:chatId/read', protect, markAsRead);
router.put('/:chatId/message/:messageId', protect, editMessage);
router.delete('/:chatId/message/:messageId', protect, deleteMessage);
router.delete('/:chatId', protect, deleteChat);

module.exports = router;
