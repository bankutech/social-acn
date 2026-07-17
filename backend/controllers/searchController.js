const User = require('../models/User');
const Post = require('../models/Post');

exports.search = async (req, res) => {
    try {
        const { q, type } = req.query;
        if (!q || q.trim().length < 2) return res.json({ users: [], posts: [] });

        const regex = { $regex: q.trim(), $options: 'i' };

        let users = [], posts = [];

        if (type === 'users' || !type || type === 'all') {
            users = await User.find({
                $or: [{ name: regex }, { bio: regex }]
            }).select('name avatarUrl bio followers').limit(20);
        }

        if (type === 'posts' || !type || type === 'all') {
            posts = await Post.find({ content: regex })
                .populate('author', 'name avatarUrl')
                .sort({ createdAt: -1 })
                .limit(20);
        }

        res.json({ users, posts });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Search failed' });
    }
};
