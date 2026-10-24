/**
 * seed-dsssb-tgt-cs.ts
 * Seeds DSSSB TGT Computer Science data into MongoDB.
 *
 * Usage:
 *   cd d:\examresource
 *   bun run seed/dsssb-tgt-cs/seed-dsssb-tgt-cs.ts
 *
 * Prerequisites:
 *   - DATABASE_URL must be set in apps/server/.env
 *   - At least one user with role='admin' must exist in the DB
 *     (or set SEED_ADMIN_EMAIL env var to auto-create one)
 *   - Run parse-md.ts first if questions/*.json files don't exist yet
 */

import 'dotenv/config';
import { config } from 'dotenv';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import mongoose, { Types, type Connection } from 'mongoose';

// â”€â”€ Load .env from apps/server â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '../../apps/server/.env') });

const MONGO_URI = process.env.DATABASE_URL;
if (!MONGO_URI) {
  console.error('âŒ  DATABASE_URL not found. Check apps/server/.env');
  process.exit(1);
}

// â”€â”€ Mongoose schemas (inline, mirrors production schemas exactly) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Subject
const SubjectSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true, unique: true },
    slug:        { type: String, required: true, trim: true, unique: true, lowercase: true, index: true },
    description: { type: String, default: null },
    createdBy:   { type: Types.ObjectId, ref: 'User', default: null },
  },
  { collection: 'subjects', timestamps: true },
);

// TestSeries
const TestSeriesSchema = new mongoose.Schema(
  {
    title:              { type: String, required: true, trim: true },
    slug:               { type: String, required: true, trim: true, unique: true, lowercase: true, index: true },
    description:        { type: String, default: null },
    targetExam:         { type: String, required: true, trim: true, index: true },
    category:           { type: String, required: true, trim: true, index: true },
    organization:       { type: String, default: null },
    status:             { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true },
    accessType:         { type: String, enum: ['free', 'premium', 'freemium'], default: 'free', index: true },
    supportedLanguages: { type: [String], default: ['English', 'Hindi'] },
    badge:              { type: String, default: null },
    order:              { type: Number, default: 0 },
    createdBy:          { type: Types.ObjectId, ref: 'User', default: null },
  },
  { collection: 'test_series', timestamps: true },
);

// TestSeriesSubject (pivot)
const TestSeriesSubjectSchema = new mongoose.Schema(
  {
    testSeriesId:      { type: Types.ObjectId, ref: 'TestSeries', required: true, index: true },
    subjectId:         { type: Types.ObjectId, ref: 'Subject',    required: true, index: true },
    order:             { type: Number, default: 0 },
    customDisplayName: { type: String, default: null },
  },
  { collection: 'test_series_subjects', timestamps: true },
);
TestSeriesSubjectSchema.index({ testSeriesId: 1, subjectId: 1 }, { unique: true });

// Chapter
const ChapterSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, trim: true },
    slug:         { type: String, required: true, trim: true, lowercase: true, index: true },
    testSeriesId: { type: Types.ObjectId, ref: 'TestSeries', required: true, index: true },
    subjectId:    { type: Types.ObjectId, ref: 'Subject',    required: true, index: true },
    description:  { type: String, default: null },
    order:        { type: Number, default: 0 },
    status:       { type: String, enum: ['draft', 'published', 'archived'], default: 'published', index: true },
    createdBy:    { type: Types.ObjectId, ref: 'User', default: null },
  },
  { collection: 'chapters', timestamps: true },
);
ChapterSchema.index({ testSeriesId: 1, subjectId: 1, slug: 1 }, { unique: true });

// QuestionOption (sub-document)
const QuestionOptionSchema = new mongoose.Schema(
  {
    content:      { type: String, required: true, trim: true },
    imageUrl:     { type: String, default: null },
    position:     { type: Number, required: true },
    isCorrect:    { type: Boolean, required: true, default: false },
    translations: { type: Map, of: String, default: {} },
  },
  { _id: true, timestamps: true },
);

