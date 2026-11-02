import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

// Load .env
const envFile = resolve(import.meta.dir, '../../apps/server/.env');
if (!existsSync(envFile)) {
  console.error('.env not found');
  process.exit(1);
}

const env: Record<string, string> = {};
for (const line of readFileSync(envFile, 'utf-8').split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const [k, ...v] = trimmed.split('=');
    env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
  }
}

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID!,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
  },
});

const bucket = env.R2_BUCKET!;
const publicBase = env.R2_PUBLIC_BASE_URL!.replace(/\/$/, '');
const webpDir = resolve(import.meta.dir, '../extracted/webp_images');
const webpFiles = readdirSync(webpDir).filter(f => f.endsWith('.webp'));

console.log(`[R2 Upload] Found ${webpFiles.length} WebP images to upload to bucket: ${bucket}`);

const uploadedMap: Record<string, string> = {};
let count = 0;

for (const filename of webpFiles) {
  const filePath = join(webpDir, filename);
  const fileBytes = readFileSync(filePath);
  const key = `question-images/dsssb-computer/${filename}`;

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fileBytes,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );
    uploadedMap[filename] = `${publicBase}/${key}`;
    count++;
    if (count % 50 === 0 || count === webpFiles.length) {
      console.log(`[R2 Upload] Uploaded ${count}/${webpFiles.length} images...`);
    }
  } catch (err) {
    console.error(`[R2 Upload] Failed ${filename}:`, err);
  }
}

const mapPath = resolve(import.meta.dir, '../extracted/r2_image_map.json');
writeFileSync(mapPath, JSON.stringify(uploadedMap, null, 2));
console.log(`[R2 Upload] [OK] Successfully uploaded ${count} images! Map saved to ${mapPath}`);

// Update complete_questions.json with public URLs
const questionsFile = resolve(import.meta.dir, '../extracted/complete_questions.json');
const questions = JSON.parse(readFileSync(questionsFile, 'utf-8'));

let linked = 0;
for (const q of questions) {
  const imgs: string[] = q.images || [];
  let foundUrl: string | null = null;
  for (const imgName of imgs) {
    if (uploadedMap[imgName]) {
      foundUrl = uploadedMap[imgName];
      break;
    }
  }
  q.questionImageUrl = foundUrl;
  if (foundUrl) linked++;
}

const finalFile = resolve(import.meta.dir, '../extracted/final_questions_for_seeding.json');
writeFileSync(finalFile, JSON.stringify(questions, null, 2));
console.log(`[R2 Upload] [OK] Linked ${linked} questions with R2 image URLs. Saved to ${finalFile}`);

