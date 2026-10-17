import 'dotenv/config';
import pg from 'pg';

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  await client.query('BEGIN');

  // Schema changes belong to Drizzle migrations. Fail with a useful message when
  // this data seed is accidentally run before `drizzle-kit migrate`.
  const relationTable = await client.query(
    `SELECT to_regclass('public.blog_category') AS name`
  );
  if (!relationTable.rows[0]?.name) {
    throw new Error(
      'blog_category does not exist. Run `bun run drizzle:migrate` before this seed.'
    );
  }

  // 2. Define categories to upsert
  const categoriesToUpsert = [
    {
      name: 'Central Government',
      slug: 'central-government',
      description: 'UPSC, SSC, Railways and more',
    },
    {
      name: 'State Exams',
      slug: 'state-exams',
      description: 'UPPSC, BPSC, MPSC and more',
    },
    {
      name: 'Banking',
      slug: 'banking',
      description: 'IBPS, SBI, RBI and more',
    },
    {
      name: 'SSC & Railways',
      slug: 'ssc-railways',
      description: 'SSC, RRB, RPF and more',
    },
    {
      name: 'Teaching',
      slug: 'teaching',
      description: 'CTET, UPTET and more',
    },
    {
      name: 'Defence',
      slug: 'defence',
      description: 'NDA, CDS, AFCAT and more',
    },
  ];

  const categoryMap = new Map();

  for (const cat of categoriesToUpsert) {
    const res = await client.query(
      `INSERT INTO "category" ("id", "name", "slug", "description", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
       ON CONFLICT ("slug") DO UPDATE
       SET "name" = EXCLUDED."name",
           "description" = EXCLUDED."description",
           "updatedAt" = NOW()
       RETURNING "id", "slug"`,
      [cat.name, cat.slug, cat.description]
    );
    const row = res.rows[0];
    categoryMap.set(row.slug, row.id);
    console.log(`Upserted category: ${cat.name} (${row.slug}) -> ${row.id}`);
  }

  // 3. Migrate existing blog.categoryId into blog_category
  const legacyRows = await client.query(
    `SELECT "id", "categoryId" FROM "blog" WHERE "categoryId" IS NOT NULL`
  );
  for (const row of legacyRows.rows) {
    await client.query(
      `INSERT INTO "blog_category" ("blogId", "categoryId")
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [row.id, row.categoryId]
    );
  }
  console.log(`Migrated ${legacyRows.rowCount} legacy blog-category relationships.`);

  // 4. Attach multiple categories to existing blogs
  const allBlogs = await client.query(`SELECT "id", "slug" FROM "blog"`);
  
  for (const blog of allBlogs.rows) {
    const s = blog.slug.toLowerCase();
    const targetCategorySlugs = [];

    if (s.includes('rrb') || s.includes('railway') || s.includes('ntpc')) {
      targetCategorySlugs.push('central-government', 'ssc-railways');
    } else if (s.includes('police') || s.includes('constable')) {
      targetCategorySlugs.push('state-exams', 'defence');
    } else if (s.includes('teacher') || s.includes('prt') || s.includes('upessc')) {
      targetCategorySlugs.push('state-exams', 'teaching');
    }

    for (const catSlug of targetCategorySlugs) {
      const catId = categoryMap.get(catSlug);
      if (catId) {
        await client.query(
          `INSERT INTO "blog_category" ("blogId", "categoryId")
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [blog.id, catId]
        );
        console.log(`Linked blog ${blog.slug} -> ${catSlug}`);
      }
    }
  }

  await client.query('COMMIT');
  console.log('Category seed and migration completed successfully.');
} catch (error) {
  await client.query('ROLLBACK');
  console.error('Error during migration/seed:', error);
  process.exitCode = 1;
} finally {
  await client.end();
}
