const Story = require('../models/Story');
const User = require('../models/User');

exports.createStory = async (req, res) => {
    try {
        const { content, type, imageUrl } = req.body;
        
        // Handle demo mode
        if (req.user._id === 'mock_id_123') {
            // Return mock story for demo user
            const mockStory = {
                _id: 'mock_story_' + Date.now(),
                author: {
                    _id: 'mock_id_123',
                    name: 'Demo Student',
                    avatarUrl: 'https://i.pravatar.cc/150?u=mock'
                },
                content,
                type: type || 'text',
                imageUrl,
                viewers: [],
                createdAt: new Date(),
                updatedAt: new Date()
            };
            return res.status(201).json(mockStory);
        }
        
        const story = await Story.create({
            author: req.user._id || req.user.id,
            content,
            type: type || 'text',
            imageUrl
        });

        const populatedStory = await Story.findById(story._id).populate('author', 'name avatarUrl');
        
        res.status(201).json(populatedStory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getStories = async (req, res) => {
    try {
        // Handle demo mode
        if (req.user._id === 'mock_id_123') {
            // Return empty stories for demo user
            return res.json([]);
        }

        const currentUser = await User.findById(req.user.id).populate('following');
        const followingIds = currentUser.following.map(user => user._id);
        followingIds.push(req.user.id);

        const stories = await Story.find({ 
            author: { $in: followingIds },
            expiresAt: { $gt: new Date() }
        })
        .populate('author', 'name avatarUrl')
        .sort({ createdAt: -1 });

        res.json(stories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.viewStory = async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);
        
        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        if (!story.viewers.includes(req.user.id)) {
            story.viewers.push(req.user.id);
            await story.save();
        }

        res.json({ viewed: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
