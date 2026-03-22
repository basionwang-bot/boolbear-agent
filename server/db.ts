import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { type InsertUser, users, classes, bears, conversations, messages, knowledgePoints, parentShareTokens, learningMaterials, generatedCourses, courseChapters, studentCourseProgress, chapterPages, pageQuestions, studentAnswers, examAnalyses, learningPathNodes, type InsertClass, type InsertBear, type InsertConversation, type InsertMessage, type InsertKnowledgePoint, type InsertParentShareToken, type InsertLearningMaterial, type InsertGeneratedCourse, type InsertCourseChapter, type InsertStudentCourseProgress, type InsertChapterPage, type InsertPageQuestion, type InsertStudentAnswer, type InsertExamAnalysis, type InsertLearningPathNode } from "../drizzle/schema";
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

export async function updateUserChatDisabled(userId: number, disabled: boolean) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ isChatDisabled: disabled }).where(eq(users.id, userId));
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

// ==================== KNOWLEDGE POINT QUERIES ====================

export async function createKnowledgePoint(data: InsertKnowledgePoint) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(knowledgePoints).values(data);
}

export async function getKnowledgePointsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(knowledgePoints)
    .where(eq(knowledgePoints.userId, userId))
    .orderBy(desc(knowledgePoints.lastMentionedAt));
}

export async function getKnowledgePointByNameAndUser(userId: number, name: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(knowledgePoints)
    .where(and(eq(knowledgePoints.userId, userId), eq(knowledgePoints.name, name)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateKnowledgePoint(id: number, data: Partial<InsertKnowledgePoint>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(knowledgePoints).set(data).where(eq(knowledgePoints.id, id));
}

export async function getKnowledgePointStats(userId: number) {
  const db = await getDb();
  if (!db) return { total: 0, subjects: {} as Record<string, number>, avgMastery: 0 };
  const points = await db.select().from(knowledgePoints).where(eq(knowledgePoints.userId, userId));
  const subjects: Record<string, number> = {};
  let totalMastery = 0;
  for (const p of points) {
    subjects[p.subject] = (subjects[p.subject] || 0) + 1;
    totalMastery += p.mastery;
  }
  return {
    total: points.length,
    subjects,
    avgMastery: points.length > 0 ? Math.round(totalMastery / points.length) : 0,
  };
}

// ==================== DELETE QUERIES ====================

/**
 * Delete a user and all their related data (bears, conversations, messages)
 * This is a cascading delete operation
 */
export async function deleteUserAndRelatedData(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // Get all bears for this user
    const userBears = await db.select().from(bears).where(eq(bears.userId, userId));
    
    // Delete all messages for conversations belonging to this user's bears
    for (const bear of userBears) {
      const userConversations = await db
        .select()
        .from(conversations)
        .where(eq(conversations.bearId, bear.id));
      
      for (const conv of userConversations) {
        // @ts-ignore - drizzle delete method
        await db.delete(messages).where(eq(messages.conversationId, conv.id));
      }
      
      // Delete all conversations for this bear
      // @ts-ignore - drizzle delete method
      await db.delete(conversations).where(eq(conversations.bearId, bear.id));
    }
    
    // Delete all bears for this user
    // @ts-ignore - drizzle delete method
    await db.delete(bears).where(eq(bears.userId, userId));
    
    // Delete the user
    // @ts-ignore - drizzle delete method
    await db.delete(users).where(eq(users.id, userId));
    
    return { success: true };
  } catch (error) {
    console.error("[Database] Error deleting user:", error);
    throw error;
  }
}

// ==================== PARENT SHARE TOKEN QUERIES ====================

export async function createParentShareToken(data: InsertParentShareToken) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(parentShareTokens).values(data);
  return getParentShareTokenByToken(data.token);
}

export async function getParentShareTokenByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(parentShareTokens)
    .where(and(eq(parentShareTokens.token, token), eq(parentShareTokens.isActive, 1)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getParentShareTokensByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(parentShareTokens)
    .where(eq(parentShareTokens.userId, userId))
    .orderBy(desc(parentShareTokens.createdAt));
}

export async function incrementShareTokenViewCount(token: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(parentShareTokens)
    .set({
      viewCount: sql`${parentShareTokens.viewCount} + 1`,
      lastViewedAt: new Date(),
    })
    .where(eq(parentShareTokens.token, token));
}

export async function deactivateShareToken(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(parentShareTokens)
    .set({ isActive: 0 })
    .where(eq(parentShareTokens.id, id));
}

/** Get recent conversation summaries for a user (last N conversations with message previews) */
export async function getRecentConversationSummaries(userId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  const convs = await db.select().from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt))
    .limit(limit);

  const summaries = await Promise.all(convs.map(async (conv) => {
    // Get first and last few messages for summary
    const msgs = await db.select().from(messages)
      .where(eq(messages.conversationId, conv.id))
      .orderBy(messages.createdAt);
    
    // Build a brief summary from the messages
    const userMessages = msgs.filter(m => m.role === "user").map(m => m.content);
    const topicPreview = userMessages.slice(0, 3).join("；").slice(0, 200);
    
    return {
      id: conv.id,
      title: conv.title,
      messageCount: conv.messageCount,
      topicPreview: topicPreview || "暂无内容",
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    };
  }));

  return summaries;
}

