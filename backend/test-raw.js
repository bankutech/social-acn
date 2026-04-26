const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

async function run() {
  try {
    console.log("Connecting to:", uri.replace(/:([^@]+)@/, ':****@'));
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db('acn_plus');
    const collections = await db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));
  } catch (err) {
    console.error("Detailed Error:");
    console.error(err);
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
