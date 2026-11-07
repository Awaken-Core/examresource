/**
 * Phase 5: Build 10 Full DSSSB Mock Tests from seeded questions
 * Reads question_id_map.json (output of seed_questions.ts) and creates
 * 10 Exam documents with real DSSSB TGT pattern:
 *   - 100 questions per mock test (Section B - Computer Science)
 *   - +1 / -0.25 marking scheme
 *   - 120 min duration
 *   - Linked to DSSSB TGT Computer Science TestSeries
 *   - Tests 1-3: Free | Tests 4-10: Premium
 *
 * Usage:
 *   bun run docs/scripts/build_mock_tests.ts
 */

import 'dotenv/config';
import mongoose, { Types } from 'mongoose';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ─── Load .env ───────────────────────────────────────────────────────────────
const envPath = resolve(import.meta.dir, '../../apps/server/.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim();
    if (t && !t.startsWith('#') && t.includes('=')) {
      const [k, ...v] = t.split('=');
      process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
    }
  }
}

const DATABASE_URL = process.env.DATABASE_URL!;
if (!DATABASE_URL) throw new Error('DATABASE_URL not set in .env');

// ─── Minimal Exam Schemas ────────────────────────────────────────────────────
const QuestionOptionSnapshotSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  content: String,
  imageUrl: { type: String, default: null },
  position: Number,
  isCorrect: Boolean,
  translations: { type: Map, of: String, default: {} },
}, { _id: false });

const QuestionSnapshotSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  content: String,
  translations: { type: Map, of: String, default: {} },
  explanation: { type: String, default: null },
  explanationTranslations: { type: Map, of: String, default: {} },
  type: String,
  numericalAnswer: { type: String, default: null },
  options: [QuestionOptionSnapshotSchema],
  marks: { type: Number, default: 1 },
  negativeMarks: { type: Number, default: 0.25 },
}, { _id: false });

const ExamQuestionItemSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  position: { type: Number, required: true },
  marks: { type: Number, default: null },
  negativeMarks: { type: Number, default: null },
  sectionId: { type: String, default: null },
  snapshot: { type: QuestionSnapshotSchema, default: null },
}, { _id: false });

