import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint, json, boolean } from "drizzle-orm/mysql-core";

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
  /** Admin can disable a student's AI chat access */
  isChatDisabled: boolean("isChatDisabled").default(false).notNull(),
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
  /** When the first message was sent in this conversation (learning session start) */
  startedAt: timestamp("startedAt"),
  /** When the last message was sent (learning session end) */
  endedAt: timestamp("endedAt"),
  /** Calculated learning duration in minutes */
  durationMinutes: int("durationMinutes").default(0).notNull(),
  /** Whether knowledge points have been extracted from this conversation */
  isAnalyzed: boolean("isAnalyzed").default(false).notNull(),
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

/**
 * Learning materials table — uploaded by admin/teachers.
 * Stores the raw content (Markdown) that AI uses to generate courses.
 */
export const learningMaterials = mysqlTable("learning_materials", {
  id: int("id").autoincrement().primaryKey(),
  /** Material title */
  title: varchar("title", { length: 256 }).notNull(),
  /** Brief description of the material */
  description: text("description"),
  /** Full content in Markdown format */
  content: text("content").notNull(),
  /** Subject category */
  subject: varchar("subject", { length: 64 }).notNull(),
  /** Grade level or target audience */
  gradeLevel: varchar("gradeLevel", { length: 64 }),
  /** Admin user who uploaded this material */
  createdBy: int("createdBy").notNull(),
  /** Whether this material is published and visible to students */
  isPublished: boolean("isPublished").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LearningMaterial = typeof learningMaterials.$inferSelect;
export type InsertLearningMaterial = typeof learningMaterials.$inferInsert;

/**
 * Generated courses table — AI-generated course outlines based on learning materials.
 * Each material can have multiple courses (different versions or for different students).
 */
export const generatedCourses = mysqlTable("generated_courses", {
  id: int("id").autoincrement().primaryKey(),
  /** Source learning material ID */
  materialId: int("materialId").notNull(),
  /** Course title (may differ from material title) */
  title: varchar("title", { length: 256 }).notNull(),
  /** Course description */
  description: text("description"),
  /** Subject category (inherited from material) */
  subject: varchar("subject", { length: 64 }).notNull(),
  /** Total number of chapters */
  chapterCount: int("chapterCount").default(0).notNull(),
  /** Total estimated learning time in minutes */
  totalMinutes: int("totalMinutes").default(0).notNull(),
  /** Course status: draft, published, archived */
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  /** Admin who generated this course */
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GeneratedCourse = typeof generatedCourses.$inferSelect;
export type InsertGeneratedCourse = typeof generatedCourses.$inferInsert;

/**
 * Course chapters table — individual chapters within a generated course.
 * Each chapter contains AI-generated educational content.
 */
export const courseChapters = mysqlTable("course_chapters", {
  id: int("id").autoincrement().primaryKey(),
  /** Parent course ID */
  courseId: int("courseId").notNull(),
  /** Chapter order index (1-based) */
  chapterIndex: int("chapterIndex").notNull(),
  /** Chapter title */
  title: varchar("title", { length: 256 }).notNull(),
  /** Learning objectives for this chapter (JSON array of strings) */
  objectives: json("objectives"),
  /** Key knowledge points covered (JSON array of strings) */
  keyPoints: json("keyPoints"),
  /** Full chapter content in Markdown */
  content: text("content"),
  /** Estimated learning time in minutes */
  estimatedMinutes: int("estimatedMinutes").default(30).notNull(),
  /** Whether content has been generated */
  isGenerated: boolean("isGenerated").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CourseChapter = typeof courseChapters.$inferSelect;
export type InsertCourseChapter = typeof courseChapters.$inferInsert;

/**
 * Student course progress table — tracks each student's progress through a course.
 */
export const studentCourseProgress = mysqlTable("student_course_progress", {
  id: int("id").autoincrement().primaryKey(),
  /** Student user ID */
  userId: int("userId").notNull(),
  /** Course ID */
  courseId: int("courseId").notNull(),
  /** Last completed chapter index (0 = not started) */
  lastCompletedChapter: int("lastCompletedChapter").default(0).notNull(),
  /** Total time spent on this course in minutes */
  timeSpentMinutes: int("timeSpentMinutes").default(0).notNull(),
  /** Course completion status */
  status: mysqlEnum("status", ["not_started", "in_progress", "completed"]).default("not_started").notNull(),
  /** When the student started this course */
  startedAt: timestamp("startedAt"),
  /** When the student completed this course */
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudentCourseProgress = typeof studentCourseProgress.$inferSelect;
export type InsertStudentCourseProgress = typeof studentCourseProgress.$inferInsert;
