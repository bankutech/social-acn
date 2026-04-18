const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { upload, setUploadType } = require('../config/upload');
const {
    getOrCreatePartnerChat,
    getPartnerMessages,
    sendPartnerMessage,
    uploadPartnerImage,
    updateTheme,
    getMyPartnerChats
} = require('../controllers/partnerChatController');

router.get('/', protect, getMyPartnerChats);
router.get('/:partnerId', protect, getOrCreatePartnerChat);
router.get('/:chatId/messages', protect, getPartnerMessages);
router.post('/:chatId/message', protect, sendPartnerMessage);
router.post('/:chatId/upload', protect, setUploadType('partner'), upload.single('image'), uploadPartnerImage);
router.put('/:chatId/theme', protect, updateTheme);

module.exports = router;
