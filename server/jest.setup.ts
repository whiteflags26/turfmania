import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create(); 
  
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri, {
    connectTimeoutMS: 30000, 
    socketTimeoutMS: 45000, 
  });
}, 60000); 

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
  
  if (mongoServer) {
    await mongoServer.stop();
  }
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    try {
      await collection.deleteMany({});
    } catch (error) {
      console.error(`Error clearing collection ${key}:`, error);
    }
  }
});