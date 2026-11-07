import mongoose from 'mongoose';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envFile = resolve(process.cwd(), 'apps/server/.env');
for (const line of readFileSync(envFile, 'utf-8').split('\n')) {
  const t = line.trim();
  if (t && !t.startsWith('#') && t.includes('=')) {
    const [k, ...v] = t.split('=');
    process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
  }
}

function cleanDash(str?: string | null): string | null | undefined {
  if (!str) return str;
  // Replace em-dash and en-dash surrounded by spaces with " - "
  // Replace standalone em-dash/en-dash with "-"
  return str
    .replace(/\s*[\u2014\u2013]\s*/g, ' - ')
    .replace(/\s+-\s+/g, ' - ')
    .trim();
}

function cleanDashInline(str?: string | null): string | null | undefined {
  if (!str) return str;
  // For names like 1NF–BCNF or 2018–2024 without spaces
  return str
    .replace(/(\d+)\s*[\u2014\u2013]\s*(\d+)/g, '$1-$2')
    .replace(/([A-Za-z0-9])\s*[\u2014\u2013]\s*([A-Za-z0-9])/g, '$1 - $2')
    .replace(/[\u2014\u2013]/g, '-');
}

console.log('Connecting to database...');
await mongoose.connect(process.env.DATABASE_URL!);
const db = mongoose.connection.db!;

// 1. Clean EXAMS
console.log('Scanning exams...');
const examsColl = db.collection('exams');
const examCursor = examsColl.find({}, { projection: { _id: 1, title: 1, description: 1, instructions: 1 } });
let examUpdated = 0;

while (await examCursor.hasNext()) {
  const ex = await examCursor.next();
  if (!ex) continue;
  let changed = false;
  const updates: Record<string, any> = {};

  if (ex.title && /[\u2014\u2013]/.test(ex.title)) {
    updates.title = cleanDash(ex.title);
    changed = true;
  }
  if (ex.description && /[\u2014\u2013]/.test(ex.description)) {
    updates.description = cleanDash(ex.description);
    changed = true;
  }
  if (ex.instructions && /[\u2014\u2013]/.test(ex.instructions)) {
    updates.instructions = cleanDash(ex.instructions);
    changed = true;
  }

  if (changed) {
    await examsColl.updateOne({ _id: ex._id }, { $set: updates });
    examUpdated++;
  }
}
console.log(`Updated ${examUpdated} exams.`);

// 2. Clean CHAPTERS
console.log('Scanning chapters...');
const chapColl = db.collection('chapters');
const chapCursor = chapColl.find({}, { projection: { _id: 1, name: 1 } });
let chapUpdated = 0;

while (await chapCursor.hasNext()) {
  const ch = await chapCursor.next();
  if (!ch) continue;
  if (ch.name && /[\u2014\u2013]/.test(ch.name)) {
    const newName = ch.name.replace(/[\u2014\u2013]/g, '-');
    await chapColl.updateOne({ _id: ch._id }, { $set: { name: newName } });
    chapUpdated++;
  }
}
console.log(`Updated ${chapUpdated} chapters.`);

// 3. Clean TEST_SERIES
console.log('Scanning test_series...');
const tsColl = db.collection('test_series');
const tsCursor = tsColl.find({}, { projection: { _id: 1, title: 1, description: 1 } });
let tsUpdated = 0;

while (await tsCursor.hasNext()) {
  const ts = await tsCursor.next();
  if (!ts) continue;
  let changed = false;
  const updates: Record<string, any> = {};

  if (ts.title && /[\u2014\u2013]/.test(ts.title)) {
    updates.title = cleanDash(ts.title);
    changed = true;
  }
  if (ts.description && /[\u2014\u2013]/.test(ts.description)) {
    updates.description = cleanDash(ts.description);
    changed = true;
  }

  if (changed) {
    await tsColl.updateOne({ _id: ts._id }, { $set: updates });
    tsUpdated++;
  }
}
console.log(`Updated ${tsUpdated} test series.`);

// 4. Clean BLOGS
console.log('Scanning blogs...');
const blogColl = db.collection('blogs');
const blogCursor = blogColl.find({}, { projection: { _id: 1, title: 1, excerpt: 1, description: 1, content: 1 } });
let blogUpdated = 0;

while (await blogCursor.hasNext()) {
  const bl = await blogCursor.next();
  if (!bl) continue;
  let changed = false;
  const updates: Record<string, any> = {};

  if (bl.title && /[\u2014\u2013]/.test(bl.title)) {
    updates.title = cleanDash(bl.title);
    changed = true;
  }
  if (bl.description && /[\u2014\u2013]/.test(bl.description)) {
    updates.description = cleanDash(bl.description);
    changed = true;
  }
  if (bl.excerpt && /[\u2014\u2013]/.test(bl.excerpt)) {
    updates.excerpt = cleanDash(bl.excerpt);
    changed = true;
  }

  if (changed) {
    await blogColl.updateOne({ _id: bl._id }, { $set: updates });
    blogUpdated++;
  }
}
console.log(`Updated ${blogUpdated} blogs.`);

await mongoose.disconnect();
console.log('All database dash sanitization completed successfully!');
