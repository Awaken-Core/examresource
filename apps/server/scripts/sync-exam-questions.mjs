import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dns from 'node:dns';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
}

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

function createSnapshot(qDoc, pos, positiveMarks, negativeMarkingEnabled, negativeMarks) {
  const marks = positiveMarks ?? qDoc.marks ?? 1;
  const negMarks = negativeMarkingEnabled ? (negativeMarks ?? qDoc.negativeMarks ?? 0.25) : 0;
  return {
    questionId: qDoc._id,
    position: pos,
    marks,
    negativeMarks: negMarks,
    snapshot: {
      questionId: qDoc._id,
      content: qDoc.content,
      translations: qDoc.translations || {},
      explanation: qDoc.explanation || null,
      explanationTranslations: qDoc.explanationTranslations || {},
      type: qDoc.type,
      numericalAnswer: qDoc.numericalAnswer || null,
      marks,
      negativeMarks: negMarks,
      options: (qDoc.options || []).map((opt, oIdx) => ({
        _id: opt._id || new mongoose.Types.ObjectId(),
        content: opt.content || '',
        translations: opt.translations || {},
        imageUrl: opt.imageUrl || null,
        position: opt.position ?? oIdx,
        isCorrect: Boolean(opt.isCorrect),
      })),
    },
  };
}

async function run() {
  const mongoUrl = process.env.DATABASE_URL;
  if (!mongoUrl) {
    console.error('No DATABASE_URL found');
    process.exit(1);
  }

  await mongoose.connect(mongoUrl);
  const db = mongoose.connection.db;
  console.log(`Connected to database: ${db.databaseName}`);

  const series = await db.collection('test_series').findOne({ slug: 'dsssb-tgt-cs' });
  if (!series) {
    console.error('DSSSB TGT CS series not found!');
    await mongoose.disconnect();
    process.exit(1);
  }
  console.log(`Found DSSSB Series: ${series.title} (${series._id})`);

  // Load all questions mapped to this series
  const allMappings = await db.collection('question_mappings').find({ testSeriesId: series._id }).toArray();
  console.log(`Loaded ${allMappings.length} mappings for this series`);

  const questionIds = allMappings.map((m) => m.questionId);
  const questionsList = await db.collection('questions').find({
    _id: { $in: questionIds },
    status: 'published',
  }).toArray();

  const questionsById = new Map();
  for (const q of questionsList) {
    questionsById.set(q._id.toString(), q);
  }
  console.log(`Loaded ${questionsById.size} published questions matching mappings`);

  // Group question IDs by chapterId and by subjectId
  const questionsByChapterId = new Map();
  const questionsBySubjectId = new Map();

  for (const m of allMappings) {
    const qDoc = questionsById.get(m.questionId.toString());
    if (!qDoc) continue;

    if (m.chapterId) {
      const cStr = m.chapterId.toString();
      if (!questionsByChapterId.has(cStr)) {
        questionsByChapterId.set(cStr, []);
      }
      questionsByChapterId.get(cStr).push(qDoc);
    }

    if (m.subjectId) {
      const sStr = m.subjectId.toString();
      if (!questionsBySubjectId.has(sStr)) {
        questionsBySubjectId.set(sStr, []);
      }
      // avoid duplicates within same subject
      const existing = questionsBySubjectId.get(sStr);
      if (!existing.some((x) => x._id.toString() === qDoc._id.toString())) {
        existing.push(qDoc);
      }
    }
  }

  // Find all exams for this series
  const exams = await db.collection('exams').find({ testSeriesId: series._id }).toArray();
  console.log(`Found ${exams.length} exams for this series`);

  let updatedChapterTests = 0;
  let updatedSubjectTests = 0;
  let skippedTests = 0;

  for (const exam of exams) {
    let eligibleQuestions = [];

    if (exam.testMode === 'chapter' && exam.chapterId) {
      eligibleQuestions = questionsByChapterId.get(exam.chapterId.toString()) || [];
      if (eligibleQuestions.length === 0) {
        // Fallback: check direct chapterId in questions collection
        eligibleQuestions = await db.collection('questions').find({
          chapterId: exam.chapterId,
          status: 'published',
        }).toArray();
      }

      if (eligibleQuestions.length > 0) {
        const questionItems = eligibleQuestions.map((q, idx) =>
          createSnapshot(
            q,
            idx,
            exam.positiveMarks,
            exam.negativeMarkingEnabled,
            exam.negativeMarks,
          )
        );

        const duration = Math.min(45, Math.max(10, questionItems.length));
        await db.collection('exams').updateOne(
          { _id: exam._id },
          {
            $set: {
              questions: questionItems,
              totalQuestionsCount: questionItems.length,
              durationMinutes: duration,
              status: 'published',
              isCurrentVersion: true,
              updatedAt: new Date(),
            },
          }
        );
        updatedChapterTests++;
      } else {
        console.warn(`No questions for chapter test: "${exam.title}" (chapterId: ${exam.chapterId})`);
        skippedTests++;
      }
    } else if (exam.testMode === 'subject' && exam.subjectId) {
      eligibleQuestions = questionsBySubjectId.get(exam.subjectId.toString()) || [];
      if (eligibleQuestions.length === 0) {
        eligibleQuestions = await db.collection('questions').find({
          subjectId: exam.subjectId,
          status: 'published',
        }).toArray();
      }

      if (eligibleQuestions.length > 0) {
        const questionItems = eligibleQuestions.map((q, idx) =>
          createSnapshot(
            q,
            idx,
            exam.positiveMarks,
            exam.negativeMarkingEnabled,
            exam.negativeMarks,
          )
        );

        const targetCount = questionItems.length;
        const duration = Math.min(120, Math.max(20, Math.round(targetCount * 1.2)));

        await db.collection('exams').updateOne(
          { _id: exam._id },
          {
            $set: {
              questions: questionItems,
              totalQuestionsCount: targetCount,
              durationMinutes: duration,
              status: 'published',
              isCurrentVersion: true,
              updatedAt: new Date(),
            },
          }
        );
        updatedSubjectTests++;
      } else {
        console.warn(`No questions for subject test: "${exam.title}" (subjectId: ${exam.subjectId})`);
        skippedTests++;
      }
    }
  }

  console.log(`\n==============================================`);
  console.log(`SUMMARY:`);
  console.log(`  Updated Chapter Tests : ${updatedChapterTests}`);
  console.log(`  Updated Subject Tests : ${updatedSubjectTests}`);
  console.log(`  Skipped (no Qs)       : ${skippedTests}`);
  console.log(`==============================================`);

  // Verify a sample updated chapter test
  const sample = await db.collection('exams').findOne({ testMode: 'chapter', testSeriesId: series._id });
  console.log(`\nSample Chapter Test "${sample?.title}":`);
  console.log(`  Questions count: ${sample?.questions?.length}`);
  console.log(`  totalQuestionsCount: ${sample?.totalQuestionsCount}`);
  console.log(`  First question snapshot preview:`, sample?.questions?.[0]?.snapshot?.content?.substring(0, 60));

  await mongoose.disconnect();
}

run().catch(console.error);
