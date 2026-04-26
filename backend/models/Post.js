const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Instagram-style: caption is optional (image-only posts allowed)
    content: { type: String, default: '' },
    type: { type: String, enum: ['text', 'image', 'code'], default: 'text' },
    imageUrl: { type: String },
    codeSnippet: { type: String },
    codeLanguage: { type: String },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [{
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    visibility: { type: String, enum: ['public', 'followers'], default: 'followers' },
    cloudinaryPublicId: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema);
