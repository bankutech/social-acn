const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    createGroup, listGroups, getGroup,
    joinGroup, leaveGroup, getGroupPosts, createGroupPost
} = require('../controllers/groupController');

router.post('/', protect, createGroup);
router.get('/', protect, listGroups);
router.get('/:id', protect, getGroup);
router.post('/:id/join', protect, joinGroup);
router.post('/:id/leave', protect, leaveGroup);
router.get('/:id/posts', protect, getGroupPosts);
router.post('/:id/posts', protect, createGroupPost);

module.exports = router;
