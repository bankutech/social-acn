const Post = require('../models/Post');
const User = require('../models/User');
const { cloudinary } = require('../config/upload');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

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
            type: typeof imageUrl === 'string' && imageUrl.length > 0 ? 'image' : (type || 'text'),
            imageUrl,
            cloudinaryPublicId: req.body.cloudinaryPublicId, // Passed from frontend upload
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

        const userId = (req.user.id || req.user._id).toString();
        const currentUser = await User.findById(userId).populate('following');
        const followingIds = (currentUser?.following || [])
            .filter(Boolean)
            .map(u => (u._id || u).toString());
        followingIds.push(userId); // Include user's own posts

        let posts = await Post.find({ 
            author: { $in: followingIds },
            visibility: { $in: ['public', 'followers'] }
        })
        .populate('author', 'name avatarUrl')
        .populate('likes', 'name avatarUrl')
        .populate('comments.author', 'name avatarUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

        // Fallback: if user follows no one or network has no posts, show discovery posts
        if (posts.length === 0 && (page === 1 || followingIds.length <= 1)) {
            posts = await Post.find({ visibility: { $in: ['public', 'followers'] } })
                .populate('author', 'name avatarUrl')
                .populate('likes', 'name avatarUrl')
                .populate('comments.author', 'name avatarUrl')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
        }

        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUserPosts = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(404).json({ message: 'User not found' });
        }
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
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: 'Post not found' });
        }
        const post = await Post.findById(req.params.id);
        
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const userId = (req.user.id || req.user._id).toString();
        const isLiked = post.likes.some(id => (id._id || id).toString() === userId);
        
        if (isLiked) {
            post.likes = post.likes.filter(id => (id._id || id).toString() !== userId);
        } else {
            post.likes.push(userId);
            
            // Create Notification
            if (post.author.toString() !== userId) {
                const Notification = require('../models/Notification');
                await Notification.create({
                    recipient: post.author,
                    sender: userId,
                    type: 'like',
                    relatedPost: post._id
                });
                
                // Emit socket event
                const io = req.app.get('io');
                if (io) {
                    io.to(`user_${post.author}`).emit(`notification_${post.author}`, { type: 'like', sender: userId, post: post._id });
                }
            }
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
        if (!content || typeof content !== 'string' || !content.trim()) {
            return res.status(400).json({ message: 'Comment content cannot be empty' });
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: 'Post not found' });
        }
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const comment = {
            author: req.user.id,
            content: content.trim(),
            createdAt: new Date()
        };

        post.comments.push(comment);
        await post.save();
        
        // Create Notification
        if (post.author.toString() !== req.user.id) {
            const Notification = require('../models/Notification');
            await Notification.create({
                recipient: post.author,
                sender: req.user.id,
                type: 'comment',
                relatedPost: post._id
            });
            
            // Emit socket event
            const io = req.app.get('io');
            if (io) {
                io.to(`user_${post.author}`).emit(`notification_${post.author}`, { type: 'comment', sender: req.user.id, post: post._id });
            }
        }

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
        const userId = (req.user.id || req.user._id).toString();
        if (userId === 'mock_id_123') {
            return res.json({ saved: true, bookmarked: true });
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: 'Post not found' });
        }
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const user = await User.findById(userId);
        const isSaved = post.savedBy.some(id => id.toString() === userId);
        
        if (isSaved) {
            post.savedBy = post.savedBy.filter(id => id.toString() !== userId);
            if (user) {
                user.bookmarks = user.bookmarks.filter(id => id.toString() !== post._id.toString());
            }
        } else {
            post.savedBy.push(userId);
            if (user && !user.bookmarks.some(id => id.toString() === post._id.toString())) {
                user.bookmarks.unshift(post._id);
            }
        }

        await post.save();
        if (user) await user.save();
        res.json({ saved: !isSaved, bookmarked: !isSaved });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deletePost = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: 'Post not found' });
        }
        const post = await Post.findById(req.params.id);
        
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const userId = (req.user.id || req.user._id).toString();
        if (post.author.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this post' });
        }

        // Delete Cloudinary image if exists
        if (post.cloudinaryPublicId) {
            try {
                await cloudinary.uploader.destroy(post.cloudinaryPublicId);
            } catch (err) {
                console.error('Cloudinary Delete Error:', err);
            }
        }

        // Delete local image if exists
        if (post.imageUrl && post.imageUrl.startsWith('/uploads/')) {
            try {
                const localPath = path.join(__dirname, '..', post.imageUrl);
                if (fs.existsSync(localPath)) {
                    fs.unlinkSync(localPath);
                }
            } catch (err) {
                console.error('Local File Delete Error:', err);
            }
        }

        // Remove from any user's bookmarks
        await User.updateMany({ bookmarks: post._id }, { $pull: { bookmarks: post._id } });

        // Clean up notifications for this post
        const Notification = require('../models/Notification');
        await Notification.deleteMany({ relatedPost: post._id });

        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteComment = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id) || !mongoose.Types.ObjectId.isValid(req.params.commentId)) {
            return res.status(404).json({ message: 'Post or comment not found' });
        }
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const comment = post.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        const userId = (req.user.id || req.user._id).toString();
        const isCommentAuthor = comment.author.toString() === userId;
        const isPostAuthor = post.author.toString() === userId;

        if (!isCommentAuthor && !isPostAuthor) {
            return res.status(403).json({ message: 'Not authorized to delete this comment' });
        }

        post.comments.pull(req.params.commentId);
        await post.save();
        res.json({ message: 'Comment deleted successfully', commentId: req.params.commentId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getPostById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: 'Post not found' });
        }
        const post = await Post.findById(req.params.id)
            .populate('author', 'name avatarUrl')
            .populate('likes', 'name avatarUrl')
            .populate('comments.author', 'name avatarUrl');
        if (!post) return res.status(404).json({ message: 'Post not found' });
        res.json(post);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
