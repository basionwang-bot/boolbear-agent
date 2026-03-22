import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import * as db from "./db";
import { sdk } from "./_core/sdk";
import { ONE_YEAR_MS } from "@shared/const";
import { extractAndSaveKnowledgePoints } from "./knowledgeExtractor";
import { generateCourseOutline, generateChapterContent, generateChapterPages, generatePageQuestions } from "./courseGenerator";
import { analyzeExamPaper } from "./examAnalyzer";
import { storagePut } from "./storage";

// ==================== AUTH ROUTER ====================

const authRouter = router({
  me: publicProcedure.query(opts => opts.ctx.user),
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),

  /** Local registration: username + password + invite code */
  register: publicProcedure
    .input(z.object({
      username: z.string().min(2).max(32),
      password: z.string().min(6).max(64),
      inviteCode: z.string().min(1).max(32),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if username already exists
      const existing = await db.getUserByUsername(input.username);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "用户名已存在" });
      }

      // Validate invite code
      const cls = await db.getClassByInviteCode(input.inviteCode);
      if (!cls) {
        throw new TRPCError({ code: "NOT_FOUND", message: "邀请码无效" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, 10);

      // Create a unique openId for local users
      const openId = `local_${nanoid(16)}`;

      // Insert user
      await db.upsertUser({
        openId,
        username: input.username,
        passwordHash,
        name: input.username,
        classId: cls.id,
        role: "user",
        loginMethod: "local",
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByUsername(input.username);
      if (!user) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "注册失败" });
      }

      // Create session token
      const token = await sdk.createSessionToken(openId, { name: input.username, expiresInMs: ONE_YEAR_MS });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      return { success: true, user: { id: user.id, username: user.username, name: user.name, role: user.role } };
    }),

  /** Local login: username + password */
  login: publicProcedure
    .input(z.object({
      username: z.string().min(1),
      password: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.getUserByUsername(input.username);
      if (!user || !user.passwordHash) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "用户名或密码错误" });
      }

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "用户名或密码错误" });
      }

      // Create session token
      const token = await sdk.createSessionToken(user.openId, { name: user.name || user.username || "", expiresInMs: ONE_YEAR_MS });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      // Update last signed in
      await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });

      return { success: true, user: { id: user.id, username: user.username, name: user.name, role: user.role } };
    }),
});

// ==================== CLASS ROUTER ====================

const classRouter = router({
  /** Admin: create a new class */
  create: adminProcedure
    .input(z.object({
      name: z.string().min(1).max(128),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const inviteCode = nanoid(8).toUpperCase();
      const cls = await db.createClass({
        name: input.name,
        inviteCode,
        createdBy: ctx.user.id,
        description: input.description ?? null,
      });
      return cls;
    }),

  /** Admin: list all classes */
  list: adminProcedure.query(async ({ ctx }) => {
    return db.getAllClasses();
  }),

  /** Admin: get students in a class */
  students: adminProcedure
    .input(z.object({ classId: z.number() }))
    .query(async ({ input }) => {
      const students = await db.getStudentsByClassId(input.classId);
      // Also get their bears
      const result = await Promise.all(students.map(async (s) => {
        const bear = await db.getBearByUserId(s.id);
        return {
          id: s.id,
          username: s.username,
          name: s.name,
          classId: s.classId,
          createdAt: s.createdAt,
          lastSignedIn: s.lastSignedIn,
          isChatDisabled: s.isChatDisabled,
          bear: bear ? {
            bearName: bear.bearName,
            bearType: bear.bearType,
            tier: bear.tier,
            level: bear.level,
            experience: bear.experience,
            totalChats: bear.totalChats,
          } : null,
        };
      }));
      return result;
    }),

  /** Public: validate invite code (for registration form) */
  validateCode: publicProcedure
    .input(z.object({ inviteCode: z.string() }))
    .query(async ({ input }) => {
      const cls = await db.getClassByInviteCode(input.inviteCode);
      return cls ? { valid: true, className: cls.name } : { valid: false, className: null };
    }),
});

// ==================== BEAR ROUTER ====================

const bearRouter = router({
  /** Adopt a bear */
  adopt: protectedProcedure
    .input(z.object({
      bearName: z.string().min(1).max(32),
      bearType: z.enum(["grizzly", "panda", "polar"]),
      personality: z.enum(["teacher", "friend", "cool"]),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user already has a bear
      const existing = await db.getBearByUserId(ctx.user.id);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "你已经领养了一只小熊" });
      }

      const bear = await db.createBear({
        userId: ctx.user.id,
        bearName: input.bearName,
        bearType: input.bearType,
        personality: input.personality,
      });
      return bear;
    }),

  /** Get current user's bear */
  mine: protectedProcedure.query(async ({ ctx }) => {
    return db.getBearByUserId(ctx.user.id) ?? null;
  }),

  /** Get bear by user ID (for admin/square) */
  getByUserId: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return db.getBearByUserId(input.userId) ?? null;
    }),

  /** Leaderboard: top bears */
  leaderboard: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(20) }).optional())
    .query(async ({ input }) => {
      const limit = input?.limit ?? 20;
      const topBears = await db.getTopBears(limit);
      // Enrich with user info
      const result = await Promise.all(topBears.map(async (b) => {
        const user = await db.getUserById(b.userId);
        return {
          ...b,
          ownerName: user?.name || user?.username || "匿名",
        };
      }));
      return result;
    }),
});

// ==================== CONVERSATION ROUTER ====================

