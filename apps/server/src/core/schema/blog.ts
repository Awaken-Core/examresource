import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

// Enums
export const blogStatusEnum = pgEnum("BlogStatus", [
  "DRAFT",
  "SCHEDULED",
  "PUBLISHED",
  "ARCHIVED",
]);

export const blogLanguageEnum = pgEnum("BlogLanguage", [
  "HINGLISH",
  "ENGLISH",
]);

export const blogBlockTypeEnum = pgEnum("BlogBlockType", [
  "PARAGRAPH",
  "HEADING_1",
  "HEADING_2",
  "HEADING_3",
  "HEADING_4",
  "HEADING_5",
  "HEADING_6",
  "IMAGE",
  "VIDEO",
  "QUOTE",
  "CODE",
  "BULLET_LIST",
  "NUMBERED_LIST",
  "DIVIDER",
  "TABLE",
  "CALLOUT",
]);

// Categories table
export const categories = pgTable(
  "category",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("Category_slug_idx").on(table.slug)],
);

// Tags table
export const tags = pgTable(
  "tag",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => [index("Tag_slug_idx").on(table.slug)],
);

// Blog table
export const blogs = pgTable(
  "blog",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    title: text("title").notNull(),
    slug: text("slug").notNull(), // URL slug — unique per language (compound unique below)
    description: text("description"), // Short excerpt
    coverImage: text("coverImage"),

    status: blogStatusEnum("status").notNull().default("DRAFT"),
    publishedAt: timestamp("publishedAt", { withTimezone: true }),
    scheduledAt: timestamp("scheduledAt", { withTimezone: true }),

    // Relationships
    authorId: text("authorId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: uuid("categoryId").references(() => categories.id, {
      onDelete: "set null",
    }),

    // SEO Metadata
    metaTitle: text("metaTitle"),
    metaDescription: text("metaDescription"),
    canonicalUrl: text("canonicalUrl"),
    imageAlt: text("imageAlt"),
    imageCaption: text("imageCaption"),
    noindex: boolean("noindex").notNull().default(false),
    language: blogLanguageEnum("language").notNull().default("HINGLISH"),
    translationGroupId: uuid("translationGroupId"),

    // Optimistic Concurrency version control
    version: integer("version").notNull().default(1),

    createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("Blog_authorId_createdAt_idx").on(table.authorId, table.createdAt),
    index("Blog_status_publishedAt_idx").on(table.status, table.publishedAt),
    index("Blog_categoryId_idx").on(table.categoryId),
    index("Blog_translationGroupId_idx").on(table.translationGroupId),
    index("Blog_language_idx").on(table.language),
    index("Blog_slug_idx").on(table.slug),
    unique("Blog_slug_language_key").on(table.slug, table.language),
  ],
);

// Blog to Tags pivot
export const blogTags = pgTable(
  "blog_tag",
  {
    blogId: uuid("blogId")
      .notNull()
      .references(() => blogs.id, { onDelete: "cascade" }),
    tagId: uuid("tagId")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    unique("BlogTag_blogId_tagId_key").on(table.blogId, table.tagId),
    index("BlogTag_blogId_idx").on(table.blogId),
    index("BlogTag_tagId_idx").on(table.tagId),
  ],
);

// Blog blocks table
export const blogBlocks = pgTable(
  "blog_block",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    blogId: uuid("blogId")
      .notNull()
      .references(() => blogs.id, { onDelete: "cascade" }),

    type: blogBlockTypeEnum("type").notNull(),
    value: text("value").notNull(),
    position: integer("position").notNull(),
    metadata: jsonb("metadata"), // e.g. alt, width, height, caption, language, level

    createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("BlogBlock_blogId_position_key").on(table.blogId, table.position),
    index("BlogBlock_blogId_position_idx").on(table.blogId, table.position),
  ],
);

// Revision History Table
export const blogRevisions = pgTable(
  "blog_revision",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    blogId: uuid("blogId")
      .notNull()
      .references(() => blogs.id, { onDelete: "cascade" }),
    authorId: text("authorId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    version: integer("version").notNull(),
    snapshot: jsonb("snapshot").notNull(), // Stores block data & metadata at this revision
    createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("BlogRevision_blogId_idx").on(table.blogId),
    index("BlogRevision_blogId_version_idx").on(table.blogId, table.version),
  ],
);

// URL Redirects table for Slug Changes (301 Permanent Redirects)
export const urlRedirects = pgTable(
  "url_redirect",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourcePath: text("sourcePath").notNull().unique(),
    targetPath: text("targetPath").notNull(),
    statusCode: integer("statusCode").notNull().default(301),
    createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("UrlRedirect_sourcePath_idx").on(table.sourcePath)],
);