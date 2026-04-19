const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    googleId: { type: String, unique: true, sparse: true },
    avatarUrl: { type: String, default: 'https://i.pravatar.cc/150' },
    bio: { type: String, default: '' },
    skills: [{ type: String }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    studyStreak: { type: Number, default: 0 },
    lastLogin: { type: Date, default: Date.now },
    pushSubscriptions: [{
        endpoint: String,
        keys: {
            p256dh: String,
            auth: String
        }
    }]
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function() {
    if (!this.isModified('password')) {
        return;
    }
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
