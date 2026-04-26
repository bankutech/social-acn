const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message_type: { type: String, enum: ['text', 'image', 'video'], default: 'text' },
    content: { type: String, default: '' },
    mediaUrl: { type: String, default: '' },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat.messages' },
    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
});

const ChatSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    messages: [MessageSchema],
    lastMessage: { type: String },
    lastMessageTime: { type: Date },
    isOnline: { type: Boolean, default: false }
}, { timestamps: true });

// Index for finding chats between two users
ChatSchema.index({ participants: 1 });

module.exports = mongoose.model('Chat', ChatSchema);