// Question
const QuestionSchema = new mongoose.Schema(
  {
    content:                { type: String, required: true, trim: true },
    translations:           { type: Map, of: String, default: {} },
    explanation:            { type: String, default: null },
    explanationTranslations:{ type: Map, of: String, default: {} },
    type:                   { type: String, enum: ['single_choice', 'multiple_choice', 'numerical'], default: 'single_choice', index: true },
    numericalAnswer:        { type: String, default: null },
    difficulty:             { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium', index: true },
    status:                 { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true },
    isAvailableForNewTests: { type: Boolean, default: true, index: true },
    subject:                { type: String, required: true, trim: true, index: true },
    subjectId:              { type: Types.ObjectId, ref: 'Subject', default: null, index: true },
    chapterId:              { type: Types.ObjectId, ref: 'Chapter', default: null, index: true },
    topic:                  { type: String, default: null, trim: true, index: true },
    subtopic:               { type: String, default: null, trim: true },
    tags:                   { type: [String], default: [], index: true },
    marks:                  { type: Number, default: 1 },
    negativeMarks:          { type: Number, default: 0 },
    source:                 { type: String, default: null },
    createdBy:              { type: Types.ObjectId, ref: 'User', required: true, index: true },
    options:                { type: [QuestionOptionSchema], default: [] },
  },
  { collection: 'questions', timestamps: true },
);
QuestionSchema.index({ status: 1, createdAt: -1 });
QuestionSchema.index({ subject: 1, topic: 1 });
QuestionSchema.index({ subjectId: 1, chapterId: 1 });

// QuestionMapping
const QuestionMappingSchema = new mongoose.Schema(
  {
    questionId:   { type: Types.ObjectId, ref: 'Question',   required: true, index: true },
    subjectId:    { type: Types.ObjectId, ref: 'Subject',    required: true, index: true },
    testSeriesId: { type: Types.ObjectId, ref: 'TestSeries', default: null,  index: true },
    chapterId:    { type: Types.ObjectId, ref: 'Chapter',    default: null,  index: true },
    order:        { type: Number, default: 0 },
    createdBy:    { type: Types.ObjectId, ref: 'User',       default: null },
  },
  { collection: 'question_mappings', timestamps: true },
);
QuestionMappingSchema.index(
  { questionId: 1, subjectId: 1, testSeriesId: 1, chapterId: 1 },
  { unique: true },
);

// User (read-only)
const UserSchema = new mongoose.Schema(
  { email: String, role: String },
  { collection: 'users' },
);

// â”€â”€ Bootstrap models â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getModels(conn: Connection) {
  return {
    Subject:         conn.model('Subject',         SubjectSchema),
    TestSeries:      conn.model('TestSeries',      TestSeriesSchema),
    TestSeriesSubject: conn.model('TestSeriesSubject', TestSeriesSubjectSchema),
    Chapter:         conn.model('Chapter',         ChapterSchema),
    Question:        conn.model('Question',        QuestionSchema),
    QuestionMapping: conn.model('QuestionMapping', QuestionMappingSchema),
    User:            conn.model('User',            UserSchema),
  };
}

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function upsertSubject(
  M: ReturnType<typeof getModels>,
  subjectDef: { slug: string; name: string },
  adminId: Types.ObjectId,
) {
  const doc = await M.Subject.findOneAndUpdate(
    { slug: subjectDef.slug },
    { $setOnInsert: { name: subjectDef.name, slug: subjectDef.slug, createdBy: adminId } },
    { upsert: true, returnDocument: 'after' },
  ).lean();
  return doc!;
}

async function upsertTestSeries(
  M: ReturnType<typeof getModels>,
  ts: any,
  adminId: Types.ObjectId,
) {
  const doc = await M.TestSeries.findOneAndUpdate(
    { slug: ts.slug },
    {
      $setOnInsert: {
        title:              ts.title,
        slug:               ts.slug,
        description:        ts.description ?? null,
        targetExam:         ts.targetExam,
        category:           ts.category,
        organization:       ts.organization ?? null,
        status:             ts.status ?? 'published',
        accessType:         ts.accessType ?? 'freemium',
        supportedLanguages: ts.supportedLanguages ?? ['English', 'Hindi'],
        badge:              ts.badge ?? null,
        order:              ts.order ?? 0,
        createdBy:          adminId,
      },
    },
    { upsert: true, returnDocument: 'after' },
  ).lean();
  return doc!;
}

