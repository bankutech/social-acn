const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

const hasCloudinary = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

let storage;

if (hasCloudinary) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: async (req, file) => {
            const type = req.uploadType || 'posts';
            const folderPath = `acn-plus/${type}`;
            const isVideo = file.mimetype.startsWith('video/');
            
            return {
                folder: folderPath,
                resource_type: isVideo ? 'video' : 'image',
                allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp', 'mp4', 'webm', 'mov', 'avi'],
                public_id: `${Date.now()}-${file.originalname.split('.')[0]}`
            };
        }
    });
} else {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadDir),
        filename: (req, file, cb) => {
            const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
            const unique = `${Date.now()}-${safeName}`;
            cb(null, unique);
        }
    });
}

const fileFilter = (req, file, cb) => {
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

const setUploadType = (type) => (req, res, next) => {
    req.uploadType = type;
    next();
};

module.exports = { upload, setUploadType, cloudinary, hasCloudinary };
module.exports.default = module.exports;
module.exports.upload = upload;
module.exports.setUploadType = setUploadType;
