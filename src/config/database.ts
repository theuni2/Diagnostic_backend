import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from './environment.js';

let mongoMemoryInstance: MongoMemoryServer | null = null;

export const connectDatabase = async (): Promise<boolean> => {
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  // 1. Attempt connection to primary configured MONGODB_URI (Atlas)
  if (config.mongodbUri) {
    try {
      const conn = await mongoose.connect(config.mongodbUri, {
        dbName: 'ud_diagnostic',
        serverSelectionTimeoutMS: 4000,
      });
      console.log(`✅ [Database Connected] MongoDB Atlas connected to host: ${conn.connection.host}`);
      return true;
    } catch (error) {
      const sanitizedMsg =
        error instanceof Error
          ? error.message.replace(/mongodb\+srv:\/\/[^@]+@/, 'mongodb+srv://*****@')
          : String(error);
      console.warn(`⚠️ [Database Warning] Atlas connection unavailable (${sanitizedMsg})`);
    }
  }

  // 2. Local MongoMemoryServer fallback if Atlas IP/network is blocked
  try {
    console.log('🔄 Initializing MongoMemoryServer fallback for local execution...');
    mongoMemoryInstance = await MongoMemoryServer.create();
    const uri = mongoMemoryInstance.getUri();
    const conn = await mongoose.connect(uri, { dbName: 'ud_diagnostic' });
    console.log(`✅ [Database Connected] Local MongoMemoryServer active on: ${conn.connection.host}`);
    return true;
  } catch (err) {
    console.error('❌ [Database Error] Failed to initialize database:', err);
    return false;
  }
};
