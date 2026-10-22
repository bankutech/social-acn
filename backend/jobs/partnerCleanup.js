const PartnerMessage = require('../models/PartnerMessage');
const cloudinary = require('cloudinary').v2;

const cleanupExpiredPartnerMessages = async () => {
    try {
        const now = new Date();
        const expiredMessages = await PartnerMessage.find({
            expires_at: { $lte: now }
        }).exec();

        for (const msg of expiredMessages) {
            if (msg.cloudinary_public_id) {
                try {
                    await cloudinary.uploader.destroy(msg.cloudinary_public_id);
                } catch (err) {
                    console.error('[partnerCleanup] Failed to delete Cloudinary asset:', err.message);
                }
            }
        }

        const res = await PartnerMessage.deleteMany({ expires_at: { $lte: now } });
        if (res.deletedCount > 0) {
            console.log(`[partnerCleanup] Successfully deleted ${res.deletedCount} expired partner messages.`);
        }
    } catch (err) {
        // May fail if DB is not yet connected
        console.log('[partnerCleanup] Partner cleanup skipped/failed:', err.message);
    }
};

module.exports = {
    cleanupExpiredPartnerMessages
};
