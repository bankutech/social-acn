const User = require('../models/User');
const crypto = require('crypto');

class UserService {
  async createUser(data) {
    const { name, email, password, bio, skills, avatarUrl, isAdmin } = data;
    const normalizedEmail = String(email).trim().toLowerCase();

    return await User.create({
      name: String(name).trim().slice(0, 80),
      email: normalizedEmail,
      password,
      bio: bio || '',
      skills: skills || [],
      avatarUrl: avatarUrl || `https://i.pravatar.cc/150?u=${email}`,
      role: isAdmin ? 'admin' : 'user',
    });
  }

  async findUserByEmail(email, selectPassword = false) {
    let query = User.findOne({ email });
    if (selectPassword) {
      query = query.select('+password');
    }
    return await query;
  }

  async createGoogleUser(data) {
    const { name, email, googleId, picture, isAdmin } = data;
    const normalizedEmail = String(email).trim().toLowerCase();
    const dummyPassword = crypto.randomBytes(16).toString('hex');

    return await User.create({
      name,
      email: normalizedEmail,
      password: dummyPassword,
      googleId,
      avatarUrl: picture || `https://i.pravatar.cc/150?u=${email}`,
      role: isAdmin ? 'admin' : 'user',
    });
  }

  async getUserProfile(userId) {
    return await User.findById(userId)
      .populate('followers', 'name avatarUrl')
      .populate('following', 'name avatarUrl');
  }

  async exploreUsers(userId, excludeIds, skip, limit) {
    return await User.find({
      _id: { $nin: excludeIds },
    })
      .select('name avatarUrl bio skills followers')
      .skip(skip)
      .limit(limit);
  }
}

module.exports = new UserService();
