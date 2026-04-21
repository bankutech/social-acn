const mongoose = require('mongoose');

const ReelSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String },
    category: { type: String, default: 'Learn in 60 seconds' },
    hashtags: [{ type: String }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [{
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    duration: { type: Number, default: 60 }, // in seconds
    visibility: { type: String, enum: ['public', 'followers'], default: 'followers' },
    cloudinaryPublicId: { type: String },
    thumbnailPublicId: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Reel', ReelSchema);
