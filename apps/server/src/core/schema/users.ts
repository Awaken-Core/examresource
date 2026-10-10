// import { relations } from "drizzle-orm/_relations";
import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";

export const UserRole = pgEnum("user_roles", ["user", "admin"]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  role: UserRole("role")
    .default("user")
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
