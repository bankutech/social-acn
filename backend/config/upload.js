const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Ensure upload directories exist
const dirs = ['uploads', 'uploads/avatars', 'uploads/posts', 'uploads/stories', 'uploads/reels', 'uploads/partner', 'uploads/chat'];
dirs.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const type = req.uploadType || 'posts';
        cb(null, path.join(__dirname, '..', 'uploads', type));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedImage = /jpeg|jpg|png|gif|webp/;
    const allowedVideo = /mp4|webm|mov|avi/;
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    const mime = file.mimetype;

    if (allowedImage.test(ext) || allowedVideo.test(ext) || 
        mime.startsWith('image/') || mime.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image and video files are allowed'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
});

// Middleware to set upload type
const setUploadType = (type) => (req, res, next) => {
    req.uploadType = type;
    next();
};

module.exports = { upload, setUploadType };
