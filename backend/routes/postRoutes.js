const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createPost, getFeed, getExplorePosts, getUserPosts, getPostById, likePost, addComment, deleteComment, savePost, deletePost } = require('../controllers/postController');

router.post('/', protect, createPost);
router.get('/feed', protect, getFeed);
router.get('/explore', protect, getExplorePosts);
router.get('/user/:userId', protect, getUserPosts);
router.get('/:id', protect, getPostById);
router.post('/:id/like', protect, likePost);
router.post('/:id/comment', protect, addComment);
router.delete('/:id/comment/:commentId', protect, deleteComment);
router.post('/:id/save', protect, savePost);
router.delete('/:id', protect, deletePost);

module.exports = router;
