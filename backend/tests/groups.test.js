const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const { startTestServer, stopTestServer, clearDatabase, apiRequest } = require('./testHelper');

describe('Groups API Suite', () => {
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
            body: { name: 'Alice Group', email: 'alice.grp@test.com', password: 'password123' }
        });
        userA = rA.data;
        tokenA = rA.data.token;

        const rB = await apiRequest('/api/auth/register', {
            method: 'POST',
            body: { name: 'Bob Group', email: 'bob.grp@test.com', password: 'password123' }
        });
        userB = rB.data;
        tokenB = rB.data.token;
    });

    it('should reject creating a group with empty name with HTTP 400', async () => {
        const res = await apiRequest('/api/groups', {
            method: 'POST',
            token: tokenA,
            body: { name: '   ', description: 'Test description' }
        });
        assert.strictEqual(res.status, 400);
        assert.strictEqual(res.data.message, 'Group name is required');
    });

    it('should successfully create a group with admin as initial member', async () => {
        const res = await apiRequest('/api/groups', {
            method: 'POST',
            token: tokenA,
            body: { name: 'Study Group A', description: 'Algorithms & Data Structures' }
        });
        assert.strictEqual(res.status, 201);
        assert.strictEqual(res.data.name, 'Study Group A');
        assert.strictEqual(res.data.admin._id, userA._id);
        assert.strictEqual(res.data.members.length, 1);
        assert.strictEqual(res.data.members[0]._id, userA._id);
    });

    it('should list public groups', async () => {
        await apiRequest('/api/groups', {
            method: 'POST',
            token: tokenA,
            body: { name: 'Public Physics Group' }
        });
        const listRes = await apiRequest('/api/groups', { token: tokenB });
        assert.strictEqual(listRes.status, 200);
        assert.ok(Array.isArray(listRes.data));
        assert.strictEqual(listRes.data.length, 1);
        assert.strictEqual(listRes.data[0].name, 'Public Physics Group');
    });

    it('should return 404 for invalid group ID or non-existent group', async () => {
        const invalidRes = await apiRequest('/api/groups/not-a-valid-id', { token: tokenA });
        assert.strictEqual(invalidRes.status, 404);

        const nonExistentId = '65d111111111111111111111';
        const notFoundRes = await apiRequest(`/api/groups/${nonExistentId}`, { token: tokenA });
        assert.strictEqual(notFoundRes.status, 404);
    });

    it('should allow user to join group and reject duplicate join', async () => {
        const createRes = await apiRequest('/api/groups', {
            method: 'POST',
            token: tokenA,
            body: { name: 'Math Club' }
        });
        const groupId = createRes.data._id;

        // User B joins
        const joinRes = await apiRequest(`/api/groups/${groupId}/join`, {
            method: 'POST',
            token: tokenB
        });
        assert.strictEqual(joinRes.status, 200);
        assert.strictEqual(joinRes.data.memberCount, 2);

        // User B attempts to join again
        const dupRes = await apiRequest(`/api/groups/${groupId}/join`, {
            method: 'POST',
            token: tokenB
        });
        assert.strictEqual(dupRes.status, 400);
        assert.strictEqual(dupRes.data.message, 'Already a member');
    });

    it('should allow member to leave group and prevent admin from leaving', async () => {
        const createRes = await apiRequest('/api/groups', {
            method: 'POST',
            token: tokenA,
            body: { name: 'Chemistry Hub' }
        });
        const groupId = createRes.data._id;

        // Admin User A tries to leave
        const adminLeave = await apiRequest(`/api/groups/${groupId}/leave`, {
            method: 'POST',
            token: tokenA
        });
        assert.strictEqual(adminLeave.status, 400);
        assert.strictEqual(adminLeave.data.message, 'Admin cannot leave the group');

        // User B joins then leaves
        await apiRequest(`/api/groups/${groupId}/join`, { method: 'POST', token: tokenB });
        const memberLeave = await apiRequest(`/api/groups/${groupId}/leave`, {
            method: 'POST',
            token: tokenB
        });
        assert.strictEqual(memberLeave.status, 200);
        assert.strictEqual(memberLeave.data.memberCount, 1);
    });

    it('should enforce membership before posting in a group', async () => {
        const createRes = await apiRequest('/api/groups', {
            method: 'POST',
            token: tokenA,
            body: { name: 'Private Discussion' }
        });
        const groupId = createRes.data._id;

        // Non-member User B tries to post
        const unauthPost = await apiRequest(`/api/groups/${groupId}/posts`, {
            method: 'POST',
            token: tokenB,
            body: { content: 'Intruder message' }
        });
        assert.strictEqual(unauthPost.status, 403);
        assert.strictEqual(unauthPost.data.message, 'Must be a member to post');

        // Member User A posts
        const authPost = await apiRequest(`/api/groups/${groupId}/posts`, {
            method: 'POST',
            token: tokenA,
            body: { content: 'Welcome to the group!' }
        });
        assert.strictEqual(authPost.status, 201);
        assert.strictEqual(authPost.data.content, 'Welcome to the group!');

        // Fetch group posts
        const postsRes = await apiRequest(`/api/groups/${groupId}/posts`, { token: tokenA });
        assert.strictEqual(postsRes.status, 200);
        assert.strictEqual(postsRes.data.length, 1);
    });
});
