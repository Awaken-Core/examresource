import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dns from 'node:dns';
import fs from 'node:fs';
import crypto from 'node:crypto';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from apps/server/.env or repo root
dotenv.config({ path: path.resolve(__dirname, '../.env') });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
}

// Ensure public DNS resolver is used for MongoDB Atlas SRV lookups on local environments
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore if unsupported
}

/**
 * Seed Script for GovtPariksha Test Series Seed Pack.
 *
 * Requirements & Safety Rules:
 * 1. Safe target check: only run in non-production on local/dev database named 'govtpariksha'.
 * 2. Deterministic & idempotent: multiple executions maintain stable record counts without duplicates.
 * 3. Never drops or clears existing collections. Preserves the 6th existing series (RRB Group D) and existing data.
 * 4. Resolves shared subjects, 32 original questions, exam-specific chapters, mappings, and tests with snapshots.
 * 5. Handles fixed tests and random-per-attempt full tests.
 */

const mongoUrl = process.env.DATABASE_URL;

if (!mongoUrl?.startsWith('mongodb')) {
  console.error('ERROR: DATABASE_URL must be a valid MongoDB URI.');
  process.exit(1);
}

// 1. Safety verification
const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();
if (nodeEnv === 'production') {
  console.error('BLOCKED: Cannot run seed script in production environment.');
  process.exit(1);
}

// Read seed pack
const seedPackPath = path.resolve(__dirname, '../../../seed/govtpariksha-test-series-seed-pack.json');
if (!fs.existsSync(seedPackPath)) {
  console.error(`ERROR: Seed pack file not found at ${seedPackPath}`);
  process.exit(1);
}

const seedPack = JSON.parse(fs.readFileSync(seedPackPath, 'utf8'));

/**
 * Deterministically generates a 24-character hex MongoDB ObjectId from a seed key.
 */
function toDeterministicObjectId(seedKey) {
  const hash = crypto.createHash('sha256').update(`govtpariksha::seed::${seedKey}`).digest('hex');
  return new mongoose.Types.ObjectId(hash.substring(0, 24));
}