// ==================== LEARNING TIME TRACKING ====================

/** Update conversation timing when a message is sent */
export async function updateConversationTiming(conversationId: number) {
  const db = await getDb();
  if (!db) return;
  const conv = await getConversationById(conversationId);
  if (!conv) return;

  const now = new Date();
  const updates: Record<string, any> = { endedAt: now };

  if (!conv.startedAt) {
    updates.startedAt = now;
    updates.durationMinutes = 0;
  } else {
    const startMs = new Date(conv.startedAt).getTime();
    const endMs = now.getTime();
    updates.durationMinutes = Math.max(0, Math.round((endMs - startMs) / 60000));
  }

  await db.update(conversations).set(updates).where(eq(conversations.id, conversationId));
}

/** Get total learning time for a user (in minutes) */
export async function getUserLearningTime(userId: number) {
  const db = await getDb();
  if (!db) return { totalMinutes: 0, todayMinutes: 0, weekMinutes: 0, conversationCount: 0 };

  const convs = await db.select().from(conversations).where(eq(conversations.userId, userId));

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

  let totalMinutes = 0;
  let todayMinutes = 0;
  let weekMinutes = 0;

  for (const c of convs) {
    const dur = c.durationMinutes || 0;
    totalMinutes += dur;
    if (c.startedAt) {
      const start = new Date(c.startedAt);
      if (start >= todayStart) todayMinutes += dur;
      if (start >= weekStart) weekMinutes += dur;
    }
  }

  return { totalMinutes, todayMinutes, weekMinutes, conversationCount: convs.length };
}

/** Check how many share tokens a user has created today */
export async function getUserDailyReportCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const tokens = await db.select().from(parentShareTokens)
    .where(eq(parentShareTokens.userId, userId));

  return tokens.filter(t => new Date(t.createdAt) >= todayStart).length;
}

// ==================== CLASS ANALYTICS QUERIES ====================

