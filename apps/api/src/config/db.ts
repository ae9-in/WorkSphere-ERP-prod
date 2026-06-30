import mongoose from 'mongoose';
import { env } from './env';

export async function connectDB(): Promise<void> {
  const MAX_RETRIES = 5;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`✅  MongoDB connected: ${mongoose.connection.host}`);
      return;
    } catch (err) {
      retries += 1;
      console.error(`❌  MongoDB connection failed (attempt ${retries}/${MAX_RETRIES}):`, err);
      if (retries >= MAX_RETRIES) {
        console.error('🛑  Max retries reached. Exiting.');
        process.exit(1);
      }
      await new Promise((res) => setTimeout(res, 3000));
    }
  }
}