const conversationRouter = router({
  /** Create a new conversation */
  create: protectedProcedure
    .input(z.object({
      title: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const bear = await db.getBearByUserId(ctx.user.id);
      if (!bear) {
        throw new TRPCError({ code: "NOT_FOUND", message: "请先领养一只小熊" });
      }
      return db.createConversation({
        userId: ctx.user.id,
        bearId: bear.id,
        title: input.title || "新对话",
      });
    }),

  /** List user's conversations */
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getConversationsByUserId(ctx.user.id);
  }),

  /** Get messages for a conversation */
  messages: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Verify ownership
      const conv = await db.getConversationById(input.conversationId);
      if (!conv || conv.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "对话不存在" });
      }
      return db.getMessagesByConversationId(input.conversationId);
    }),
});

// ==================== ADMIN ROUTER ====================

const adminRouter = router({
  /** Get dashboard stats */
  stats: adminProcedure.query(async () => {
    const allStudents = await db.getAllStudents();
    const allClasses = await db.getAllClasses();
    const allBears = await db.getAllBears();
    return {
      totalStudents: allStudents.length,
      totalClasses: allClasses.length,
      totalBears: allBears.length,
    };
  }),

  /** Get analytics for all classes (overview) */
  classesAnalytics: adminProcedure.query(async () => {
    return db.getAllClassesAnalytics();
  }),

  /** Get detailed analytics for a specific class */
  classAnalytics: adminProcedure
    .input(z.object({ classId: z.number() }))
    .query(async ({ input }) => {
      return db.getClassAnalytics(input.classId);
    }),

  /** Admin: generate a share link for any student */
  generateStudentReport: adminProcedure
    .input(z.object({
      userId: z.number().int().positive(),
      label: z.string().max(128).optional(),
    }))
    .mutation(async ({ input }) => {
      const student = await db.getUserById(input.userId);
      if (!student) {
        throw new TRPCError({ code: "NOT_FOUND", message: "学生不存在" });
      }
      const token = nanoid(24);
      const shareToken = await db.createParentShareToken({
        userId: input.userId,
        token,
        label: input.label || `${student.name || student.username} 的学习报告`,
      });
      return shareToken;
    }),

  /** List all students with their bears */
  students: adminProcedure.query(async () => {
    const students = await db.getAllStudents();
    const result = await Promise.all(students.map(async (s) => {
      const bear = await db.getBearByUserId(s.id);
      const cls = s.classId ? await db.getClassById(s.classId) : null;
      return {
        id: s.id,
        username: s.username,
        name: s.name,
        className: cls?.name || "未分班",
        createdAt: s.createdAt,
        lastSignedIn: s.lastSignedIn,
        isChatDisabled: s.isChatDisabled,
        bear: bear ? {
          bearName: bear.bearName,
          bearType: bear.bearType,
          tier: bear.tier,
          level: bear.level,
          experience: bear.experience,
          totalChats: bear.totalChats,
        } : null,
      };
    }));
    return result;
  }),

  /** Toggle a student's AI chat access (disable/enable) */
  toggleChatDisabled: adminProcedure
    .input(z.object({
      userId: z.number().int().positive(),
      disabled: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const user = await db.getUserById(input.userId);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "用户不存在" });
      if (user.role === "admin") throw new TRPCError({ code: "FORBIDDEN", message: "不能停用管理员账号" });
      await db.updateUserChatDisabled(input.userId, input.disabled);
      return { success: true, isChatDisabled: input.disabled };
    }),

  /** Delete a user and all their related data */
  deleteUser: adminProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      try {
        const result = await db.deleteUserAndRelatedData(input.userId);
        return result;
      } catch (error) {
        console.error("[Admin] Error deleting user:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "删除用户失败" });
      }
    }),
});

// ==================== LEARNING TIME ROUTER ====================

const learningTimeRouter = router({
  /** Get current user's learning time stats */
  stats: protectedProcedure.query(async ({ ctx }) => {
    return db.getUserLearningTime(ctx.user.id);
  }),

  /** Check if user can generate a report today */
  canGenerateReport: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role === "admin") {
      return { canGenerate: true, remaining: 999, usedToday: 0 };
    }
    const usedToday = await db.getUserDailyReportCount(ctx.user.id);
    return { canGenerate: usedToday < 1, remaining: Math.max(0, 1 - usedToday), usedToday };
  }),
});

// ==================== KNOWLEDGE ROUTER ==

const knowledgeRouter = router({
  /** Get current user's knowledge points */
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getKnowledgePointsByUserId(ctx.user.id);
  }),

  /** Get knowledge point statistics for current user */
  stats: protectedProcedure.query(async ({ ctx }) => {
    return db.getKnowledgePointStats(ctx.user.id);
  }),

  /** Manually trigger knowledge extraction for a specific conversation */
  extract: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const conv = await db.getConversationById(input.conversationId);
      if (!conv || conv.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "对话不存在" });
      }
      return extractAndSaveKnowledgePoints(input.conversationId, ctx.user.id);
    }),

  /** Extract knowledge points from all conversations (batch) */
  extractAll: protectedProcedure.mutation(async ({ ctx }) => {
    const conversations = await db.getConversationsByUserId(ctx.user.id);
    let totalAdded = 0;
    let totalUpdated = 0;
    for (const conv of conversations) {
      try {
        const { added, updated } = await extractAndSaveKnowledgePoints(conv.id, ctx.user.id);
        totalAdded += added;
        totalUpdated += updated;
      } catch (err) {
        console.error(`[Knowledge] Failed to extract from conversation ${conv.id}:`, err);
      }
    }
    return { added: totalAdded, updated: totalUpdated };
  }),
});

