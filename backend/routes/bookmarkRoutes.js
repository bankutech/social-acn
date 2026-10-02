const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  toggleBookmark,
  getBookmarks,
  createFolder,
  toggleFolderPost,
  updateFolder,
  deleteFolder,
} = require('../controllers/bookmarkController');

router.get('/', protect, getBookmarks);
router.post('/:id/bookmark', protect, toggleBookmark);
router.post('/folders', protect, createFolder);
router.post('/folders/toggle-post', protect, toggleFolderPost);
router.put('/folders', protect, updateFolder);
router.delete('/folders', protect, deleteFolder);

module.exports = router;
