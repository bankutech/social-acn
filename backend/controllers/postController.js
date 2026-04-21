const Post = require('../models/Post');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

const getDemoStore = () => {
    if (!global.__acn_demo_store) {
        global.__acn_demo_store = { posts: [] };
    }
    return global.__acn_demo_store;
};

exports.createPost = async (req, res) => {
    try {
        const { content, type, imageUrl, codeSnippet, codeLanguage } = req.body;

        const hasSomething =
            (typeof content === 'string' && content.trim().length > 0) ||
            (typeof imageUrl === 'string' && imageUrl.trim().length > 0) ||
            (typeof codeSnippet === 'string' && codeSnippet.trim().length > 0);
        if (!hasSomething) {
            return res.status(400).json({ message: 'Post must have content, image, or code.' });
        }
        
        // Handle demo mode
        if (req.user._id === 'mock_id_123') {
            // Return mock post for demo user
            const mockPost = {
                _id: 'mock_post_' + Date.now(),
                author: {
                    _id: 'mock_id_123',
                    name: 'Demo Student',
                    avatarUrl: 'https://i.pravatar.cc/150?u=mock'
                },
                content: content || '',
                type: type || 'text',
                imageUrl,
                codeSnippet,
                codeLanguage,
                likes: [],
                comments: [],
                savedBy: [],
                visibility: 'followers',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const store = getDemoStore();
            store.posts.unshift(mockPost);
            return res.status(201).json(mockPost);
        }
        
        const post = await Post.create({
            author: req.user._id || req.user.id,
            content,
            type: type || 'text',
            imageUrl,
            codeSnippet,
            codeLanguage
        });

        const populatedPost = await Post.findById(post._id).populate('author', 'name avatarUrl');
        
        res.status(201).json(populatedPost);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getFeed = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Handle demo mode
        if (req.user._id === 'mock_id_123') {
            const store = getDemoStore();
            const pagedPosts = store.posts.slice(skip, skip + limit);
            return res.json(pagedPosts);
        }

        const currentUser = await User.findById(req.user.id).populate('following');
        const followingIds = currentUser.following.map(user => user._id);
        followingIds.push(req.user.id); // Include user's own posts

        const posts = await Post.find({ 
            author: { $in: followingIds },
            visibility: { $in: ['public', 'followers'] }
        })
        .populate('author', 'name avatarUrl')
        .populate('likes', 'name avatarUrl')
        .populate('comments.author', 'name avatarUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUserPosts = async (req, res) => {
    try {
        const { userId } = req.params;
        const posts = await Post.find({ author: userId })
            .populate('author', 'name avatarUrl')
            .populate('likes', 'name avatarUrl')
            .populate('comments.author', 'name avatarUrl')
            .sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.likePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const isLiked = post.likes.includes(req.user.id);
        
        if (isLiked) {
            post.likes.pull(req.user.id);
        } else {
            post.likes.push(req.user.id);
        }

        await post.save();
        res.json({ liked: !isLiked, likesCount: post.likes.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addComment = async (req, res) => {
    try {
        const { content } = req.body;
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const comment = {
            author: req.user.id,
            content,
            createdAt: new Date()
        };

        post.comments.push(comment);
        await post.save();

        const populatedComment = await Post.findById(req.params.id)
            .populate('comments.author', 'name avatarUrl')
            .select('comments');

        res.json(populatedComment.comments[populatedComment.comments.length - 1]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.savePost = async (req, res) => {
    try {
        if (req.user._id === 'mock_id_123' || req.user.id === 'mock_id_123') {
            return res.json({ saved: true });
        }

        const post = await Post.findById(req.params.id);
        
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const isSaved = post.savedBy.some(id => id.toString() === req.user.id.toString());
        
        if (isSaved) {
            post.savedBy = post.savedBy.filter(id => id.toString() !== req.user.id.toString());
        } else {
            post.savedBy.push(req.user.id);
        }

        await post.save();
        res.json({ saved: !isSaved });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const userId = req.user.id || req.user._id;
        if (post.author.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this post' });
        }

        // Delete local image if exists
        if (post.imageUrl && post.imageUrl.startsWith('/uploads/')) {
            const filePath = path.join(__dirname, '..', post.imageUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