// ==================== PARENT ROUTER ====================

const parentRouter = router({
  /** Student: generate a share link for parents (limited to 1 per day for non-admin) */
  createShareLink: protectedProcedure
    .input(z.object({
      label: z.string().max(128).optional(),
    }).optional())
    .mutation(async ({ ctx, input }) => {
      // Check daily limit for non-admin users
      if (ctx.user.role !== "admin") {
        const usedToday = await db.getUserDailyReportCount(ctx.user.id);
        if (usedToday >= 1) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "每天只能生成一次学习报告，请明天再试",
          });
        }
      }
      const token = nanoid(24);
      const shareToken = await db.createParentShareToken({
        userId: ctx.user.id,
        token,
        label: input?.label || null,
      });
      return shareToken;
    }),

  /** Student: list their share links */
  myShareLinks: protectedProcedure.query(async ({ ctx }) => {
    return db.getParentShareTokensByUserId(ctx.user.id);
  }),

  /** Student: deactivate a share link */
  deactivateLink: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership via token list
      const tokens = await db.getParentShareTokensByUserId(ctx.user.id);
      const target = tokens.find(t => t.id === input.id);
      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "链接不存在" });
      }
      await db.deactivateShareToken(input.id);
      return { success: true };
    }),

  /** Public: view child's learning report via share token (no login required) */
  viewReport: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const shareToken = await db.getParentShareTokenByToken(input.token);
      if (!shareToken) {
        throw new TRPCError({ code: "NOT_FOUND", message: "链接无效或已过期" });
      }

      // Check expiration
      if (shareToken.expiresAt && new Date(shareToken.expiresAt) < new Date()) {
        throw new TRPCError({ code: "NOT_FOUND", message: "链接已过期" });
      }

      // Increment view count
      await db.incrementShareTokenViewCount(input.token);

      const userId = shareToken.userId;

      // Get student info
      const student = await db.getUserById(userId);
      if (!student) {
        throw new TRPCError({ code: "NOT_FOUND", message: "学生信息不存在" });
      }

      // Get bear info
      const bear = await db.getBearByUserId(userId);

      // Get class info
      const cls = student.classId ? await db.getClassById(student.classId) : null;

      // Get knowledge points
      const knowledgePointsList = await db.getKnowledgePointsByUserId(userId);
      const knowledgeStats = await db.getKnowledgePointStats(userId);

      // Get recent conversation summaries
      const recentConversations = await db.getRecentConversationSummaries(userId, 10);

      // Get learning time stats
      const learningTime = await db.getUserLearningTime(userId);

      return {
        student: {
          name: student.name || student.username || "未知",
          className: cls?.name || "未分班",
          createdAt: student.createdAt,
          lastSignedIn: student.lastSignedIn,
        },
        learningTime,
        bear: bear ? {
          bearName: bear.bearName,
          bearType: bear.bearType,
          personality: bear.personality,
          tier: bear.tier,
          level: bear.level,
          experience: bear.experience,
          wisdom: bear.wisdom,
          tech: bear.tech,
          social: bear.social,
          totalChats: bear.totalChats,
          emotion: bear.emotion,
          createdAt: bear.createdAt,
        } : null,
        knowledge: {
          points: knowledgePointsList.map(kp => ({
            name: kp.name,
            subject: kp.subject,
            mastery: kp.mastery,
            difficulty: kp.difficulty,
            mentionCount: kp.mentionCount,
            lastMentionedAt: kp.lastMentionedAt,
          })),
          stats: knowledgeStats,
        },
        conversations: recentConversations,
      };
    }),
});

// ==================== MATERIAL ROUTER (Admin) ====================

const materialRouter = router({
  /** Create a new learning material */
  create: adminProcedure
    .input(z.object({
      title: z.string().min(1).max(256),
      description: z.string().max(2000).optional(),
      content: z.string().min(1),
      subject: z.string().min(1).max(64),
      gradeLevel: z.string().max(64).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return db.createLearningMaterial({
        title: input.title,
        description: input.description || null,
        content: input.content,
        subject: input.subject,
        gradeLevel: input.gradeLevel || null,
        createdBy: ctx.user.id,
        isPublished: false,
      });
    }),

  /** List all materials (admin sees all) */
  list: adminProcedure.query(async () => {
    return db.listLearningMaterials();
  }),

  /** Get material detail */
  detail: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const material = await db.getLearningMaterialById(input.id);
      if (!material) throw new TRPCError({ code: "NOT_FOUND", message: "资料不存在" });
      // Also get courses generated from this material
      const courses = await db.listCoursesByMaterialId(input.id);
      return { ...material, courses };
    }),

  /** Update material */
  update: adminProcedure
    .input(z.object({
      id: z.number().int().positive(),
      title: z.string().min(1).max(256).optional(),
      description: z.string().max(2000).optional(),
      content: z.string().min(1).optional(),
      subject: z.string().min(1).max(64).optional(),
      gradeLevel: z.string().max(64).optional(),
      isPublished: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const material = await db.getLearningMaterialById(id);
      if (!material) throw new TRPCError({ code: "NOT_FOUND", message: "资料不存在" });
      await db.updateLearningMaterial(id, data);
      return { success: true };
    }),

  /** Delete material and all related courses */
  delete: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const material = await db.getLearningMaterialById(input.id);
      if (!material) throw new TRPCError({ code: "NOT_FOUND", message: "资料不存在" });
      await db.deleteLearningMaterial(input.id);
      return { success: true };
    }),
});

