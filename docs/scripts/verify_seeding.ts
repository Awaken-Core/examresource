import 'dotenv/config';
import mongoose from 'mongoose';
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

const series = await mongoose.connection.collection('test_series').findOne({ slug: 'dsssb-tgt-computer-science' });
console.log('TestSeries:', series?.title, '| ID:', series?._id?.toString());

const chapters = await mongoose.connection.collection('chapters').find({ testSeriesId: series!._id }).toArray();
console.log(`\nChapters under DSSSB TGT Computer Science (${chapters.length}):`);
for (const ch of chapters) {
  const qCount = await mongoose.connection.collection('questions').countDocuments({ chapterId: ch._id });
  console.log(`  • ${ch.name}: ${qCount} questions in DB`);
}

const exams = await mongoose.connection.collection('exams').find({ testSeriesId: series!._id }).sort({ createdAt: 1 }).toArray();
console.log(`\nMock Tests Created (${exams.length}):`);
for (const ex of exams) {
  console.log(`  [${(ex.access || 'FREE').toUpperCase()}] ${ex.title} — ${ex.questions?.length} Qs | slug: ${ex.slug}`);
}

const sampleImgQ = await mongoose.connection.collection('questions').findOne({ questionImageUrl: { $ne: null } });
console.log('\nSample Question with R2 Image:');
console.log('  Content:', sampleImgQ?.content?.slice(0, 100));
console.log('  R2 Image URL:', sampleImgQ?.questionImageUrl);
console.log('  Answer Explanation:', sampleImgQ?.explanation?.slice(0, 120));

await mongoose.disconnect();

