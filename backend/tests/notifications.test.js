const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const { startTestServer, stopTestServer, clearDatabase, apiRequest } = require('./testHelper');

describe('Notifications API Suite', () => {
    let userA, tokenA;
    let userB, tokenB;

    before(async () => {
        await startTestServer();
    });

    after(async () => {
        await stopTestServer();
    });

    beforeEach(async () => {
        await clearDatabase();

        const rA = await apiRequest('/api/auth/register', {
            method: 'POST',
            body: { name: 'Alice Notify', email: 'alice.notif@test.com', password: 'password123' }
        });
        userA = rA.data;
        tokenA = rA.data.token;

        const rB = await apiRequest('/api/auth/register', {
            method: 'POST',
            body: { name: 'Bob Notify', email: 'bob.notif@test.com', password: 'password123' }
        });
        userB = rB.data;
        tokenB = rB.data.token;
    });

    it('should retrieve notifications list for authenticated user', async () => {
        const Notification = require('../models/Notification');
        await Notification.create({
            recipient: userA._id,
            sender: userB._id,
            type: 'like',
            read: false
        });

        const res = await apiRequest('/api/notifications', { token: tokenA });
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.data));
        assert.strictEqual(res.data.length, 1);
        assert.strictEqual(res.data[0].type, 'like');
        assert.strictEqual(res.data[0].read, false);
    });

    it('should mark single notification as read', async () => {
        const Notification = require('../models/Notification');
        const notif = await Notification.create({
            recipient: userA._id,
            sender: userB._id,
            type: 'follow',
            read: false
        });

        const markRes = await apiRequest(`/api/notifications/${notif._id}/read`, {
            method: 'PUT',
            token: tokenA
        });
        assert.strictEqual(markRes.status, 200);
        assert.strictEqual(markRes.data.read, true);

        // Verify with invalid notification ID returns 404
        const invalidRes = await apiRequest('/api/notifications/invalid-id/read', {
            method: 'PUT',
            token: tokenA
        });
        assert.strictEqual(invalidRes.status, 404);
    });

    it('should mark all unread notifications as read', async () => {
        const Notification = require('../models/Notification');
        await Notification.create([
            { recipient: userA._id, sender: userB._id, type: 'comment', read: false },
            { recipient: userA._id, sender: userB._id, type: 'like', read: false }
        ]);

        const markAllRes = await apiRequest('/api/notifications/read-all', {
            method: 'PUT',
            token: tokenA
        });
        assert.strictEqual(markAllRes.status, 200);
        assert.strictEqual(markAllRes.data.message, 'All notifications marked as read');

        // Check list to verify all are now read
        const listRes = await apiRequest('/api/notifications', { token: tokenA });
        assert.strictEqual(listRes.data.length, 2);
        assert.ok(listRes.data.every(n => n.read === true));
    });
});
