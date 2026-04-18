const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { upload, setUploadType } = require('../config/upload');

// Generic file upload endpoint
router.post('/image/:type', protect, (req, res, next) => {
    req.uploadType = req.params.type || 'posts';
    next();
}, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    const fileUrl = `/uploads/${req.params.type}/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.filename });
});

// Generic video upload endpoint (also used by chat)
router.post('/video/:type', protect, (req, res, next) => {
    req.uploadType = req.params.type || 'reels';
    next();
}, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    const fileUrl = `/uploads/${req.params.type}/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.filename });
});

module.exports = router;
