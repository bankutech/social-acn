const mongoose = require('mongoose');

const PartnerMessageSchema = new mongoose.Schema({
    chat_id: { type: mongoose.Schema.Types.ObjectId, ref: 'PartnerChat', required: true },
    sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message_type: { type: String, enum: ['text', 'image'], default: 'text' },
    content: { type: String, default: '' },
    image_url: { type: String, default: '' },
    cloudinary_public_id: { type: String, default: '' },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'PartnerMessage' },
    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    expires_at: { type: Date, required: true }
});

// TTL index — MongoDB auto-deletes documents when expires_at passes
PartnerMessageSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
// Quick lookups by chat
PartnerMessageSchema.index({ chat_id: 1, created_at: 1 });

module.exports = mongoose.model('PartnerMessage', PartnerMessageSchema);
