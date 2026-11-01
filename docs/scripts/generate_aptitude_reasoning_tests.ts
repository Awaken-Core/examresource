/**
 * Generate 800+ Tests for Quantitative Aptitude & Logical Reasoning
 *
 * Aptitude (quantitative-aptitude-complete):
 *   - 10 chapters × 12 chapter tests (20 Qs each) = 120
 *   - 10 chapters × 5 sectional tests (all Qs in chapter) = 50
 *   - 10 grand mock tests (all available Qs, random 50) = 10
 *   Total Aptitude = 180 tests
 *
 * Reasoning (logical-reasoning-complete):
 *   - 10 chapters × 12 chapter tests (15 Qs each) = 120
 *   - 10 chapters × 5 sectional tests = 50
 *   - 10 grand mock tests = 10
 *   Total Reasoning = 180 tests
 *
 * Grand Total = 360 tests
 *
 * Usage: bun run docs/scripts/generate_aptitude_reasoning_tests.ts
 */

import 'dotenv/config';
import mongoose, { Types } from 'mongoose';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Load .env
const envFile = resolve(import.meta.dir, '../../apps/server/.env');
for (const line of readFileSync(envFile, 'utf-8').split('\n')) {
  const t = line.trim();
  if (t && !t.startsWith('#') && t.includes('=')) {
    const [k, ...v] = t.split('=');
    process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
  }
}

await mongoose.connect(process.env.DATABASE_URL!);
console.log('[generator] Connected to MongoDB.');

const db = mongoose.connection;
const ExamCol = db.collection('exams');
const QCol = db.collection('questions');
const SeriesCol = db.collection('test_series');
const ChapterCol = db.collection('chapters');
const UserCol = db.collection('users');

const adminUser = await UserCol.findOne({ role: 'admin' });
const adminId = adminUser?._id || new Types.ObjectId();

// ─── Helper: deterministic shuffle ─────────────────────────────────────────────
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let m = a.length, t, i;
  let s = seed;
  while (m) {
    s = (s * 9301 + 49297) % 233280;
    i = Math.floor((s / 233280) * m--);
    t = a[m]; a[m] = a[i]; a[i] = t;
  }
  return a;
}

