const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const type = req.uploadType || 'posts';
        const folderPath = `acn-plus/${type}`;
        
        // Determine resource type (image or video)
        const isVideo = file.mimetype.startsWith('video/');
        
        return {
            folder: folderPath,
            resource_type: isVideo ? 'video' : 'image',
            allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp', 'mp4', 'webm', 'mov', 'avi'],
            public_id: `${Date.now()}-${file.originalname.split('.')[0]}`
        };
    }
});

const fileFilter = (req, file, cb) => {
    const allowedImage = /jpeg|jpg|png|gif|webp/;
    const allowedVideo = /mp4|webm|mov|avi/;
    const mime = file.mimetype;

    if (mime.startsWith('image/') || mime.startsWith('video/')) {
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

module.exports = { upload, setUploadType, cloudinary };