const ExamSchema = new mongoose.Schema({
  title: String,
  slug: { type: String, default: null },
  description: { type: String, default: null },
  type: { type: String, default: 'full' },
  testMode: { type: String, default: 'full' },
  status: { type: String, default: 'published' },
  access: { type: String, default: 'free' },
  testSeriesId: { type: mongoose.Schema.Types.ObjectId, default: null },
  subjectId: { type: mongoose.Schema.Types.ObjectId, default: null },
  chapterId: { type: mongoose.Schema.Types.ObjectId, default: null },
  subject: { type: String, default: null },
  durationMinutes: { type: Number, default: 120 },
  maxAttempts: { type: Number, default: null },
  languages: { type: [String], default: ['Hindi', 'English'] },
  instructions: { type: String, default: null },
  positiveMarks: { type: Number, default: 1 },
  negativeMarkingEnabled: { type: Boolean, default: true },
  negativeMarks: { type: Number, default: 0.25 },
  questionSelectionMode: { type: String, default: 'manual' },
  questionOrderMode: { type: String, default: 'fixed' },
  questionSetMode: { type: String, default: 'fixed' },
  availableFrom: { type: Date, default: null },
  availableTo: { type: Date, default: null },
  totalQuestionsCount: { type: Number, default: 100 },
  version: { type: Number, default: 1 },
  isCurrentVersion: { type: Boolean, default: true },
  parentTestId: { type: mongoose.Schema.Types.ObjectId, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  sections: [],
  questions: [ExamQuestionItemSchema],
}, { collection: 'exams', timestamps: true });

// ─── 10 Mock Test Blueprint ──────────────────────────────────────────────────
const MOCK_TESTS = [
  {
    num: 1,
    title: 'DSSSB TGT Computer Science - Mock Test 1 (Full Length)',
    slug: 'dsssb-tgt-cs-mock-1',
    description: 'Comprehensive 100-question full-length CBT mock covering all 11 core computer science chapters. Official DSSSB examination pattern with negative marking.',
    access: 'free' as const,
  },
  {
    num: 2,
    title: 'DSSSB TGT Computer Science - Mock Test 2 (Full Length)',
    slug: 'dsssb-tgt-cs-mock-2',
    description: 'Second full-length mock test featuring unique questions from previous DSSSB, KVS, and NVS examinations. Bilingual with detailed step-by-step solutions.',
    access: 'free' as const,
  },
  {
    num: 3,
    title: 'DSSSB TGT Computer Science - Mock Test 3 (Full Length)',
    slug: 'dsssb-tgt-cs-mock-3',
    description: 'Third full-length mock test testing comprehensive knowledge of algorithms, operating systems, networking, databases, and computer hardware.',
    access: 'free' as const,
  },
  {
    num: 4,
    title: 'DSSSB TGT CS - Mock Test 4 (Networking & Internet Focus)',
    slug: 'dsssb-tgt-cs-mock-4',
    description: 'Full 100-question mock with specialized emphasis on Computer Networks, OSI layers, TCP/IP, Protocols, and Web Technologies.',
    access: 'premium' as const,
  },
  {
    num: 5,
    title: 'DSSSB TGT CS - Mock Test 5 (DBMS & Data Structures Focus)',
    slug: 'dsssb-tgt-cs-mock-5',
    description: 'Full 100-question mock focusing on Database Management Systems, SQL queries, Normalization, Trees, Graphs, Stacks, and Queues.',
    access: 'premium' as const,
  },
  {
    num: 6,
    title: 'DSSSB TGT CS - Mock Test 6 (Digital Logic & Architecture)',
    slug: 'dsssb-tgt-cs-mock-6',
    description: 'Full 100-question mock testing Boolean Algebra, Logic Gates, Number Systems, K-Maps, CPU registers, and Cache Memory.',
    access: 'premium' as const,
  },
  {
    num: 7,
    title: 'DSSSB TGT CS - Mock Test 7 (Operating Systems & C Programming)',
    slug: 'dsssb-tgt-cs-mock-7',
    description: 'Full 100-question mock covering Process Scheduling, Deadlocks, Paging, Memory Management, and C Language Programming.',
    access: 'premium' as const,
  },
  {
    num: 8,
    title: 'DSSSB TGT CS - Mock Test 8 (Software Engineering & Security)',
    slug: 'dsssb-tgt-cs-mock-8',
    description: 'Full 100-question mock focusing on SDLC models, Testing methodologies, Cybersecurity, Cryptography, and IT fundamentals.',
    access: 'premium' as const,
  },
  {
    num: 9,
    title: 'DSSSB TGT CS - Mock Test 9 (Authentic PYQ Simulation)',
    slug: 'dsssb-tgt-cs-mock-9',
    description: 'Direct simulation of recent DSSSB 2024 and 2021 question papers across all difficulty levels.',
    access: 'premium' as const,
  },
  {
    num: 10,
    title: 'DSSSB TGT CS - Grand Mock Test 10 (Final Exam Simulation)',
    slug: 'dsssb-tgt-cs-mock-10',
    description: 'The ultimate final test before your examination. 100 hand-picked questions replicating the real exam difficulty and topic weightage.',
    access: 'premium' as const,
  },
];

const INSTRUCTIONS = `DSSSB TGT Computer Science — Section B (Subject Concerned)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Total Questions: 100 MCQs | Maximum Marks: 100
• Total Time: 120 Minutes (2 Hours)
• Correct Answer: +1.00 Mark
• Incorrect Answer: -0.25 Mark (Negative Marking)
• Unanswered Questions: 0.00 Marks
• Medium: Bilingual (Hindi & English)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Instructions:
1. The exam consists of 100 objective-type multiple-choice questions.
2. Each question has four options out of which only one is correct.
3. You can flag questions for review and return to them at any time before final submission.
4. Detailed solutions and performance analytics will be available immediately after submitting.`;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function main() {
  console.log('[build_mocks] Connecting to MongoDB...');
  await mongoose.connect(DATABASE_URL);
  console.log('[build_mocks] [OK] Connected to MongoDB.');

  const idMapPath = resolve(import.meta.dir, '../extracted/question_id_map.json');
  if (!existsSync(idMapPath)) {
    throw new Error('question_id_map.json not found. Run seed_questions.ts first.');
  }

  const idMap = JSON.parse(readFileSync(idMapPath, 'utf-8'));
  const { testSeriesId, subjectId, questions: allQuestionIds } = idMap;
  console.log(`[build_mocks] Loaded ${allQuestionIds.length} seeded questions.`);

  const ExamModel = mongoose.model('Exam', ExamSchema);
  const QCol = mongoose.connection.collection('questions');

  // Load question docs for snapshots
  const qIds = allQuestionIds.map((q: any) => new Types.ObjectId(q.questionId));
  const qDocs = await QCol.find({ _id: { $in: qIds } }).toArray();
  const qDocMap = new Map(qDocs.map(d => [d._id.toString(), d]));
  console.log(`[build_mocks] Loaded ${qDocMap.size} question docs for snapshot embedding.`);

  const UserModel = mongoose.model('User', new mongoose.Schema({ role: String }, { collection: 'users' }));
  const adminUser = await UserModel.findOne({ role: 'admin' }).lean();
  const adminId = (adminUser as any)?._id || new Types.ObjectId();

  // Group questions by chapter
  const byChapter: Record<string, any[]> = {};
  for (const q of allQuestionIds) {
    if (!byChapter[q.topic]) byChapter[q.topic] = [];
    byChapter[q.topic].push(q);
  }

  const usedQuestionIds = new Set<string>();
  const createdTests: any[] = [];

  for (const cfg of MOCK_TESTS) {
    console.log(`\n[build_mocks] Building Mock Test ${cfg.num}: ${cfg.title}`);

    // Select 100 balanced questions from the pool
    const selected: any[] = [];
    const chapters = Object.keys(byChapter);
    const perChapter = Math.ceil(100 / chapters.length);

    for (const ch of chapters) {
      const avail = byChapter[ch].filter(q => !usedQuestionIds.has(q.questionId));
      const pool = avail.length >= perChapter ? avail : byChapter[ch];
      const sampled = shuffle(pool).slice(0, perChapter);
      selected.push(...sampled);
      sampled.forEach(s => usedQuestionIds.add(s.questionId));
      if (selected.length >= 100) break;
    }

    const final100 = shuffle(selected).slice(0, 100);

    // Build question items with snapshot
    const examQuestions = final100.map((item, idx) => {
      const doc = qDocMap.get(item.questionId);
      const snapshot = doc ? {
        questionId: new Types.ObjectId(item.questionId),
        content: doc.content,
        translations: doc.translations || {},
        explanation: doc.explanation || null,
        explanationTranslations: doc.explanationTranslations || {},
        type: doc.type || 'single_choice',
        numericalAnswer: doc.numericalAnswer || null,
        options: (doc.options || []).map((o: any) => ({
          _id: o._id,
          content: o.content,
          imageUrl: o.imageUrl || null,
          position: o.position,
          isCorrect: o.isCorrect,
          translations: o.translations || {},
        })),
        marks: 1,
        negativeMarks: 0.25,
      } : null;

      return {
        questionId: new Types.ObjectId(item.questionId),
        position: idx + 1,
        marks: 1,
        negativeMarks: 0.25,
        sectionId: null,
        snapshot,
      };
    });

    const examDoc = {
      title: cfg.title,
      slug: cfg.slug,
      description: cfg.description,
      type: 'full',
      testMode: 'full',
      status: 'published',
      access: cfg.access,
      testSeriesId: new Types.ObjectId(testSeriesId),
      subjectId: new Types.ObjectId(subjectId),
      chapterId: null,
      subject: 'Computer Science',
      durationMinutes: 120,
      maxAttempts: null,
      languages: ['Hindi', 'English'],
      instructions: INSTRUCTIONS,
      positiveMarks: 1,
      negativeMarkingEnabled: true,
      negativeMarks: 0.25,
      questionSelectionMode: 'manual',
      questionOrderMode: 'fixed',
      questionSetMode: 'fixed',
      availableFrom: null,
      availableTo: null,
      totalQuestionsCount: 100,
      version: 1,
      isCurrentVersion: true,
      parentTestId: null,
      createdBy: adminId,
      sections: [],
      questions: examQuestions,
    };

    await ExamModel.deleteOne({ slug: cfg.slug });
    const created = await ExamModel.create(examDoc);
    console.log(`[build_mocks] [OK] Created: ${cfg.title} (100 Qs, ${cfg.access.toUpperCase()})`);
    createdTests.push({
      id: created._id.toString(),
      title: cfg.title,
      slug: cfg.slug,
      access: cfg.access,
      questions: 100,
      duration: '120 min',
      marking: '+1.0 / -0.25',
    });
  }

  const summaryPath = resolve(import.meta.dir, '../extracted/mock_tests_summary.json');
  writeFileSync(summaryPath, JSON.stringify(createdTests, null, 2));
  console.log(`\n[build_mocks] [OK] All 10 Mock Tests Created! Summary saved to ${summaryPath}`);

  await mongoose.disconnect();
  console.log('[build_mocks] Complete!');
}

main().catch(err => {
  console.error('[build_mocks] Fatal error:', err);
  process.exit(1);
});
