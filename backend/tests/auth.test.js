const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const { startTestServer, stopTestServer, clearDatabase, apiRequest } = require('./testHelper');

describe('Auth API Suite', () => {
    before(async () => {
        await startTestServer();
    });

    after(async () => {
        await stopTestServer();
    });

    beforeEach(async () => {
        await clearDatabase();
    });

    describe('POST /api/auth/register', () => {
        it('should reject registration when required fields are missing', async () => {
            const res = await apiRequest('/api/auth/register', {
                method: 'POST',
                body: { name: '', email: '', password: '' }
            });
            assert.strictEqual(res.status, 400);
            assert.strictEqual(res.data.message, 'Name, email, and password are required');
        });

        it('should reject registration with invalid email format', async () => {
            const res = await apiRequest('/api/auth/register', {
                method: 'POST',
                body: { name: 'Alice Test', email: 'alice-invalid-email', password: 'password123' }
            });
            assert.strictEqual(res.status, 400);
            assert.strictEqual(res.data.message, 'Please provide a valid email address');
        });

        it('should reject registration with password shorter than 6 characters', async () => {
            const res = await apiRequest('/api/auth/register', {
                method: 'POST',
                body: { name: 'Alice Test', email: 'alice@example.com', password: '123' }
            });
            assert.strictEqual(res.status, 400);
            assert.strictEqual(res.data.message, 'Password must be at least 6 characters');
        });

        it('should successfully register a valid new user and return JWT', async () => {
            const res = await apiRequest('/api/auth/register', {
                method: 'POST',
                body: {
                    name: 'Alice Cooper',
                    email: 'alice@example.com',
                    password: 'password123',
                    bio: 'Rock & Code',
                    skills: ['JavaScript', 'Music']
                }
            });
            assert.strictEqual(res.status, 201);
            assert.ok(res.data.token, 'Token must be present in response');
            assert.strictEqual(res.data.name, 'Alice Cooper');
            assert.strictEqual(res.data.email, 'alice@example.com');
            assert.strictEqual(res.data.bio, 'Rock & Code');
            assert.deepStrictEqual(res.data.skills, ['JavaScript', 'Music']);
            assert.ok(res.data._id, 'User ID must be returned');
        });

        it('should reject duplicate email registration', async () => {
            await apiRequest('/api/auth/register', {
                method: 'POST',
                body: { name: 'Alice Cooper', email: 'alice@example.com', password: 'password123' }
            });

            const res = await apiRequest('/api/auth/register', {
                method: 'POST',
                body: { name: 'Alice Clone', email: 'ALICE@EXAMPLE.COM', password: 'password456' }
            });
            assert.strictEqual(res.status, 400);
            assert.strictEqual(res.data.message, 'User already exists');
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            await apiRequest('/api/auth/register', {
                method: 'POST',
                body: { name: 'Bob Dylan', email: 'bob@example.com', password: 'bobpassword' }
            });
        });

        it('should reject login if email or password is missing', async () => {
            const res = await apiRequest('/api/auth/login', {
                method: 'POST',
                body: { email: 'bob@example.com' }
            });
            assert.strictEqual(res.status, 400);
            assert.strictEqual(res.data.message, 'Email and password are required');
        });

        it('should reject login with wrong password', async () => {
            const res = await apiRequest('/api/auth/login', {
                method: 'POST',
                body: { email: 'bob@example.com', password: 'wrongpassword' }
            });
            assert.strictEqual(res.status, 401);
            assert.strictEqual(res.data.message, 'Invalid email or password');
        });

        it('should reject login for non-existent user', async () => {
            const res = await apiRequest('/api/auth/login', {
                method: 'POST',
                body: { email: 'nobody@example.com', password: 'password123' }
            });
            assert.strictEqual(res.status, 401);
            assert.strictEqual(res.data.message, 'Invalid email or password');
        });

        it('should successfully login and return JWT token', async () => {
            const res = await apiRequest('/api/auth/login', {
                method: 'POST',
                body: { email: 'bob@example.com', password: 'bobpassword' }
            });
            assert.strictEqual(res.status, 200);
            assert.ok(res.data.token);
            assert.strictEqual(res.data.email, 'bob@example.com');
            assert.strictEqual(res.data.name, 'Bob Dylan');
        });
    });

    describe('Protected User Profile & Social Actions', () => {
        let aliceToken;
        let aliceId;
        let bobToken;
        let bobId;

        beforeEach(async () => {
            const r1 = await apiRequest('/api/auth/register', {
                method: 'POST',
                body: { name: 'Alice', email: 'alice@test.com', password: 'password123' }
            });
            aliceToken = r1.data.token;
            aliceId = r1.data._id;

            const r2 = await apiRequest('/api/auth/register', {
                method: 'POST',
                body: { name: 'Bob', email: 'bob@test.com', password: 'password123' }
            });
            bobToken = r2.data.token;
            bobId = r2.data._id;
        });

        it('should reject GET /api/auth/profile without token', async () => {
            const res = await apiRequest('/api/auth/profile');
            assert.strictEqual(res.status, 401);
        });

        it('should reject GET /api/auth/profile with invalid token', async () => {
            const res = await apiRequest('/api/auth/profile', {
                token: 'invalid_malformed_token'
            });
            assert.strictEqual(res.status, 401);
        });

        it('should return user profile with valid token', async () => {
            const res = await apiRequest('/api/auth/profile', { token: aliceToken });
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.email, 'alice@test.com');
            assert.strictEqual(res.data.name, 'Alice');
        });

        it('should update user profile via PUT /api/auth/profile', async () => {
            const res = await apiRequest('/api/auth/profile', {
                method: 'PUT',
                token: aliceToken,
                body: { bio: 'Updated bio string', skills: ['Node.js', 'React'] }
            });
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.bio, 'Updated bio string');
            assert.deepStrictEqual(res.data.skills, ['Node.js', 'React']);
        });

        it('should toggle follow/unfollow between users', async () => {
            // Follow Bob
            const followRes = await apiRequest(`/api/auth/follow/${bobId}`, {
                method: 'POST',
                token: aliceToken
            });
            assert.strictEqual(followRes.status, 200);
            assert.strictEqual(followRes.data.following, true);
            assert.strictEqual(followRes.data.followersCount, 1);

            // Verify Alice profile has following Bob
            const aliceProfile = await apiRequest('/api/auth/profile', { token: aliceToken });
            assert.ok(aliceProfile.data.following.some(id => String(id) === String(bobId) || id._id === String(bobId)));

            // Unfollow Bob
            const unfollowRes = await apiRequest(`/api/auth/follow/${bobId}`, {
                method: 'POST',
                token: aliceToken
            });
            assert.strictEqual(unfollowRes.status, 200);
            assert.strictEqual(unfollowRes.data.following, false);
            assert.strictEqual(unfollowRes.data.followersCount, 0);
        });

        it('should handle search with special regex characters safely without crashing', async () => {
            // Query with regex metacharacters: [test](.*)+?
            const res = await apiRequest('/api/auth/search?query=' + encodeURIComponent('[(.*+?'), {
                token: aliceToken
            });
            assert.strictEqual(res.status, 200);
            assert.ok(Array.isArray(res.data));
        });
    });
});
