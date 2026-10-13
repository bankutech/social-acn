const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { toggleBookmark, getBookmarks } = require('../controllers/bookmarkController');

router.get('/', protect, getBookmarks);
router.post('/:id/bookmark', protect, toggleBookmark);

module.exports = router;
