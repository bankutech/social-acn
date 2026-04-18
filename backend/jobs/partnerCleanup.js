const PartnerMessage = require('../models/PartnerMessage');
const fs = require('fs');
const path = require('path');

const cleanupExpiredPartnerMessages = async () => {
    try {
        // Find expired messages with images before MongoDB TTL deletes them
        const expiredWithImages = await PartnerMessage.find({
            expires_at: { $lt: new Date() },
            message_type: 'image',
            image_url: { $ne: '' }
        });

        // Delete image files
        for (const msg of expiredWithImages) {
            if (msg.image_url) {
                const filePath = path.join(__dirname, '..', msg.image_url);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`[Cleanup] Deleted image: ${msg.image_url}`);
                }
            }
        }

        // Force delete expired messages (in case TTL hasn't caught them yet)
        const result = await PartnerMessage.deleteMany({
            expires_at: { $lt: new Date() }
        });

        if (result.deletedCount > 0) {
            console.log(`[Cleanup] Removed ${result.deletedCount} expired partner messages`);
        }
    } catch (error) {
        console.error('[Cleanup] Error:', error.message);
    }
};

module.exports = { cleanupExpiredPartnerMessages };
