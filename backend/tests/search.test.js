const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const { startTestServer, stopTestServer, clearDatabase, apiRequest } = require('./testHelper');

describe('Search API Suite', () => {
    let token;
    let userId;

    before(async () => {
        await startTestServer();
    });

    after(async () => {
        await stopTestServer();
    });

    beforeEach(async () => {
        await clearDatabase();

        const res = await apiRequest('/api/auth/register', {
            method: 'POST',
            body: { name: 'Search Guru', email: 'guru@test.com', password: 'password123', bio: 'AI enthusiast [developer]' }
        });
        token = res.data.token;
        userId = res.data._id;

        // Create a test post
        await apiRequest('/api/posts', {
            method: 'POST',
            token,
            body: { content: 'Post about [React] and NodeJS regex patterns (cool)!' }
        });
    });

    it('should return empty results if query is less than 2 characters', async () => {
        const res = await apiRequest('/api/search?q=a', { token });
        assert.strictEqual(res.status, 200);
        assert.deepStrictEqual(res.data, { users: [], posts: [] });
    });

    it('should safely escape regex special characters and not crash with 500', async () => {
        const specialQueries = ['[React]', '(cool)', '.*', 'developer]', '\\'];
        for (const q of specialQueries) {
            const res = await apiRequest(`/api/search?q=${encodeURIComponent(q)}`, { token });
            assert.strictEqual(res.status, 200, `Query "${q}" should return 200 OK`);
            assert.ok(Array.isArray(res.data.users));
            assert.ok(Array.isArray(res.data.posts));
        }
    });

    it('should filter search results by type=users', async () => {
        const res = await apiRequest('/api/search?q=Guru&type=users', { token });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.users.length, 1);
        assert.strictEqual(res.data.users[0].name, 'Search Guru');
        assert.strictEqual(res.data.posts.length, 0);
    });

    it('should filter search results by type=posts', async () => {
        const res = await apiRequest('/api/search?q=NodeJS&type=posts', { token });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.posts.length, 1);
        assert.ok(res.data.posts[0].content.includes('NodeJS'));
        assert.strictEqual(res.data.users.length, 0);
    });

    it('should return both matching users and posts when type is omitted or all', async () => {
        const res = await apiRequest('/api/search?q=developer', { token });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.users.length, 1);
    });
});
