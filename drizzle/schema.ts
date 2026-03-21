import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with username/password for local registration and class association.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  /** Local auth: username for registration/login */
  username: varchar("username", { length: 64 }).unique(),
  /** Local auth: hashed password (bcrypt) */
  passwordHash: varchar("passwordHash", { length: 256 }),
  /** Class association */
  classId: int("classId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Classes table — managed by admin/teachers.
 * Each class has a unique invite code for student registration.
 */
export const classes = mysqlTable("classes", {
  id: int("id").autoincrement().primaryKey(),
  /** Class display name, e.g. "三年级二班" */
  name: varchar("name", { length: 128 }).notNull(),
  /** Unique invite code for student registration */
  inviteCode: varchar("inviteCode", { length: 32 }).notNull().unique(),
  /** Teacher/admin who created this class */
  createdBy: int("createdBy").notNull(),
  /** Optional description */
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Class = typeof classes.$inferSelect;
export type InsertClass = typeof classes.$inferInsert;

/**
 * Bears table — each user's AI companion bear.
 * Stores bear type, personality, tier/level, and experience.
 */
export const bears = mysqlTable("bears", {
  id: int("id").autoincrement().primaryKey(),
  /** Owner user ID */
  userId: int("userId").notNull(),
  /** Bear name given by user */
  bearName: varchar("bearName", { length: 64 }).notNull(),
  /** Bear type: grizzly (可可), panda (圆圆), polar (冰冰) */
  bearType: mysqlEnum("bearType", ["grizzly", "panda", "polar"]).notNull(),
  /** Personality style affects AI system prompt */
  personality: mysqlEnum("personality", ["teacher", "friend", "cool"]).default("friend").notNull(),
  /** Current tier/rank */
  tier: mysqlEnum("tier", ["bronze", "silver", "gold", "platinum", "diamond", "starlight", "king"]).default("bronze").notNull(),
  /** Current level within tier (1-100) */
  level: int("level").default(1).notNull(),
  /** Total experience points */
  experience: int("experience").default(0).notNull(),
  /** Wisdom attribute */
  wisdom: int("wisdom").default(0).notNull(),
  /** Tech attribute */
  tech: int("tech").default(0).notNull(),
  /** Social attribute */
  social: int("social").default(0).notNull(),
  /** Total conversation count */
  totalChats: int("totalChats").default(0).notNull(),
  /** Current emotion state */
  emotion: mysqlEnum("emotion", ["happy", "thinking", "tired", "levelup", "studying"]).default("happy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Bear = typeof bears.$inferSelect;
export type InsertBear = typeof bears.$inferInsert;

/**
 * Conversations table — groups of messages between a user and their bear.
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  /** Owner user ID */
  userId: int("userId").notNull(),
  /** Associated bear ID */
  bearId: int("bearId").notNull(),
  /** Conversation title (auto-generated or user-set) */
  title: varchar("title", { length: 256 }).default("新对话").notNull(),
  /** Total message count in this conversation */
  messageCount: int("messageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Messages table — individual messages within a conversation.
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  /** Parent conversation ID */
  conversationId: int("conversationId").notNull(),
  /** Message role: user or assistant */
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  /** Message content (text) */
  content: text("content").notNull(),
  /** Token count for this message (for tracking usage) */
  tokenCount: int("tokenCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Knowledge points table — extracted from conversation history via LLM analysis.
 * Tracks what subjects/topics the student has been learning.
 */
export const knowledgePoints = mysqlTable("knowledge_points", {
  id: int("id").autoincrement().primaryKey(),
  /** Owner user ID */
  userId: int("userId").notNull(),
  /** Source conversation ID */
  conversationId: int("conversationId"),
  /** Knowledge point name, e.g. "二次方程" */
  name: varchar("name", { length: 128 }).notNull(),
  /** Subject/category, e.g. "数学", "语文", "英语" */
  subject: varchar("subject", { length: 64 }).notNull(),
  /** Detailed description of the knowledge point */
  description: text("description"),
  /** Mastery level: 0-100 */
  mastery: int("mastery").default(30).notNull(),
  /** Difficulty level */
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).default("medium").notNull(),
  /** Number of times this topic was discussed */
  mentionCount: int("mentionCount").default(1).notNull(),
  /** Last time this knowledge point was discussed */
  lastMentionedAt: timestamp("lastMentionedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KnowledgePoint = typeof knowledgePoints.$inferSelect;
export type InsertKnowledgePoint = typeof knowledgePoints.$inferInsert;

/**
 * Parent share tokens — allows parents to view their child's learning data
 * without needing to register or log in.
 */
export const parentShareTokens = mysqlTable("parent_share_tokens", {
  id: int("id").autoincrement().primaryKey(),
  /** The student user ID this token belongs to */
  userId: int("userId").notNull(),
  /** Unique share token (used in URL) */
  token: varchar("token", { length: 64 }).notNull().unique(),
  /** Optional label, e.g. "爸爸的链接" */
  label: varchar("label", { length: 128 }),
  /** Whether this token is still active */
  isActive: int("isActive").default(1).notNull(),
  /** Expiration date (null = never expires) */
  expiresAt: timestamp("expiresAt"),
  /** View count */
  viewCount: int("viewCount").default(0).notNull(),
  /** Last viewed at */
  lastViewedAt: timestamp("lastViewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ParentShareToken = typeof parentShareTokens.$inferSelect;
export type InsertParentShareToken = typeof parentShareTokens.$inferInsert;
