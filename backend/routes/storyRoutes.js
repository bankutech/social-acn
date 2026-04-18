const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createStory, getStories, viewStory } = require('../controllers/storyController');

router.post('/', protect, createStory);
router.get('/', protect, getStories);
router.post('/:id/view', protect, viewStory);

module.exports = router;
