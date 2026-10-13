const Group = require('../models/Group');
const Post = require('../models/Post');

exports.createGroup = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const { name, description, isPrivate } = req.body;
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ message: 'Group name is required' });
        }
        const group = await Group.create({
            name: name.trim(),
            description: description || '',
            admin: userId,
            members: [userId],
            isPrivate: isPrivate || false
        });
        const populated = await Group.findById(group._id)
            .populate('admin', 'name avatarUrl')
            .populate('members', 'name avatarUrl');
        res.status(201).json(populated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

exports.listGroups = async (req, res) => {
    try {
        const groups = await Group.find({ isPrivate: false })
            .populate('admin', 'name avatarUrl')
            .populate('members', 'name avatarUrl')
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(groups);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

exports.getGroup = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id)
            .populate('admin', 'name avatarUrl')
            .populate('members', 'name avatarUrl');
        if (!group) return res.status(404).json({ message: 'Group not found' });
        res.json(group);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

exports.joinGroup = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });
        const isMember = group.members.some(m => m.toString() === userId.toString());
        if (isMember) return res.status(400).json({ message: 'Already a member' });
        group.members.push(userId);
        await group.save();
        res.json({ message: 'Joined group', memberCount: group.members.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

exports.leaveGroup = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });
        if (group.admin.toString() === userId.toString()) {
            return res.status(400).json({ message: 'Admin cannot leave the group' });
        }
        group.members = group.members.filter(m => m.toString() !== userId.toString());
        await group.save();
        res.json({ message: 'Left group', memberCount: group.members.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

exports.getGroupPosts = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });
        const posts = await Post.find({ group: req.params.id })
            .populate('author', 'name avatarUrl')
            .populate('likes', 'name avatarUrl')
            .populate('comments.author', 'name avatarUrl')
            .sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

exports.createGroupPost = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });
        const isMember = group.members.some(m => m.toString() === userId.toString());
        if (!isMember) return res.status(403).json({ message: 'Must be a member to post' });
        const { content, imageUrl, cloudinaryPublicId } = req.body;
        if (!content && !imageUrl) {
            return res.status(400).json({ message: 'Post must have content or image' });
        }
        const post = await Post.create({
            author: userId,
            content: content || '',
            type: imageUrl ? 'image' : 'text',
            imageUrl: imageUrl || null,
            cloudinaryPublicId: cloudinaryPublicId || null,
            visibility: 'group',
            group: req.params.id
        });
        const populated = await Post.findById(post._id)
            .populate('author', 'name avatarUrl');
        res.status(201).json(populated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};
