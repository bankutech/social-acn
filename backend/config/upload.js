const multerImport = require('multer');
const multer = typeof multerImport === 'function' ? multerImport : (multerImport.default || multerImport);
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
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

    try {
        const multerStorage = require('multer-storage-cloudinary');
        const CloudinaryStorage = multerStorage.CloudinaryStorage || (multerStorage.default && multerStorage.default.CloudinaryStorage);
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
    } catch (e) {
        console.warn('CloudinaryStorage init fallback to memoryStorage:', e.message);
        storage = multer.memoryStorage();
    }
} else {
    // In serverless, writable directory is /tmp
    const uploadDir = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, '..', 'uploads');
    try {
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
    } catch {
        storage = multer.memoryStorage();
    }
}

const fileFilter = (req, file, cb) => {
    const mime = file.mimetype || '';
    if (mime.startsWith('image/') || mime.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image and video files are allowed'), false);
    }
};

let rawUpload = null;
const getUploadInstance = () => {
    if (!rawUpload) {
        rawUpload = multer({
            storage,
            fileFilter,
            limits: { fileSize: 50 * 1024 * 1024 }
        });
    }
    return rawUpload;
};

const upload = {
    single: (name) => (req, res, next) => getUploadInstance().single(name)(req, res, next),
    array: (name, max) => (req, res, next) => getUploadInstance().array(name, max)(req, res, next),
    fields: (fields) => (req, res, next) => getUploadInstance().fields(fields)(req, res, next),
    any: () => (req, res, next) => getUploadInstance().any()(req, res, next)
};

const setUploadType = (type) => (req, res, next) => {
    req.uploadType = type;
    next();
};

module.exports = {
    upload,
    setUploadType,
    cloudinary,
    hasCloudinary
};
module.exports.default = module.exports;
module.exports.upload = upload;
module.exports.setUploadType = setUploadType;
