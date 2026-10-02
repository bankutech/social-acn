const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

router.get('/', protect, notificationController.getNotifications);
router.patch('/read-all', protect, notificationController.markAllAsRead);
router.patch('/:id/read', protect, notificationController.markAsRead);

module.exports = router;
