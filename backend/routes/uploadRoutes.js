const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { upload, setUploadType, optimizeImage } = require('../config/upload');

// Generic file upload endpoint
router.post(
  '/image/:type',
  protect,
  (req, res, next) => {
    req.uploadType = req.params.type || 'posts';
    next();
  },
  upload.single('file'),
  optimizeImage,
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const isCloudinary = req.file.path.startsWith('http');
    const url = isCloudinary ? req.file.path : `/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.filename || req.file.public_id });
  }
);

// Generic multiple files upload endpoint
router.post(
  '/images/:type',
  protect,
  (req, res, next) => {
    req.uploadType = req.params.type || 'posts';
    next();
  },
  upload.array('files', 5),
  optimizeImage,
  (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    const uploadedFiles = req.files.map(file => {
      const isCloudinary = file.path.startsWith('http');
      return {
        url: isCloudinary ? file.path : `/uploads/${file.filename}`,
        filename: file.filename || file.public_id
      };
    });
    res.json(uploadedFiles);
  }
);

// Generic video upload endpoint (also used by chat) - with type
router.post(
  '/video/:type',
  protect,
  (req, res, next) => {
    req.uploadType = req.params.type || 'reels';
    next();
  },
  upload.single('file'),
  optimizeImage,
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const isCloudinary = req.file.path.startsWith('http');
    const url = isCloudinary ? req.file.path : `/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.filename || req.file.public_id });
  }
);

// Generic video upload - default to reels folder
router.post(
  '/video',
  protect,
  (req, res, next) => {
    req.uploadType = 'reels';
    next();
  },
  upload.single('file'),
  optimizeImage,
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const isCloudinary = req.file.path.startsWith('http');
    const url = isCloudinary ? req.file.path : `/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.filename || req.file.public_id });
  }
);

module.exports = router;