async function runSeed() {
  console.log(`Connecting to database for seeding (NODE_ENV=${nodeEnv})...`);
  await mongoose.connect(mongoUrl);
  const db = mongoose.connection.db;

  // Strict verification of target database name
  if (db.databaseName !== 'govtpariksha') {
    console.error(`BLOCKED: Seed script is only permitted to run against 'govtpariksha'. Target was: '${db.databaseName}'`);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`Connected to verified development database: ${db.databaseName}`);

  // Fetch or attribute to system/admin user
  let adminUser = await db.collection('users').findOne({ role: 'admin' });
  if (!adminUser) {
    adminUser = await db.collection('users').findOne({});
  }
  const creatorId = adminUser ? adminUser._id : toDeterministicObjectId('default-admin-creator');
  console.log(`Using user ID for creation records: ${creatorId}`);

  const now = new Date();

  // =========================================================================
  // 1. SHARED SUBJECTS (8 in pack + preserve any existing)
  // =========================================================================
  console.log('\n--- Upserting Shared Global Subjects ---');
  const subjectSlugToDoc = new Map();

  for (const sub of seedPack.sharedSubjects) {
    const deterministicId = toDeterministicObjectId(`subject::${sub.slug}`);
    await db.collection('subjects').updateOne(
      { slug: sub.slug.toLowerCase() },
      {
        $setOnInsert: {
          _id: deterministicId,
          slug: sub.slug.toLowerCase(),
          description: `${sub.name} foundational syllabus and questions bank.`,
          iconUrl: null,
          createdBy: creatorId,
          createdAt: now,
        },
        $set: {
          name: sub.name,
          updatedAt: now,
        },
      },
      { upsert: true }
    );
  }

  // Load all subjects for in-memory resolution
  const allSubjects = await db.collection('subjects').find({}).toArray();
  for (const s of allSubjects) {
    subjectSlugToDoc.set(s.slug, s);
  }
  console.log(`✓ Total shared subjects in database: ${allSubjects.length}`);

  // =========================================================================
  // 2. TEST SERIES (5 in pack + preserve 6th e.g. RRB Group D)
  // =========================================================================
  console.log('\n--- Upserting Test Series ---');
  const seriesSlugToDoc = new Map();

  for (let idx = 0; idx < seedPack.testSeries.length; idx++) {
    const s = seedPack.testSeries[idx];
    const deterministicId = toDeterministicObjectId(`series::${s.slug}`);
    await db.collection('test_series').updateOne(
      { slug: s.slug.toLowerCase() },
      {
        $setOnInsert: {
          _id: deterministicId,
          slug: s.slug.toLowerCase(),
          createdBy: creatorId,
          createdAt: now,
        },
        $set: {
          title: s.title,
          targetExam: s.targetExam,
          category: s.category,
          description: s.description,
          status: s.status,
          accessType: s.accessType,
          supportedLanguages: s.languages || ['English', 'Hindi'],
          order: idx + 1,
          updatedAt: now,
        },
      },
      { upsert: true }
    );
  }

  // Ensure RRB Group D is preserved or maintained with published status
  const existingGroupD = await db.collection('test_series').findOne({ slug: 'rrb-group-d' });
  if (!existingGroupD) {
    const groupDId = toDeterministicObjectId('series::rrb-group-d');
    await db.collection('test_series').insertOne({
      _id: groupDId,
      slug: 'rrb-group-d',
      title: 'RRB Group D (CEN RRC)',
      targetExam: 'Railway Group D Level-1',
      category: 'ssc-railways',
      organization: 'Indian Railways',
      description: 'Full-length CBT mocks and science chapter tests for Railway Level-1 posts.',
      badge: 'Free Access',
      status: 'published',
      accessType: 'free',
      supportedLanguages: ['Hindi', 'English'],
      order: 6,
      createdBy: creatorId,
      createdAt: now,
      updatedAt: now,
    });
  }

  const allSeries = await db.collection('test_series').find({}).toArray();
  for (const s of allSeries) {
    seriesSlugToDoc.set(s.slug, s);
  }
  console.log(`✓ Total test series in database: ${allSeries.length} (Including 5 demo pack series + RRB Group D)`);

  // =========================================================================
  // 3. TEST SERIES SUBJECT ASSIGNMENTS & CHAPTERS
  // =========================================================================
  console.log('\n--- Upserting Test Series Subject Assignments & Chapters ---');
  const chapterLookup = new Map(); // key: `${seriesSlug}::${subjectSlug}::${chapterSlug}` -> chapterDoc

  for (const s of seedPack.testSeries) {
    const seriesDoc = seriesSlugToDoc.get(s.slug);
    if (!seriesDoc) continue;

    for (let subIdx = 0; subIdx < s.subjects.length; subIdx++) {
      const subInfo = s.subjects[subIdx];
      const subjectDoc = subjectSlugToDoc.get(subInfo.subjectSlug);
      if (!subjectDoc) {
        throw new Error(`Subject slug not found: ${subInfo.subjectSlug}`);
      }

      // Upsert TestSeriesSubject association
      await db.collection('test_series_subjects').updateOne(
        { testSeriesId: seriesDoc._id, subjectId: subjectDoc._id },
        {
          $setOnInsert: {
            testSeriesId: seriesDoc._id,
            subjectId: subjectDoc._id,
            createdAt: now,
          },
          $set: {
            order: subIdx + 1,
            customDisplayName: subInfo.displayName,
            updatedAt: now,
          },
        },
        { upsert: true }
      );

      // Upsert Chapter
      const chapterSlug = subInfo.chapterSlug.toLowerCase();
      const chapterDeterministicId = toDeterministicObjectId(`chapter::${s.slug}::${subInfo.subjectSlug}::${chapterSlug}`);
      await db.collection('chapters').updateOne(
        {
          testSeriesId: seriesDoc._id,
          subjectId: subjectDoc._id,
          slug: chapterSlug,
        },
        {
          $setOnInsert: {
            _id: chapterDeterministicId,
            testSeriesId: seriesDoc._id,
            subjectId: subjectDoc._id,
            slug: chapterSlug,
            createdBy: creatorId,
            createdAt: now,
          },
          $set: {
            name: subInfo.chapterName,
            description: `Exam-specific chapter for ${seriesDoc.title} - ${subInfo.displayName}.`,
            order: 1,
            status: 'published',
            updatedAt: now,
          },
        },
        { upsert: true }
      );
    }
  }

  const allChapters = await db.collection('chapters').find({}).toArray();
  for (const ch of allChapters) {
    const sDoc = allSeries.find((s) => s._id.equals(ch.testSeriesId));
    const subDoc = allSubjects.find((sub) => sub._id.equals(ch.subjectId));
    if (sDoc && subDoc) {
      chapterLookup.set(`${sDoc.slug}::${subDoc.slug}::${ch.slug}`, ch);
    }
  }
  console.log(`✓ Total chapters in database: ${allChapters.length}`);

  // =========================================================================
  // 4. QUESTIONS BANK (32 unique questions in pack)
  // =========================================================================
  console.log('\n--- Upserting Central Question Bank ---');
  const questionSlugToDoc = new Map();

  for (const q of seedPack.questions) {
    const deterministicQId = toDeterministicObjectId(`question::${q.slug}`);
    const subjectDoc = subjectSlugToDoc.get(q.subjectSlug);
    if (!subjectDoc) {
      throw new Error(`Subject not found for question ${q.slug}: ${q.subjectSlug}`);
    }

    // Build options with deterministic ObjectIds per option key
    const options = (q.options || []).map((opt, optIdx) => {
      const optId = toDeterministicObjectId(`option::${q.slug}::${opt.key}`);
      return {
        _id: optId,
        content: opt.content,
        translations: opt.translations || {},
        imageUrl: null,
        position: optIdx,
        isCorrect: Boolean(opt.isCorrect),
      };
    });

    await db.collection('questions').updateOne(
      { seedSlug: q.slug },
      {
        $setOnInsert: {
          _id: deterministicQId,
          seedSlug: q.slug,
          createdBy: creatorId,
          createdAt: now,
        },
        $set: {
          content: q.content,
          translations: q.translations || {},
          type: q.type,
          numericalAnswer: q.type === 'numerical' ? String(q.numericalAnswer) : null,
          difficulty: q.difficulty || 'medium',
          status: q.status || 'published',
          isAvailableForNewTests: q.isAvailableForNewTests !== false,
          subject: subjectDoc.name,
          subjectId: subjectDoc._id,
          marks: q.marks ?? 1,
          negativeMarks: q.negativeMarks ?? 0,
          explanation: q.explanation || null,
          explanationTranslations: q.explanationTranslations || {},
          tags: q.tags || [],
          source: q.source || 'Original GovtPariksha demo question',
          options,
          updatedAt: now,
        },
      },
      { upsert: true }
    );
  }

  const allQuestions = await db.collection('questions').find({}).toArray();
  for (const q of allQuestions) {
    if (q.seedSlug) {
      questionSlugToDoc.set(q.seedSlug, q);
    }
  }
  console.log(`✓ Total questions in central question bank: ${allQuestions.length}`);

  // Helper to build QuestionSnapshot
  function createSnapshot(qDoc, customMarks, customNegativeMarks) {
    return {
      questionId: qDoc._id,
      content: qDoc.content,
      translations: qDoc.translations || {},
      explanation: qDoc.explanation || null,
      explanationTranslations: qDoc.explanationTranslations || {},
      type: qDoc.type,
      numericalAnswer: qDoc.numericalAnswer || null,
      marks: customMarks ?? qDoc.marks ?? 1,
      negativeMarks: customNegativeMarks ?? qDoc.negativeMarks ?? 0,
      options: (qDoc.options || []).map((opt) => ({
        _id: opt._id,
        content: opt.content,
        translations: opt.translations || {},
        imageUrl: opt.imageUrl || null,
        position: opt.position,
        isCorrect: Boolean(opt.isCorrect),
      })),
    };
  }

  // =========================================================================
  // 5. QUESTION MAPPINGS (60 in pack)
  // =========================================================================
  console.log('\n--- Upserting Question Bank Mappings ---');

  for (let mIdx = 0; mIdx < seedPack.questionMappings.length; mIdx++) {
    const m = seedPack.questionMappings[mIdx];
    const qDoc = questionSlugToDoc.get(m.questionSlug);
    const seriesDoc = seriesSlugToDoc.get(m.seriesSlug);
    const subjectDoc = subjectSlugToDoc.get(m.subjectSlug);
    const chapterDoc = m.chapterSlug ? chapterLookup.get(`${m.seriesSlug}::${m.subjectSlug}::${m.chapterSlug}`) : null;

    if (!qDoc || !seriesDoc || !subjectDoc) {
      throw new Error(`Cannot resolve mapping dependencies for: ${JSON.stringify(m)}`);
    }

    const mappingDeterministicId = toDeterministicObjectId(
      `mapping::${m.seriesSlug}::${m.subjectSlug}::${m.chapterSlug || 'none'}::${m.questionSlug}`
    );

    await db.collection('question_mappings').updateOne(
      {
        questionId: qDoc._id,
        testSeriesId: seriesDoc._id,
        subjectId: subjectDoc._id,
        chapterId: chapterDoc ? chapterDoc._id : null,
      },
      {
        $setOnInsert: {
          _id: mappingDeterministicId,
          questionId: qDoc._id,
          testSeriesId: seriesDoc._id,
          subjectId: subjectDoc._id,
          chapterId: chapterDoc ? chapterDoc._id : null,
          createdBy: creatorId,
          createdAt: now,
        },
        $set: {
          order: mIdx + 1,
          updatedAt: now,
        },
      },
      { upsert: true }
    );
  }

  const allMappingsCount = await db.collection('question_mappings').countDocuments();
  console.log(`✓ Total question mappings in database: ${allMappingsCount}`);

  // =========================================================================
  // 6. INDIVIDUAL TESTS (30 tests: 10 subject, 10 chapter, 10 full tests)
  // =========================================================================
  console.log('\n--- Upserting Individual Tests & Snapshots ---');

  for (const t of seedPack.tests) {
    const seriesDoc = seriesSlugToDoc.get(t.seriesSlug);
    if (!seriesDoc) {
      throw new Error(`Series not found for test ${t.seedKey}: ${t.seriesSlug}`);
    }

    const testDeterministicId = toDeterministicObjectId(`test::${t.seedKey}`);

    if (t.testMode === 'subject' || t.testMode === 'chapter') {
      const subjectDoc = subjectSlugToDoc.get(t.subjectSlug);
      const chapterDoc = t.chapterSlug ? chapterLookup.get(`${t.seriesSlug}::${t.subjectSlug}::${t.chapterSlug}`) : null;

      if (!subjectDoc) {
        throw new Error(`Subject not found for test ${t.seedKey}: ${t.subjectSlug}`);
      }

      // Build question items with snapshot
      const questionItems = (t.questionSlugs || []).map((qSlug, pos) => {
        const qDoc = questionSlugToDoc.get(qSlug);
        if (!qDoc) {
          throw new Error(`Question ${qSlug} not found for test ${t.seedKey}`);
        }
        const marks = t.positiveMarks ?? qDoc.marks ?? 1;
        const negativeMarks = t.negativeMarkingEnabled ? (t.negativeMarks ?? qDoc.negativeMarks ?? 0) : 0;
        return {
          questionId: qDoc._id,
          position: pos,
          marks,
          negativeMarks,
          snapshot: createSnapshot(qDoc, marks, negativeMarks),
        };
      });

      await db.collection('exams').updateOne(
        { seedKey: t.seedKey },
        {
          $setOnInsert: {
            _id: testDeterministicId,
            seedKey: t.seedKey,
            createdBy: creatorId,
            createdAt: now,
          },
          $set: {
            title: t.title,
            description: t.instructions,
            type: t.testMode,
            testMode: t.testMode,
            status: t.status || 'published',
            access: t.access || 'free',
            testSeriesId: seriesDoc._id,
            subjectId: subjectDoc._id,
            chapterId: chapterDoc ? chapterDoc._id : null,
            durationMinutes: t.durationMinutes || 10,
            maxAttempts: t.maxAttempts || null,
            languages: t.languages || ['English', 'Hindi'],
            positiveMarks: t.positiveMarks ?? 1,
            negativeMarkingEnabled: Boolean(t.negativeMarkingEnabled),
            negativeMarks: t.negativeMarks ?? 0,
            questionSelectionMode: t.questionSelectionMode || 'manual',
            questionSetMode: t.questionSetMode || 'fixed',
            questionOrderMode: t.questionOrderMode || 'fixed',
            totalQuestionsCount: t.questionCount || questionItems.length,
            version: t.version || 1,
            isCurrentVersion: t.isCurrentVersion !== false,
            availableFrom: t.availableFrom || null,
            availableTo: t.availableTo || null,
            questions: questionItems,
            sections: [],
            updatedAt: now,
          },
        },
        { upsert: true }
      );
    } else if (t.testMode === 'full') {
      // Full test with sections
      const sections = [];

      for (let sIdx = 0; sIdx < t.sections.length; sIdx++) {
        const sec = t.sections[sIdx];
        const secSubjectDoc = subjectSlugToDoc.get(sec.subjectSlug);
        const secChapterDoc = sec.chapterSlug ? chapterLookup.get(`${t.seriesSlug}::${sec.subjectSlug}::${sec.chapterSlug}`) : null;

        // In fixed mode: sec.questionSlugs. In random_per_attempt mode: sec.eligibleQuestionSlugs
        const poolSlugs = (sec.questionSlugs && sec.questionSlugs.length > 0)
          ? sec.questionSlugs
          : sec.eligibleQuestionSlugs;

        const secQuestions = (poolSlugs || []).map((qSlug, pos) => {
          const qDoc = questionSlugToDoc.get(qSlug);
          if (!qDoc) {
            throw new Error(`Question ${qSlug} not found for section ${sec.seedKey}`);
          }
          const marks = sec.positiveMarks ?? qDoc.marks ?? 1;
          const negativeMarks = sec.negativeMarkingEnabled ? (sec.negativeMarks ?? qDoc.negativeMarks ?? 0) : 0;
          return {
            questionId: qDoc._id,
            position: pos,
            marks,
            negativeMarks,
            snapshot: createSnapshot(qDoc, marks, negativeMarks),
          };
        });

        sections.push({
          name: sec.title,
          topic: null,
          subjectId: secSubjectDoc ? secSubjectDoc._id : null,
          chapterId: secChapterDoc ? secChapterDoc._id : null,
          order: sec.order ?? sIdx + 1,
          durationMinutes: sec.durationMinutes || null,
          positiveMarks: sec.positiveMarks ?? 1,
          negativeMarkingEnabled: Boolean(sec.negativeMarkingEnabled),
          negativeMarks: sec.negativeMarks ?? 0,
          selectionMode: sec.questionSelectionMode || 'manual',
          questionOrderMode: sec.questionOrderMode || 'fixed',
          questionSetMode: sec.questionSetMode || 'fixed',
          requiredQuestionCount: sec.questionCount,
          questions: secQuestions,
        });
      }

      await db.collection('exams').updateOne(
        { seedKey: t.seedKey },
        {
          $setOnInsert: {
            _id: testDeterministicId,
            seedKey: t.seedKey,
            createdBy: creatorId,
            createdAt: now,
          },
          $set: {
            title: t.title,
            description: t.instructions,
            type: 'full',
            testMode: 'full',
            status: t.status || 'published',
            access: t.access || 'free',
            testSeriesId: seriesDoc._id,
            subjectId: null,
            chapterId: null,
            durationMinutes: t.durationMinutes || 24,
            maxAttempts: t.maxAttempts || null,
            languages: t.languages || ['English', 'Hindi'],
            positiveMarks: t.positiveMarks ?? 1,
            negativeMarkingEnabled: Boolean(t.negativeMarkingEnabled),
            negativeMarks: t.negativeMarks ?? 0,
            questionSelectionMode: t.questionSelectionMode || 'manual',
            questionSetMode: t.questionSetMode || 'fixed',
            questionOrderMode: t.questionOrderMode || 'fixed',
            totalQuestionsCount: t.questionCount,
            version: t.version || 1,
            isCurrentVersion: t.isCurrentVersion !== false,
            availableFrom: t.availableFrom || null,
            availableTo: t.availableTo || null,
            questions: [],
            sections,
            updatedAt: now,
          },
        },
        { upsert: true }
      );
    }
  }

  // =========================================================================
  // 7. VERIFICATION AND DETAILED COUNTS
  // =========================================================================
  console.log('\n============================================================');
  console.log('SEED SUMMARY & PER-SERIES AUDIT');
  console.log('============================================================');

  for (const s of allSeries) {
    const seriesSubjects = await db.collection('test_series_subjects').countDocuments({ testSeriesId: s._id });
    const chapters = await db.collection('chapters').countDocuments({ testSeriesId: s._id });
    const subjectTests = await db.collection('exams').countDocuments({ testSeriesId: s._id, testMode: 'subject' });
    const chapterTests = await db.collection('exams').countDocuments({ testSeriesId: s._id, testMode: 'chapter' });
    const fullTests = await db.collection('exams').countDocuments({ testSeriesId: s._id, testMode: 'full' });
    const totalTests = subjectTests + chapterTests + fullTests;

    console.log(
      `Series: "${s.title}" (${s.slug}) -> Subjects: ${seriesSubjects}, Chapters: ${chapters}, Tests: ${totalTests} (Subject: ${subjectTests}, Chapter: ${chapterTests}, Full: ${fullTests})`
    );
  }

  const finalCounts = {
    testSeries: await db.collection('test_series').countDocuments(),
    subjects: await db.collection('subjects').countDocuments(),
    testSeriesSubjects: await db.collection('test_series_subjects').countDocuments(),
    chapters: await db.collection('chapters').countDocuments(),
    questions: await db.collection('questions').countDocuments(),
    questionMappings: await db.collection('question_mappings').countDocuments(),
    exams: await db.collection('exams').countDocuments(),
  };

  console.log('\nTotal Database Document Counts:');
  console.table(finalCounts);

  console.log('SUCCESS: Seed completed deterministically and idempotently.');
  console.log('Target database preserved. No existing collections were dropped.');
  console.log('============================================================\n');

  await mongoose.disconnect();
}

runSeed().catch((err) => {
  console.error('Seed execution error:', err);
  process.exit(1);
});
