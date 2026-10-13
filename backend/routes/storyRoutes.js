const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createStory, getStories, viewStory, getUserStories, toggleStoryLike } = require('../controllers/storyController');

router.post('/', protect, createStory);
router.get('/', protect, getStories);
router.get('/user/:userId', protect, getUserStories);
router.post('/:id/view', protect, viewStory);
router.post('/:id/like', protect, toggleStoryLike);

module.exports = router;
