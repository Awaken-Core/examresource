-- This table may already exist in databases where the one-off category seed ran
-- before this migration. Keep the migration safe for those databases while still
-- creating it normally on fresh installations.
CREATE TABLE IF NOT EXISTS "blog_category" (
	"blogId" uuid NOT NULL,
	"categoryId" uuid NOT NULL,
	CONSTRAINT "BlogCategory_blogId_categoryId_key" UNIQUE("blogId","categoryId")
);
--> statement-breakpoint
ALTER TABLE "blog" DROP CONSTRAINT IF EXISTS "blog_slug_key";--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'Blog_slug_language_key'
			AND conrelid = 'blog'::regclass
	) THEN
		ALTER TABLE "blog" ADD CONSTRAINT "Blog_slug_language_key" UNIQUE("slug","language");
	END IF;
END
$$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "BlogCategory_blogId_idx" ON "blog_category" ("blogId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "BlogCategory_categoryId_idx" ON "blog_category" ("categoryId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Blog_slug_idx" ON "blog" ("slug");--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname IN ('blog_category_blogId_blog_id_fkey', 'blog_category_blogId_fkey')
			AND conrelid = 'blog_category'::regclass
	) THEN
		ALTER TABLE "blog_category" ADD CONSTRAINT "blog_category_blogId_blog_id_fkey" FOREIGN KEY ("blogId") REFERENCES "blog"("id") ON DELETE CASCADE;
	END IF;
END
$$;--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname IN ('blog_category_categoryId_category_id_fkey', 'blog_category_categoryId_fkey')
			AND conrelid = 'blog_category'::regclass
	) THEN
		ALTER TABLE "blog_category" ADD CONSTRAINT "blog_category_categoryId_category_id_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE;
	END IF;
END
$$;
