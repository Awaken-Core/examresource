/**
 * Migrate PDF-extracted Aptitude & Reasoning questions into the new test series.
 * 
 * This script:
 * 1. Finds all questions from the PDF with aptitude/reasoning subjects
 * 2. Re-maps them to proper chapters in the new Aptitude & Reasoning series
 * 3. Updates their subject, subjectId, chapterId fields
 * 4. Regenerates tests to include these additional questions
 *
 * Usage: bun run docs/scripts/migrate_pdf_apti_reasoning.ts
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
console.log('[migrate] Connected to MongoDB.');
const db = mongoose.connection;

// ─── Get series IDs ─────────────────────────────────────────────────────────
const aptSeries = await db.collection('test_series').findOne({ slug: 'quantitative-aptitude-complete' });
const reasonSeries = await db.collection('test_series').findOne({ slug: 'logical-reasoning-complete' });
if (!aptSeries || !reasonSeries) throw new Error('Series not found — run seed scripts first');

const aptSubject = await db.collection('subjects').findOne({ slug: 'quantitative-aptitude' });
const reasonSubject = await db.collection('subjects').findOne({ slug: 'logical-reasoning' });

// ─── Load chapters for both series ──────────────────────────────────────────
const aptChapters = await db.collection('chapters').find({ testSeriesId: aptSeries._id }).toArray();
const reasonChapters = await db.collection('chapters').find({ testSeriesId: reasonSeries._id }).toArray();

const aptChMap: Record<string, any> = {};
for (const ch of aptChapters) aptChMap[ch.name] = ch;

const reasonChMap: Record<string, any> = {};
for (const ch of reasonChapters) reasonChMap[ch.name] = ch;

console.log('Aptitude chapters:', aptChapters.map(c => c.name));
console.log('Reasoning chapters:', reasonChapters.map(c => c.name));

// ─── Topic → Chapter mapping ─────────────────────────────────────────────────
// For Aptitude
const aptTopicToChapter: Record<string, string> = {
  // Mathematics & Aptitude topics
  'Algebra': 'Algebra & Linear Equations',
  'Calculus': 'Miscellaneous Arithmetic',
  'Linear Algebra': 'Algebra & Linear Equations',
  'Probability': 'Miscellaneous Arithmetic',
  'Statistics': 'Data Interpretation',
  'Trigonometry': 'Geometry & Mensuration',
  'Data Interpretation': 'Data Interpretation',
  'LCM & HCF': 'Number System & HCF/LCM',
  'Profit & Loss': 'Percentage & Profit/Loss',
  'Percentages': 'Percentage & Profit/Loss',
  'Ratio and Proportion': 'Ratio, Proportion & Averages',
  'Simple Interest': 'Simple & Compound Interest',
  // Already correct mappings
  'Number System & HCF/LCM': 'Number System & HCF/LCM',
  'Percentage & Profit/Loss': 'Percentage & Profit/Loss',
  'Simple & Compound Interest': 'Simple & Compound Interest',
  'Time, Work & Pipes': 'Time, Work & Pipes',
  'Speed, Distance & Time': 'Speed, Distance & Time',
  'Ratio, Proportion & Averages': 'Ratio, Proportion & Averages',
  'Algebra & Linear Equations': 'Algebra & Linear Equations',
  'Geometry & Mensuration': 'Geometry & Mensuration',
  'Miscellaneous Arithmetic': 'Miscellaneous Arithmetic',
};

// For Reasoning
const reasonTopicToChapter: Record<string, string> = {
  'Analogy': 'Analogy & Classification',
  'Number Series': 'Number & Letter Series',
  'Divisibility Rules': 'Number & Letter Series',
  'Letter Coding': 'Coding-Decoding',
  // Already correct
  'Number & Letter Series': 'Number & Letter Series',
  'Coding-Decoding': 'Coding-Decoding',
  'Blood Relations': 'Blood Relations',
  'Direction & Distance': 'Direction & Distance',
  'Ranking & Arrangement': 'Ranking & Arrangement',
  'Syllogism': 'Syllogism',
  'Analogy & Classification': 'Analogy & Classification',
  'Puzzles & Seating Arrangement': 'Puzzles & Seating Arrangement',
  'Mathematical Operations': 'Mathematical Operations',
  'Venn Diagrams & Statement-Conclusion': 'Venn Diagrams & Statement-Conclusion',
};

// ─── Sources to migrate ──────────────────────────────────────────────────────

// APTITUDE: migrate Mathematics & Aptitude (55 Qs), Mathematics (2 Qs)
const aptSources = ['Mathematics & Aptitude', 'Mathematics'];
const aptPdfQs = await db.collection('questions').find({ subject: { $in: aptSources } }).toArray();
console.log(`\n[migrate] Found ${aptPdfQs.length} PDF aptitude questions to migrate`);

// REASONING: migrate Reasoning Ability (26), Reasoning (4), General Intelligence & Reasoning (1), Research Aptitude (2)
const reasonSources = ['Reasoning Ability', 'Reasoning', 'General Intelligence & Reasoning', 'Research Aptitude'];
const reasonPdfQs = await db.collection('questions').find({ subject: { $in: reasonSources } }).toArray();
console.log(`[migrate] Found ${reasonPdfQs.length} PDF reasoning questions to migrate`);

// ─── Migrate Aptitude questions ──────────────────────────────────────────────
let aptMigrated = 0;
const defaultAptChapter = aptChMap['Miscellaneous Arithmetic'];

for (const q of aptPdfQs) {
  // Skip if already has valid options (at least 2)
  if (!q.options || q.options.filter((o: any) => o.content).length < 2) {
    console.log(`  [SKIP-INVALID] ${q._id}: < 2 options`);
    continue;
  }

  const topic = q.topic || '';
  const chapterName = aptTopicToChapter[topic] || 'Miscellaneous Arithmetic';
  const chapter = aptChMap[chapterName] || defaultAptChapter;

  await db.collection('questions').updateOne(
    { _id: q._id },
    {
      $set: {
        subject: 'Quantitative Aptitude',
        subjectId: aptSubject!._id,
        chapterId: chapter._id,
        topic: chapterName,
        tags: [...(q.tags || []), 'Aptitude', 'Government Exam', 'PDF Extracted'],
        updatedAt: new Date(),
      }
    }
  );
  aptMigrated++;
}
console.log(`[migrate] ✅ Aptitude migrated: ${aptMigrated}`);

// ─── Migrate Reasoning questions ─────────────────────────────────────────────
let reasonMigrated = 0;
const defaultReasonChapter = reasonChMap['Miscellaneous Arithmetic'] || reasonChMap['Venn Diagrams & Statement-Conclusion'];

for (const q of reasonPdfQs) {
  if (!q.options || q.options.filter((o: any) => o.content).length < 2) {
    console.log(`  [SKIP-INVALID] ${q._id}: < 2 options`);
    continue;
  }

  const topic = q.topic || '';
  const chapterName = reasonTopicToChapter[topic] || 'Venn Diagrams & Statement-Conclusion';
  const chapter = reasonChMap[chapterName] || defaultReasonChapter;

  await db.collection('questions').updateOne(
    { _id: q._id },
    {
      $set: {
        subject: 'Logical Reasoning',
        subjectId: reasonSubject!._id,
        chapterId: chapter._id,
        topic: chapterName,
        tags: [...(q.tags || []), 'Reasoning', 'Government Exam', 'PDF Extracted'],
        updatedAt: new Date(),
      }
    }
  );
  reasonMigrated++;
}
console.log(`[migrate] ✅ Reasoning migrated: ${reasonMigrated}`);

// ─── Final counts ─────────────────────────────────────────────────────────────
const finalApt = await db.collection('questions').countDocuments({ subject: 'Quantitative Aptitude' });
const finalReason = await db.collection('questions').countDocuments({ subject: 'Logical Reasoning' });
console.log(`\n[migrate] FINAL COUNTS:`);
console.log(`  Quantitative Aptitude: ${finalApt} questions`);
console.log(`  Logical Reasoning: ${finalReason} questions`);
console.log(`  Total Aptitude+Reasoning: ${finalApt + finalReason}`);

await mongoose.disconnect();
console.log('[migrate] Done!');
