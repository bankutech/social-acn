const User = require('../models/User');
const Post = require('../models/Post');

exports.toggleBookmark = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const postId = req.params.id;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const user = await User.findById(userId);
        const isBookmarked = user.bookmarks.some(id => id.toString() === postId.toString());

        if (isBookmarked) {
            user.bookmarks = user.bookmarks.filter(id => id.toString() !== postId.toString());
            post.savedBy = post.savedBy.filter(id => id.toString() !== userId.toString());
        } else {
            user.bookmarks.unshift(postId);
            if (!post.savedBy.some(id => id.toString() === userId.toString())) {
                post.savedBy.push(userId);
            }
        }

        await user.save();
        await post.save();
        res.json({ bookmarked: !isBookmarked, saved: !isBookmarked });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getBookmarks = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const user = await User.findById(userId).populate({
            path: 'bookmarks',
            populate: [
                { path: 'author', select: 'name avatarUrl' },
                { path: 'likes', select: '_id' },
                { path: 'comments.author', select: 'name avatarUrl' }
            ]
        });
        const validBookmarks = (user?.bookmarks || []).filter(b => b && b._id);
        res.json(validBookmarks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
