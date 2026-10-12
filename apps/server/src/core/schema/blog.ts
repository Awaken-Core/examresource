import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

// Enums
export const blogStatusEnum = pgEnum("BlogStatus", [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
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
]);

// Blog table
export const blogs = pgTable(
  "blog",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    title: text("title").notNull(),
    slug: text("slug").notNull().unique(), // This works as business URL or public URL
    description: text("description"),
    coverImage: text("coverImage"),

    status: blogStatusEnum("status").notNull().default("DRAFT"),
    publishedAt: timestamp("publishedAt"),

    authorId: text("authorId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("Blog_authorId_createdAt_idx").on(
      table.authorId,
      table.createdAt,
    ),
    index("Blog_status_publishedAt_idx").on(
      table.status,
      table.publishedAt,
    ),
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
    value: text("value").notNull(), // This can be any text or img/vid key as well
    position: integer("position").notNull(), // incremental positive number
    metadata: jsonb("metadata"), // like alt, width, height, color etc.

    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("BlogBlock_blogId_position_key").on(
      table.blogId,
      table.position,
    ),
    index("BlogBlock_blogId_position_idx").on(
      table.blogId,
      table.position,
    ),
  ],
);