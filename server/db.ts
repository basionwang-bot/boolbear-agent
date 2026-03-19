import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, classes, bears, conversations, messages, type InsertClass, type InsertBear, type InsertConversation, type InsertMessage } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== USER QUERIES ====================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (user.username !== undefined) {
      values.username = user.username;
      updateSet.username = user.username;
    }
    if (user.passwordHash !== undefined) {
      values.passwordHash = user.passwordHash;
      updateSet.passwordHash = user.passwordHash;
    }
    if (user.classId !== undefined) {
      values.classId = user.classId;
      updateSet.classId = user.classId;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllStudents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.role, "user"));
}

export async function getStudentsByClassId(classId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(and(eq(users.role, "user"), eq(users.classId, classId)));
}

// ==================== CLASS QUERIES ====================

export async function createClass(data: InsertClass) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(classes).values(data);
  return getClassByInviteCode(data.inviteCode);
}

export async function getClassByInviteCode(inviteCode: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(classes).where(eq(classes.inviteCode, inviteCode)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getClassById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(classes).where(eq(classes.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllClasses() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(classes).orderBy(desc(classes.createdAt));
}

export async function getClassesByCreator(createdBy: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(classes).where(eq(classes.createdBy, createdBy));
}

// ==================== BEAR QUERIES ====================

export async function createBear(data: InsertBear) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(bears).values(data);
  return getBearByUserId(data.userId);
}

export async function getBearByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bears).where(eq(bears.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getBearById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bears).where(eq(bears.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateBear(id: number, data: Partial<InsertBear>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(bears).set(data).where(eq(bears.id, id));
  return getBearById(id);
}

export async function getAllBears() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bears).orderBy(desc(bears.experience));
}

export async function getTopBears(limit: number = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bears).orderBy(desc(bears.experience)).limit(limit);
}

// ==================== CONVERSATION QUERIES ====================

export async function createConversation(data: InsertConversation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(conversations).values(data);
  // Get the inserted ID
  const [inserted] = await db.select().from(conversations)
    .where(and(eq(conversations.userId, data.userId), eq(conversations.bearId, data.bearId)))
    .orderBy(desc(conversations.createdAt))
    .limit(1);
  return inserted;
}

export async function getConversationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.updatedAt));
}

export async function getConversationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateConversation(id: number, data: Partial<InsertConversation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(conversations).set(data).where(eq(conversations.id, id));
}

// ==================== MESSAGE QUERIES ====================

export async function createMessage(data: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(messages).values(data);
  // Update conversation message count
  await db.update(conversations)
    .set({ messageCount: sql`${conversations.messageCount} + 1` })
    .where(eq(conversations.id, data.conversationId));
}

export async function getMessagesByConversationId(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
}
