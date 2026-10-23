const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const { startTestServer, stopTestServer, clearDatabase, apiRequest } = require('./testHelper');

describe('Posts & Interactions API Suite', () => {
    let userA, tokenA;
    let userB, tokenB;
    let userC, tokenC;

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
            body: { name: 'User A', email: 'userA@test.com', password: 'password123' }
        });
        userA = rA.data;
        tokenA = rA.data.token;

        const rB = await apiRequest('/api/auth/register', {
            method: 'POST',
            body: { name: 'User B', email: 'userB@test.com', password: 'password123' }
        });
        userB = rB.data;
        tokenB = rB.data.token;

        const rC = await apiRequest('/api/auth/register', {
            method: 'POST',
            body: { name: 'User C', email: 'userC@test.com', password: 'password123' }
        });
        userC = rC.data;
        tokenC = rC.data.token;
    });

    describe('Post Creation & Validation', () => {
        it('should reject creating an empty post without text, image, or code', async () => {
            const res = await apiRequest('/api/posts', {
                method: 'POST',
                token: tokenA,
                body: { content: '   ' }
            });
            assert.strictEqual(res.status, 400);
            assert.strictEqual(res.data.message, 'Post must have content, image, or code.');
        });

        it('should successfully create a post with content and image', async () => {
            const res = await apiRequest('/api/posts', {
                method: 'POST',
                token: tokenA,
                body: {
                    content: 'Hello World from User A',
                    imageUrl: '/uploads/sample-photo.jpg'
                }
            });
            assert.strictEqual(res.status, 201);
            assert.ok(res.data._id);
            assert.strictEqual(res.data.content, 'Hello World from User A');
            assert.strictEqual(res.data.imageUrl, '/uploads/sample-photo.jpg');
            assert.strictEqual(res.data.type, 'image');
            assert.strictEqual(res.data.author._id, userA._id);
            assert.strictEqual(res.data.author.name, 'User A');
        });
    });

    describe('Feed & Pagination', () => {
        it('should return feed containing own posts and followed users posts', async () => {
            // User A creates Post 1
            await apiRequest('/api/posts', {
                method: 'POST',
                token: tokenA,
                body: { content: 'Post 1 by User A' }
            });

            // User B creates Post 2
            await apiRequest('/api/posts', {
                method: 'POST',
                token: tokenB,
                body: { content: 'Post 2 by User B' }
            });

            // User A follows User B
            await apiRequest(`/api/auth/follow/${userB._id}`, {
                method: 'POST',
                token: tokenA
            });

            // User A fetches feed
            const feedRes = await apiRequest('/api/posts/feed?page=1&limit=10', {
                token: tokenA
            });
            assert.strictEqual(feedRes.status, 200);
            assert.ok(Array.isArray(feedRes.data));
            assert.ok(feedRes.data.length >= 2);
            const contents = feedRes.data.map(p => p.content);
            assert.ok(contents.includes('Post 1 by User A'));
            assert.ok(contents.includes('Post 2 by User B'));
        });

        it('should safely handle out-of-bounds and negative pagination values without crashing', async () => {
            const feedRes = await apiRequest('/api/posts/feed?page=-5&limit=-10', {
                token: tokenA
            });
            assert.strictEqual(feedRes.status, 200);
            assert.ok(Array.isArray(feedRes.data));
        });
    });

    describe('Likes & Toggle', () => {
        let postId;

        beforeEach(async () => {
            const res = await apiRequest('/api/posts', {
                method: 'POST',
                token: tokenA,
                body: { content: 'Post for like testing' }
            });
            postId = res.data._id;
        });

        it('should toggle like on and off accurately', async () => {
            // Like post
            const likeRes = await apiRequest(`/api/posts/${postId}/like`, {
                method: 'POST',
                token: tokenB
            });
            assert.strictEqual(likeRes.status, 200);
            assert.strictEqual(likeRes.data.liked, true);
            assert.strictEqual(likeRes.data.likesCount, 1);

            // Fetch post to verify likes array
            const postRes = await apiRequest(`/api/posts/${postId}`, { token: tokenB });
            assert.strictEqual(postRes.status, 200);
            assert.strictEqual(postRes.data.likes.length, 1);

            // Unlike post
            const unlikeRes = await apiRequest(`/api/posts/${postId}/like`, {
                method: 'POST',
                token: tokenB
            });
            assert.strictEqual(unlikeRes.status, 200);
            assert.strictEqual(unlikeRes.data.liked, false);
            assert.strictEqual(unlikeRes.data.likesCount, 0);
        });
    });

    describe('Comments & Authorization', () => {
        let postId;

        beforeEach(async () => {
            const res = await apiRequest('/api/posts', {
                method: 'POST',
                token: tokenA,
                body: { content: 'Post for comment testing' }
            });
            postId = res.data._id;
        });

        it('should allow adding a comment and deleting by comment author', async () => {
            // User B comments on User A post
            const commentRes = await apiRequest(`/api/posts/${postId}/comment`, {
                method: 'POST',
                token: tokenB,
                body: { content: 'Great post!' }
            });
            assert.strictEqual(commentRes.status, 200);
            assert.strictEqual(commentRes.data.content, 'Great post!');
            const commentId = commentRes.data._id;
            assert.ok(commentId);

            // User C (unauthorized stranger) tries to delete comment -> 403
            const unauthorizedDel = await apiRequest(`/api/posts/${postId}/comment/${commentId}`, {
                method: 'DELETE',
                token: tokenC
            });
            assert.strictEqual(unauthorizedDel.status, 403);

            // User B (comment author) deletes comment -> 200
            const deleteRes = await apiRequest(`/api/posts/${postId}/comment/${commentId}`, {
                method: 'DELETE',
                token: tokenB
            });
            assert.strictEqual(deleteRes.status, 200);
            assert.strictEqual(deleteRes.data.message, 'Comment deleted successfully');

            // Verify comment is gone
            const postRes = await apiRequest(`/api/posts/${postId}`, { token: tokenA });
            assert.strictEqual(postRes.data.comments.length, 0);
        });

        it('should allow post author to delete any comment on their post', async () => {
            // User B comments
            const commentRes = await apiRequest(`/api/posts/${postId}/comment`, {
                method: 'POST',
                token: tokenB,
                body: { content: 'Spam comment' }
            });
            const commentId = commentRes.data._id;

            // User A (post author) deletes User B's comment
            const deleteRes = await apiRequest(`/api/posts/${postId}/comment/${commentId}`, {
                method: 'DELETE',
                token: tokenA
            });
            assert.strictEqual(deleteRes.status, 200);
        });

        it('should reject empty or whitespace-only comment with HTTP 400', async () => {
            const commentRes = await apiRequest(`/api/posts/${postId}/comment`, {
                method: 'POST',
                token: tokenB,
                body: { content: '    ' }
            });
            assert.strictEqual(commentRes.status, 400);
            assert.strictEqual(commentRes.data.message, 'Comment content cannot be empty');
        });
    });

    describe('Bookmarks & Data Synchronization', () => {
        let postId;

        beforeEach(async () => {
            const res = await apiRequest('/api/posts', {
                method: 'POST',
                token: tokenA,
                body: { content: 'Post to bookmark' }
            });
            postId = res.data._id;
        });

        it('should synchronize savedBy on post and bookmarks on user model', async () => {
            // User B saves post
            const saveRes = await apiRequest(`/api/posts/${postId}/save`, {
                method: 'POST',
                token: tokenB
            });
            assert.strictEqual(saveRes.status, 200);
            assert.strictEqual(saveRes.data.saved, true);

            // Verify post.savedBy contains User B
            const postRes = await apiRequest(`/api/posts/${postId}`, { token: tokenB });
            assert.ok(postRes.data.savedBy.some(id => String(id) === String(userB._id)));

            // Verify User B's bookmarks route (/api/bookmarks) includes post
            const bookmarksRes = await apiRequest('/api/bookmarks', { token: tokenB });
            assert.strictEqual(bookmarksRes.status, 200);
            assert.ok(bookmarksRes.data.some(p => String(p._id) === String(postId)));

            // Unsave post
            const unsaveRes = await apiRequest(`/api/posts/${postId}/save`, {
                method: 'POST',
                token: tokenB
            });
            assert.strictEqual(unsaveRes.status, 200);
            assert.strictEqual(unsaveRes.data.saved, false);

            // Verify User B's bookmarks no longer include post
            const afterUnsave = await apiRequest('/api/bookmarks', { token: tokenB });
            assert.strictEqual(afterUnsave.data.length, 0);
        });

        it('should clean up bookmarks and related notifications when a post is deleted', async () => {
            // User B bookmarks User A's post
            await apiRequest(`/api/posts/${postId}/save`, {
                method: 'POST',
                token: tokenB
            });

            // User B comments on User A's post (generating a notification for User A)
            await apiRequest(`/api/posts/${postId}/comment`, {
                method: 'POST',
                token: tokenB,
                body: { content: 'Nice post!' }
            });

            // Verify notification exists for User A
            const notifsBefore = await apiRequest('/api/notifications', { token: tokenA });
            assert.strictEqual(notifsBefore.status, 200);
            assert.ok(notifsBefore.data.some(n => n.relatedPost && String(n.relatedPost._id || n.relatedPost) === String(postId)));

            // User C attempts to delete User A's post -> 403
            const unauthDelete = await apiRequest(`/api/posts/${postId}`, {
                method: 'DELETE',
                token: tokenC
            });
            assert.strictEqual(unauthDelete.status, 403);

            // User A deletes post -> 200
            const deleteRes = await apiRequest(`/api/posts/${postId}`, {
                method: 'DELETE',
                token: tokenA
            });
            assert.strictEqual(deleteRes.status, 200);

            // Verify post is 404
            const getPostRes = await apiRequest(`/api/posts/${postId}`, { token: tokenA });
            assert.strictEqual(getPostRes.status, 404);

            // Verify User B bookmarks no longer contain deleted post
            const bookmarksRes = await apiRequest('/api/bookmarks', { token: tokenB });
            assert.strictEqual(bookmarksRes.data.length, 0);

            // Verify User A notifications related to deleted post have been cleaned up
            const notifsAfter = await apiRequest('/api/notifications', { token: tokenA });
            assert.strictEqual(notifsAfter.status, 200);
            assert.ok(!notifsAfter.data.some(n => n.relatedPost && String(n.relatedPost._id || n.relatedPost) === String(postId)));
        });

        it('should return 404 for invalid post ObjectId format', async () => {
            const getRes = await apiRequest('/api/posts/not-a-valid-id', { token: tokenA });
            assert.strictEqual(getRes.status, 404);

            const likeRes = await apiRequest('/api/posts/not-a-valid-id/like', {
                method: 'POST',
                token: tokenA
            });
            assert.strictEqual(likeRes.status, 404);
        });
    });
});


