import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  return mongoose.connect(env.DATABASE_URL);
}
