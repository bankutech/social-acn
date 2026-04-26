const PartnerMessage = require('../models/PartnerMessage');
const { cloudinary } = require('../config/upload');
const path = require('path');

const cleanupExpiredPartnerMessages = async () => {
    try {
        // Find expired messages with Cloudinary public IDs
        const expiredWithCloudinary = await PartnerMessage.find({
            expires_at: { $lt: new Date() },
            cloudinary_public_id: { $ne: '' }
        });
        
        // Delete from Cloudinary
        if (expiredWithCloudinary.length > 0) {
            const publicIds = expiredWithCloudinary.map(m => m.cloudinary_public_id);
            try {
                // delete_resources handles multiple public_ids for images
                await cloudinary.api.delete_resources(publicIds);
                console.log(`[Cleanup] Deleted ${publicIds.length} resources from Cloudinary`);
            } catch (err) {
                console.error('[Cleanup] Cloudinary Deletion Error:', err.message);
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