/** Get detailed analytics for a specific class */
export async function getClassAnalytics(classId: number) {
  const db = await getDb();
  if (!db) return null;

  const students = await db.select().from(users)
    .where(and(eq(users.role, "user"), eq(users.classId, classId)));

  if (students.length === 0) {
    return {
      studentCount: 0,
      bearCount: 0,
      totalConversations: 0,
      totalMessages: 0,
      totalKnowledgePoints: 0,
      avgExperience: 0,
      avgMastery: 0,
      activeStudents7d: 0,
      subjectDistribution: {} as Record<string, number>,
      tierDistribution: {} as Record<string, number>,
      studentDetails: [] as any[],
    };
  }

  const studentIds = students.map(s => s.id);
  let bearCount = 0;
  let totalConversations = 0;
  let totalMessages = 0;
  let totalKnowledgePoints = 0;
  let totalExperience = 0;
  let totalMastery = 0;
  let masteryCount = 0;
  let activeStudents7d = 0;
  const subjectDistribution: Record<string, number> = {};
  const tierDistribution: Record<string, number> = {};
  const studentDetails: any[] = [];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  for (const student of students) {
    const bear = await db.select().from(bears).where(eq(bears.userId, student.id)).limit(1);
    const convs = await db.select().from(conversations).where(eq(conversations.userId, student.id));
    const kps = await db.select().from(knowledgePoints).where(eq(knowledgePoints.userId, student.id));

    const studentBear = bear[0] || null;
    const convCount = convs.length;
    const msgCount = convs.reduce((sum, c) => sum + (c.messageCount || 0), 0);
    const kpCount = kps.length;

    if (studentBear) {
      bearCount++;
      totalExperience += studentBear.experience || 0;
      const tier = studentBear.tier || "bronze";
      tierDistribution[tier] = (tierDistribution[tier] || 0) + 1;
    }

    totalConversations += convCount;
    totalMessages += msgCount;
    totalKnowledgePoints += kpCount;

    for (const kp of kps) {
      subjectDistribution[kp.subject] = (subjectDistribution[kp.subject] || 0) + 1;
      totalMastery += kp.mastery;
      masteryCount++;
    }

    // Check if active in last 7 days
    if (student.lastSignedIn && new Date(student.lastSignedIn) > sevenDaysAgo) {
      activeStudents7d++;
    }

      // Calculate learning time for this student
      const learningMinutes = convs.reduce((sum, c) => sum + (c.durationMinutes || 0), 0);

      studentDetails.push({
        id: student.id,
        name: student.name || student.username || "未知",
        username: student.username,
        bearName: studentBear?.bearName || null,
        bearType: studentBear?.bearType || null,
        tier: studentBear?.tier || null,
        level: studentBear?.level || 0,
        experience: studentBear?.experience || 0,
        totalChats: studentBear?.totalChats || 0,
        conversationCount: convCount,
        messageCount: msgCount,
        knowledgePointCount: kpCount,
        learningMinutes,
        lastSignedIn: student.lastSignedIn,
      });
  }

  const totalLearningMinutes = studentDetails.reduce((sum: number, s: any) => sum + (s.learningMinutes || 0), 0);

  return {
    studentCount: students.length,
    bearCount,
    totalConversations,
    totalMessages,
    totalKnowledgePoints,
    totalLearningMinutes,
    avgExperience: bearCount > 0 ? Math.round(totalExperience / bearCount) : 0,
    avgMastery: masteryCount > 0 ? Math.round(totalMastery / masteryCount) : 0,
    activeStudents7d,
    subjectDistribution,
    tierDistribution,
    studentDetails,
  };
}

/** Get analytics for all classes (overview) */
export async function getAllClassesAnalytics() {
  const db = await getDb();
  if (!db) return [];

  const allClasses = await db.select().from(classes).orderBy(desc(classes.createdAt));
  const result = [];

  for (const cls of allClasses) {
    const students = await db.select().from(users)
      .where(and(eq(users.role, "user"), eq(users.classId, cls.id)));
    
    let totalExp = 0;
    let bearCount = 0;
    let totalConvs = 0;
    let totalKps = 0;
    let activeCount = 0;
    let totalLearningMinutes = 0;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    for (const s of students) {
      const bear = await db.select().from(bears).where(eq(bears.userId, s.id)).limit(1);
      const convs = await db.select().from(conversations).where(eq(conversations.userId, s.id));
      const kps = await db.select().from(knowledgePoints).where(eq(knowledgePoints.userId, s.id));
      
      if (bear[0]) {
        bearCount++;
        totalExp += bear[0].experience || 0;
      }
      totalConvs += convs.length;
      totalKps += kps.length;
      totalLearningMinutes += convs.reduce((sum, c) => sum + (c.durationMinutes || 0), 0);
      if (s.lastSignedIn && new Date(s.lastSignedIn) > sevenDaysAgo) {
        activeCount++;
      }
    }

    result.push({
      classId: cls.id,
      className: cls.name,
      inviteCode: cls.inviteCode,
      studentCount: students.length,
      bearCount,
      avgExperience: bearCount > 0 ? Math.round(totalExp / bearCount) : 0,
      totalConversations: totalConvs,
      totalKnowledgePoints: totalKps,
      totalLearningMinutes,
      activeStudents7d: activeCount,
    });
  }

  return result;
}