async function upsertChapter(
  M: ReturnType<typeof getModels>,
  ch: any,
  testSeriesId: Types.ObjectId,
  subjectId: Types.ObjectId,
  adminId: Types.ObjectId,
) {
  const doc = await M.Chapter.findOneAndUpdate(
    { testSeriesId, subjectId, slug: ch.slug },
    {
      $setOnInsert: {
        name:         ch.name,
        slug:         ch.slug,
        testSeriesId,
        subjectId,
        order:        ch.order ?? 0,
        status:       'published',
        createdBy:    adminId,
      },
    },
    { upsert: true, returnDocument: 'after' },
  ).lean();
  return doc!;
}

// â”€â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function main() {
  console.log('\nðŸ”Œ  Connecting to MongoDBâ€¦');
  const conn = await mongoose.createConnection(MONGO_URI!).asPromise();
  console.log('âœ…  Connected\n');

  const M = getModels(conn);

  // â”€â”€ 1. Resolve admin user â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log('ðŸ‘¤  Resolving admin userâ€¦');
  let adminUser = await M.User.findOne({ role: 'admin' }).lean();

  if (!adminUser) {
    const seedEmail = process.env.SEED_ADMIN_EMAIL ?? 'seed-admin@dsssb.local';
    console.log(`   No admin found â€” creating seed admin: ${seedEmail}`);
    // We only create the minimal doc needed (no password â€” not a real login account)
    const created = await conn.collection('users').insertOne({
      name:            'Seed Admin',
      email:           seedEmail,
      role:            'admin',
      status:          'active',
      createdAt:       new Date(),
      updatedAt:       new Date(),
    });
    adminUser = { _id: created.insertedId, email: seedEmail, role: 'admin' } as any;
    console.log(`   Created seed admin with _id: ${created.insertedId}`);
  } else {
    console.log(`   Found admin: ${(adminUser as any).email} (${(adminUser as any)._id})`);
  }

  const adminId = new Types.ObjectId(String((adminUser as any)._id));

  // â”€â”€ 2. Load metadata â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const META = JSON.parse(
    readFileSync(join(__dirname, 'metadata.json'), 'utf-8'),
  );

  // â”€â”€ 3. Upsert Subjects â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log('\nðŸ“š  Upserting subjectsâ€¦');
  const subjectIdMap: Record<string, Types.ObjectId> = {}; // slug â†’ _id

  for (const subDef of META.subjects) {
    const doc = await upsertSubject(M, subDef, adminId);
    subjectIdMap[subDef.slug] = new Types.ObjectId(String(doc._id));
    console.log(`   âœ” ${subDef.slug}`);
  }

  // â”€â”€ 4. Upsert TestSeries â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log('\nðŸ“‹  Upserting test seriesâ€¦');
  const tsDef = META.testSeries;
  const tsDoc = await upsertTestSeries(M, tsDef, adminId);
  const testSeriesId = new Types.ObjectId(String(tsDoc._id));
  console.log(`   âœ” ${tsDef.slug} (${testSeriesId})`);

  // â”€â”€ 5. Upsert TestSeriesSubject pivots â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log('\nðŸ”—  Linking subjects to test seriesâ€¦');
  for (const subDef of META.subjects) {
    const subjectId = subjectIdMap[subDef.slug];
    await M.TestSeriesSubject.findOneAndUpdate(
      { testSeriesId, subjectId },
      { $setOnInsert: { testSeriesId, subjectId, order: subDef.order ?? 0 } },
      { upsert: true },
    );
    console.log(`   âœ” ${subDef.slug}`);
  }

  // â”€â”€ 6. Upsert Chapters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log('\nðŸ—‚   Upserting chaptersâ€¦');
  const chapterIdMap: Record<string, Types.ObjectId> = {}; // chapterSlug â†’ _id

  for (const ch of META.chapters) {
    const subjectId = subjectIdMap[ch.subjectSlug];
    if (!subjectId) {
      console.warn(`   âš  Subject slug not found: ${ch.subjectSlug} (for chapter ${ch.slug})`);
      continue;
    }
    const doc = await upsertChapter(M, ch, testSeriesId, subjectId, adminId);
    chapterIdMap[ch.slug] = new Types.ObjectId(String(doc._id));
  }
  console.log(`   âœ” ${Object.keys(chapterIdMap).length} chapters ready`);

  // â”€â”€ 7. Seed Questions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const QUESTIONS_DIR = join(__dirname, 'questions');
  if (!existsSync(QUESTIONS_DIR)) {
    console.error('\nâŒ  questions/ directory not found. Run parse-md.ts first.');
    await conn.close();
    process.exit(1);
  }

  const files = readdirSync(QUESTIONS_DIR).filter(f => f.endsWith('.json'));
  console.log(`\nâ“  Seeding questions from ${files.length} filesâ€¦`);

  let totalInserted  = 0;
  let totalSkipped   = 0;
  let totalMappings  = 0;

  for (const file of files) {
    const subjectSlug = file.replace('.json', '');
    const subjectId   = subjectIdMap[subjectSlug];

    if (!subjectId) {
      console.warn(`   âš  No subjectId for ${file} â€” skipping`);
      continue;
    }

    const rawQuestions: any[] = JSON.parse(
      readFileSync(join(QUESTIONS_DIR, file), 'utf-8'),
    );

    let fileInserted = 0;
    let fileSkipped  = 0;

    // Process in batches of 50 to avoid memory issues
    const BATCH = 50;
    for (let i = 0; i < rawQuestions.length; i += BATCH) {
      const batch = rawQuestions.slice(i, i + BATCH);

      for (const rq of batch) {
        // Dedup: skip if exact source+content already exists
        const existing = await M.Question.findOne({
          source:  rq.source,
          content: rq.content,
        }).select('_id').lean();

        if (existing) {
          fileSkipped++;
          // Still ensure mapping exists
          const chapterId = chapterIdMap[rq.chapterSlug] ?? null;
          if (chapterId) {
            await M.QuestionMapping.findOneAndUpdate(
              { questionId: existing._id, subjectId, testSeriesId, chapterId },
              { $setOnInsert: { questionId: existing._id, subjectId, testSeriesId, chapterId, order: 0, createdBy: adminId } },
              { upsert: true },
            );
            totalMappings++;
          }
          continue;
        }

        const chapterId = chapterIdMap[rq.chapterSlug] ?? null;

        // Build options with auto-assigned _id; skip empty-content options (truth-table image questions)
        const options = (rq.options as any[])
          .filter(opt => opt.content && String(opt.content).trim().length > 0)
          .map(opt => ({
            _id:       new Types.ObjectId(),
            content:   String(opt.content).trim(),
            position:  opt.position,
            isCorrect: opt.isCorrect,
            translations: {},
          }));

        // Skip questions that lost valid options after filtering, or have no correct answer
        if (options.length < 2 || !options.some(o => o.isCorrect)) {
          fileSkipped++;
          continue;
        }

        const qDoc = await M.Question.create({
          content:                rq.content,
          translations:           {},
          explanation:            rq.explanation || null,
          explanationTranslations:{},
          type:                   rq.type ?? 'single_choice',
          difficulty:             rq.difficulty ?? 'easy',
          status:                 'published',
          isAvailableForNewTests: true,
          subject:                rq.subject,
          subjectId,
          chapterId,
          topic:                  rq.topic || null,
          subtopic:               null,
          tags:                   rq.tags ?? [],
          marks:                  1,
          negativeMarks:          0,
          source:                 rq.source,
          createdBy:              adminId,
          options,
        });

        fileInserted++;
        totalInserted++;

        // Create QuestionMapping
        if (chapterId) {
          await M.QuestionMapping.findOneAndUpdate(
            { questionId: qDoc._id, subjectId, testSeriesId, chapterId },
            { $setOnInsert: { questionId: qDoc._id, subjectId, testSeriesId, chapterId, order: 0, createdBy: adminId } },
            { upsert: true },
          );
          totalMappings++;
        }
      }
    }

    console.log(`   ðŸ“„ ${file.padEnd(35)} inserted: ${fileInserted}  skipped: ${fileSkipped}`);
    totalSkipped += fileSkipped;
  }

  // â”€â”€ 8. Summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log('\nâ”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”');
  console.log('ðŸŽ‰  SEED COMPLETE');
  console.log('â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”');
  console.log(`   Subjects:         ${Object.keys(subjectIdMap).length}`);
  console.log(`   Test Series:      1  (${tsDef.slug})`);
  console.log(`   Chapters:         ${Object.keys(chapterIdMap).length}`);
  console.log(`   Questions added:  ${totalInserted}`);
  console.log(`   Questions skipped:${totalSkipped}  (already existed)`);
  console.log(`   Mappings:         ${totalMappings}`);
  console.log('â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n');

  await conn.close();
}

main().catch(err => {
  console.error('âŒ  Fatal error:', err);
  process.exit(1);
});