// ==================== COURSE ROUTER ====================

const courseRouter = router({
  /** Generate course outline from a learning material (admin) */
  generateOutline: adminProcedure
    .input(z.object({ materialId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const material = await db.getLearningMaterialById(input.materialId);
      if (!material) throw new TRPCError({ code: "NOT_FOUND", message: "资料不存在" });

      // Generate outline using LLM
      const outline = await generateCourseOutline(
        material.title,
        material.content,
        material.subject,
        material.gradeLevel
      );

      // Save course to database
      const totalMinutes = outline.chapters.reduce((sum, ch) => sum + ch.estimatedMinutes, 0);
      const course = await db.createGeneratedCourse({
        materialId: input.materialId,
        title: outline.title,
        description: outline.description,
        subject: material.subject,
        chapterCount: outline.chapters.length,
        totalMinutes,
        status: "draft",
        createdBy: ctx.user.id,
      });

      // Save chapters (without content yet)
      for (const ch of outline.chapters) {
        await db.createCourseChapter({
          courseId: course.id,
          chapterIndex: ch.index,
          title: ch.title,
          objectives: ch.objectives,
          keyPoints: ch.keyPoints,
          estimatedMinutes: ch.estimatedMinutes,
          isGenerated: false,
        });
      }

      return { courseId: course.id, outline };
    }),

  /** Generate content for a specific chapter (admin) */
  generateChapter: adminProcedure
    .input(z.object({
      courseId: z.number().int().positive(),
      chapterId: z.number().int().positive(),
    }))
    .mutation(async ({ input }) => {
      const course = await db.getGeneratedCourseById(input.courseId);
      if (!course) throw new TRPCError({ code: "NOT_FOUND", message: "课程不存在" });

      const chapter = await db.getCourseChapterById(input.chapterId);
      if (!chapter || chapter.courseId !== input.courseId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "章节不存在" });
      }

      const material = await db.getLearningMaterialById(course.materialId);
      if (!material) throw new TRPCError({ code: "NOT_FOUND", message: "源资料不存在" });

      // Generate chapter content using LLM
      const content = await generateChapterContent(
        material.content,
        chapter.title,
        (chapter.objectives as string[]) || [],
        (chapter.keyPoints as string[]) || [],
        course.subject,
        material.gradeLevel
      );

      // Save content
      await db.updateCourseChapter(chapter.id, { content, isGenerated: true });

      return { chapterId: chapter.id, content };
    }),

  /** Generate content for ALL chapters of a course (admin) */
  generateAllChapters: adminProcedure
    .input(z.object({ courseId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const course = await db.getGeneratedCourseById(input.courseId);
      if (!course) throw new TRPCError({ code: "NOT_FOUND", message: "课程不存在" });

      const material = await db.getLearningMaterialById(course.materialId);
      if (!material) throw new TRPCError({ code: "NOT_FOUND", message: "源资料不存在" });

      const chapters = await db.getChaptersByCourseId(input.courseId);
      let generated = 0;

      for (const chapter of chapters) {
        if (chapter.isGenerated) continue; // Skip already generated
        try {
          const content = await generateChapterContent(
            material.content,
            chapter.title,
            (chapter.objectives as string[]) || [],
            (chapter.keyPoints as string[]) || [],
            course.subject,
            material.gradeLevel
          );
          await db.updateCourseChapter(chapter.id, { content, isGenerated: true });
          generated++;
        } catch (err) {
          console.error(`[Course] Failed to generate chapter ${chapter.id}:`, err);
        }
      }

      return { generated, total: chapters.length };
    }),

  /** Publish a course (admin) */
  publish: adminProcedure
    .input(z.object({ courseId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const course = await db.getGeneratedCourseById(input.courseId);
      if (!course) throw new TRPCError({ code: "NOT_FOUND", message: "课程不存在" });
      await db.updateGeneratedCourse(input.courseId, { status: "published" });
      return { success: true };
    }),

  /** Unpublish / archive a course (admin) */
  archive: adminProcedure
    .input(z.object({ courseId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await db.updateGeneratedCourse(input.courseId, { status: "archived" });
      return { success: true };
    }),

  /** Delete a course (admin) */
  deleteCourse: adminProcedure
    .input(z.object({ courseId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await db.deleteGeneratedCourse(input.courseId);
      return { success: true };
    }),

  /** Get course detail with chapters (admin) */
  adminDetail: adminProcedure
    .input(z.object({ courseId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const course = await db.getGeneratedCourseById(input.courseId);
      if (!course) throw new TRPCError({ code: "NOT_FOUND", message: "课程不存在" });
      const chapters = await db.getChaptersByCourseId(input.courseId);
      const material = await db.getLearningMaterialById(course.materialId);
      return { ...course, chapters, materialTitle: material?.title || "未知资料" };
    }),

  // ---- Student-facing endpoints ----

  /** List published courses (student) */
  listPublished: protectedProcedure.query(async () => {
    return db.listPublishedCourses();
  }),

  /** Get course detail for student (only published) */
  detail: protectedProcedure
    .input(z.object({ courseId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const course = await db.getGeneratedCourseById(input.courseId);
      if (!course || course.status !== "published") {
        throw new TRPCError({ code: "NOT_FOUND", message: "课程不存在或未发布" });
      }
      const chapters = await db.getChaptersByCourseId(input.courseId);
      const progress = await db.getOrCreateProgress(ctx.user.id, input.courseId);
      return {
        ...course,
        chapters: chapters.map(ch => ({
          id: ch.id,
          chapterIndex: ch.chapterIndex,
          title: ch.title,
          objectives: ch.objectives,
          keyPoints: ch.keyPoints,
          estimatedMinutes: ch.estimatedMinutes,
          isGenerated: ch.isGenerated,
          // Only include content if chapter is generated
          content: ch.isGenerated ? ch.content : null,
        })),
        progress,
      };
    }),

  /** Update student's course progress */
  updateProgress: protectedProcedure
    .input(z.object({
      courseId: z.number().int().positive(),
      lastCompletedChapter: z.number().int().min(0),
      timeSpentMinutes: z.number().int().min(0).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const course = await db.getGeneratedCourseById(input.courseId);
      if (!course || course.status !== "published") {
        throw new TRPCError({ code: "NOT_FOUND", message: "课程不存在" });
      }

      const progress = await db.getOrCreateProgress(ctx.user.id, input.courseId);
      const isCompleted = input.lastCompletedChapter >= course.chapterCount;

      await db.updateCourseProgress(progress.id, {
        lastCompletedChapter: input.lastCompletedChapter,
        timeSpentMinutes: input.timeSpentMinutes ?? progress.timeSpentMinutes,
        status: isCompleted ? "completed" : "in_progress",
        startedAt: progress.startedAt || new Date(),
        completedAt: isCompleted ? new Date() : null,
      });

      return { success: true, isCompleted };
    }),

  /** Get student's progress for all courses */
  myProgress: protectedProcedure.query(async ({ ctx }) => {
    return db.getStudentCourseProgressList(ctx.user.id);
  }),

  // ---- Page-based learning endpoints (NEW) ----

  /** Generate pages for a chapter (admin) — splits content into ~15 bite-sized pages with quizzes */
  generatePages: adminProcedure
    .input(z.object({
      courseId: z.number().int().positive(),
      chapterId: z.number().int().positive(),
      pageCount: z.number().int().min(5).max(25).optional().default(15),
    }))
    .mutation(async ({ input }) => {
      const course = await db.getGeneratedCourseById(input.courseId);
      if (!course) throw new TRPCError({ code: "NOT_FOUND", message: "课程不存在" });

      const chapter = await db.getCourseChapterById(input.chapterId);
      if (!chapter || chapter.courseId !== input.courseId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "章节不存在" });
      }

      const material = await db.getLearningMaterialById(course.materialId);
      if (!material) throw new TRPCError({ code: "NOT_FOUND", message: "源资料不存在" });

      // Delete existing pages first (regenerate)
      await db.deletePagesByChapterId(chapter.id);

      // Generate pages using LLM
      const pages = await generateChapterPages(
        material.content,
        chapter.title,
        (chapter.objectives as string[]) || [],
        (chapter.keyPoints as string[]) || [],
        course.subject,
        material.gradeLevel,
        input.pageCount
      );

      // Save pages to database
      const savedPages = await db.createChapterPagesBatch(
        pages.map(p => ({
          chapterId: chapter.id,
          pageIndex: p.pageIndex,
          title: p.title,
          content: p.content,
          hasQuiz: false,
        }))
      );

      // Generate questions for each page
      let questionsGenerated = 0;
      for (const savedPage of savedPages) {
        try {
          const questions = await generatePageQuestions(
            savedPage.content,
            savedPage.title,
            chapter.title,
            course.subject,
            material.gradeLevel
          );

          if (questions.length > 0) {
            await db.createPageQuestionsBatch(
              questions.map(q => ({
                pageId: savedPage.id,
                questionIndex: q.questionIndex,
                questionType: q.questionType,
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
              }))
            );
            await db.updateChapterPage(savedPage.id, { hasQuiz: true });
            questionsGenerated += questions.length;
          }
        } catch (err) {
          console.error(`[Course] Failed to generate questions for page ${savedPage.id}:`, err);
        }
      }

      // Mark chapter as generated
      await db.updateCourseChapter(chapter.id, { isGenerated: true });

      return {
        chapterId: chapter.id,
        pagesGenerated: savedPages.length,
        questionsGenerated,
      };
    }),

  /** Generate pages for ALL chapters of a course (admin) */
  generateAllPages: adminProcedure
    .input(z.object({
      courseId: z.number().int().positive(),
      pageCount: z.number().int().min(5).max(25).optional().default(15),
    }))
    .mutation(async ({ input }) => {
      const course = await db.getGeneratedCourseById(input.courseId);
      if (!course) throw new TRPCError({ code: "NOT_FOUND", message: "课程不存在" });

      const material = await db.getLearningMaterialById(course.materialId);
      if (!material) throw new TRPCError({ code: "NOT_FOUND", message: "源资料不存在" });

      const chapters = await db.getChaptersByCourseId(input.courseId);
      let totalPages = 0;
      let totalQuestions = 0;

      for (const chapter of chapters) {
        try {
          // Delete existing pages
          await db.deletePagesByChapterId(chapter.id);

          const pages = await generateChapterPages(
            material.content,
            chapter.title,
            (chapter.objectives as string[]) || [],
            (chapter.keyPoints as string[]) || [],
            course.subject,
            material.gradeLevel,
            input.pageCount
          );

          const savedPages = await db.createChapterPagesBatch(
            pages.map(p => ({
              chapterId: chapter.id,
              pageIndex: p.pageIndex,
              title: p.title,
              content: p.content,
              hasQuiz: false,
            }))
          );

          totalPages += savedPages.length;

          for (const savedPage of savedPages) {
            try {
              const questions = await generatePageQuestions(
                savedPage.content,
                savedPage.title,
                chapter.title,
                course.subject,
                material.gradeLevel
              );

              if (questions.length > 0) {
                await db.createPageQuestionsBatch(
                  questions.map(q => ({
                    pageId: savedPage.id,
                    questionIndex: q.questionIndex,
                    questionType: q.questionType,
                    question: q.question,
                    options: q.options,
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation,
                  }))
                );
                await db.updateChapterPage(savedPage.id, { hasQuiz: true });
                totalQuestions += questions.length;
              }
            } catch (err) {
              console.error(`[Course] Failed to generate questions for page ${savedPage.id}:`, err);
            }
          }

          await db.updateCourseChapter(chapter.id, { isGenerated: true });
        } catch (err) {
          console.error(`[Course] Failed to generate pages for chapter ${chapter.id}:`, err);
        }
      }

      return { chaptersProcessed: chapters.length, totalPages, totalQuestions };
    }),

  /** Get chapter pages with questions for student learning */
  chapterPages: protectedProcedure
    .input(z.object({
      courseId: z.number().int().positive(),
      chapterId: z.number().int().positive(),
    }))
    .query(async ({ ctx, input }) => {
      const course = await db.getGeneratedCourseById(input.courseId);
      if (!course || course.status !== "published") {
        throw new TRPCError({ code: "NOT_FOUND", message: "课程不存在或未发布" });
      }

      const chapter = await db.getCourseChapterById(input.chapterId);
      if (!chapter || chapter.courseId !== input.courseId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "章节不存在" });
      }

      let pages = await db.getPagesByChapterId(input.chapterId);

      // Auto-generate pages if none exist (lazy generation)
      if (pages.length === 0 && chapter.isGenerated) {
        try {
          const material = await db.getLearningMaterialById(course.materialId);
          if (material) {
            console.log(`[Course] Auto-generating pages for chapter ${chapter.id}: ${chapter.title}`);
            const generatedPages = await generateChapterPages(
              material.content,
              chapter.title,
              (chapter.objectives as string[]) || [],
              (chapter.keyPoints as string[]) || [],
              course.subject,
              material.gradeLevel,
              15
            );

            const savedPages = await db.createChapterPagesBatch(
              generatedPages.map(p => ({
                chapterId: chapter.id,
                pageIndex: p.pageIndex,
                title: p.title,
                content: p.content,
                hasQuiz: false,
              }))
            );

            // Generate questions for each page
            for (const savedPage of savedPages) {
              try {
                const questions = await generatePageQuestions(
                  savedPage.content,
                  savedPage.title,
                  chapter.title,
                  course.subject,
                  material.gradeLevel
                );
                if (questions.length > 0) {
                  await db.createPageQuestionsBatch(
                    questions.map(q => ({
                      pageId: savedPage.id,
                      questionIndex: q.questionIndex,
                      questionType: q.questionType,
                      question: q.question,
                      options: q.options,
                      correctAnswer: q.correctAnswer,
                      explanation: q.explanation,
                    }))
                  );
                  await db.updateChapterPage(savedPage.id, { hasQuiz: true });
                }
              } catch (err) {
                console.error(`[Course] Failed to generate questions for page ${savedPage.id}:`, err);
              }
            }

            console.log(`[Course] Auto-generated ${savedPages.length} pages for chapter ${chapter.id}`);
            pages = await db.getPagesByChapterId(input.chapterId);
          }
        } catch (err) {
          console.error(`[Course] Auto-generation failed for chapter ${chapter.id}:`, err);
          // Return empty pages, frontend will show "generating" message
        }
      }
      const pageProgress = await db.getChapterPageProgress(ctx.user.id, input.chapterId);

      // Get questions and answers for each page
      const pagesWithQuiz = await Promise.all(
        pages.map(async (page) => {
          const questions = await db.getQuestionsByPageId(page.id);
          const answers = await db.getStudentAnswersForPage(ctx.user.id, page.id);
          const pagePassed = pageProgress.pageStatuses.find(ps => ps.pageId === page.id)?.passed ?? false;

          return {
            ...page,
            questions: questions.map(q => ({
              id: q.id,
              questionIndex: q.questionIndex,
              questionType: q.questionType,
              question: q.question,
              options: q.options as string[],
              // Only reveal correct answer and explanation if student already answered correctly
              correctAnswer: answers.some(a => a.questionId === q.id && a.isCorrect) ? q.correctAnswer : null,
              explanation: answers.some(a => a.questionId === q.id && a.isCorrect) ? q.explanation : null,
            })),
            passed: pagePassed,
            studentAnswers: answers.map(a => ({
              questionId: a.questionId,
              answer: a.answer,
              isCorrect: a.isCorrect,
              attemptNumber: a.attemptNumber,
            })),
          };
        })
      );

      return {
        chapter: {
          id: chapter.id,
          title: chapter.title,
          chapterIndex: chapter.chapterIndex,
          objectives: chapter.objectives,
          keyPoints: chapter.keyPoints,
        },
        pages: pagesWithQuiz,
        progress: pageProgress,
      };
    }),

  /** Submit answer for a question */
  submitAnswer: protectedProcedure
    .input(z.object({
      courseId: z.number().int().positive(),
      chapterId: z.number().int().positive(),
      pageId: z.number().int().positive(),
      questionId: z.number().int().positive(),
      answer: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify the question exists
      const question = await db.getQuestionById(input.questionId);
      if (!question || question.pageId !== input.pageId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "题目不存在" });
      }

      // Check if student already answered this question correctly
      const existingAnswers = await db.getStudentAnswersForPage(ctx.user.id, input.pageId);
      const alreadyCorrect = existingAnswers.some(
        a => a.questionId === input.questionId && a.isCorrect
      );
      if (alreadyCorrect) {
        return {
          isCorrect: true,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          alreadyAnswered: true,
        };
      }

      // Calculate attempt number
      const previousAttempts = existingAnswers.filter(a => a.questionId === input.questionId);
      const attemptNumber = previousAttempts.length + 1;

      // Check answer
      const isCorrect = input.answer === question.correctAnswer;

      // Save answer
      await db.createStudentAnswer({
        userId: ctx.user.id,
        questionId: input.questionId,
        pageId: input.pageId,
        chapterId: input.chapterId,
        courseId: input.courseId,
        answer: input.answer,
        isCorrect,
        attemptNumber,
      });

      // Check if all questions on this page are now correct
      const pagePassed = await db.hasStudentPassedPage(ctx.user.id, input.pageId);

      // If page passed, check if entire chapter is passed
      let chapterPassed = false;
      if (pagePassed) {
        chapterPassed = await db.hasStudentPassedChapter(ctx.user.id, input.chapterId);

        // If chapter passed, update course progress
        if (chapterPassed) {
          const course = await db.getGeneratedCourseById(input.courseId);
          const chapter = await db.getCourseChapterById(input.chapterId);
          if (course && chapter) {
            const progress = await db.getOrCreateProgress(ctx.user.id, input.courseId);
            const newCompleted = Math.max(progress.lastCompletedChapter, chapter.chapterIndex);
            const isFullyCompleted = newCompleted >= course.chapterCount;
            await db.updateCourseProgress(progress.id, {
              lastCompletedChapter: newCompleted,
              status: isFullyCompleted ? "completed" : "in_progress",
              startedAt: progress.startedAt || new Date(),
              completedAt: isFullyCompleted ? new Date() : null,
            });
          }
        }
      }

      return {
        isCorrect,
        correctAnswer: isCorrect ? question.correctAnswer : null,
        explanation: isCorrect ? question.explanation : null,
        alreadyAnswered: false,
        pagePassed,
        chapterPassed,
        attemptNumber,
      };
    }),

  /** Check if student can access a specific chapter (must have passed all previous chapters) */
  canAccessChapter: protectedProcedure
    .input(z.object({
      courseId: z.number().int().positive(),
      chapterId: z.number().int().positive(),
    }))
    .query(async ({ ctx, input }) => {
      const course = await db.getGeneratedCourseById(input.courseId);
      if (!course) return { canAccess: false, reason: "课程不存在" };

      const chapter = await db.getCourseChapterById(input.chapterId);
      if (!chapter || chapter.courseId !== input.courseId) {
        return { canAccess: false, reason: "章节不存在" };
      }

      // First chapter is always accessible
      if (chapter.chapterIndex === 1) return { canAccess: true, reason: null };

      // Check if all previous chapters are passed
      const allChapters = await db.getChaptersByCourseId(input.courseId);
      for (const prevChapter of allChapters) {
        if (prevChapter.chapterIndex >= chapter.chapterIndex) continue;
        const passed = await db.hasStudentPassedChapter(ctx.user.id, prevChapter.id);
        if (!passed) {
          return {
            canAccess: false,
            reason: `请先完成第 ${prevChapter.chapterIndex} 章「${prevChapter.title}」的所有题目`,
          };
        }
      }

      return { canAccess: true, reason: null };
    }),

  /** Admin: get pages for a chapter (for preview) */
  adminChapterPages: adminProcedure
    .input(z.object({ chapterId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const pages = await db.getPagesByChapterId(input.chapterId);
      const pagesWithQuiz = await Promise.all(
        pages.map(async (page) => {
          const questions = await db.getQuestionsByPageId(page.id);
          return { ...page, questions };
        })
      );
      return pagesWithQuiz;
    }),
});

// ==================== EXAM ANALYSIS ROUTER ====================

const examRouter = router({
  /** Upload exam images and create analysis record */
  create: protectedProcedure
    .input(z.object({
      subject: z.string().min(1).max(64),
      examTitle: z.string().max(256).optional(),
      score: z.number().int().min(0),
      totalScore: z.number().int().min(1).default(100),
      imageDataList: z.array(z.object({
        base64: z.string(),
        mimeType: z.string(),
        fileName: z.string(),
      })).min(1).max(10),
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. Upload images to S3
      const imageUrls: string[] = [];
      for (const img of input.imageDataList) {
        const buffer = Buffer.from(img.base64, "base64");
        const suffix = Math.random().toString(36).slice(2, 8);
        const key = `exam-papers/${ctx.user.id}/${Date.now()}-${suffix}-${img.fileName}`;
        const { url } = await storagePut(key, buffer, img.mimeType);
        imageUrls.push(url);
      }

      // 2. Create analysis record
      const record = await db.createExamAnalysis({
        userId: ctx.user.id,
        subject: input.subject,
        examTitle: input.examTitle || null,
        score: input.score,
        totalScore: input.totalScore,
        imageUrls,
        status: "analyzing",
      });

      // 3. Start async analysis (don't await - let it run in background)
      (async () => {
        try {
          console.log(`[Exam] Starting analysis for record ${record.id}`);
          const result = await analyzeExamPaper(
            imageUrls,
            input.subject,
            input.score,
            input.totalScore,
            input.examTitle || undefined
          );

          // Save analysis results
          await db.updateExamAnalysis(record.id, {
            status: "completed",
            overallGrade: result.overallGrade,
            overallComment: result.overallComment,
            dimensionScores: result.dimensionScores,
            weakPoints: result.weakPoints,
            strongPoints: result.strongPoints,
            wrongAnswers: result.wrongAnswers,
            learningPath: result.learningPath,
          });

          // Create learning path nodes in DB for tracking
          const nodes = result.learningPath.flatMap(phase =>
            phase.tasks.map(task => ({
              examAnalysisId: record.id,
              userId: ctx.user.id,
              phaseIndex: phase.phaseIndex,
              nodeIndex: task.taskIndex,
              title: task.title,
              description: task.description,
              taskType: task.taskType as "study" | "practice" | "review" | "test",
              priority: task.priority as "high" | "medium" | "low",
              knowledgePoint: task.knowledgePoint,
              estimatedMinutes: task.estimatedMinutes,
            }))
          );
          if (nodes.length > 0) {
            await db.createLearningPathNodesBatch(nodes);
          }

          console.log(`[Exam] Analysis completed for record ${record.id}`);
        } catch (err) {
          console.error(`[Exam] Analysis failed for record ${record.id}:`, err);
          await db.updateExamAnalysis(record.id, {
            status: "failed",
            errorMessage: err instanceof Error ? err.message : "Unknown error",
          });
        }
      })();

      return { id: record.id, status: "analyzing" };
    }),

  /** Get analysis result by ID */
  detail: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const analysis = await db.getExamAnalysisById(input.id);
      if (!analysis || analysis.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "分析记录不存在" });
      }
      const nodes = await db.getLearningPathNodesByAnalysisId(input.id);
      return {
        ...analysis,
        dimensionScores: (analysis.dimensionScores || []) as any[],
        weakPoints: (analysis.weakPoints || []) as any[],
        strongPoints: (analysis.strongPoints || []) as any[],
        wrongAnswers: (analysis.wrongAnswers || []) as any[],
        learningPath: (analysis.learningPath || { phases: [] }) as any,
        imageUrls: (analysis.imageUrls || []) as string[],
        pathNodes: nodes,
      };
    }),

  /** List all analyses for current user */
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.listExamAnalysesByUserId(ctx.user.id);
  }),

  /** Delete an analysis */
  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const analysis = await db.getExamAnalysisById(input.id);
      if (!analysis || analysis.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "分析记录不存在" });
      }
      await db.deleteExamAnalysis(input.id);
      return { success: true };
    }),

  /** Toggle a learning path node completion */
  toggleNode: protectedProcedure
    .input(z.object({ nodeId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const node = await db.getLearningPathNodeById(input.nodeId);
      if (!node || node.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "任务不存在" });
      }
      const newCompleted = !node.isCompleted;
      await db.updateLearningPathNode(input.nodeId, {
        isCompleted: newCompleted,
        completedAt: newCompleted ? new Date() : null,
      });
      return { isCompleted: newCompleted };
    }),

  /** Generate a share link for an exam analysis */
  generateShareLink: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const analysis = await db.getExamAnalysisById(input.id);
      if (!analysis || analysis.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "分析记录不存在" });
      }
      if (analysis.status !== "completed") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "分析尚未完成，无法分享" });
      }
      // Reuse existing token or generate new one
      let shareToken = analysis.shareToken;
      if (!shareToken) {
        shareToken = nanoid(24);
        await db.setExamShareToken(input.id, shareToken);
      }
      return { shareToken };
    }),

  /** Public: Get shared exam analysis by token (no auth required) */
  shareDetail: publicProcedure
    .input(z.object({ shareToken: z.string().min(1) }))
    .query(async ({ input }) => {
      const analysis = await db.getExamAnalysisByShareToken(input.shareToken);
      if (!analysis || analysis.status !== "completed") {
        throw new TRPCError({ code: "NOT_FOUND", message: "分享链接无效或已过期" });
      }
      // Get the student's bear info for display
      const bear = await db.getBearByUserId(analysis.userId);
      const user = await db.getUserById(analysis.userId);
      const nodes = await db.getLearningPathNodesByAnalysisId(analysis.id);
      return {
        id: analysis.id,
        subject: analysis.subject,
        examTitle: analysis.examTitle,
        score: analysis.score,
        totalScore: analysis.totalScore,
        overallGrade: analysis.overallGrade,
        overallComment: analysis.overallComment,
        dimensionScores: (analysis.dimensionScores || []) as any[],
        weakPoints: (analysis.weakPoints || []) as any[],
        strongPoints: (analysis.strongPoints || []) as any[],
        wrongAnswers: (analysis.wrongAnswers || []) as any[],
        learningPath: (analysis.learningPath || { phases: [] }) as any,
        pathNodes: nodes,
        createdAt: analysis.createdAt,
        studentName: user?.name || user?.username || "小同学",
        bearName: bear?.bearName || "小熊",
        bearType: bear?.bearType || "grizzly",
      };
    }),
});

// ==================== APP ROUTER ====================

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  class: classRouter,
  bear: bearRouter,
  conversation: conversationRouter,
  admin: adminRouter,
  knowledge: knowledgeRouter,
  parent: parentRouter,
  learningTime: learningTimeRouter,
  material: materialRouter,
  course: courseRouter,
  exam: examRouter,
});

export type AppRouter = typeof appRouter;
