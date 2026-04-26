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
    res.json({ url: req.file.path, filename: req.file.filename });
});

// Generic video upload endpoint (also used by chat) - with type
router.post('/video/:type', protect, (req, res, next) => {
    req.uploadType = req.params.type || 'reels';
    next();
}, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({ url: req.file.path, filename: req.file.filename });
});

// Generic video upload - default to reels folder
router.post('/video', protect, (req, res, next) => {
    req.uploadType = 'reels';
    next();
}, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({ url: req.file.path, filename: req.file.filename });
});

module.exports = router;
