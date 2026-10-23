const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

let mongoServer;
let serverInstance;
let baseUrl;
let appInstance;
let ioInstance;

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_12345';

async function startTestServer() {
    if (!mongoServer) {
        mongoServer = await MongoMemoryServer.create({
            binary: { arch: 'x64', version: '7.0.14' }
        });
        const mongoUri = mongoServer.getUri();
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(mongoUri);
        }
    }

    const { server, app, io, connectDB } = require('../server');
    await connectDB();
    appInstance = app;
    ioInstance = io;
    serverInstance = server;

    if (!serverInstance.listening) {
        await new Promise((resolve) => {
            serverInstance.listen(0, () => {
                const port = serverInstance.address().port;
                baseUrl = `http://127.0.0.1:${port}`;
                resolve();
            });
        });
    } else {
        const port = serverInstance.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
    }

    return {
        app: appInstance,
        server: serverInstance,
        io: ioInstance,
        baseUrl,
        mongoServer
    };
}

async function stopTestServer() {
    if (serverInstance && serverInstance.listening) {
        await new Promise((resolve) => serverInstance.close(resolve));
    }
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    if (mongoServer) {
        await mongoServer.stop();
        mongoServer = null;
    }
}

async function clearDatabase() {
    if (mongoose.connection.readyState === 1) {
        const collections = mongoose.connection.collections;
        for (const key of Object.keys(collections)) {
            await collections[key].deleteMany({});
        }
    }
}

function generateToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
}

async function apiRequest(endpoint, { method = 'GET', body = null, token = null, headers = {} } = {}) {
    const finalHeaders = { ...headers };
    let finalBody = body;

    if (token) {
        finalHeaders['Authorization'] = `Bearer ${token}`;
    }

    if (body && !(body instanceof FormData) && typeof body === 'object') {
        finalHeaders['Content-Type'] = 'application/json';
        finalBody = JSON.stringify(body);
    }

    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
    const res = await fetch(url, {
        method,
        headers: finalHeaders,
        body: finalBody
    });

    let data;
    const text = await res.text();
    try {
        data = JSON.parse(text);
    } catch {
        data = text;
    }

    return {
        status: res.status,
        ok: res.ok,
        headers: res.headers,
        data
    };
}

module.exports = {
    startTestServer,
    stopTestServer,
    clearDatabase,
    generateToken,
    apiRequest,
    getBaseUrl: () => baseUrl
};
