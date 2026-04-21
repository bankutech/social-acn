const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['text', 'image'], default: 'text' },
    imageUrl: { type: String },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    expiresAt: { type: Date, default: () => new Date(Date.now() + 86400000), expires: 86400 }, // Auto-delete after 24 hours
    cloudinaryPublicId: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Story', StorySchema);
