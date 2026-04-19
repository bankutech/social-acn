const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

console.log('--- MongoDB Connection Test ---');
console.log('URI:', MONGO_URI ? MONGO_URI.replace(/:([^@]+)@/, ':****@') : 'UNDEFINED');
console.log('Testing connection...');

if (!MONGO_URI) {
    console.error('❌ Error: MONGO_URI is not defined in .env');
    process.exit(1);
}

mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000, // Wait 5 seconds before timeout
})
.then(() => {
    console.log('✅ SUCCESS: Connected to MongoDB Atlas successfully!');
    process.exit(0);
})
.catch(err => {
    console.error('❌ FAILURE: Could not connect to MongoDB.');
    console.error('MESSAGE:', err.message);
    
    if (err.message.includes('IP address')) {
        console.error('\n--- ACTION REQUIRED ---');
        console.error('Your IP address is likely not whitelisted in MongoDB Atlas.');
        console.error('1. Go to MongoDB Atlas -> Network Access');
        console.error('2. Add "Allow Access From Anywhere" (0.0.0.0/0) or your current IP.');
    } else if (err.message.includes('Authentication failed')) {
        console.error('\n--- ACTION REQUIRED ---');
        console.error('Authentication failed. Check your password in the .env file.');
        console.error('Ensure any special characters in the password are URL encoded (e.g. @ as %40).');
    }
    
    process.exit(1);
});