// ==================== LEARNING MATERIALS QUERIES ====================

export async function createLearningMaterial(data: InsertLearningMaterial) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(learningMaterials).values(data);
  const id = result[0].insertId;
  return { id, ...data };
}

export async function getLearningMaterialById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(learningMaterials).where(eq(learningMaterials.id, id));
  return rows[0];
}

export async function listLearningMaterials() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(learningMaterials).orderBy(desc(learningMaterials.createdAt));
}

export async function listPublishedMaterials() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(learningMaterials)
    .where(eq(learningMaterials.isPublished, true))
    .orderBy(desc(learningMaterials.createdAt));
}

export async function updateLearningMaterial(id: number, data: Partial<InsertLearningMaterial>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(learningMaterials).set(data).where(eq(learningMaterials.id, id));
}

export async function deleteLearningMaterial(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Also delete related courses and chapters
  const courses = await db.select({ id: generatedCourses.id }).from(generatedCourses)
    .where(eq(generatedCourses.materialId, id));
  for (const course of courses) {
    await db.delete(courseChapters).where(eq(courseChapters.courseId, course.id));
    await db.delete(studentCourseProgress).where(eq(studentCourseProgress.courseId, course.id));
  }
  await db.delete(generatedCourses).where(eq(generatedCourses.materialId, id));
  await db.delete(learningMaterials).where(eq(learningMaterials.id, id));
}

// ==================== GENERATED COURSES QUERIES ====================

export async function createGeneratedCourse(data: InsertGeneratedCourse) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(generatedCourses).values(data);
  const id = result[0].insertId;
  return { id, ...data };
}

export async function getGeneratedCourseById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(generatedCourses).where(eq(generatedCourses.id, id));
  return rows[0];
}

export async function listCoursesByMaterialId(materialId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(generatedCourses)
    .where(eq(generatedCourses.materialId, materialId))
    .orderBy(desc(generatedCourses.createdAt));
}

export async function listPublishedCourses() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(generatedCourses)
    .where(eq(generatedCourses.status, "published"))
    .orderBy(desc(generatedCourses.createdAt));
}

export async function updateGeneratedCourse(id: number, data: Partial<InsertGeneratedCourse>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(generatedCourses).set(data).where(eq(generatedCourses.id, id));
}

export async function deleteGeneratedCourse(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(courseChapters).where(eq(courseChapters.courseId, id));
  await db.delete(studentCourseProgress).where(eq(studentCourseProgress.courseId, id));
  await db.delete(generatedCourses).where(eq(generatedCourses.id, id));
}

// ==================== COURSE CHAPTERS QUERIES ====================

export async function createCourseChapter(data: InsertCourseChapter) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(courseChapters).values(data);
  const id = result[0].insertId;
  return { id, ...data };
}

export async function getChaptersByCourseId(courseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(courseChapters)
    .where(eq(courseChapters.courseId, courseId))
    .orderBy(courseChapters.chapterIndex);
}

export async function getCourseChapterById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(courseChapters).where(eq(courseChapters.id, id));
  return rows[0];
}

export async function updateCourseChapter(id: number, data: Partial<InsertCourseChapter>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(courseChapters).set(data).where(eq(courseChapters.id, id));
}

// ==================== STUDENT COURSE PROGRESS QUERIES ====================

