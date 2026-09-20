import mongoose from 'mongoose';
import { seedIfEmpty } from './seed.js';

export const connectDB = async () => {
  let uri = process.env.MONGODB_URI;
  if (!uri) {
    // Defense in depth: server.js runs validateEnv() before connectDB(),
    // which already refuses to boot in production without MONGODB_URI.
    // This second check protects any other entry point that might import
    // and call connectDB() directly without going through that boot path.
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MONGODB_URI is required in production — refusing to fall back to the in-memory demo database.');
    }
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    console.log('⚡ No MONGODB_URI set — using in-memory MongoDB (demo mode).');
    console.log('   Set MONGODB_URI in .env for persistent data.');
  }
  mongoose.set('strictQuery', true);
  const conn = await mongoose.connect(uri);
  console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  await seedIfEmpty();
  return conn;
};
