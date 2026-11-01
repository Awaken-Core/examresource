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
const db = mongoose.connection;

// All subjects
const subjects = await db.collection('questions').distinct('subject');
console.log('ALL SUBJECTS:', JSON.stringify(subjects));

// DSSSB chapters
const series = await db.collection('test_series').findOne({ slug: 'dsssb-tgt-computer-science' });
const chapters = await db.collection('chapters').find({ testSeriesId: series!._id }).toArray();
console.log('\nDSSB CHAPTERS:');
for (const ch of chapters) {
  const count = await db.collection('questions').countDocuments({ chapterId: ch._id });
  console.log(`  "${ch.name}": ${count} questions`);
}

// Unique topics in CS questions
const topics = await db.collection('questions').distinct('topic', { subject: 'Computer Science' });
console.log('\nALL CS TOPICS:', JSON.stringify(topics));

// Tags used
const tags = await db.collection('questions').distinct('tags', { subject: 'Computer Science' });
console.log('\nALL CS TAGS (first 30):', JSON.stringify(tags.slice(0, 30)));

// Total counts
const csCount = await db.collection('questions').countDocuments({ subject: 'Computer Science' });
const aptCount = await db.collection('questions').countDocuments({ subject: 'Quantitative Aptitude' });
const reasonCount = await db.collection('questions').countDocuments({ subject: 'Logical Reasoning' });
console.log(`\nQ COUNTS: CS=${csCount}, Aptitude=${aptCount}, Reasoning=${reasonCount}`);

await mongoose.disconnect();