export async function getOrCreateProgress(userId: number, courseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(studentCourseProgress)
    .where(and(
      eq(studentCourseProgress.userId, userId),
      eq(studentCourseProgress.courseId, courseId)
    ));
  if (existing[0]) return existing[0];
  const result = await db.insert(studentCourseProgress).values({ userId, courseId });
  return { id: result[0].insertId, userId, courseId, lastCompletedChapter: 0, timeSpentMinutes: 0, status: "not_started" as const, startedAt: null, completedAt: null, createdAt: new Date(), updatedAt: new Date() };
}

export async function updateCourseProgress(id: number, data: Partial<InsertStudentCourseProgress>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(studentCourseProgress).set(data).where(eq(studentCourseProgress.id, id));
}

export async function getStudentCourseProgressList(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(studentCourseProgress)
    .where(eq(studentCourseProgress.userId, userId));
}


// ==================== CHAPTER PAGES QUERIES ====================

export async function createChapterPage(data: InsertChapterPage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(chapterPages).values(data);
  return { id: result[0].insertId, ...data };
}

export async function createChapterPagesBatch(dataList: InsertChapterPage[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (dataList.length === 0) return [];
  await db.insert(chapterPages).values(dataList);
  // Return the pages for this chapter
  return db.select().from(chapterPages)
    .where(eq(chapterPages.chapterId, dataList[0].chapterId))
    .orderBy(chapterPages.pageIndex);
}

export async function getPagesByChapterId(chapterId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chapterPages)
    .where(eq(chapterPages.chapterId, chapterId))
    .orderBy(chapterPages.pageIndex);
}

export async function getChapterPageById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(chapterPages).where(eq(chapterPages.id, id));
  return rows[0];
}

export async function updateChapterPage(id: number, data: Partial<InsertChapterPage>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(chapterPages).set(data).where(eq(chapterPages.id, id));
}

export async function deletePagesByChapterId(chapterId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // First delete questions for all pages of this chapter
  const pages = await db.select({ id: chapterPages.id }).from(chapterPages)
    .where(eq(chapterPages.chapterId, chapterId));
  for (const page of pages) {
    await db.delete(pageQuestions).where(eq(pageQuestions.pageId, page.id));
  }
  await db.delete(chapterPages).where(eq(chapterPages.chapterId, chapterId));
}

// ==================== PAGE QUESTIONS QUERIES ====================

export async function createPageQuestionsBatch(dataList: InsertPageQuestion[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (dataList.length === 0) return [];
  await db.insert(pageQuestions).values(dataList);
  return db.select().from(pageQuestions)
    .where(eq(pageQuestions.pageId, dataList[0].pageId))
    .orderBy(pageQuestions.questionIndex);
}

export async function getQuestionsByPageId(pageId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pageQuestions)
    .where(eq(pageQuestions.pageId, pageId))
    .orderBy(pageQuestions.questionIndex);
}

export async function getQuestionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(pageQuestions).where(eq(pageQuestions.id, id));
  return rows[0];
}

// ==================== STUDENT ANSWERS QUERIES ====================

export async function createStudentAnswer(data: InsertStudentAnswer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(studentAnswers).values(data);
  return { id: result[0].insertId, ...data };
}

export async function getStudentAnswersForPage(userId: number, pageId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(studentAnswers)
    .where(and(
      eq(studentAnswers.userId, userId),
      eq(studentAnswers.pageId, pageId)
    ))
    .orderBy(desc(studentAnswers.createdAt));
}

export async function getStudentAnswersForChapter(userId: number, chapterId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(studentAnswers)
    .where(and(
      eq(studentAnswers.userId, userId),
      eq(studentAnswers.chapterId, chapterId)
    ))
    .orderBy(studentAnswers.createdAt);
}

export async function getStudentAnswersForCourse(userId: number, courseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(studentAnswers)
    .where(and(
      eq(studentAnswers.userId, userId),
      eq(studentAnswers.courseId, courseId)
    ))
    .orderBy(studentAnswers.createdAt);
}

/**
 * Check if a student has passed all questions on a page (all correct on latest attempt).
 */
