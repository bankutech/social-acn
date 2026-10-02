const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  googleLogin,
  getUserProfile,
  getOtherProfile,
  updateProfile,
  toggleFollow,
  exploreUsers,
  searchUsers,
  getAllUsers,
  pushSubscribe,
  getVapidPublicKey,
  completeOnboarding,
  getMe,
  logoutUser,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');
const { upload, setUploadType } = require('../config/upload');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.get('/me', protect, getMe);
router.post('/logout', logoutUser);
router.get('/profile', protect, getUserProfile);
router.get('/profile/:userId', protect, getOtherProfile);
router.put('/profile', protect, updateProfile);
router.put('/onboarding', protect, completeOnboarding);
router.post('/follow/:userId', protect, toggleFollow);
router.get('/explore', protect, exploreUsers);
router.get('/search', protect, searchUsers);
router.get('/all-users', protect, admin, getAllUsers);
router.get('/push/vapidPublicKey', protect, getVapidPublicKey);
router.post('/push/subscribe', protect, pushSubscribe);

// Avatar upload
router.post('/avatar', protect, setUploadType('avatars'), upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file' });
  // req.file.path is the Cloudinary URL or local absolute path
  const isCloudinary = req.file.path.startsWith('http');
  const url = isCloudinary ? req.file.path : `/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.filename || req.file.public_id });
});

module.exports = router;
