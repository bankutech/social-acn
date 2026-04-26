const webPush = require('web-push');
const User = require('../models/User');

setTimeout(() => {
    try {
        if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
            webPush.setVapidDetails(
                'mailto:test@example.com',
                process.env.VAPID_PUBLIC_KEY,
                process.env.VAPID_PRIVATE_KEY
            );
        }
    } catch (e) {
        console.error('Failed to set VAPID details', e);
    }
}, 0);

const sendPushNotification = async (userId, payload) => {
    try {
        const user = await User.findById(userId);
        if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) return;

        const stringPayload = JSON.stringify(payload);
        
        const removeSubIds = [];
        const sendPromises = user.pushSubscriptions.map(async (sub) => {
            try {
                await webPush.sendNotification(sub, stringPayload);
            } catch (err) {
                if (err.statusCode === 404 || err.statusCode === 410) {
                    removeSubIds.push(sub._id); // expired subscription
                } else {
                    console.error('Push error:', err);
                }
            }
        });

        await Promise.all(sendPromises);

        if (removeSubIds.length > 0) {
            user.pushSubscriptions = user.pushSubscriptions.filter(s => !removeSubIds.includes(s._id));
            await user.save();
        }
    } catch (err) {
        console.error('Failed to send push notification:', err);
    }
};

module.exports = { sendPushNotification };
