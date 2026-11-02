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
console.log('DSSSB Series ID:', series?._id?.toString());

const questions = await mongoose.connection.collection('questions').find({ subject: 'Computer Science' }).toArray();
console.log('Total Questions in DB:', questions.length);

const chapters = await mongoose.connection.collection('chapters').find({ testSeriesId: series!._id }).toArray();
console.log(`\nQuestions per Chapter (${chapters.length} chapters):`);
for (const ch of chapters) {
  const qList = questions.filter(q => q.chapterId?.toString() === ch._id.toString());
  console.log(`  • ${ch.name}: ${qList.length} questions`);
}

// Check exam tags
const examCounts: Record<string, number> = {};
for (const q of questions) {
  const src = q.source || 'Other';
  examCounts[src] = (examCounts[src] || 0) + 1;
}
console.log(`\nUnique Exam sources in Question Bank: ${Object.keys(examCounts).length}`);
const topSources = Object.entries(examCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);
for (const [src, cnt] of topSources) {
  console.log(`  - ${src}: ${cnt}`);
}

await mongoose.disconnect();

