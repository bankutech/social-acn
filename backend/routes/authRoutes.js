const express = require('express');
const router = express.Router();
const { 
    registerUser, loginUser, googleLogin, getUserProfile, getOtherProfile,
    updateProfile, toggleFollow, exploreUsers, searchUsers, getAllUsers, pushSubscribe, getVapidPublicKey
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const uploadConfig = require('../config/upload');
const upload = uploadConfig.upload || (uploadConfig.default && uploadConfig.default.upload);
const setUploadType = uploadConfig.setUploadType || (uploadConfig.default && uploadConfig.default.setUploadType) || ((type) => (req, res, next) => { req.uploadType = type; next(); });

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.get('/profile', protect, getUserProfile);
router.get('/profile/:userId', protect, getOtherProfile);
router.put('/profile', protect, updateProfile);
router.post('/follow/:userId', protect, toggleFollow);
router.get('/explore', protect, exploreUsers);
router.get('/search', protect, searchUsers);
router.get('/all-users', protect, getAllUsers);
router.get('/push/vapidPublicKey', protect, getVapidPublicKey);
router.post('/push/subscribe', protect, pushSubscribe);

// Avatar upload
router.post('/avatar', protect, setUploadType('avatars'), upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file' });
    const url = req.file.path && (req.file.path.startsWith('http://') || req.file.path.startsWith('https://'))
        ? req.file.path
        : `/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.filename });
});

module.exports = router;
