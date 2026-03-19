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
});

// ==================== APP ROUTER ====================

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  class: classRouter,
  bear: bearRouter,
  conversation: conversationRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