export async function hasStudentPassedPage(userId: number, pageId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  // Get all questions for this page
  const questions = await db.select({ id: pageQuestions.id }).from(pageQuestions)
    .where(eq(pageQuestions.pageId, pageId));
  
  if (questions.length === 0) return true; // No questions = auto-pass
  
  // For each question, check if the student has at least one correct answer
  for (const q of questions) {
    const correctAnswers = await db.select().from(studentAnswers)
      .where(and(
        eq(studentAnswers.userId, userId),
        eq(studentAnswers.questionId, q.id),
        eq(studentAnswers.isCorrect, true)
      ))
      .limit(1);
    if (correctAnswers.length === 0) return false;
  }
  
  return true;
}

/**
 * Check if a student has passed all pages in a chapter.
 */
export async function hasStudentPassedChapter(userId: number, chapterId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const pages = await db.select({ id: chapterPages.id }).from(chapterPages)
    .where(eq(chapterPages.chapterId, chapterId));
  
  if (pages.length === 0) return true;
  
  for (const page of pages) {
    const passed = await hasStudentPassedPage(userId, page.id);
    if (!passed) return false;
  }
  
  return true;
}

/**
 * Get the student's progress summary for a chapter (which pages are passed).
 */
export async function getChapterPageProgress(userId: number, chapterId: number) {
  const db = await getDb();
  if (!db) return { totalPages: 0, passedPages: 0, pageStatuses: [] as { pageId: number; pageIndex: number; passed: boolean }[] };
  
  const pages = await db.select().from(chapterPages)
    .where(eq(chapterPages.chapterId, chapterId))
    .orderBy(chapterPages.pageIndex);
  
  const pageStatuses: { pageId: number; pageIndex: number; passed: boolean }[] = [];
  let passedPages = 0;
  
  for (const page of pages) {
    const passed = await hasStudentPassedPage(userId, page.id);
    pageStatuses.push({ pageId: page.id, pageIndex: page.pageIndex, passed });
    if (passed) passedPages++;
  }
  
  return { totalPages: pages.length, passedPages, pageStatuses };
}

// ==================== EXAM ANALYSIS QUERIES ====================

export async function createExamAnalysis(data: InsertExamAnalysis) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(examAnalyses).values(data).$returningId();
  return { id: result.id, ...data };
}

export async function getExamAnalysisById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(examAnalyses).where(eq(examAnalyses.id, id));
  return rows[0] || undefined;
}

export async function listExamAnalysesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(examAnalyses)
    .where(eq(examAnalyses.userId, userId))
    .orderBy(desc(examAnalyses.createdAt));
}

export async function updateExamAnalysis(id: number, data: Partial<InsertExamAnalysis>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(examAnalyses).set(data).where(eq(examAnalyses.id, id));
}

export async function deleteExamAnalysis(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete associated learning path nodes first
  await db.delete(learningPathNodes).where(eq(learningPathNodes.examAnalysisId, id));
  await db.delete(examAnalyses).where(eq(examAnalyses.id, id));
}

// ==================== LEARNING PATH NODE QUERIES ====================

export async function createLearningPathNodesBatch(dataList: InsertLearningPathNode[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (dataList.length === 0) return [];
  const results = await db.insert(learningPathNodes).values(dataList).$returningId();
  return dataList.map((d, i) => ({ id: results[i].id, ...d }));
}

export async function getLearningPathNodesByAnalysisId(examAnalysisId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(learningPathNodes)
    .where(eq(learningPathNodes.examAnalysisId, examAnalysisId))
    .orderBy(learningPathNodes.phaseIndex, learningPathNodes.nodeIndex);
}

export async function updateLearningPathNode(id: number, data: Partial<InsertLearningPathNode>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(learningPathNodes).set(data).where(eq(learningPathNodes.id, id));
}

export async function getLearningPathNodeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(learningPathNodes).where(eq(learningPathNodes.id, id));
  return rows[0] || undefined;
}
