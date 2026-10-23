const Story = require('../models/Story');
const User = require('../models/User');
const mongoose = require('mongoose');

exports.createStory = async (req, res) => {
    try {
        const { content, type, imageUrl } = req.body;

        const hasContent = typeof content === 'string' && content.trim().length > 0;
        const hasImage = typeof imageUrl === 'string' && imageUrl.trim().length > 0;
        if (!hasContent && !hasImage) {
            return res.status(400).json({ message: 'Story must have content or image.' });
        }
        
        const story = await Story.create({
            author: req.user._id || req.user.id,
            content: content || '',
            type: type || (imageUrl ? 'image' : 'text'),
            imageUrl,
            cloudinaryPublicId: req.body.cloudinaryPublicId // Passed from frontend
        });

        const populatedStory = await Story.findById(story._id).populate('author', 'name avatarUrl');
        
        res.status(201).json(populatedStory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getStories = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const currentUser = await User.findById(userId).populate('following').lean();
        const followingSet = new Set((currentUser?.following || []).map(u => (u._id || u).toString()));
        followingSet.add(userId.toString());

        // Fetch all active stories from the last 24 hours
        const stories = await Story.find({ 
            createdAt: { $gt: new Date(Date.now() - 86400000) }
        })
        .populate('author', 'name avatarUrl')
        .sort({ createdAt: -1 })
        .lean();

        // Sort so followed users and own stories appear first in the story tray, then community stories
        stories.sort((a, b) => {
            const aAuthorId = (a.author?._id || a.author)?.toString();
            const bAuthorId = (b.author?._id || b.author)?.toString();
            const aIsFollowed = followingSet.has(aAuthorId);
            const bIsFollowed = followingSet.has(bAuthorId);
            if (aIsFollowed && !bIsFollowed) return -1;
            if (!aIsFollowed && bIsFollowed) return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        res.json(stories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.viewStory = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: 'Story not found' });
        }
        const story = await Story.findById(req.params.id);
        
        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        const userIdStr = (req.user.id || req.user._id).toString();
        const alreadyViewed = story.viewers.some(id => (id._id || id).toString() === userIdStr);
        if (!alreadyViewed) {
            story.viewers.push(req.user.id || req.user._id);
            await story.save();
        }

        res.json({ viewed: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUserStories = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
            return res.status(404).json({ message: 'User not found' });
        }

        const stories = await Story.find({ 
            author: req.params.userId,
            createdAt: { $gt: new Date(Date.now() - 86400000) }
        })
        .populate('author', 'name avatarUrl')
        .sort({ createdAt: -1 });

        res.json(stories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.toggleStoryLike = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: 'Story not found' });
        }
        const story = await Story.findById(req.params.id);
        if (!story) return res.status(404).json({ message: 'Story not found' });

        const userId = (req.user.id || req.user._id).toString();
        const isLiked = story.likes.some(id => (id._id || id).toString() === userId);

        if (isLiked) {
            story.likes = story.likes.filter(id => (id._id || id).toString() !== userId);
        } else {
            story.likes.push(userId);
            // Optionally, we could send a Push Notification to story.author here
            const { sendPushNotification } = require('../utils/push');
            if (story.author.toString() !== userId) {
                const User = require('../models/User');
                const sender = await User.findById(userId);
                sendPushNotification(story.author, {
                    title: sender ? sender.name : 'Someone',
                    body: 'Liked your story ❤️',
                    url: '/'
                });
            }
        }

        await story.save();
        res.json({ liked: !isLiked, likesCount: story.likes.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
