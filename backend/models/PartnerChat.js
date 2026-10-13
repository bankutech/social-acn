const mongoose = require('mongoose');

const ThemeSchema = new mongoose.Schema({
    theme_name: { type: String, default: 'purple_dark' },
    wallpaper_url: { type: String, default: '' },
    updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updated_at: { type: Date, default: Date.now }
});

const PartnerChatSchema = new mongoose.Schema({
    user_one_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    user_two_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    theme: { type: ThemeSchema, default: () => ({}) },
    expires_enabled: { type: Boolean, default: true }
}, { timestamps: true });

// Ensure unique partner pair
PartnerChatSchema.index({ user_one_id: 1, user_two_id: 1 }, { unique: true });

module.exports = mongoose.model('PartnerChat', PartnerChatSchema);
