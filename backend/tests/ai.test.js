const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const { startTestServer, stopTestServer, clearDatabase, apiRequest } = require('./testHelper');

describe('AI Assistant API Suite', () => {
    let userA, tokenA;

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
            body: { name: 'Alice AI', email: 'alice.ai@test.com', password: 'password123' }
        });
        userA = rA.data;
        tokenA = rA.data.token;
    });

    it('should reject asking question with empty input', async () => {
        const res = await apiRequest('/api/ai/ask', {
            method: 'POST',
            token: tokenA,
            body: {}
        });
        assert.strictEqual(res.status, 400);
        assert.strictEqual(res.data.message, 'Question is required');
    });

    it('should handle ask question and return answer', async () => {
        const res = await apiRequest('/api/ai/ask', {
            method: 'POST',
            token: tokenA,
            body: { question: 'What is Big O notation?' }
        });
        assert.strictEqual(res.status, 200);
        assert.ok(typeof res.data.answer === 'string');
        assert.ok(res.data.answer.length > 10);
    });

    it('should summarize study notes and reject empty notes', async () => {
        const emptyRes = await apiRequest('/api/ai/summarize', {
            method: 'POST',
            token: tokenA,
            body: {}
        });
        assert.strictEqual(emptyRes.status, 400);

        const res = await apiRequest('/api/ai/summarize', {
            method: 'POST',
            token: tokenA,
            body: { notes: 'Recursion requires a base case and recursive step.' }
        });
        assert.strictEqual(res.status, 200);
        assert.ok(typeof res.data.summary === 'string');
    });

    it('should generate MCQs and reject empty topic', async () => {
        const emptyRes = await apiRequest('/api/ai/mcq', {
            method: 'POST',
            token: tokenA,
            body: {}
        });
        assert.strictEqual(emptyRes.status, 400);

        const res = await apiRequest('/api/ai/mcq', {
            method: 'POST',
            token: tokenA,
            body: { topic: 'Data Structures' }
        });
        assert.strictEqual(res.status, 200);
        assert.ok(typeof res.data.mcqs === 'string');
    });

    it('should generate post captions and reject empty content', async () => {
        const emptyRes = await apiRequest('/api/ai/caption', {
            method: 'POST',
            token: tokenA,
            body: {}
        });
        assert.strictEqual(emptyRes.status, 400);

        const res = await apiRequest('/api/ai/caption', {
            method: 'POST',
            token: tokenA,
            body: { content: 'Finished my deep learning assignment on Transformers' }
        });
        assert.strictEqual(res.status, 200);
        assert.ok(typeof res.data.caption === 'string');
    });
});
