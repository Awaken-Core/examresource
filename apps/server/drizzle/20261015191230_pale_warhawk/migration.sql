CREATE TYPE "user_role" AS ENUM('student', 'editor', 'admin');--> statement-breakpoint
CREATE TYPE "user_status" AS ENUM('active', 'suspended');--> statement-breakpoint
CREATE TYPE "BlogBlockType" AS ENUM('PARAGRAPH', 'HEADING_1', 'HEADING_2', 'HEADING_3', 'HEADING_4', 'HEADING_5', 'HEADING_6', 'IMAGE', 'VIDEO', 'QUOTE', 'CODE', 'BULLET_LIST', 'NUMBERED_LIST', 'DIVIDER', 'TABLE', 'CALLOUT');--> statement-breakpoint
CREATE TYPE "BlogStatus" AS ENUM('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "notification_kind" AS ENUM('welcome', 'blog', 'broadcast');--> statement-breakpoint
CREATE TABLE "email_verification_tokens" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_states" (
	"id" text PRIMARY KEY,
	"state_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY,
	"clerk_user_id" text,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"google_subject" text,
	"password_hash" text,
	"email_verified_at" timestamp with time zone,
	"role" "user_role" DEFAULT 'student'::"user_role" NOT NULL,
	"status" "user_status" DEFAULT 'active'::"user_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_block" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"blogId" uuid NOT NULL,
	"type" "BlogBlockType" NOT NULL,
	"value" text NOT NULL,
	"position" integer NOT NULL,
	"metadata" jsonb,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "BlogBlock_blogId_position_key" UNIQUE("blogId","position")
);
--> statement-breakpoint
CREATE TABLE "blog_revision" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"blogId" uuid NOT NULL,
	"authorId" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"version" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_tag" (
	"blogId" uuid NOT NULL,
	"tagId" uuid NOT NULL,
	CONSTRAINT "BlogTag_blogId_tagId_key" UNIQUE("blogId","tagId")
);
--> statement-breakpoint
CREATE TABLE "blog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"title" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"description" text,
	"coverImage" text,
	"status" "BlogStatus" DEFAULT 'DRAFT'::"BlogStatus" NOT NULL,
	"publishedAt" timestamp with time zone,
	"scheduledAt" timestamp with time zone,
	"authorId" text NOT NULL,
	"categoryId" uuid,
	"metaTitle" text,
	"metaDescription" text,
	"canonicalUrl" text,
	"imageAlt" text,
	"imageCaption" text,
	"noindex" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "url_redirect" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"sourcePath" text NOT NULL UNIQUE,
	"targetPath" text NOT NULL,
	"statusCode" integer DEFAULT 301 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_reads" (
	"notification_id" text,
	"user_id" text,
	"read_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_reads_pkey" PRIMARY KEY("notification_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY,
	"kind" "notification_kind" NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"href" text,
	"audience_user_id" text,
	"created_by_id" text,
	"source_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "email_verification_tokens_hash_unique" ON "email_verification_tokens" ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "oauth_states_hash_unique" ON "oauth_states" ("state_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "password_reset_tokens_hash_unique" ON "password_reset_tokens" ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_hash_unique" ON "sessions" ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_clerk_user_id_unique" ON "users" ("clerk_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_google_subject_unique" ON "users" ("google_subject");--> statement-breakpoint
CREATE INDEX "BlogBlock_blogId_position_idx" ON "blog_block" ("blogId","position");--> statement-breakpoint
CREATE INDEX "BlogRevision_blogId_idx" ON "blog_revision" ("blogId");--> statement-breakpoint
CREATE INDEX "BlogRevision_blogId_version_idx" ON "blog_revision" ("blogId","version");--> statement-breakpoint
CREATE INDEX "BlogTag_blogId_idx" ON "blog_tag" ("blogId");--> statement-breakpoint
CREATE INDEX "BlogTag_tagId_idx" ON "blog_tag" ("tagId");--> statement-breakpoint
CREATE INDEX "Blog_authorId_createdAt_idx" ON "blog" ("authorId","createdAt");--> statement-breakpoint
CREATE INDEX "Blog_status_publishedAt_idx" ON "blog" ("status","publishedAt");--> statement-breakpoint
CREATE INDEX "Blog_categoryId_idx" ON "blog" ("categoryId");--> statement-breakpoint
CREATE INDEX "Category_slug_idx" ON "category" ("slug");--> statement-breakpoint
CREATE INDEX "Tag_slug_idx" ON "tag" ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "UrlRedirect_sourcePath_idx" ON "url_redirect" ("sourcePath");--> statement-breakpoint
CREATE INDEX "notification_reads_user_id_idx" ON "notification_reads" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_source_key_unique" ON "notifications" ("source_key");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" ("created_at");--> statement-breakpoint
CREATE INDEX "notifications_audience_user_id_idx" ON "notifications" ("audience_user_id");--> statement-breakpoint
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "blog_block" ADD CONSTRAINT "blog_block_blogId_blog_id_fkey" FOREIGN KEY ("blogId") REFERENCES "blog"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "blog_revision" ADD CONSTRAINT "blog_revision_blogId_blog_id_fkey" FOREIGN KEY ("blogId") REFERENCES "blog"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "blog_revision" ADD CONSTRAINT "blog_revision_authorId_users_id_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "blog_tag" ADD CONSTRAINT "blog_tag_blogId_blog_id_fkey" FOREIGN KEY ("blogId") REFERENCES "blog"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "blog_tag" ADD CONSTRAINT "blog_tag_tagId_tag_id_fkey" FOREIGN KEY ("tagId") REFERENCES "tag"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "blog" ADD CONSTRAINT "blog_authorId_users_id_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "blog" ADD CONSTRAINT "blog_categoryId_category_id_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_notification_id_notifications_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_audience_user_id_users_id_fkey" FOREIGN KEY ("audience_user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_created_by_id_users_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL;