const User = require('../models/User');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key_123', {
        expiresIn: '30d',
    });
};

exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, bio, skills, avatarUrl } = req.body;

        if (!name || !name.trim() || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({ message: 'Please provide a valid email address' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const userExists = await User.findOne({ email: normalizedEmail });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password,
            bio: bio || '',
            skills: skills || [],
            avatarUrl: avatarUrl || `https://i.pravatar.cc/150?u=${encodeURIComponent(normalizedEmail)}`
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                avatarUrl: user.avatarUrl,
                bio: user.bio,
                skills: user.skills,
                token: generateToken(user._id),
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const normalizedEmail = email.toLowerCase().trim();

        let user;
        try {
            user = await User.findOne({ email: normalizedEmail }).select('+password');
            if (!user && email === 'demo@acn.plus' && password === 'demo123') {
                user = await User.create({
                    name: 'Demo Student',
                    email: 'demo@acn.plus',
                    password: 'demo123',
                    bio: 'ACN+ Platform Explorer & Student',
                    skills: ['JavaScript', 'React', 'Computer Science'],
                    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
                });
            }
        } catch (dbErr) {
            console.warn('DB Query failed:', dbErr.message);
            return res.status(500).json({ message: 'Database connection error' });
        }

        if (user && (await user.matchPassword(password))) {
            const now = new Date();
            const prevLogin = user.lastLogin;
            if (prevLogin) {
                const diffTime = Math.abs(now.getTime() - new Date(prevLogin).getTime());
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    user.studyStreak = (user.studyStreak || 0) + 1;
                } else if (diffDays > 1) {
                    user.studyStreak = 1;
                }
            } else {
                user.studyStreak = 1;
            }
            user.lastLogin = now;

            await user.save();

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                avatarUrl: user.avatarUrl,
                bio: user.bio,
                skills: user.skills,
                studyStreak: user.studyStreak,
                followers: user.followers,
                following: user.following,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
         res.status(500).json({ message: error.message });
    }
};

exports.googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body;
        
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        
        const payload = ticket.getPayload();
        const { email, name, picture, sub: googleId } = payload;
        
        let user;
        try {
            user = await User.findOne({ email }).select('+password');
        } catch (dbErr) {
            console.warn('DB Query failed');
            return res.status(500).json({ message: 'Database connection error' });
        }
        
        if (!user) {
            const dummyPassword = crypto.randomBytes(16).toString('hex');
            
            user = await User.create({
                name,
                email,
                password: dummyPassword,
                googleId,
                avatarUrl: picture || `https://i.pravatar.cc/150?u=${email}`
            });
        } else {
            if (!user.googleId) {
                user.googleId = googleId;
            }
            const now = new Date();
            const prevLogin = user.lastLogin;
            if (prevLogin) {
                const diffTime = Math.abs(now.getTime() - new Date(prevLogin).getTime());
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    user.studyStreak = (user.studyStreak || 0) + 1;
                } else if (diffDays > 1) {
                    user.studyStreak = 1;
                }
            } else {
                user.studyStreak = 1;
            }
            user.lastLogin = now;
            
            await user.save();
        }
        
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            skills: user.skills,
            studyStreak: user.studyStreak,
            followers: user.followers,
            following: user.following,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(401).json({ message: 'Invalid Google token' });
    }
};

exports.getUserProfile = async (req, res) => {
    try {

        const user = await User.findById(req.user.id)
            .populate('followers', 'name avatarUrl')
            .populate('following', 'name avatarUrl');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get another user's profile
exports.getOtherProfile = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
            return res.status(404).json({ message: 'Invalid user ID' });
        }

        const user = await User.findById(req.params.userId)
            .populate('followers', 'name avatarUrl')
            .populate('following', 'name avatarUrl');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, bio, skills, avatarUrl, avatarPublicId } = req.body;
        const userId = req.user.id || req.user._id;

        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ message: 'User not found' });

        if (name) user.name = name;
        if (bio !== undefined) user.bio = bio;
        if (skills) user.skills = skills;
        
        // If updating avatar, we should ideally delete the old one from Cloudinary
        // However, we'll keep it simple for now and just update the fields
        if (avatarUrl) {
            user.avatarUrl = avatarUrl;
            if (avatarPublicId) user.avatarPublicId = avatarPublicId;
        }

        await user.save();
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Follow / Unfollow
exports.toggleFollow = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const targetId = req.params.userId;

        if (!mongoose.Types.ObjectId.isValid(targetId)) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (userId.toString() === targetId) {
            return res.status(400).json({ message: 'Cannot follow yourself' });
        }

        const user = await User.findById(userId);
        const target = await User.findById(targetId);

        if (!target) return res.status(404).json({ message: 'User not found' });

        const isFollowing = user.following.some(id => id.toString() === targetId);

        if (isFollowing) {
            user.following = user.following.filter(id => id.toString() !== targetId);
            target.followers = target.followers.filter(id => id.toString() !== userId.toString());
        } else {
            user.following.push(targetId);
            target.followers.push(userId);
            
            // Create Notification
            const Notification = require('../models/Notification');
            await Notification.create({
                recipient: targetId,
                sender: userId,
                type: 'follow'
            });
            
            // Emit socket event
            const io = req.app.get('io');
            if (io) {
                io.emit(`notification_${targetId}`, { type: 'follow', sender: userId });
            }
        }

        await user.save();
        await target.save();

        res.json({ following: !isFollowing, followersCount: target.followers.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Explore — suggest users to follow
exports.exploreUsers = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;

        const user = await User.findById(userId);
        const excludeIds = [...user.following, userId];

        const suggestions = await User.find({
            _id: { $nin: excludeIds }
        })
        .select('name avatarUrl bio skills followers')
        .limit(20);

        res.json(suggestions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Search users
exports.searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || !q.trim()) return res.json([]);

        const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const users = await User.find({
            $or: [
                { name: { $regex: escaped, $options: 'i' } },
                { email: { $regex: escaped, $options: 'i' } }
            ]
        }).select('name avatarUrl bio skills').limit(10);

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin function to get all registered users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.pushSubscribe = async (req, res) => {
    try {
        const subscription = req.body;
        const userId = req.user.id || req.user._id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        // Remove existing identical subscription if there
        user.pushSubscriptions = user.pushSubscriptions.filter(s => s.endpoint !== subscription.endpoint);
        
        user.pushSubscriptions.push(subscription);
        await user.save();
        res.status(201).json({ message: 'Subscribed successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getVapidPublicKey = (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};
