const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { askQuestion, summarizeNotes, generateMCQs, generateCaption } = require('../controllers/aiController');

router.post('/ask', protect, askQuestion);
router.post('/summarize', protect, summarizeNotes);
router.post('/mcq', protect, generateMCQs);
router.post('/caption', protect, generateCaption);

module.exports = router;
