const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const uploadConfig = require('../config/upload');
const upload = uploadConfig.upload || (uploadConfig.default && uploadConfig.default.upload);
const setUploadType = uploadConfig.setUploadType || (uploadConfig.default && uploadConfig.default.setUploadType) || ((type) => (req, res, next) => { req.uploadType = type; next(); });
const {
    getOrCreatePartnerChat,
    getPartnerMessages,
    sendPartnerMessage,
    uploadPartnerImage,
    updateTheme,
    getMyPartnerChats,
    deletePartnerChat
} = require('../controllers/partnerChatController');

router.get('/', protect, getMyPartnerChats);
router.get('/:partnerId', protect, getOrCreatePartnerChat);
router.get('/:chatId/messages', protect, getPartnerMessages);
const uploadImageOrFile = (req, res, next) => {
    upload.fields([{ name: 'image', maxCount: 1 }, { name: 'file', maxCount: 1 }])(req, res, (err) => {
        if (err) return next(err);
        if (req.files) {
            req.file = (req.files['image'] && req.files['image'][0]) || (req.files['file'] && req.files['file'][0]) || null;
        }
        next();
    });
};

router.post('/:chatId/message', protect, sendPartnerMessage);
router.post('/:chatId/upload', protect, setUploadType('partner'), uploadImageOrFile, uploadPartnerImage);
router.put('/:chatId/theme', protect, updateTheme);
router.delete('/:chatId', protect, deletePartnerChat);
router.put('/message/:messageId', protect, require('../controllers/partnerChatController').editPartnerMessage);
router.delete('/message/:messageId', protect, require('../controllers/partnerChatController').deletePartnerMessage);

module.exports = router;
