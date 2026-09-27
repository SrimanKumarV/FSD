const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

module.exports = {
  connect: async () => {
    try {
      if (mongoose.connection.readyState === 1) return;
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      if (!mongoServer) {
        mongoServer = await MongoMemoryServer.create();
      }
      const uri = mongoServer.getUri();
      await mongoose.connect(uri);
    } catch (err) {
      console.warn('[Test DB] MongoMemoryServer warning:', err.message);
    }
  },
  closeDatabase: async () => {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
      }
      if (mongoServer) {
        await mongoServer.stop();
        mongoServer = null;
      }
    } catch (err) {
      // ignore
    }
  },
  clearDatabase: async () => {
    if (mongoose.connection.readyState !== 0) {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany();
      }
    }
  }
};
