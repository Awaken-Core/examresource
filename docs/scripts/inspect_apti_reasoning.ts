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

// Aptitude-related subjects
const aptitudeSubjects = ['Quantitative Aptitude', 'Mathematics', 'Mathematics & Aptitude'];
// Reasoning-related subjects
const reasoningSubjects = ['Logical Reasoning', 'Reasoning', 'Reasoning Ability', 'General Intelligence & Reasoning', 'Research Aptitude'];

console.log('=== APTITUDE-RELATED SUBJECTS ===');
for (const s of aptitudeSubjects) {
  const count = await db.collection('questions').countDocuments({ subject: s });
  const topics = await db.collection('questions').distinct('topic', { subject: s });
  const tags = await db.collection('questions').distinct('tags', { subject: s });
  console.log(`\n${s}: ${count} questions`);
  console.log(`  Topics: ${JSON.stringify(topics)}`);
  // Sample one question
  const sample = await db.collection('questions').findOne({ subject: s });
  if (sample) console.log(`  Sample: "${sample.content?.substring(0, 80)}..."`);
}

console.log('\n=== REASONING-RELATED SUBJECTS ===');
for (const s of reasoningSubjects) {
  const count = await db.collection('questions').countDocuments({ subject: s });
  const topics = await db.collection('questions').distinct('topic', { subject: s });
  console.log(`\n${s}: ${count} questions`);
  console.log(`  Topics: ${JSON.stringify(topics)}`);
  const sample = await db.collection('questions').findOne({ subject: s });
  if (sample) console.log(`  Sample: "${sample.content?.substring(0, 80)}..."`);
}

console.log('\n=== GRAND TOTAL ===');
const allAptCount = await db.collection('questions').countDocuments({ subject: { $in: [...aptitudeSubjects, ...reasoningSubjects] } });
console.log(`Combined Aptitude+Reasoning from PDF: ${allAptCount}`);

const total = await db.collection('questions').countDocuments();
console.log(`Total all questions in DB: ${total}`);

await mongoose.disconnect();
