/**
 * Refresh all Aptitude & Reasoning tests — delete old ones and regenerate
 * so question snapshots reflect the full 292+220 question pool.
 *
 * Usage: bun run docs/scripts/refresh_apti_reasoning_tests.ts
 */
import 'dotenv/config';
import mongoose, { Types } from 'mongoose';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envFile = resolve(import.meta.dir, '../../apps/server/.env');
for (const line of readFileSync(envFile, 'utf-8').split('\n')) {
  const t = line.trim();
  if (t && !t.startsWith('#') && t.includes('=')) {
    const [k, ...v] = t.split('=');
    process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
  }
}

await mongoose.connect(process.env.DATABASE_URL!);
console.log('[refresh] Connected to MongoDB.');
const db = mongoose.connection;

const aptSeries = await db.collection('test_series').findOne({ slug: 'quantitative-aptitude-complete' });
const reasonSeries = await db.collection('test_series').findOne({ slug: 'logical-reasoning-complete' });

// Delete all existing tests for both series
const aptDel = await db.collection('exams').deleteMany({ testSeriesId: aptSeries!._id });
const reasonDel = await db.collection('exams').deleteMany({ testSeriesId: reasonSeries!._id });
console.log(`[refresh] Deleted ${aptDel.deletedCount} Aptitude tests`);
console.log(`[refresh] Deleted ${reasonDel.deletedCount} Reasoning tests`);

await mongoose.disconnect();
console.log('[refresh] Done! Now run generate_aptitude_reasoning_tests.ts');
