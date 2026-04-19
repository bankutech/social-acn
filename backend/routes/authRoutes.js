const express = require('express');
const router = express.Router();
const { 
    registerUser, loginUser, googleLogin, getUserProfile, getOtherProfile,
    updateProfile, toggleFollow, exploreUsers, searchUsers, getAllUsers
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { upload, setUploadType } = require('../config/upload');

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

// Avatar upload
router.post('/avatar', protect, setUploadType('avatars'), upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file' });
    res.json({ url: `/uploads/avatars/${req.file.filename}` });
});

module.exports = router;
