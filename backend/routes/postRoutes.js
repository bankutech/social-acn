const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createPost, getFeed, likePost, addComment, savePost } = require('../controllers/postController');

router.post('/', protect, createPost);
router.get('/feed', protect, getFeed);
router.post('/:id/like', protect, likePost);
router.post('/:id/comment', protect, addComment);
router.post('/:id/save', protect, savePost);

module.exports = router;
