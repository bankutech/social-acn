const express = require('express');
const router = express.Router();
const fs = require('fs');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/upload');

const getFileUrl = (file) => {
    if (file.path && (file.path.startsWith('http://') || file.path.startsWith('https://'))) {
        return file.path;
    }
    if (file.buffer) {
        return `data:${file.mimetype || 'image/jpeg'};base64,${file.buffer.toString('base64')}`;
    }
    if (process.env.VERCEL && file.path && fs.existsSync(file.path)) {
        const buf = fs.readFileSync(file.path);
        return `data:${file.mimetype || 'image/jpeg'};base64,${buf.toString('base64')}`;
    }
    return `/uploads/${file.filename}`;
};

// Generic file upload endpoint
router.post('/image/:type', protect, (req, res, next) => {
    req.uploadType = req.params.type || 'posts';
    next();
}, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({ url: getFileUrl(req.file), filename: req.file.filename });
});

// Generic video upload endpoint (also used by chat) - with type
router.post('/video/:type', protect, (req, res, next) => {
    req.uploadType = req.params.type || 'reels';
    next();
}, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({ url: getFileUrl(req.file), filename: req.file.filename });
});

// Generic video upload - default to reels folder
router.post('/video', protect, (req, res, next) => {
    req.uploadType = 'reels';
    next();
}, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({ url: getFileUrl(req.file), filename: req.file.filename });
});

module.exports = router;
