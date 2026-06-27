import { MongoMemoryServer } from 'mongodb-memory-server';

export async function startMongoMemoryServer(): Promise<MongoMemoryServer> {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  return mongod;
}
