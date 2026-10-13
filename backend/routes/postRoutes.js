const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createPost, getFeed, getUserPosts, likePost, addComment, savePost, deletePost } = require('../controllers/postController');

router.post('/', protect, createPost);
router.get('/feed', protect, getFeed);
router.get('/user/:userId', protect, getUserPosts);
router.post('/:id/like', protect, likePost);
router.post('/:id/comment', protect, addComment);
router.post('/:id/save', protect, savePost);
router.delete('/:id', protect, deletePost);

module.exports = router;
