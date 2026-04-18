const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            
            // Note: Use a default secret if env is not loaded for testing
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_123');
            
            // Handle demo mode mock user
            if (decoded.id === 'mock_id_123') {
                req.user = {
                    _id: 'mock_id_123',
                    name: 'Demo Student',
                    email: 'demo@acn.plus',
                    avatarUrl: 'https://i.pravatar.cc/150?u=mock',
                    studyStreak: 5,
                    following: []
                };
                return next();
            }
            
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };
