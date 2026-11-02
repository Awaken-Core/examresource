/**
 * Phase 4: Seed all 4,001 questions from the 576-page PDF into MongoDB.
 * Creates the DSSSB TestSeries hierarchy:
 *   TestSeries: "DSSSB TGT Computer Science"
 *   Subject: "Computer Science"
 *   11 Chapters:
 *     1. Digital Logic Circuits
 *     2. Computer Organization & Architecture
 *     3. Data Structures & Algorithms
 *     4. Programming Concepts in C
 *     5. Object Oriented Programming (C++ / Java)
 *     6. Operating Systems
 *     7. Database Management Systems (DBMS / SQL)
 *     8. Computer Networks & Data Communication
 *     9. Software Engineering
 *     10. Internet & Web Technologies
 *     11. Computer Fundamentals, Security & MS Office
 *
 * Usage:
 *   bun run docs/scripts/seed_questions.ts
 */

import 'dotenv/config';
import mongoose, { Types } from 'mongoose';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// ─── Load .env ───────────────────────────────────────────────────────────────
const envFile = resolve(import.meta.dir, '../../apps/server/.env');
if (!existsSync(envFile)) {
  console.error('.env not found at', envFile);
  process.exit(1);
}

for (const line of readFileSync(envFile, 'utf-8').split('\n')) {
  const t = line.trim();
  if (t && !t.startsWith('#') && t.includes('=')) {
    const [k, ...v] = t.split('=');
    process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
  }
}

const DATABASE_URL = process.env.DATABASE_URL!;
if (!DATABASE_URL) throw new Error('DATABASE_URL not set in .env');

// ─── Inline Schemas ──────────────────────────────────────────────────────────
const SubjectSchema = new mongoose.Schema({
  name: String, slug: String, description: String, iconUrl: String, createdBy: mongoose.Schema.Types.ObjectId,
}, { collection: 'subjects', timestamps: true });

const TestSeriesSchema = new mongoose.Schema({
  title: String, slug: String, description: String, targetExam: String,
  category: String, organization: String, status: String, accessType: String,
  supportedLanguages: [String], badge: String, logoUrl: String, order: Number, createdBy: mongoose.Schema.Types.ObjectId,
}, { collection: 'test_series', timestamps: true });

const TestSeriesSubjectSchema = new mongoose.Schema({
  testSeriesId: mongoose.Schema.Types.ObjectId,
  subjectId: mongoose.Schema.Types.ObjectId,
  order: Number, customDisplayName: String,
}, { collection: 'test_series_subjects', timestamps: true });

const ChapterSchema = new mongoose.Schema({
  name: String, slug: String, testSeriesId: mongoose.Schema.Types.ObjectId,
  subjectId: mongoose.Schema.Types.ObjectId, description: String, order: Number,
  status: String, createdBy: mongoose.Schema.Types.ObjectId,
}, { collection: 'chapters', timestamps: true });

const QuestionOptionSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  content: String, imageUrl: { type: String, default: null },
  position: Number, isCorrect: Boolean, translations: { type: Map, of: String, default: {} },
});

const QuestionSchema = new mongoose.Schema({
  content: String, translations: { type: Map, of: String, default: {} },
  explanation: { type: String, default: null },
  explanationTranslations: { type: Map, of: String, default: {} },
  type: { type: String, default: 'single_choice' },
  numericalAnswer: { type: String, default: null },
  difficulty: { type: String, default: 'medium' },
  status: { type: String, default: 'published' },
  isAvailableForNewTests: { type: Boolean, default: true },
  subject: String, subjectId: mongoose.Schema.Types.ObjectId,
  chapterId: mongoose.Schema.Types.ObjectId,
  topic: String, subtopic: { type: String, default: null },
  tags: [String], marks: { type: Number, default: 1 },
  negativeMarks: { type: Number, default: 0.25 },
  source: String, createdBy: mongoose.Schema.Types.ObjectId,
  options: [QuestionOptionSchema],
  questionImageUrl: { type: String, default: null },
}, { collection: 'questions', timestamps: true });

const QuestionMappingSchema = new mongoose.Schema({
  questionId: mongoose.Schema.Types.ObjectId,
  subjectId: mongoose.Schema.Types.ObjectId,
  testSeriesId: mongoose.Schema.Types.ObjectId,
  chapterId: mongoose.Schema.Types.ObjectId,
  order: { type: Number, default: 0 },
  createdBy: mongoose.Schema.Types.ObjectId,
}, { collection: 'question_mappings', timestamps: true });

// ─── 11 Core Chapters ────────────────────────────────────────────────────────
const CHAPTER_CONFIG = [
  { name: 'Digital Logic Circuits', slug: 'digital-logic-circuits', order: 1 },
  { name: 'Computer Organization & Architecture', slug: 'computer-organization-architecture', order: 2 },
  { name: 'Data Structures & Algorithms', slug: 'data-structures-algorithms', order: 3 },
  { name: 'Programming Concepts in C', slug: 'programming-concepts-in-c', order: 4 },
  { name: 'Object Oriented Programming (C++ / Java)', slug: 'object-oriented-programming', order: 5 },
  { name: 'Operating Systems', slug: 'operating-systems', order: 6 },
  { name: 'Database Management Systems (DBMS / SQL)', slug: 'database-management-systems', order: 7 },
  { name: 'Computer Networks & Data Communication', slug: 'computer-networks-data-communication', order: 8 },
  { name: 'Software Engineering', slug: 'software-engineering', order: 9 },
  { name: 'Internet & Web Technologies', slug: 'internet-web-technologies', order: 10 },
  { name: 'Computer Fundamentals, Security & MS Office', slug: 'computer-fundamentals-security-ms-office', order: 11 },
];

async function main() {
  console.log('[seed] Connecting to MongoDB...');
  await mongoose.connect(DATABASE_URL);
  console.log('[seed] [OK] Connected to MongoDB.');

  const SubjectModel = mongoose.model('Subject', SubjectSchema);
  const TestSeriesModel = mongoose.model('TestSeries', TestSeriesSchema);
  const TestSeriesSubjectModel = mongoose.model('TestSeriesSubject', TestSeriesSubjectSchema);
  const ChapterModel = mongoose.model('Chapter', ChapterSchema);
  const QuestionModel = mongoose.model('Question', QuestionSchema);
  const QuestionMappingModel = mongoose.model('QuestionMapping', QuestionMappingSchema);

  // 1. Get Admin User
  const UserModel = mongoose.model('User', new mongoose.Schema({ role: String, email: String }, { collection: 'users' }));
  const adminUser = await UserModel.findOne({ role: 'admin' }).lean();
  if (!adminUser) throw new Error('No admin user found in database.');
  const adminId = adminUser._id as Types.ObjectId;
  console.log(`[seed] Admin user: ${(adminUser as any).email} (${adminId})`);

  // 2. Ensure TestSeries "DSSSB TGT Computer Science" exists
  const seriesData = {
    title: 'DSSSB TGT Computer Science',
    slug: 'dsssb-tgt-computer-science',
    description: 'Complete official mock test series for DSSSB TGT & PGT Computer Science featuring 4,000+ authentic previous year exam questions with bilingual content, detailed step-by-step explanations, and real CBT examination pattern.',
    targetExam: 'DSSSB TGT',
    category: 'teaching',
    organization: 'Delhi Subordinate Services Selection Board',
    status: 'published',
    accessType: 'freemium',
    supportedLanguages: ['Hindi', 'English'],
    badge: 'Popular',
    order: 1,
    createdBy: adminId,
  };

  let testSeries = await TestSeriesModel.findOne({ slug: seriesData.slug });
  if (!testSeries) {
    testSeries = await TestSeriesModel.create(seriesData);
    console.log('[seed] [OK] Created TestSeries: DSSSB TGT Computer Science');
  } else {
    console.log('[seed] TestSeries already exists: DSSSB TGT Computer Science');
  }
  const testSeriesId = testSeries._id as Types.ObjectId;

  // 3. Ensure Subject "Computer Science" exists
  let subject = await SubjectModel.findOne({ slug: 'computer-science' });
  if (!subject) {
    subject = await SubjectModel.create({
      name: 'Computer Science',
      slug: 'computer-science',
      description: 'Comprehensive Computer Science curriculum covering all core subjects, algorithms, networks, and databases.',
      createdBy: adminId,
    });
    console.log('[seed] [OK] Created Subject: Computer Science');
  }
  const subjectId = subject._id as Types.ObjectId;

  // 4. Assign Subject to TestSeries
  const existingAssign = await TestSeriesSubjectModel.findOne({ testSeriesId, subjectId });
  if (!existingAssign) {
    await TestSeriesSubjectModel.create({ testSeriesId, subjectId, order: 1 });
    console.log('[seed] [OK] Assigned Subject to TestSeries');
  }

  // 5. Ensure all 11 Chapters exist
  const chapterMap: Record<string, Types.ObjectId> = {};
  for (const ch of CHAPTER_CONFIG) {
    let chapter = await ChapterModel.findOne({ testSeriesId, subjectId, slug: ch.slug });
    if (!chapter) {
      chapter = await ChapterModel.create({
        name: ch.name,
        slug: ch.slug,
        testSeriesId,
        subjectId,
        order: ch.order,
        status: 'published',
        createdBy: adminId,
      });
      console.log(`[seed] [OK] Created Chapter: ${ch.name}`);
    }
    chapterMap[ch.name] = chapter._id as Types.ObjectId;
  }
  console.log(`[seed] [OK] All ${Object.keys(chapterMap).length} chapters ready.`);

  // 6. Load questions JSON
  const candidates = [
    resolve(import.meta.dir, '../extracted/v3_final_questions.json'),
    resolve(import.meta.dir, '../extracted/final_questions_for_seeding.json'),
    resolve(import.meta.dir, '../extracted/complete_questions.json'),
  ];
  const inputPath = candidates.find(p => existsSync(p));
  if (!inputPath) throw new Error('No extracted questions JSON file found.');

  const rawQuestions: any[] = JSON.parse(readFileSync(inputPath, 'utf-8'));
  console.log(`[seed] Loaded ${rawQuestions.length} questions from ${inputPath}`);

  // 7. Filter valid questions (must have content and at least 2 options)
  const validQuestions = rawQuestions.filter(q =>
    q.content && q.content.trim().length > 3 &&
    Array.isArray(q.options) && q.options.length >= 2
  );
  console.log(`[seed] Valid questions with options: ${validQuestions.length}`);

  // 8. Check existing questions from source
  const existingCount = await QuestionModel.countDocuments({
    tags: 'computer-practice-set-v2',
  });

  if (existingCount > 0 && !process.argv.includes('--force')) {
    console.log(`[seed] Found ${existingCount} questions already seeded. Pass --force to overwrite. Exiting.`);
    await mongoose.disconnect();
    return;
  }

  if (process.argv.includes('--force')) {
    console.log('[seed] Removing previous seeded questions...');
    await QuestionModel.deleteMany({ tags: 'computer-practice-set-v2' });
    await QuestionMappingModel.deleteMany({ testSeriesId });
  }

  // 9. Batch insert questions
  const BATCH_SIZE = 200;
  let inserted = 0;
  const questionIdMap: Array<{ parsedIdx: number; topic: string; questionId: Types.ObjectId }> = [];

  for (let i = 0; i < validQuestions.length; i += BATCH_SIZE) {
    const batch = validQuestions.slice(i, i + BATCH_SIZE);
    const docs = batch.map((q, idx) => {
      const chName = q.chapter || 'Computer Fundamentals, Security & MS Office';
      const chapterId = chapterMap[chName] || chapterMap['Computer Fundamentals, Security & MS Office'];

      return {
        content: q.content.trim(),
        type: 'single_choice',
        difficulty: 'medium',
        status: 'published',
        isAvailableForNewTests: true,
        subject: 'Computer Science',
        subjectId,
        chapterId,
        topic: chName,
        tags: ['computer-science', 'dsssb', 'computer-practice-set-v2', (q.source || '').toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30)],
        marks: 1,
        negativeMarks: 0.25,
        source: q.source || 'DSSSB Computer Science / PYQ',
        createdBy: adminId,
        questionImageUrl: q.questionImageUrl || null,
        options: (q.options || []).map((opt: any, pos: number) => ({
          _id: new Types.ObjectId(),
          content: opt.content?.trim() || `Option ${String.fromCharCode(65 + pos)}`,
          imageUrl: null,
          position: pos,
          isCorrect: Boolean(opt.isCorrect),
          translations: {},
        })),
        explanation: q.explanation?.trim() || null,
        translations: {},
        explanationTranslations: {},
      };
    });

    const result = await QuestionModel.insertMany(docs, { ordered: false });
    result.forEach((doc, idx) => {
      questionIdMap.push({
        parsedIdx: i + idx,
        topic: batch[idx].chapter || 'Computer Fundamentals, Security & MS Office',
        questionId: doc._id as Types.ObjectId,
      });
    });

    inserted += result.length;
    process.stdout.write(`\r[seed] Inserted: ${inserted}/${validQuestions.length} questions`);
  }
  console.log(`\n[seed] [OK] Successfully inserted ${inserted} questions into MongoDB!`);

  // 10. Create QuestionMappings
  console.log('[seed] Creating QuestionMappings...');
  const mappings = questionIdMap.map(({ topic, questionId }, idx) => ({
    questionId,
    subjectId,
    testSeriesId,
    chapterId: chapterMap[topic] || chapterMap['Computer Fundamentals, Security & MS Office'],
    order: idx,
    createdBy: adminId,
  }));

  for (let i = 0; i < mappings.length; i += BATCH_SIZE) {
    await QuestionMappingModel.insertMany(mappings.slice(i, i + BATCH_SIZE), { ordered: false });
  }
  console.log(`[seed] [OK] Created ${mappings.length} QuestionMappings.`);

  // 11. Save question ID map for mock test builder
  const idMapPath = resolve(import.meta.dir, '../extracted/question_id_map.json');
  writeFileSync(idMapPath, JSON.stringify({
    testSeriesId: testSeriesId.toString(),
    subjectId: subjectId.toString(),
    chapterMap: Object.fromEntries(Object.entries(chapterMap).map(([k, v]) => [k, v.toString()])),
    questions: questionIdMap.map(q => ({
      parsedIdx: q.parsedIdx,
      topic: q.topic,
      questionId: q.questionId.toString(),
      testSeriesId: testSeriesId.toString(),
      subjectId: subjectId.toString(),
      chapterId: (chapterMap[q.topic] || chapterMap['Computer Fundamentals, Security & MS Office']).toString(),
    })),
  }, null, 2));
  console.log(`[seed] [OK] ID map saved: ${idMapPath}`);

  await mongoose.disconnect();
  console.log('[seed] Complete!');
}

main().catch(err => {
  console.error('[seed] Fatal error:', err);
  process.exit(1);
});
