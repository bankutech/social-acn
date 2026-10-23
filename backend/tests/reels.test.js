const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const { startTestServer, stopTestServer, clearDatabase, apiRequest } = require('./testHelper');

describe('Reels API Suite', () => {
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
            body: { name: 'Alice Reel', email: 'alice.reel@test.com', password: 'password123' }
        });
        userA = rA.data;
        tokenA = rA.data.token;

        const rB = await apiRequest('/api/auth/register', {
            method: 'POST',
            body: { name: 'Bob Reel', email: 'bob.reel@test.com', password: 'password123' }
        });
        userB = rB.data;
        tokenB = rB.data.token;
    });

    it('should reject creating a reel with missing title or videoUrl with HTTP 400', async () => {
        const noTitle = await apiRequest('/api/reels', {
            method: 'POST',
            token: tokenA,
            body: { videoUrl: 'https://cdn.example.com/video.mp4' }
        });
        assert.strictEqual(noTitle.status, 400);

        const noUrl = await apiRequest('/api/reels', {
            method: 'POST',
            token: tokenA,
            body: { title: 'Missing Video' }
        });
        assert.strictEqual(noUrl.status, 400);
    });

    it('should successfully create a reel and fetch feed', async () => {
        const res = await apiRequest('/api/reels', {
            method: 'POST',
            token: tokenA,
            body: {
                title: 'Quick Calculus Derivative Tutorial',
                videoUrl: 'https://cdn.example.com/calculus.mp4',
                thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
                hashtags: 'math,calculus,stem'
            }
        });
        assert.strictEqual(res.status, 201);
        assert.strictEqual(res.data.title, 'Quick Calculus Derivative Tutorial');
        assert.strictEqual(res.data.author._id, userA._id);
        assert.ok(Array.isArray(res.data.hashtags));
        assert.strictEqual(res.data.hashtags.length, 3);

        // Fetch reels feed
        const feedRes = await apiRequest('/api/reels', { token: tokenA });
        assert.strictEqual(feedRes.status, 200);
        assert.strictEqual(feedRes.data.length, 1);
        assert.strictEqual(feedRes.data[0].title, 'Quick Calculus Derivative Tutorial');
    });

    it('should toggle like on a reel', async () => {
        const createRes = await apiRequest('/api/reels', {
            method: 'POST',
            token: tokenA,
            body: { title: 'Like Test Reel', videoUrl: 'https://cdn.example.com/test.mp4' }
        });
        const reelId = createRes.data._id;

        // User B likes reel
        const like1 = await apiRequest(`/api/reels/${reelId}/like`, {
            method: 'POST',
            token: tokenB
        });
        assert.strictEqual(like1.status, 200);
        assert.strictEqual(like1.data.liked, true);
        assert.strictEqual(like1.data.likesCount, 1);

        // User B unlikes reel
        const like2 = await apiRequest(`/api/reels/${reelId}/like`, {
            method: 'POST',
            token: tokenB
        });
        assert.strictEqual(like2.status, 200);
        assert.strictEqual(like2.data.liked, false);
        assert.strictEqual(like2.data.likesCount, 0);
    });

    it('should add comment and reject empty comment', async () => {
        const createRes = await apiRequest('/api/reels', {
            method: 'POST',
            token: tokenA,
            body: { title: 'Comment Test Reel', videoUrl: 'https://cdn.example.com/test.mp4' }
        });
        const reelId = createRes.data._id;

        // Empty comment -> 400
        const emptyComment = await apiRequest(`/api/reels/${reelId}/comment`, {
            method: 'POST',
            token: tokenB,
            body: { content: '   ' }
        });
        assert.strictEqual(emptyComment.status, 400);

        // Valid comment -> 200
        const validComment = await apiRequest(`/api/reels/${reelId}/comment`, {
            method: 'POST',
            token: tokenB,
            body: { content: 'Great explanation!' }
        });
        assert.strictEqual(validComment.status, 200);
        assert.strictEqual(validComment.data.content, 'Great explanation!');
    });

    it('should enforce author-only permissions when deleting a reel', async () => {
        const createRes = await apiRequest('/api/reels', {
            method: 'POST',
            token: tokenA,
            body: { title: 'Delete Test Reel', videoUrl: 'https://cdn.example.com/del.mp4' }
        });
        const reelId = createRes.data._id;

        // User B attempts to delete User A's reel -> 403
        const unauthDel = await apiRequest(`/api/reels/${reelId}`, {
            method: 'DELETE',
            token: tokenB
        });
        assert.strictEqual(unauthDel.status, 403);
        assert.strictEqual(unauthDel.data.message, 'Not authorized to delete this reel');

        // Author User A deletes reel -> 200
        const authDel = await apiRequest(`/api/reels/${reelId}`, {
            method: 'DELETE',
            token: tokenA
        });
        assert.strictEqual(authDel.status, 200);
        assert.strictEqual(authDel.data.message, 'Reel deleted successfully');
    });

    it('should return 404 for invalid reel ID', async () => {
        const invalidLike = await apiRequest('/api/reels/invalid-id/like', {
            method: 'POST',
            token: tokenA
        });
        assert.strictEqual(invalidLike.status, 404);

        const invalidComment = await apiRequest('/api/reels/invalid-id/comment', {
            method: 'POST',
            token: tokenA,
            body: { content: 'Test' }
        });
        assert.strictEqual(invalidComment.status, 404);
    });
});
