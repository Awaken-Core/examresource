import 'dotenv/config';
import mongoose from 'mongoose';

const mongoUrl = process.env.DATABASE_URL;
if (!mongoUrl) {
  console.error('DATABASE_URL is required in environment');
  process.exit(1);
}

await mongoose.connect(mongoUrl);
const db = mongoose.connection.db;

console.log('--- Step 1: Checking "latest-jobs" Category ---');
let category = await db.collection('categories').findOne({
  slug: { $in: ['latest-jobs', 'latest-job'] }
});

if (!category) {
  console.log('Category "Latest Jobs" does not exist in DB. Creating it...');
  const now = new Date();
  const insertResult = await db.collection('categories').insertOne({
    name: 'Latest Jobs',
    slug: 'latest-jobs',
    description: 'Latest government job recruitment notifications, vacancies, application links, and Sarkari Naukri updates across India.',
    createdAt: now,
    updatedAt: now,
  });
  category = await db.collection('categories').findOne({ _id: insertResult.insertedId });
  console.log('Created Category:', category);
} else {
  console.log('Found Category:', category);
}

console.log('\n--- Step 2: Locating Railway Job Blogs ---');
// Specifically targeting the user's recently added RRB NTPC UG recruitment blog
const targetSlugs = [
  'rrb-ntpc-10-2-ug-recruitment-2026-notification-apply-online',
  'rrb-ntpc-undergraduate-recruitment-2026',
  'rrb-ntpc-graduate-recruitment-2026'
];

const targetBlogs = await db.collection('blogs').find({
  slug: { $in: targetSlugs }
}).toArray();

console.log(`Found ${targetBlogs.length} railway blog documents matching target slugs:`);
for (const b of targetBlogs) {
  console.log(`- [${b.language}] ${b.title} (slug: ${b.slug}, ID: ${b._id})`);
}

console.log('\n--- Step 3: Assigning Railway Blogs to "Latest Jobs" in blog_categories ---');
for (const blog of targetBlogs) {
  const existingRelation = await db.collection('blog_categories').findOne({
    blogId: blog._id,
    categoryId: category._id,
  });

  if (!existingRelation) {
    const now = new Date();
    await db.collection('blog_categories').insertOne({
      blogId: blog._id,
      categoryId: category._id,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`Added relation: blog ${blog._id} (${blog.slug} [${blog.language}]) -> category ${category.name} (${category._id})`);
  } else {
    console.log(`Relation already exists: blog ${blog._id} (${blog.slug} [${blog.language}]) -> category ${category.name}`);
  }
}

console.log('\n--- Step 4: Verification Query ---');
const blogCatRecords = await db.collection('blog_categories').find({ categoryId: category._id }).toArray();
console.log(`Total blogs in "Latest Jobs" category (${category.slug}): ${blogCatRecords.length}`);

for (const r of blogCatRecords) {
  const linkedBlog = await db.collection('blogs').findOne({ _id: r.blogId }, { projection: { title: 1, slug: 1, language: 1 } });
  console.log(`  -> ${linkedBlog?.slug} [${linkedBlog?.language}] - "${linkedBlog?.title}"`);
}

await mongoose.disconnect();
console.log('\nDone successfully.');
