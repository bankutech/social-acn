const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const { startTestServer, stopTestServer, clearDatabase, apiRequest } = require('./testHelper');

describe('Stories API Suite', () => {
    let tokenA, userA;
    let tokenB, userB;

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
            body: { name: 'Story Creator', email: 'storyA@test.com', password: 'password123' }
        });
        userA = rA.data;
        tokenA = rA.data.token;

        const rB = await apiRequest('/api/auth/register', {
            method: 'POST',
            body: { name: 'Story Viewer', email: 'storyB@test.com', password: 'password123' }
        });
        userB = rB.data;
        tokenB = rB.data.token;
    });

    it('should create a story and fetch active stories', async () => {
        const createRes = await apiRequest('/api/stories', {
            method: 'POST',
            token: tokenA,
            body: {
                content: 'My 24-hour update',
                imageUrl: '/uploads/story-image.jpg',
                type: 'image'
            }
        });
        assert.strictEqual(createRes.status, 201);
        assert.ok(createRes.data._id);
        assert.strictEqual(createRes.data.content, 'My 24-hour update');

        // Viewer B follows Creator A
        await apiRequest(`/api/auth/follow/${userA._id}`, {
            method: 'POST',
            token: tokenB
        });

        // Viewer B fetches feed stories
        const storiesRes = await apiRequest('/api/stories', { token: tokenB });
        assert.strictEqual(storiesRes.status, 200);
        assert.ok(Array.isArray(storiesRes.data));
        assert.ok(storiesRes.data.length >= 1);
        assert.strictEqual(storiesRes.data[0].content, 'My 24-hour update');
    });

    it('should record story view and toggle story like', async () => {
        const createRes = await apiRequest('/api/stories', {
            method: 'POST',
            token: tokenA,
            body: { content: 'Interactive Story' }
        });
        const storyId = createRes.data._id;

        // User B views story
        const viewRes = await apiRequest(`/api/stories/${storyId}/view`, {
            method: 'POST',
            token: tokenB
        });
        assert.strictEqual(viewRes.status, 200);
        assert.strictEqual(viewRes.data.viewed, true);

        // User B likes story
        const likeRes = await apiRequest(`/api/stories/${storyId}/like`, {
            method: 'POST',
            token: tokenB
        });
        assert.strictEqual(likeRes.status, 200);
        assert.strictEqual(likeRes.data.liked, true);
        assert.strictEqual(likeRes.data.likesCount, 1);

        // User B unlikes story
        const unlikeRes = await apiRequest(`/api/stories/${storyId}/like`, {
            method: 'POST',
            token: tokenB
        });
        assert.strictEqual(unlikeRes.status, 200);
        assert.strictEqual(unlikeRes.data.liked, false);
        assert.strictEqual(unlikeRes.data.likesCount, 0);
    });

    it('should allow image-only story without text caption', async () => {
        const createRes = await apiRequest('/api/stories', {
            method: 'POST',
            token: tokenA,
            body: {
                imageUrl: '/uploads/captionless-story.jpg',
                type: 'image'
            }
        });
        assert.strictEqual(createRes.status, 201);
        assert.strictEqual(createRes.data.imageUrl, '/uploads/captionless-story.jpg');
        assert.strictEqual(createRes.data.content, '');
    });

    it('should reject story creation when both content and imageUrl are missing', async () => {
        const createRes = await apiRequest('/api/stories', {
            method: 'POST',
            token: tokenA,
            body: {
                content: '   '
            }
        });
        assert.strictEqual(createRes.status, 400);
        assert.strictEqual(createRes.data.message, 'Story must have content or image.');
    });

    it('should return 404 for invalid story ID on like and view', async () => {
        const likeRes = await apiRequest('/api/stories/invalid-id/like', {
            method: 'POST',
            token: tokenB
        });
        assert.strictEqual(likeRes.status, 404);

        const viewRes = await apiRequest('/api/stories/invalid-id/view', {
            method: 'POST',
            token: tokenB
        });
        assert.strictEqual(viewRes.status, 404);
    });
});


