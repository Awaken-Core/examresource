CREATE TYPE "BlogLanguage" AS ENUM('HINGLISH', 'ENGLISH');--> statement-breakpoint
ALTER TABLE "blog" ADD COLUMN "language" "BlogLanguage" DEFAULT 'HINGLISH'::"BlogLanguage" NOT NULL;--> statement-breakpoint
ALTER TABLE "blog" ADD COLUMN "translationGroupId" uuid;--> statement-breakpoint
CREATE INDEX "Blog_translationGroupId_idx" ON "blog" ("translationGroupId");--> statement-breakpoint
CREATE INDEX "Blog_language_idx" ON "blog" ("language");