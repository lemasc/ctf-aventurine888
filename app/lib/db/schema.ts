import { sql } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  userId: text("user_id").primaryKey().notNull(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  verificationPin: text("verification_pin"),
  balance: integer("balance").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey().notNull(),
  senderId: text("sender_id").references(() => users.userId, {
    onDelete: "cascade",
  }),
  receiverId: text("receiver_id")
    .notNull()
    .references(() => users.userId, {
      onDelete: "cascade",
    }),
  content: text("content").notNull(),
  hasRead: integer("has_read", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
