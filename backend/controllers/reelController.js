const Reel = require('../models/Reel');
const User = require('../models/User');
const { cloudinary } = require('../config/upload');
const path = require('path');
const mongoose = require('mongoose');

exports.createReel = async (req, res) => {
    try {
        const { title, videoUrl, thumbnailUrl, hashtags } = req.body;
        
        if (!title || typeof title !== 'string' || !title.trim() || !videoUrl || typeof videoUrl !== 'string' || !videoUrl.trim()) {
            return res.status(400).json({ message: 'Title and videoUrl are required' });
        }

        // Handle demo mode
        if (req.user._id === 'mock_id_123') {
            // Return mock reel for demo user
            const mockReel = {
                _id: 'mock_reel_' + Date.now(),
                author: {
                    _id: 'mock_id_123',
                    name: 'Demo Student',
                    avatarUrl: 'https://i.pravatar.cc/150?u=mock'
                },
                title: title.trim(),
                videoUrl,
                thumbnailUrl,
                category: 'Learn in 60 seconds',
                hashtags: hashtags ? (Array.isArray(hashtags) ? hashtags : hashtags.split(',').map(tag => tag.trim())) : [],
                likes: [],
                comments: [],
                duration: 60,
                visibility: 'followers',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            return res.status(201).json(mockReel);
        }
        
        const reel = await Reel.create({
            author: req.user._id || req.user.id,
            title: title.trim(),
            videoUrl,
            cloudinaryPublicId: req.body.cloudinaryPublicId, // Passed from frontend
            thumbnailUrl,
            thumbnailPublicId: req.body.thumbnailPublicId, // Passed from frontend
            hashtags: Array.isArray(hashtags)
                ? hashtags
                : (hashtags ? hashtags.split(',').map(tag => tag.trim()).filter(Boolean) : [])
        });

        const populatedReel = await Reel.findById(reel._id).populate('author', 'name avatarUrl');
        
        res.status(201).json(populatedReel);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getReels = async (req, res) => {
    try {
        // Handle demo mode
        if (req.user._id === 'mock_id_123') {
            // Return empty reels for demo user
            return res.json([]);
        }

        const currentUser = await User.findById(req.user.id).populate('following');
        const followingIds = currentUser?.following?.map(user => user._id) || [];
        followingIds.push(req.user.id);

        const reels = await Reel.find({ 
            author: { $in: followingIds },
            visibility: { $in: ['public', 'followers'] }
        })
        .populate('author', 'name avatarUrl')
        .populate('likes', 'name avatarUrl')
        .populate('comments.author', 'name avatarUrl')
        .sort({ createdAt: -1 });

        res.json(reels);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.likeReel = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: 'Reel not found' });
        }
        const reel = await Reel.findById(req.params.id);
        
        if (!reel) {
            return res.status(404).json({ message: 'Reel not found' });
        }

        const userId = (req.user.id || req.user._id).toString();
        const isLiked = reel.likes.some(id => (id._id || id).toString() === userId);
        
        if (isLiked) {
            reel.likes = reel.likes.filter(id => (id._id || id).toString() !== userId);
        } else {
            reel.likes.push(userId);
        }

        await reel.save();
        res.json({ liked: !isLiked, likesCount: reel.likes.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addComment = async (req, res) => {
    try {
        const { content } = req.body;
        if (!content || typeof content !== 'string' || !content.trim()) {
            return res.status(400).json({ message: 'Comment content cannot be empty' });
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: 'Reel not found' });
        }
        const reel = await Reel.findById(req.params.id);

        if (!reel) {
            return res.status(404).json({ message: 'Reel not found' });
        }

        const comment = {
            author: req.user.id || req.user._id,
            content: content.trim(),
            createdAt: new Date()
        };

        reel.comments.push(comment);
        await reel.save();

        const populatedComment = await Reel.findById(req.params.id)
            .populate('comments.author', 'name avatarUrl')
            .select('comments');

        res.json(populatedComment.comments[populatedComment.comments.length - 1]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteReel = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: 'Reel not found' });
        }
        const reel = await Reel.findById(req.params.id);

        if (!reel) {
            return res.status(404).json({ message: 'Reel not found' });
        }

        const userId = (req.user.id || req.user._id).toString();
        if (reel.author.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this reel' });
        }

        // Delete Cloudinary video if exists
        if (reel.cloudinaryPublicId) {
            try {
                await cloudinary.uploader.destroy(reel.cloudinaryPublicId, { resource_type: 'video' });
            } catch (err) {
                console.error('Cloudinary Reel Delete Error:', err);
            }
        }

        // Delete thumbnail if exists
        if (reel.thumbnailPublicId) {
            try {
                await cloudinary.uploader.destroy(reel.thumbnailPublicId);
            } catch (err) {
                console.error('Cloudinary Reel Thumbnail Delete Error:', err);
            }
        }

        await Reel.findByIdAndDelete(req.params.id);
        res.json({ message: 'Reel deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUserReels = async (req, res) => {
    try {
        const userId = req.params.userId;
        if (userId === 'mock_id_123') return res.json([]);

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(404).json({ message: 'User not found' });
        }

        const reels = await Reel.find({ author: userId })
            .populate('author', 'name avatarUrl')
            .populate('likes', 'name avatarUrl')
            .populate('comments.author', 'name avatarUrl')
            .sort({ createdAt: -1 });

        res.json(reels);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
