const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const { startTestServer, stopTestServer, clearDatabase, apiRequest } = require('./testHelper');

describe('Media & Upload API Suite', () => {
    let userToken;
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
            body: { name: 'Media User', email: 'media@test.com', password: 'password123' }
        });
        userToken = res.data.token;
        userId = res.data._id;
    });

    it('should successfully upload an image via POST /api/upload/image/posts', async () => {
        const formData = new FormData();
        const fakeImageBuffer = Buffer.from('fake-png-image-content');
        const blob = new Blob([fakeImageBuffer], { type: 'image/png' });
        formData.append('file', blob, 'sample.png');

        const res = await apiRequest('/api/upload/image/posts', {
            method: 'POST',
            token: userToken,
            body: formData
        });

        assert.strictEqual(res.status, 200);
        assert.ok(res.data.url, 'Upload response should contain a url');
        assert.ok(res.data.filename, 'Upload response should contain a filename');
        assert.ok(
            res.data.url.startsWith('/uploads/') || res.data.url.startsWith('http'),
            'URL should be a valid relative /uploads/ path or absolute URL'
        );
    });

    it('should successfully upload an avatar via POST /api/auth/avatar', async () => {
        const formData = new FormData();
        const fakeImageBuffer = Buffer.from('fake-jpeg-image-content');
        const blob = new Blob([fakeImageBuffer], { type: 'image/jpeg' });
        formData.append('file', blob, 'my-avatar.jpg');

        const res = await apiRequest('/api/auth/avatar', {
            method: 'POST',
            token: userToken,
            body: formData
        });

        assert.strictEqual(res.status, 200);
        assert.ok(res.data.url);
        assert.ok(res.data.filename);
    });

    it('should reject invalid file extensions with HTTP 400', async () => {
        const formData = new FormData();
        const fakeTextBuffer = Buffer.from('this is plain text, not an image');
        const blob = new Blob([fakeTextBuffer], { type: 'text/plain' });
        formData.append('file', blob, 'malicious.txt');

        const res = await apiRequest('/api/upload/image/posts', {
            method: 'POST',
            token: userToken,
            body: formData
        });

        assert.strictEqual(res.status, 400);
        assert.ok(
            res.data.message.includes('Only valid image and video files are allowed'),
            `Unexpected error message: ${res.data.message}`
        );
    });

    it('should reject requests with missing file with HTTP 400', async () => {
        const formData = new FormData();
        // No file attached
        const res = await apiRequest('/api/upload/image/posts', {
            method: 'POST',
            token: userToken,
            body: formData
        });

        assert.strictEqual(res.status, 400);
        assert.strictEqual(res.data.message, 'No file uploaded');
    });

    it('should reject unauthorized upload requests with HTTP 401', async () => {
        const formData = new FormData();
        const blob = new Blob(['data'], { type: 'image/png' });
        formData.append('file', blob, 'sample.png');

        const res = await apiRequest('/api/upload/image/posts', {
            method: 'POST',
            token: null,
            body: formData
        });

        assert.strictEqual(res.status, 401);
    });
});
