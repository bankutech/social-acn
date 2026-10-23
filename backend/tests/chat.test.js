const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const { io: ClientIO } = require('socket.io-client');
const { startTestServer, stopTestServer, clearDatabase, apiRequest, getBaseUrl } = require('./testHelper');

describe('Chat & Real-Time Socket Suite', () => {
    let userA, tokenA;
    let userB, tokenB;
    let userC, tokenC;
    let socketA, socketB, socketC;

    before(async () => {
        await startTestServer();
    });

    after(async () => {
        if (socketA && socketA.connected) socketA.disconnect();
        if (socketB && socketB.connected) socketB.disconnect();
        if (socketC && socketC.connected) socketC.disconnect();
        await stopTestServer();
    });

    beforeEach(async () => {
        if (socketA && socketA.connected) socketA.disconnect();
        if (socketB && socketB.connected) socketB.disconnect();
        if (socketC && socketC.connected) socketC.disconnect();

        await clearDatabase();

        const rA = await apiRequest('/api/auth/register', {
            method: 'POST',
            body: { name: 'Alice Chat', email: 'alice.chat@test.com', password: 'password123' }
        });
        userA = rA.data;
        tokenA = rA.data.token;

        const rB = await apiRequest('/api/auth/register', {
            method: 'POST',
            body: { name: 'Bob Chat', email: 'bob.chat@test.com', password: 'password123' }
        });
        userB = rB.data;
        tokenB = rB.data.token;

        const rC = await apiRequest('/api/auth/register', {
            method: 'POST',
            body: { name: 'Charlie Intruder', email: 'charlie.chat@test.com', password: 'password123' }
        });
        userC = rC.data;
        tokenC = rC.data.token;
    });

    describe('REST Chat Messaging & Authorization', () => {
        it('should reject messaging oneself with HTTP 400', async () => {
            const res = await apiRequest('/api/chat/send', {
                method: 'POST',
                token: tokenA,
                body: { receiverId: userA._id, content: 'Talking to myself' }
            });
            assert.strictEqual(res.status, 400);
            assert.strictEqual(res.data.message, 'Cannot chat with yourself');
        });

        it('should reject invalid receiver IDs with HTTP 400', async () => {
            const res = await apiRequest('/api/chat/send', {
                method: 'POST',
                token: tokenA,
                body: { receiverId: 'invalid_id_format', content: 'Hello' }
            });
            assert.strictEqual(res.status, 400);
            assert.strictEqual(res.data.message, 'Valid receiver ID is required');
        });

        it('should reject empty message content and empty media with HTTP 400', async () => {
            const res = await apiRequest('/api/chat/send', {
                method: 'POST',
                token: tokenA,
                body: { receiverId: userB._id, content: '   ' }
            });
            assert.strictEqual(res.status, 400);
            assert.strictEqual(res.data.message, 'Message must have text or media.');
        });

        it('should send a message between two users and persist in database', async () => {
            const sendRes = await apiRequest('/api/chat/send', {
                method: 'POST',
                token: tokenA,
                body: { receiverId: userB._id, content: 'Hello Bob!' }
            });
            assert.strictEqual(sendRes.status, 201);
            assert.strictEqual(sendRes.data.content, 'Hello Bob!');
            assert.strictEqual(sendRes.data.sender._id, userA._id);

            // Fetch conversation from User B perspective
            const chatRes = await apiRequest(`/api/chat/${userA._id}`, { token: tokenB });
            assert.strictEqual(chatRes.status, 200);
            assert.strictEqual(chatRes.data.messages.length, 1);
            assert.strictEqual(chatRes.data.messages[0].content, 'Hello Bob!');
            assert.strictEqual(chatRes.data.messages[0].read, false);
        });

        it('should allow recipient to mark messages as read', async () => {
            // A sends to B
            await apiRequest('/api/chat/send', {
                method: 'POST',
                token: tokenA,
                body: { receiverId: userB._id, content: 'Unread message' }
            });

            // Get chat ID
            const chatRes = await apiRequest(`/api/chat/${userA._id}`, { token: tokenB });
            const chatId = chatRes.data._id;

            // User C (unauthorized outsider) attempts to mark read -> 403
            const unauthRead = await apiRequest(`/api/chat/${chatId}/read`, {
                method: 'PUT',
                token: tokenC
            });
            assert.strictEqual(unauthRead.status, 403);

            // User B marks as read -> 200
            const readRes = await apiRequest(`/api/chat/${chatId}/read`, {
                method: 'PUT',
                token: tokenB
            });
            assert.strictEqual(readRes.status, 200);
            assert.strictEqual(readRes.data.success, true);

            // Verify message read state is now true
            const afterRead = await apiRequest(`/api/chat/${userA._id}`, { token: tokenB });
            assert.strictEqual(afterRead.data.messages[0].read, true);
        });

        it('should enforce sender-only permissions on edit and delete message', async () => {
            // A sends message
            const sendRes = await apiRequest('/api/chat/send', {
                method: 'POST',
                token: tokenA,
                body: { receiverId: userB._id, content: 'Original message text' }
            });
            const messageId = sendRes.data._id;
            const chatRes = await apiRequest(`/api/chat/${userB._id}`, { token: tokenA });
            const chatId = chatRes.data._id;

            // B (recipient) attempts to edit A's message -> 403
            const editUnauth = await apiRequest(`/api/chat/${chatId}/message/${messageId}`, {
                method: 'PUT',
                token: tokenB,
                body: { content: 'Hacked message' }
            });
            assert.strictEqual(editUnauth.status, 403);

            // A edits their own message -> 200
            const editAuth = await apiRequest(`/api/chat/${chatId}/message/${messageId}`, {
                method: 'PUT',
                token: tokenA,
                body: { content: 'Corrected message text' }
            });
            assert.strictEqual(editAuth.status, 200);
            assert.strictEqual(editAuth.data.content, 'Corrected message text');
            assert.strictEqual(editAuth.data.isEdited, true);

            // B attempts to delete A's message -> 403
            const delUnauth = await apiRequest(`/api/chat/${chatId}/message/${messageId}`, {
                method: 'DELETE',
                token: tokenB
            });
            assert.strictEqual(delUnauth.status, 403);

            // A deletes their own message -> 200
            const delAuth = await apiRequest(`/api/chat/${chatId}/message/${messageId}`, {
                method: 'DELETE',
                token: tokenA
            });
            assert.strictEqual(delAuth.status, 200);
            assert.strictEqual(delAuth.data.success, true);
        });
    });

    describe('Real-Time Socket.IO Communication & Anti-Impersonation', () => {
        const createSocket = (token) => {
            return ClientIO(getBaseUrl(), {
                auth: { token },
                transports: ['websocket'],
                reconnection: false
            });
        };

        it('should block socket impersonation when joining unauthorized rooms', async () => {
            socketC = createSocket(tokenC);
            await new Promise((res) => socketC.on('connect', res));

            // User C attempts to join User B's room to spy on B's messages
            socketC.emit('join', userB._id);

            // Wait a brief moment for join processing
            await new Promise((r) => setTimeout(r, 100));

            // Verify User C is not receiving messages destined for User B
            let cReceivedBMessage = false;
            socketC.on('new_message', () => {
                cReceivedBMessage = true;
            });

            // Alice sends message to Bob
            await apiRequest('/api/chat/send', {
                method: 'POST',
                token: tokenA,
                body: { receiverId: userB._id, content: 'Top secret for Bob' }
            });

            await new Promise((r) => setTimeout(r, 200));
            assert.strictEqual(cReceivedBMessage, false, 'Impersonating socket C should not receive Bob private messages');
        });

        it('should deliver real-time messages and typing indicators between authenticated sockets', async () => {
            socketA = createSocket(tokenA);
            socketB = createSocket(tokenB);

            await Promise.all([
                new Promise((res) => socketA.on('connect', res)),
                new Promise((res) => socketB.on('connect', res))
            ]);

            socketA.emit('join', userA._id);
            socketB.emit('join', userB._id);

            await new Promise((r) => setTimeout(r, 100));

            // 1. Test real-time message delivery
            const messagePromise = new Promise((resolve) => {
                socketB.once('new_message', (payload) => {
                    resolve(payload);
                });
            });

            // Alice sends message to Bob via REST endpoint
            const res = await apiRequest('/api/chat/send', {
                method: 'POST',
                token: tokenA,
                body: { receiverId: userB._id, content: 'Real-time test ping' }
            });
            assert.strictEqual(res.status, 201);

            const receivedPayload = await messagePromise;
            assert.strictEqual(receivedPayload.type, 'new_message');
            assert.strictEqual(receivedPayload.message.content, 'Real-time test ping');
            assert.strictEqual(receivedPayload.message.sender._id, userA._id);

            // 2. Test typing indicator
            const typingPromise = new Promise((resolve) => {
                socketA.once('user_typing', (data) => {
                    resolve(data);
                });
            });

            // Bob emits typing to Alice
            socketB.emit('typing', { receiverId: userA._id, isTyping: true });

            const typingData = await typingPromise;
            assert.strictEqual(typingData.userId, userB._id);
            assert.strictEqual(typingData.isTyping, true);
        });

        it('should block unauthenticated sockets without token from joining user rooms', async () => {
            const anonSocket = ClientIO(getBaseUrl(), {
                transports: ['websocket'],
                reconnection: false
            });
            await new Promise((res) => anonSocket.on('connect', res));

            // Anonymous socket tries to join User B's room
            anonSocket.emit('join', userB._id);
            await new Promise((r) => setTimeout(r, 100));

            let anonReceivedMessage = false;
            anonSocket.on('new_message', () => {
                anonReceivedMessage = true;
            });

            // Alice sends to Bob
            await apiRequest('/api/chat/send', {
                method: 'POST',
                token: tokenA,
                body: { receiverId: userB._id, content: 'Secret message for Bob' }
            });

            await new Promise((r) => setTimeout(r, 200));
            anonSocket.disconnect();
            assert.strictEqual(anonReceivedMessage, false, 'Unauthenticated socket should not receive Bob private messages');
        });

        it('should validate partner chat uploads and enforce socket room membership', async () => {
            // Alice starts partner chat with Bob
            const partnerRes = await apiRequest(`/api/partner-chat/${userB._id}`, { token: tokenA });
            assert.strictEqual(partnerRes.status, 200);
            const chatId = partnerRes.data._id;

            // Missing file upload returns 400
            const formData = new FormData();
            const emptyUploadRes = await apiRequest(`/api/partner-chat/${chatId}/upload`, {
                method: 'POST',
                token: tokenA,
                body: formData
            });
            assert.strictEqual(emptyUploadRes.status, 400);
            assert.strictEqual(emptyUploadRes.data.message, 'No file uploaded');

            // Test socket room authorization for partner chat
            socketA = createSocket(tokenA);
            socketC = createSocket(tokenC);

            await Promise.all([
                new Promise((res) => socketA.on('connect', res)),
                new Promise((res) => socketC.on('connect', res))
            ]);

            // Alice (participant) and Charlie (outsider) try to join partner room
            socketA.emit('join_partner_chat', chatId);
            socketC.emit('join_partner_chat', chatId);
            await new Promise((r) => setTimeout(r, 150));

            let cGotPartnerMsg = false;
            let aGotPartnerMsg = false;

            socketC.on('partner_new_message', () => { cGotPartnerMsg = true; });
            socketA.on('partner_new_message', () => { aGotPartnerMsg = true; });

            // Alice sends message into partner chat
            const msgRes = await apiRequest(`/api/partner-chat/${chatId}/message`, {
                method: 'POST',
                token: tokenA,
                body: { content: 'Partner secret between Alice and Bob' }
            });
            assert.strictEqual(msgRes.status, 201);

            await new Promise((r) => setTimeout(r, 200));

            assert.strictEqual(aGotPartnerMsg, true, 'Participant Alice should receive partner message');
            assert.strictEqual(cGotPartnerMsg, false, 'Outsider Charlie should NOT receive partner message');
        });
    });
});

