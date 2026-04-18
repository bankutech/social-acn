const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createReel, getReels, likeReel, addComment } = require('../controllers/reelController');

router.post('/', protect, createReel);
router.get('/', protect, getReels);
router.post('/:id/like', protect, likeReel);
router.post('/:id/comment', protect, addComment);

module.exports = router;