function buildSnapshots(questions: any[]) {
  return questions.map((q, idx) => ({
    questionId: q._id,
    position: idx + 1,
    marks: 1,
    negativeMarks: 0.25,
    sectionId: null,
    snapshot: {
      content: q.content,
      type: q.type,
      options: q.options,
      explanation: q.explanation,
      difficulty: q.difficulty,
      topic: q.topic,
    },
  }));
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const INSTRUCTIONS = [
  '• Each question carries 1 mark.',
  '• 0.25 marks deducted for each wrong answer.',
  '• Do not refresh or close the browser during the test.',
  '• Review all answers before submitting.',
];

let totalCreated = 0;
let totalSkipped = 0;

// ─── Core generator function ───────────────────────────────────────────────────
async function generateTestsForSeries(seriesSlug: string, subjectName: string, qsPerChapterTest: number) {
  const series = await SeriesCol.findOne({ slug: seriesSlug });
  if (!series) throw new Error(`Series not found: ${seriesSlug}`);
  const testSeriesId = series._id;

  const chapters = await ChapterCol.find({ testSeriesId }).toArray();
  console.log(`\n[${subjectName}] ${chapters.length} chapters found.`);

  const allQuestions = await QCol.find({ subject: subjectName }).toArray();
  console.log(`[${subjectName}] ${allQuestions.length} total questions.`);

  const qByChapter = new Map<string, any[]>();
  for (const ch of chapters) qByChapter.set(ch._id.toString(), []);
  for (const q of allQuestions) {
    const cid = q.chapterId?.toString();
    if (cid && qByChapter.has(cid)) qByChapter.get(cid)!.push(q);
  }

  let seriesCreated = 0;
  let seriesSkipped = 0;

  // ── Phase 1: Chapter Practice Tests (12 per chapter) ───────────────────────
  console.log(`[${subjectName}] Generating chapter practice tests...`);
  for (const ch of chapters) {
    const chQs = qByChapter.get(ch._id.toString()) || [];
    if (chQs.length === 0) { console.log(`  [SKIP] ${ch.name}: no questions`); continue; }

    for (let variant = 1; variant <= 12; variant++) {
      const isFree = variant <= 3;
      const shuffled = seededShuffle(chQs, variant * 31 + ch.order * 7);
      const selected = shuffled.slice(0, Math.min(qsPerChapterTest, shuffled.length));
      if (selected.length < 5) continue;

      const title = `${ch.name} - Practice Test ${variant}`;
      const slug = `${slugify(ch.name)}-practice-${variant}-${slugify(seriesSlug)}`;

      const existing = await ExamCol.findOne({ slug });
      if (existing) { seriesSkipped++; continue; }

      await ExamCol.insertOne({
        title,
        slug,
        description: `Chapter practice test ${variant} for ${ch.name}. Covers important ${subjectName} concepts.`,
        type: 'mock_test',
        testMode: 'practice',
        status: 'published',
        access: isFree ? 'free' : 'premium',
        testSeriesId,
        subjectId: ch.subjectId,
        chapterId: ch._id,
        subject: subjectName,
        durationMinutes: Math.ceil(selected.length * 1.5),
        languages: ['Hindi', 'English'],
        instructions: INSTRUCTIONS,
        positiveMarks: 1,
        negativeMarkingEnabled: true,
        negativeMarks: 0.25,
        questionSelectionMode: 'manual',
        questionOrderMode: 'fixed',
        questionSetMode: 'fixed',
        totalQuestionsCount: selected.length,
        version: 1,
        isCurrentVersion: true,
        parentTestId: null,
        createdBy: adminId,
        sections: [],
        questions: buildSnapshots(selected),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      seriesCreated++;
    }
  }

  // ── Phase 2: Sectional Tests (5 per chapter, all Qs) ───────────────────────
  console.log(`[${subjectName}] Generating sectional tests...`);
  for (const ch of chapters) {
    const chQs = qByChapter.get(ch._id.toString()) || [];
    if (chQs.length === 0) continue;

    for (let variant = 1; variant <= 5; variant++) {
      const isFree = variant === 1;
      const shuffled = seededShuffle(chQs, variant * 53 + ch.order * 11);
      const selected = shuffled.slice(0, Math.min(chQs.length, 20));

      const title = `${ch.name} - Sectional Test ${variant}`;
      const slug = `${slugify(ch.name)}-sectional-${variant}-${slugify(seriesSlug)}`;

      const existing = await ExamCol.findOne({ slug });
      if (existing) { seriesSkipped++; continue; }

      await ExamCol.insertOne({
        title,
        slug,
        description: `Full sectional test ${variant} for ${ch.name}. All topics covered.`,
        type: 'sectional_test',
        testMode: 'exam',
        status: 'published',
        access: isFree ? 'free' : 'premium',
        testSeriesId,
        subjectId: ch.subjectId,
        chapterId: ch._id,
        subject: subjectName,
        durationMinutes: Math.ceil(selected.length * 1.2),
        languages: ['Hindi', 'English'],
        instructions: INSTRUCTIONS,
        positiveMarks: 1,
        negativeMarkingEnabled: true,
        negativeMarks: 0.25,
        questionSelectionMode: 'manual',
        questionOrderMode: 'fixed',
        questionSetMode: 'fixed',
        totalQuestionsCount: selected.length,
        version: 1,
        isCurrentVersion: true,
        parentTestId: null,
        createdBy: adminId,
        sections: [],
        questions: buildSnapshots(selected),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      seriesCreated++;
    }
  }

  // ── Phase 3: Full Grand Mock Tests ─────────────────────────────────────────
  console.log(`[${subjectName}] Generating grand mock tests...`);
  for (let mock = 1; mock <= 20; mock++) {
    const isFree = mock <= 3;
    const shuffled = seededShuffle(allQuestions, mock * 97 + 13);
    const selected = shuffled.slice(0, Math.min(50, shuffled.length));
    if (selected.length < 10) continue;

    const title = `${subjectName} - Grand Mock Test ${mock}`;
    const slug = `${slugify(subjectName)}-grand-mock-${mock}`;

    const existing = await ExamCol.findOne({ slug });
    if (existing) { seriesSkipped++; continue; }

    // Find subjectId from first question
    const subjectId = selected[0]?.subjectId;

    await ExamCol.insertOne({
      title,
      slug,
      description: `Full-length grand mock test ${mock} for ${subjectName}. Covers all chapters.`,
      type: 'full_mock',
      testMode: 'exam',
      status: 'published',
      access: isFree ? 'free' : 'premium',
      testSeriesId,
      subjectId,
      chapterId: null,
      subject: subjectName,
      durationMinutes: 60,
      languages: ['Hindi', 'English'],
      instructions: INSTRUCTIONS,
      positiveMarks: 1,
      negativeMarkingEnabled: true,
      negativeMarks: 0.25,
      questionSelectionMode: 'manual',
      questionOrderMode: 'fixed',
      questionSetMode: 'fixed',
      totalQuestionsCount: selected.length,
      version: 1,
      isCurrentVersion: true,
      parentTestId: null,
      createdBy: adminId,
      sections: [],
      questions: buildSnapshots(selected),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    seriesCreated++;
  }

  // ── Phase 4: Speed Tests (timed 10-min sprints) ─────────────────────────────
  console.log(`[${subjectName}] Generating speed tests...`);
  for (const ch of chapters) {
    const chQs = qByChapter.get(ch._id.toString()) || [];
    if (chQs.length < 5) continue;

    for (let variant = 1; variant <= 3; variant++) {
      const shuffled = seededShuffle(chQs, variant * 71 + ch.order * 3);
      const selected = shuffled.slice(0, Math.min(10, chQs.length));

      const title = `${ch.name} - Speed Test ${variant}`;
      const slug = `${slugify(ch.name)}-speed-${variant}-${slugify(seriesSlug)}`;

      const existing = await ExamCol.findOne({ slug });
      if (existing) { seriesSkipped++; continue; }

      await ExamCol.insertOne({
        title,
        slug,
        description: `10-minute speed drill for ${ch.name}. Test your speed and accuracy.`,
        type: 'speed_test',
        testMode: 'practice',
        status: 'published',
        access: variant === 1 ? 'free' : 'premium',
        testSeriesId,
        subjectId: ch.subjectId,
        chapterId: ch._id,
        subject: subjectName,
        durationMinutes: 10,
        languages: ['Hindi', 'English'],
        instructions: INSTRUCTIONS,
        positiveMarks: 1,
        negativeMarkingEnabled: false,
        negativeMarks: 0,
        questionSelectionMode: 'manual',
        questionOrderMode: 'fixed',
        questionSetMode: 'fixed',
        totalQuestionsCount: selected.length,
        version: 1,
        isCurrentVersion: true,
        parentTestId: null,
        createdBy: adminId,
        sections: [],
        questions: buildSnapshots(selected),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      seriesCreated++;
    }
  }

  // ── Phase 5: Mixed Chapter Tests (cross-chapter) ────────────────────────────
  console.log(`[${subjectName}] Generating mixed chapter tests...`);
  for (let mix = 1; mix <= 15; mix++) {
    const isFree = mix <= 2;
    // Pick 2-3 questions from each chapter, shuffle
    const selected: any[] = [];
    for (const ch of chapters) {
      const chQs = qByChapter.get(ch._id.toString()) || [];
      const s = seededShuffle(chQs, mix * 41 + ch.order * 13).slice(0, 3);
      selected.push(...s);
    }
    if (selected.length < 10) continue;
    const finalSelected = seededShuffle(selected, mix * 59).slice(0, Math.min(40, selected.length));

    const title = `${subjectName} - Mixed Test ${mix}`;
    const slug = `${slugify(subjectName)}-mixed-${mix}`;

    const existing = await ExamCol.findOne({ slug });
    if (existing) { seriesSkipped++; continue; }

    const subjectId = finalSelected[0]?.subjectId;

    await ExamCol.insertOne({
      title,
      slug,
      description: `Mixed chapter test ${mix} covering all ${subjectName} topics proportionally.`,
      type: 'mixed_test',
      testMode: 'practice',
      status: 'published',
      access: isFree ? 'free' : 'premium',
      testSeriesId,
      subjectId,
      chapterId: null,
      subject: subjectName,
      durationMinutes: 45,
      languages: ['Hindi', 'English'],
      instructions: INSTRUCTIONS,
      positiveMarks: 1,
      negativeMarkingEnabled: true,
      negativeMarks: 0.25,
      questionSelectionMode: 'manual',
      questionOrderMode: 'fixed',
      questionSetMode: 'fixed',
      totalQuestionsCount: finalSelected.length,
      version: 1,
      isCurrentVersion: true,
      parentTestId: null,
      createdBy: adminId,
      sections: [],
      questions: buildSnapshots(finalSelected),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    seriesCreated++;
  }

  console.log(`[${subjectName}] ✅ Created: ${seriesCreated}, Skipped: ${seriesSkipped}`);
  totalCreated += seriesCreated;
  totalSkipped += seriesSkipped;

  // Count free vs premium
  const freeCount = await ExamCol.countDocuments({ testSeriesId, access: 'free' });
  const premiumCount = await ExamCol.countDocuments({ testSeriesId, access: 'premium' });
  console.log(`[${subjectName}] Free: ${freeCount}, Premium: ${premiumCount}, Total: ${freeCount + premiumCount}`);

  return { freeCount, premiumCount, total: freeCount + premiumCount };
}

// ─── Run for both series ────────────────────────────────────────────────────────
const aptStats = await generateTestsForSeries('quantitative-aptitude-complete', 'Quantitative Aptitude', 20);
const reasonStats = await generateTestsForSeries('logical-reasoning-complete', 'Logical Reasoning', 15);

console.log('\n═══════════════════════════════════════════════');
console.log(`TOTAL CREATED: ${totalCreated}`);
console.log(`TOTAL SKIPPED: ${totalSkipped}`);
console.log(`Aptitude Tests: ${aptStats.total} (Free: ${aptStats.freeCount}, Premium: ${aptStats.premiumCount})`);
console.log(`Reasoning Tests: ${reasonStats.total} (Free: ${reasonStats.freeCount}, Premium: ${reasonStats.premiumCount})`);
console.log('═══════════════════════════════════════════════');

await mongoose.disconnect();
console.log('[generator] Done!');
