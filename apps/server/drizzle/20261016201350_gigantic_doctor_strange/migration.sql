CREATE TABLE "blog_category" (
	"blogId" uuid NOT NULL,
	"categoryId" uuid NOT NULL,
	CONSTRAINT "BlogCategory_blogId_categoryId_key" UNIQUE("blogId","categoryId")
);
--> statement-breakpoint
ALTER TABLE "blog" DROP CONSTRAINT "blog_slug_key";--> statement-breakpoint
ALTER TABLE "blog" ADD CONSTRAINT "Blog_slug_language_key" UNIQUE("slug","language");--> statement-breakpoint
CREATE INDEX "BlogCategory_blogId_idx" ON "blog_category" ("blogId");--> statement-breakpoint
CREATE INDEX "BlogCategory_categoryId_idx" ON "blog_category" ("categoryId");--> statement-breakpoint
CREATE INDEX "Blog_slug_idx" ON "blog" ("slug");--> statement-breakpoint
ALTER TABLE "blog_category" ADD CONSTRAINT "blog_category_blogId_blog_id_fkey" FOREIGN KEY ("blogId") REFERENCES "blog"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "blog_category" ADD CONSTRAINT "blog_category_categoryId_category_id_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE;