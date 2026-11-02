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
let totalQ = 0;
for (const ch of chapters) {
  const qCount = await mongoose.connection.collection('questions').countDocuments({ chapterId: ch._id });
  totalQ += qCount;
  console.log(`  • ${ch.name}: ${qCount} questions in DB`);
}
console.log(`\nTotal Questions Across All Chapters: ${totalQ}`);

const examCount = await mongoose.connection.collection('exams').countDocuments({ testSeriesId: series!._id });
const freeExams = await mongoose.connection.collection('exams').countDocuments({ testSeriesId: series!._id, access: 'free' });
const premiumExams = await mongoose.connection.collection('exams').countDocuments({ testSeriesId: series!._id, access: 'premium' });

console.log(`\nMock Tests in DB: Total=${examCount} | Free=${freeExams} | Premium=${premiumExams}`);

const r2ImgCount = await mongoose.connection.collection('questions').countDocuments({ questionImageUrl: { $ne: null } });
console.log(`Questions with R2 Diagrams: ${r2ImgCount}`);

const sampleImgQ = await mongoose.connection.collection('questions').findOne({ questionImageUrl: { $ne: null } });
console.log('\nSample Question with R2 Image:');
console.log('  Content:', sampleImgQ?.content?.slice(0, 100));
console.log('  R2 Image URL:', sampleImgQ?.questionImageUrl);
console.log('  Answer Explanation:', sampleImgQ?.explanation?.slice(0, 120));

await mongoose.disconnect();
console.log('\n[SUCCESS] Seeding verification complete!');

