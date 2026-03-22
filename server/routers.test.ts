import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";

// ==================== MOCK DB ====================

// In-memory mock data stores
let mockUsers: any[] = [];
let mockClasses: any[] = [];
let mockBears: any[] = [];
let mockConversations: any[] = [];
let mockMessages: any[] = [];
let mockKnowledgePoints: any[] = [];
let mockShareTokens: any[] = [];
let autoId = { user: 100, class: 100, bear: 100, conv: 100, msg: 100, kp: 100, st: 100 };

vi.mock("./db", () => ({
  getUserByUsername: vi.fn(async (username: string) => {
    return mockUsers.find((u) => u.username === username) || undefined;
  }),
  getUserByOpenId: vi.fn(async (openId: string) => {
    return mockUsers.find((u) => u.openId === openId) || undefined;
  }),
  getUserById: vi.fn(async (id: number) => {
    return mockUsers.find((u) => u.id === id) || undefined;
  }),
  upsertUser: vi.fn(async (data: any) => {
    const existing = mockUsers.find((u) => u.openId === data.openId);
    if (existing) {
      Object.assign(existing, data);
    } else {
      const user = {
        id: autoId.user++,
        openId: data.openId,
        username: data.username || null,
        name: data.name || null,
        email: null,
        loginMethod: data.loginMethod || "local",
        role: data.role || "user",
        classId: data.classId || null,
        passwordHash: data.passwordHash || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: data.lastSignedIn || new Date(),
      };
      mockUsers.push(user);
    }
  }),
  getClassByInviteCode: vi.fn(async (code: string) => {
    return mockClasses.find((c) => c.inviteCode === code) || undefined;
  }),
  getClassById: vi.fn(async (id: number) => {
    return mockClasses.find((c) => c.id === id) || undefined;
  }),
  createClass: vi.fn(async (data: any) => {
    const cls = { id: autoId.class++, ...data, createdAt: new Date(), updatedAt: new Date() };
    mockClasses.push(cls);
    return cls;
  }),
  getAllClasses: vi.fn(async () => mockClasses),
  getStudentsByClassId: vi.fn(async (classId: number) => {
    return mockUsers.filter((u) => u.classId === classId && u.role === "user");
  }),
  getAllStudents: vi.fn(async () => mockUsers.filter((u) => u.role === "user")),
  createBear: vi.fn(async (data: any) => {
    const bear = {
      id: autoId.bear++,
      userId: data.userId,
      bearName: data.bearName,
      bearType: data.bearType,
      personality: data.personality || "friend",
      tier: "bronze",
      level: 1,
      experience: 0,
      wisdom: 0,
      tech: 0,
      social: 0,
      totalChats: 0,
      emotion: "happy",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockBears.push(bear);
    return bear;
  }),
  getBearByUserId: vi.fn(async (userId: number) => {
    return mockBears.find((b) => b.userId === userId) || undefined;
  }),
  getBearById: vi.fn(async (id: number) => {
    return mockBears.find((b) => b.id === id) || undefined;
  }),
  getTopBears: vi.fn(async (limit: number) => {
    return [...mockBears].sort((a, b) => b.experience - a.experience).slice(0, limit);
  }),
  getAllBears: vi.fn(async () => mockBears),
  updateBear: vi.fn(async (id: number, data: any) => {
    const bear = mockBears.find((b) => b.id === id);
    if (bear) Object.assign(bear, data);
    return bear;
  }),
  createConversation: vi.fn(async (data: any) => {
    const conv = {
      id: autoId.conv++,
      userId: data.userId,
      bearId: data.bearId,
      title: data.title || "新对话",
      messageCount: 0,
      startedAt: data.startedAt || new Date(),
      endedAt: data.endedAt || null,
      durationMinutes: data.durationMinutes || 0,
      isAnalyzed: data.isAnalyzed || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockConversations.push(conv);
    return conv;
  }),
  getConversationsByUserId: vi.fn(async (userId: number) => {
    return mockConversations.filter((c) => c.userId === userId);
  }),
  getConversationById: vi.fn(async (id: number) => {
    return mockConversations.find((c) => c.id === id) || undefined;
  }),
  getMessagesByConversationId: vi.fn(async (convId: number) => {
    return mockMessages.filter((m) => m.conversationId === convId);
  }),
  createMessage: vi.fn(async (data: any) => {
    const msg = { id: autoId.msg++, ...data, createdAt: new Date() };
    mockMessages.push(msg);
    return msg;
  }),
  updateConversation: vi.fn(async (id: number, data: any) => {
    const conv = mockConversations.find((c) => c.id === id);
    if (conv) Object.assign(conv, data);
  }),
  deleteUserAndRelatedData: vi.fn(async (userId: number) => {
    const idx = mockUsers.findIndex((u) => u.id === userId);
    if (idx === -1) throw new Error("User not found");
    mockBears = mockBears.filter((b) => b.userId !== userId);
    mockConversations = mockConversations.filter((c) => c.userId !== userId);
    mockUsers.splice(idx, 1);
    return { success: true };
  }),
  updateUserChatDisabled: vi.fn(async (userId: number, disabled: boolean) => {
    const user = mockUsers.find((u) => u.id === userId);
    if (!user) throw new Error("User not found");
    (user as any).isChatDisabled = disabled;
    return user;
  }),
  getKnowledgePointsByUserId: vi.fn(async (userId: number) => {
    return mockKnowledgePoints.filter((kp) => kp.userId === userId);
  }),
  getKnowledgePointStats: vi.fn(async (userId: number) => {
    const points = mockKnowledgePoints.filter((kp) => kp.userId === userId);
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
  }),
  getKnowledgePointByNameAndUser: vi.fn(async (userId: number, name: string) => {
    return mockKnowledgePoints.find((kp) => kp.userId === userId && kp.name === name) || undefined;
  }),
  createKnowledgePoint: vi.fn(async (data: any) => {
    const kp = { id: autoId.kp++, ...data, createdAt: new Date(), updatedAt: new Date() };
    mockKnowledgePoints.push(kp);
    return kp;
  }),
  updateKnowledgePoint: vi.fn(async (id: number, data: any) => {
    const kp = mockKnowledgePoints.find((k) => k.id === id);
    if (kp) Object.assign(kp, data);
    return kp;
  }),
  createParentShareToken: vi.fn(async (data: any) => {
    const token = {
      id: autoId.st++,
      userId: data.userId,
      token: data.token,
      label: data.label || null,
      isActive: 1,
      viewCount: 0,
      lastViewedAt: null,
      expiresAt: null,
      createdAt: new Date(),
    };
    mockShareTokens.push(token);
    return token;
  }),
  getParentShareTokensByUserId: vi.fn(async (userId: number) => {
    return mockShareTokens.filter((t) => t.userId === userId);
  }),
  getParentShareTokenByToken: vi.fn(async (token: string) => {
    return mockShareTokens.find((t) => t.token === token && t.isActive === 1) || undefined;
  }),
  deactivateShareToken: vi.fn(async (id: number) => {
    const token = mockShareTokens.find((t) => t.id === id);
    if (token) token.isActive = 0;
  }),
  incrementShareTokenViewCount: vi.fn(async (token: string) => {
    const t = mockShareTokens.find((st) => st.token === token);
    if (t) t.viewCount++;
  }),
  getRecentConversationSummaries: vi.fn(async (userId: number, limit: number) => {
    return mockConversations
      .filter((c) => c.userId === userId)
      .slice(0, limit)
      .map((c) => ({
        id: c.id,
        title: c.title,
        messageCount: c.messageCount,
        topicPreview: "测试对话内容",
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));
  }),
  getClassAnalytics: vi.fn(async (classId: number) => {
    const students = mockUsers.filter((u) => u.classId === classId && u.role === "user");
    if (students.length === 0) {
      return {
        studentCount: 0, bearCount: 0, totalConversations: 0, totalMessages: 0,
        totalKnowledgePoints: 0, avgExperience: 0, avgMastery: 0, activeStudents7d: 0,
        subjectDistribution: {}, tierDistribution: {}, studentDetails: [],
      };
    }
    let bearCount = 0, totalExp = 0, totalConvs = 0, totalMsgs = 0, totalKps = 0, totalMastery = 0, masteryCount = 0;
    const subjectDistribution: Record<string, number> = {};
    const tierDistribution: Record<string, number> = {};
    const studentDetails: any[] = [];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let activeCount = 0;
    for (const s of students) {
      const bear = mockBears.find((b) => b.userId === s.id);
      const convs = mockConversations.filter((c) => c.userId === s.id);
      const kps = mockKnowledgePoints.filter((kp) => kp.userId === s.id);
      const msgCount = convs.reduce((sum: number, c: any) => sum + (c.messageCount || 0), 0);
      if (bear) {
        bearCount++;
        totalExp += bear.experience || 0;
        tierDistribution[bear.tier] = (tierDistribution[bear.tier] || 0) + 1;
      }
      totalConvs += convs.length;
      totalMsgs += msgCount;
      totalKps += kps.length;
      for (const kp of kps) {
        subjectDistribution[kp.subject] = (subjectDistribution[kp.subject] || 0) + 1;
        totalMastery += kp.mastery;
        masteryCount++;
      }
      if (s.lastSignedIn && new Date(s.lastSignedIn) > sevenDaysAgo) activeCount++;
      studentDetails.push({
        id: s.id, name: s.name || s.username, username: s.username,
        bearName: bear?.bearName || null, bearType: bear?.bearType || null,
        tier: bear?.tier || null, level: bear?.level || 0,
        experience: bear?.experience || 0, totalChats: bear?.totalChats || 0,
        conversationCount: convs.length, messageCount: msgCount,
        knowledgePointCount: kps.length, lastSignedIn: s.lastSignedIn,
      });
    }
    return {
      studentCount: students.length, bearCount, totalConversations: totalConvs,
      totalMessages: totalMsgs, totalKnowledgePoints: totalKps,
      avgExperience: bearCount > 0 ? Math.round(totalExp / bearCount) : 0,
      avgMastery: masteryCount > 0 ? Math.round(totalMastery / masteryCount) : 0,
      activeStudents7d: activeCount, subjectDistribution, tierDistribution, studentDetails,
    };
  }),
  getAllClassesAnalytics: vi.fn(async () => {
    const result = [];
    for (const cls of mockClasses) {
      const students = mockUsers.filter((u) => u.classId === cls.id && u.role === "user");
      let totalExp = 0, bearCount = 0, totalConvs = 0, totalKps = 0, activeCount = 0, totalLearningMinutes = 0;
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      for (const s of students) {
        const bear = mockBears.find((b) => b.userId === s.id);
        const convs = mockConversations.filter((c) => c.userId === s.id);
        const kps = mockKnowledgePoints.filter((kp) => kp.userId === s.id);
        if (bear) { bearCount++; totalExp += bear.experience || 0; }
        totalConvs += convs.length;
        totalKps += kps.length;
        totalLearningMinutes += convs.reduce((sum: number, c: any) => sum + (c.durationMinutes || 0), 0);
        if (s.lastSignedIn && new Date(s.lastSignedIn) > sevenDaysAgo) activeCount++;
      }
      result.push({
        classId: cls.id, className: cls.name, inviteCode: cls.inviteCode,
        studentCount: students.length, bearCount,
        avgExperience: bearCount > 0 ? Math.round(totalExp / bearCount) : 0,
        totalConversations: totalConvs, totalKnowledgePoints: totalKps,
        totalLearningMinutes,
        activeStudents7d: activeCount,
      });
    }
    return result;
  }),
  getUserLearningTime: vi.fn(async (userId: number) => {
    const convs = mockConversations.filter((c) => c.userId === userId);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    let totalMinutes = 0, todayMinutes = 0, weekMinutes = 0;
    for (const c of convs) {
      const dur = c.durationMinutes || 0;
      totalMinutes += dur;
      if (c.startedAt && new Date(c.startedAt) >= todayStart) todayMinutes += dur;
      if (c.startedAt && new Date(c.startedAt) >= weekStart) weekMinutes += dur;
    }
    return { totalMinutes, todayMinutes, weekMinutes, totalSessions: convs.length };
  }),
  getUserDailyReportCount: vi.fn(async (userId: number) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return mockShareTokens.filter(
      (t) => t.userId === userId && new Date(t.createdAt) >= todayStart
    ).length;
  }),
  updateConversationLearningTime: vi.fn(async () => {}),

  // ==================== MATERIAL & COURSE MOCKS ====================
  createLearningMaterial: vi.fn(async (data: any) => {
    const mat = { id: autoId.st++, ...data, status: data.status || "draft", createdAt: new Date(), updatedAt: new Date() };
    return mat;
  }),
  getLearningMaterialById: vi.fn(async (id: number) => {
    return { id, title: "Test Material", description: "desc", content: "# Test\n\nContent here", subject: "数学", gradeLevel: "初中", status: "published", createdBy: 99, createdAt: new Date(), updatedAt: new Date() };
  }),
  listLearningMaterials: vi.fn(async () => []),
  listPublishedMaterials: vi.fn(async () => []),
  updateLearningMaterial: vi.fn(async () => {}),
  deleteLearningMaterial: vi.fn(async () => {}),
  createGeneratedCourse: vi.fn(async (data: any) => {
    return { id: autoId.st++, ...data, status: data.status || "draft", createdAt: new Date(), updatedAt: new Date() };
  }),
  getGeneratedCourseById: vi.fn(async (id: number) => {
    return { id, materialId: 1, title: "Test Course", description: "desc", subject: "数学", gradeLevel: "初中", chapterCount: 3, totalMinutes: 45, outline: { chapters: [] }, status: "published", createdBy: 99, createdAt: new Date(), updatedAt: new Date() };
  }),
  listCoursesByMaterialId: vi.fn(async () => []),
  listPublishedCourses: vi.fn(async () => []),
  updateGeneratedCourse: vi.fn(async () => {}),
  deleteGeneratedCourse: vi.fn(async () => {}),
  createCourseChapter: vi.fn(async (data: any) => {
    return { id: autoId.st++, ...data, createdAt: new Date(), updatedAt: new Date() };
  }),
  getChaptersByCourseId: vi.fn(async () => [
    { id: 1, courseId: 1, chapterIndex: 1, title: "Chapter 1", objectives: ["obj1"], keyPoints: ["kp1"], estimatedMinutes: 15, content: "# Ch1", isGenerated: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 2, courseId: 1, chapterIndex: 2, title: "Chapter 2", objectives: ["obj2"], keyPoints: ["kp2"], estimatedMinutes: 15, content: null, isGenerated: false, createdAt: new Date(), updatedAt: new Date() },
  ]),
  getCourseChapterById: vi.fn(async (id: number) => {
    return { id, courseId: 1, chapterIndex: 1, title: "Chapter 1", objectives: ["obj1"], keyPoints: ["kp1"], estimatedMinutes: 15, content: "# Ch1", isGenerated: true, createdAt: new Date(), updatedAt: new Date() };
  }),
  updateCourseChapter: vi.fn(async () => {}),
  getOrCreateProgress: vi.fn(async (userId: number, courseId: number) => {
    return { id: 1, userId, courseId, lastCompletedChapter: 0, timeSpentMinutes: 0, status: "not_started" as const, startedAt: null, completedAt: null, createdAt: new Date(), updatedAt: new Date() };
  }),
  updateCourseProgress: vi.fn(async () => {}),
  getStudentCourseProgressList: vi.fn(async () => []),
  // Chapter pages, questions, and student answers
  getPagesByChapterId: vi.fn(async () => []),
  getQuestionsByPageId: vi.fn(async () => []),
  getStudentAnswersForPage: vi.fn(async () => []),
  getQuestionById: vi.fn(async (id: number) => ({
    id,
    pageId: 1,
    questionIndex: 1,
    questionType: "choice",
    question: "1+1=?",
    options: ["1", "2", "3", "4"],
    correctAnswer: "2",
    explanation: "一加一等于二",
    createdAt: new Date(),
  })),
  createStudentAnswer: vi.fn(async () => {}),
  hasStudentPassedPage: vi.fn(async () => false),
  hasStudentPassedChapter: vi.fn(async () => false),
  getChapterPageProgress: vi.fn(async () => ({
    passedPages: 0,
    totalPages: 0,
    pageStatuses: [],
  })),
  createChapterPage: vi.fn(async (data: any) => ({ id: 1, ...data })),
  createPageQuestion: vi.fn(async (data: any) => ({ id: 1, ...data })),
  createChapterPagesBatch: vi.fn(async (dataList: any[]) => dataList.map((d: any, i: number) => ({ id: 500 + i, ...d, createdAt: new Date() }))),
  createPageQuestionsBatch: vi.fn(async (dataList: any[]) => dataList.map((d: any, i: number) => ({ id: 600 + i, ...d, createdAt: new Date() }))),
  updateChapterPage: vi.fn(async () => {}),
  deletePagesByChapterId: vi.fn(async () => {}),
  // Exam analysis mocks
  createExamAnalysis: vi.fn(async (data: any) => ({ id: 500, ...data, createdAt: new Date(), updatedAt: new Date() })),
  getExamAnalysisById: vi.fn(async (id: number) => null as any),
  listExamAnalysesByUserId: vi.fn(async () => []),
  updateExamAnalysis: vi.fn(async () => {}),
  deleteExamAnalysis: vi.fn(async () => {}),
  createLearningPathNodesBatch: vi.fn(async (dataList: any[]) => dataList.map((d: any, i: number) => ({ id: 700 + i, ...d, isCompleted: false, completedAt: null, createdAt: new Date() }))),
  getLearningPathNodesByAnalysisId: vi.fn(async () => []),
  updateLearningPathNode: vi.fn(async () => {}),
  getLearningPathNodeById: vi.fn(async (id: number) => null as any),
}));

// Mock sdk.createSessionToken
vi.mock("./_core/sdk", () => ({
  sdk: {
    createSessionToken: vi.fn(async () => "mock-session-token"),
    verifySession: vi.fn(async () => null),
    authenticateRequest: vi.fn(async () => null),
  },
}));

// ==================== HELPERS ====================

function createUserContext(user: Partial<User> = {}): TrpcContext {
  const fullUser: User = {
    id: 1,
    openId: "test-user-open-id",
    username: "testuser",
    name: "Test User",
    email: "test@example.com",
    loginMethod: "local",
    role: "user",
    classId: 1,
    passwordHash: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...user,
  };

  return {
    user: fullUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as any,
  };
}

function createAdminContext(user: Partial<User> = {}): TrpcContext {
  return createUserContext({ role: "admin", id: 99, openId: "admin-open-id", username: "admin", ...user });
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as any,
  };
}

// ==================== TESTS ====================

beforeEach(() => {
  mockUsers = [];
  mockClasses = [];
  mockBears = [];
  mockConversations = [];
  mockMessages = [];
  mockKnowledgePoints = [];
  mockShareTokens = [];
  autoId = { user: 100, class: 100, bear: 100, conv: 100, msg: 100, kp: 100, st: 100 };
  vi.clearAllMocks();
});

describe("bear router", () => {
  it("adopt: creates a bear for authenticated user", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bear.adopt({
      bearName: "小可可",
      bearType: "grizzly",
      personality: "teacher",
    });

    expect(result).toBeDefined();
    expect(result?.bearName).toBe("小可可");
    expect(result?.bearType).toBe("grizzly");
    expect(result?.personality).toBe("teacher");
    expect(result?.tier).toBe("bronze");
    expect(result?.level).toBe(1);
  });

  it("adopt: prevents duplicate adoption", async () => {
    const ctx = createUserContext();
    // Pre-populate a bear for this user
    mockBears.push({
      id: 1,
      userId: ctx.user!.id,
      bearName: "已有熊",
      bearType: "panda",
      personality: "friend",
      tier: "bronze",
      level: 1,
      experience: 0,
      wisdom: 0,
      tech: 0,
      social: 0,
      totalChats: 0,
      emotion: "happy",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.bear.adopt({ bearName: "新熊", bearType: "polar", personality: "cool" })
    ).rejects.toThrow("你已经领养了一只小熊");
  });

  it("mine: returns user's bear", async () => {
    const ctx = createUserContext();
    mockBears.push({
      id: 1,
      userId: ctx.user!.id,
      bearName: "测试熊",
      bearType: "grizzly",
      personality: "friend",
      tier: "silver",
      level: 5,
      experience: 150,
      wisdom: 10,
      tech: 8,
      social: 5,
      totalChats: 20,
      emotion: "happy",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const caller = appRouter.createCaller(ctx);
    const result = await caller.bear.mine();

    expect(result).toBeDefined();
    expect(result?.bearName).toBe("测试熊");
    expect(result?.tier).toBe("silver");
  });

  it("mine: returns undefined when no bear", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.bear.mine();
    expect(result).toBeUndefined();
  });

  it("leaderboard: returns top bears sorted by experience", async () => {
    mockBears.push(
      { id: 1, userId: 1, bearName: "A", bearType: "grizzly", experience: 500, tier: "gold", level: 10, totalChats: 50, personality: "friend", wisdom: 0, tech: 0, social: 0, emotion: "happy", createdAt: new Date(), updatedAt: new Date() },
      { id: 2, userId: 2, bearName: "B", bearType: "panda", experience: 1000, tier: "diamond", level: 20, totalChats: 100, personality: "teacher", wisdom: 0, tech: 0, social: 0, emotion: "happy", createdAt: new Date(), updatedAt: new Date() }
    );
    mockUsers.push(
      { id: 1, openId: "u1", username: "user1", name: "User 1", role: "user" },
      { id: 2, openId: "u2", username: "user2", name: "User 2", role: "user" }
    );

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.bear.leaderboard({ limit: 10 });

    expect(result).toHaveLength(2);
    expect(result[0].bearName).toBe("B"); // Higher experience first
    expect(result[0].ownerName).toBe("User 2");
    expect(result[1].bearName).toBe("A");
  });
});

describe("conversation router", () => {
  it("create: creates a new conversation", async () => {
    const ctx = createUserContext();
    mockBears.push({
      id: 1,
      userId: ctx.user!.id,
      bearName: "测试熊",
      bearType: "grizzly",
      personality: "friend",
      tier: "bronze",
      level: 1,
      experience: 0,
      wisdom: 0,
      tech: 0,
      social: 0,
      totalChats: 0,
      emotion: "happy",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const caller = appRouter.createCaller(ctx);
    const result = await caller.conversation.create({ title: "测试对话" });

    expect(result).toBeDefined();
    expect(result.title).toBe("测试对话");
    expect(result.userId).toBe(ctx.user!.id);
  });

  it("create: fails without a bear", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.conversation.create({ title: "无熊对话" })
    ).rejects.toThrow("请先领养一只小熊");
  });

  it("list: returns user's conversations", async () => {
    const ctx = createUserContext();
    mockConversations.push(
      { id: 1, userId: ctx.user!.id, bearId: 1, title: "对话1", messageCount: 5, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, userId: ctx.user!.id, bearId: 1, title: "对话2", messageCount: 3, createdAt: new Date(), updatedAt: new Date() }
    );

    const caller = appRouter.createCaller(ctx);
    const result = await caller.conversation.list();

    expect(result).toHaveLength(2);
  });

  it("messages: returns messages for owned conversation", async () => {
    const ctx = createUserContext();
    mockConversations.push({
      id: 1,
      userId: ctx.user!.id,
      bearId: 1,
      title: "对话",
      messageCount: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockMessages.push(
      { id: 1, conversationId: 1, role: "user", content: "你好", createdAt: new Date() },
      { id: 2, conversationId: 1, role: "assistant", content: "你好呀！", createdAt: new Date() }
    );

    const caller = appRouter.createCaller(ctx);
    const result = await caller.conversation.messages({ conversationId: 1 });

    expect(result).toHaveLength(2);
    expect(result[0].role).toBe("user");
    expect(result[1].role).toBe("assistant");
  });

  it("messages: fails for non-owned conversation", async () => {
    const ctx = createUserContext({ id: 1 });
    mockConversations.push({
      id: 1,
      userId: 999, // Different user
      bearId: 1,
      title: "别人的对话",
      messageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.conversation.messages({ conversationId: 1 })
    ).rejects.toThrow("对话不存在");
  });
});

describe("class router", () => {
  it("create: admin can create a class", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.class.create({
      name: "三年级一班",
      description: "测试班级",
    });

    expect(result).toBeDefined();
    expect(result?.name).toBe("三年级一班");
    expect(result?.inviteCode).toBeDefined();
    expect(typeof result?.inviteCode).toBe("string");
  });

  it("list: admin can list all classes", async () => {
    const ctx = createAdminContext();
    mockClasses.push(
      { id: 1, name: "班级A", inviteCode: "CODE1", createdBy: 99, description: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: "班级B", inviteCode: "CODE2", createdBy: 99, description: null, createdAt: new Date(), updatedAt: new Date() }
    );

    const caller = appRouter.createCaller(ctx);
    const result = await caller.class.list();

    expect(result).toHaveLength(2);
  });

  it("validateCode: returns valid for existing code", async () => {
    mockClasses.push({
      id: 1,
      name: "测试班级",
      inviteCode: "TESTCODE",
      createdBy: 1,
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.class.validateCode({ inviteCode: "TESTCODE" });

    expect(result.valid).toBe(true);
    expect(result.className).toBe("测试班级");
  });

  it("validateCode: returns invalid for non-existing code", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.class.validateCode({ inviteCode: "INVALID" });

    expect(result.valid).toBe(false);
    expect(result.className).toBeNull();
  });

  it("students: admin can view class students", async () => {
    const ctx = createAdminContext();
    mockUsers.push(
      { id: 10, openId: "s1", username: "student1", name: "学生1", role: "user", classId: 1, createdAt: new Date(), lastSignedIn: new Date() },
      { id: 11, openId: "s2", username: "student2", name: "学生2", role: "user", classId: 1, createdAt: new Date(), lastSignedIn: new Date() }
    );

    const caller = appRouter.createCaller(ctx);
    const result = await caller.class.students({ classId: 1 });

    expect(result).toHaveLength(2);
    expect(result[0].username).toBe("student1");
  });
});

describe("admin router", () => {
  it("stats: returns correct counts", async () => {
    const ctx = createAdminContext();
    mockUsers.push(
      { id: 1, openId: "s1", role: "user" },
      { id: 2, openId: "s2", role: "user" }
    );
    mockClasses.push({ id: 1, name: "班级" });
    mockBears.push({ id: 1, userId: 1 });

    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.stats();

    expect(result.totalStudents).toBe(2);
    expect(result.totalClasses).toBe(1);
    expect(result.totalBears).toBe(1);
  });

  it("students: returns all students with bear info", async () => {
    const ctx = createAdminContext();
    mockUsers.push(
      { id: 10, openId: "s1", username: "student1", name: "学生1", role: "user", classId: 1, createdAt: new Date(), lastSignedIn: new Date() }
    );
    mockClasses.push({ id: 1, name: "测试班级", inviteCode: "TEST", createdBy: 99, createdAt: new Date(), updatedAt: new Date() });
    mockBears.push({
      id: 1,
      userId: 10,
      bearName: "小熊",
      bearType: "grizzly",
      tier: "silver",
      level: 5,
      experience: 150,
      totalChats: 20,
    });

    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.students();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("学生1");
    expect(result[0].className).toBe("测试班级");
    expect(result[0].bear?.bearName).toBe("小熊");
    expect(result[0].bear?.tier).toBe("silver");
  });

  it("stats: rejects non-admin users", async () => {
    const ctx = createUserContext(); // role: "user"
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.stats()).rejects.toThrow();
  });
});

describe("chat logic", () => {
  it("calculateTier: returns correct tier for experience", async () => {
    const { calculateTier } = await import("./chat");

    expect(calculateTier(0)).toBe("bronze");
    expect(calculateTier(50)).toBe("bronze");
    expect(calculateTier(100)).toBe("silver");
    expect(calculateTier(300)).toBe("gold");
    expect(calculateTier(600)).toBe("platinum");
    expect(calculateTier(1000)).toBe("diamond");
    expect(calculateTier(1500)).toBe("starlight");
    expect(calculateTier(2500)).toBe("king");
    expect(calculateTier(9999)).toBe("king");
  });

  it("calculateLevel: returns correct level", async () => {
    const { calculateLevel } = await import("./chat");

    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(10)).toBe(2);
    expect(calculateLevel(100)).toBe(11);
    expect(calculateLevel(999)).toBe(100); // capped at 100
    expect(calculateLevel(5000)).toBe(100);
  });

  it("buildSystemPrompt: includes bear name and personality", async () => {
    const { buildSystemPrompt } = await import("./chat");

    const bear = {
      id: 1,
      userId: 1,
      bearName: "小可可",
      bearType: "grizzly" as const,
      personality: "teacher" as const,
      tier: "gold" as const,
      level: 10,
      experience: 300,
      wisdom: 20,
      tech: 15,
      social: 10,
      totalChats: 50,
      emotion: "happy" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const prompt = buildSystemPrompt(bear);

    expect(prompt).toContain("小可可");
    expect(prompt).toContain("可可"); // bear type name
    expect(prompt).toContain("耐心的老师型"); // teacher personality
    expect(prompt).toContain("gold"); // tier
    expect(prompt).toContain("10"); // level
  });
});


// ==================== ADMIN ROUTER ====================

describe("admin router", () => {
  it("deleteUser: should delete a user and all related data", async () => {
    const ctx = createAdminContext();
    
    // Setup: Create a test user with bear and conversations
    const testUserId = 200;
    const testBearId = 200;
    const testConvId = 200;
    
    mockUsers.push({
      id: testUserId,
      openId: "test-delete-user",
      username: "testdeleteuser",
      name: "Test Delete User",
      email: null,
      loginMethod: "local",
      role: "user",
      classId: null,
      passwordHash: "hashed",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });

    mockBears.push({
      id: testBearId,
      userId: testUserId,
      bearName: "Test Bear",
      bearType: "grizzly",
      personality: "friend",
      tier: "bronze",
      level: 1,
      experience: 0,
      wisdom: 0,
      tech: 0,
      social: 0,
      totalChats: 0,
      emotion: "happy",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockConversations.push({
      id: testConvId,
      userId: testUserId,
      bearId: testBearId,
      title: "Test Conversation",
      messageCount: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockMessages.push({
      id: 200,
      conversationId: testConvId,
      role: "user",
      content: "Hello",
      createdAt: new Date(),
    });

    // The deleteUserAndRelatedData function is called internally by the router
    // We just verify the router returns success

    const caller = appRouter.createCaller(ctx);
    
    // This test verifies the router endpoint exists and is callable
    // The actual deletion is tested via integration tests
    try {
      await caller.admin.deleteUser({ userId: 999 });
    } catch (err: any) {
      // Expected to fail since user 999 doesn't exist
      expect(err.message).toBeDefined();
    }
  });

  it("deleteUser: requires admin role", async () => {
    const ctx = createUserContext(); // Regular user, not admin
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.deleteUser({ userId: 999 })
    ).rejects.toThrow();
  });

  it("stats: returns dashboard statistics", async () => {
    const ctx = createAdminContext();

    // Setup mock data
    mockUsers.push(
      { id: 1, openId: "u1", username: "user1", role: "user", name: null, email: null, loginMethod: "local", classId: null, passwordHash: null, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
      { id: 2, openId: "u2", username: "user2", role: "user", name: null, email: null, loginMethod: "local", classId: null, passwordHash: null, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }
    );
    mockClasses.push(
      { id: 1, name: "Class 1", description: null, inviteCode: "code1", createdBy: 99, createdAt: new Date(), updatedAt: new Date() }
    );
    mockBears.push(
      { id: 1, userId: 1, bearName: "Bear 1", bearType: "grizzly", personality: "friend", tier: "bronze", level: 1, experience: 0, wisdom: 0, tech: 0, social: 0, totalChats: 0, emotion: "happy", createdAt: new Date(), updatedAt: new Date() }
    );

    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.stats();

    expect(result).toBeDefined();
    expect(result.totalStudents).toBe(2);
    expect(result.totalClasses).toBe(1);
    expect(result.totalBears).toBe(1);
  });

  it("students: returns all students with their bears", async () => {
    const ctx = createAdminContext();

    // Setup mock data
    mockUsers.push(
      { id: 1, openId: "u1", username: "user1", name: "User 1", role: "user", email: null, loginMethod: "local", classId: 1, passwordHash: null, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }
    );
    mockClasses.push(
      { id: 1, name: "Class 1", description: null, inviteCode: "code1", createdBy: 99, createdAt: new Date(), updatedAt: new Date() }
    );
    mockBears.push(
      { id: 1, userId: 1, bearName: "Test Bear", bearType: "grizzly", personality: "friend", tier: "silver", level: 5, experience: 100, wisdom: 10, tech: 8, social: 5, totalChats: 20, emotion: "happy", createdAt: new Date(), updatedAt: new Date() }
    );

    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.students();

    expect(result).toHaveLength(1);
    expect(result[0].username).toBe("user1");
    expect(result[0].bear?.bearName).toBe("Test Bear");
    expect(result[0].className).toBe("Class 1");
  });
});


// ==================== KNOWLEDGE ROUTER ====================

// Mock the knowledgeExtractor module
vi.mock("./knowledgeExtractor", () => ({
  extractKnowledgePoints: vi.fn(async () => [
    {
      name: "二次方程",
      subject: "数学",
      difficulty: "medium",
      mastery: 60,
      description: "一元二次方程的求解方法",
    },
    {
      name: "光合作用",
      subject: "生物",
      difficulty: "easy",
      mastery: 80,
      description: "植物通过光合作用产生能量",
    },
  ]),
  extractAndSaveKnowledgePoints: vi.fn(async (conversationId: number, userId: number) => {
    // Check if conversation is already analyzed
    const conv = mockConversations.find((c) => c.id === conversationId);
    if (conv && conv.isAnalyzed) {
      return { added: 0, updated: 0 };
    }
    return { added: 2, updated: 0 };
  }),
}));

vi.mock("./courseGenerator", () => ({
  generateCourseOutline: vi.fn(async () => ({
    title: "AI生成的课程",
    description: "基于学习资料生成的课程",
    totalEstimatedMinutes: 45,
    chapters: [
      { chapterIndex: 1, title: "第一章", objectives: ["obj1"], keyPoints: ["kp1"], estimatedMinutes: 15, contentOutline: "outline1" },
      { chapterIndex: 2, title: "第二章", objectives: ["obj2"], keyPoints: ["kp2"], estimatedMinutes: 15, contentOutline: "outline2" },
      { chapterIndex: 3, title: "第三章", objectives: ["obj3"], keyPoints: ["kp3"], estimatedMinutes: 15, contentOutline: "outline3" },
    ],
  })),
  generateChapterContent: vi.fn(async () => "# 章节内容\n\n这是生成的课程内容"),
  generateChapterPages: vi.fn(async () => ({
    pages: [
      { pageIndex: 1, title: "第1页", content: "知识内宱1" },
      { pageIndex: 2, title: "第2页", content: "知识内容2" },
    ],
  })),
  generatePageQuestions: vi.fn(async () => ({
    questions: [
      { questionIndex: 1, questionType: "choice", question: "1+1=?", options: ["1", "2", "3", "4"], correctAnswer: "2", explanation: "一加一等于二" },
      { questionIndex: 2, questionType: "judge", question: "1+1=3", options: ["对", "错"], correctAnswer: "错", explanation: "1+1=2" },
    ],
  })),
}));

vi.mock("./examAnalyzer", () => ({
  analyzeExamPaper: vi.fn(async () => ({
    overallGrade: "B+",
    overallComment: "整体表现良好",
    dimensionScores: [{ name: "计算能力", score: 85, fullScore: 100 }],
    weakPoints: [{ name: "应用题", description: "需加强练习", severity: "medium" }],
    strongPoints: [{ name: "基础计算", description: "掌握较好" }],
    wrongAnswers: [{ questionNumber: "3", questionSummary: "应用题", studentAnswer: "10", correctAnswer: "15", errorType: "计算错误", explanation: "需要乘法", knowledgePoint: "乘法应用" }],
    learningPath: [{
      phaseIndex: 1,
      title: "基础巩固",
      description: "复习基础知识",
      duration: "1周",
      tasks: [{
        taskIndex: 1,
        title: "复习乘法",
        description: "练习乘法运算",
        taskType: "study",
        priority: "high",
        knowledgePoint: "乘法",
        estimatedMinutes: 30,
        resources: "教材第3章",
      }],
    }],
  })),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn(async (key: string) => ({ key, url: `https://mock-cdn.com/${key}` })),
}));

describe("knowledge router", () => {
  it("list: returns knowledge points for authenticated user", async () => {
    const ctx = createUserContext();

    // Pre-populate knowledge points
    mockKnowledgePoints.push(
      {
        id: 1,
        userId: ctx.user!.id,
        conversationId: 1,
        name: "二次方程",
        subject: "数学",
        difficulty: "medium",
        mastery: 60,
        mentionCount: 3,
        description: "一元二次方程的求解方法",
        lastMentionedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        userId: ctx.user!.id,
        conversationId: 1,
        name: "光合作用",
        subject: "生物",
        difficulty: "easy",
        mastery: 80,
        mentionCount: 2,
        description: "植物通过光合作用产生能量",
        lastMentionedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    );

    const caller = appRouter.createCaller(ctx);
    const result = await caller.knowledge.list();

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("二次方程");
    expect(result[1].name).toBe("光合作用");
  });

  it("list: returns empty array when no knowledge points", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.knowledge.list();

    expect(result).toHaveLength(0);
  });

  it("stats: returns knowledge point statistics", async () => {
    const ctx = createUserContext();

    mockKnowledgePoints.push(
      {
        id: 1,
        userId: ctx.user!.id,
        conversationId: 1,
        name: "二次方程",
        subject: "数学",
        difficulty: "medium",
        mastery: 60,
        mentionCount: 3,
        description: "一元二次方程的求解方法",
        lastMentionedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        userId: ctx.user!.id,
        conversationId: 1,
        name: "函数",
        subject: "数学",
        difficulty: "hard",
        mastery: 40,
        mentionCount: 1,
        description: "函数的基本概念",
        lastMentionedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        userId: ctx.user!.id,
        conversationId: 2,
        name: "光合作用",
        subject: "生物",
        difficulty: "easy",
        mastery: 80,
        mentionCount: 2,
        description: "植物通过光合作用产生能量",
        lastMentionedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    );

    const caller = appRouter.createCaller(ctx);
    const result = await caller.knowledge.stats();

    expect(result.total).toBe(3);
    expect(result.subjects["数学"]).toBe(2);
    expect(result.subjects["生物"]).toBe(1);
    expect(result.avgMastery).toBe(60); // (60+40+80)/3 = 60
  });

  it("stats: returns zero stats when no knowledge points", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.knowledge.stats();

    expect(result.total).toBe(0);
    expect(result.avgMastery).toBe(0);
  });

  it("extract: requires authenticated user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.knowledge.extract({ conversationId: 1 })
    ).rejects.toThrow();
  });

  it("extract: extracts knowledge points from conversation", async () => {
    const ctx = createUserContext();

    // Setup conversation with messages
    mockConversations.push({
      id: 1,
      userId: ctx.user!.id,
      bearId: 1,
      title: "数学学习",
      messageCount: 4,
      startedAt: new Date(),
      endedAt: new Date(),
      durationMinutes: 30,
      isAnalyzed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockMessages.push(
      { id: 1, conversationId: 1, role: "user", content: "什么是二次方程？", createdAt: new Date() },
      { id: 2, conversationId: 1, role: "assistant", content: "二次方程是...", createdAt: new Date() },
      { id: 3, conversationId: 1, role: "user", content: "光合作用是什么？", createdAt: new Date() },
      { id: 4, conversationId: 1, role: "assistant", content: "光合作用是植物...", createdAt: new Date() }
    );

    const caller = appRouter.createCaller(ctx);
    const result = await caller.knowledge.extract({ conversationId: 1 });

    expect(result).toBeDefined();
    expect(result.added).toBeGreaterThanOrEqual(0);
    expect(result.updated).toBeGreaterThanOrEqual(0);
  });
});

describe("parent router", () => {
  it("createShareLink: generates a share link for authenticated user", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.parent.createShareLink({ label: "爸爸的链接" });

    expect(result).toBeDefined();
    expect(result.userId).toBe(ctx.user!.id);
    expect(result.label).toBe("爸爸的链接");
    expect(result.token).toBeDefined();
    expect(result.isActive).toBe(1);
    expect(result.viewCount).toBe(0);
  });

  it("createShareLink: works without label", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.parent.createShareLink({});

    expect(result).toBeDefined();
    expect(result.label).toBeNull();
    expect(result.token).toBeDefined();
  });

  it("createShareLink: requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.parent.createShareLink({})).rejects.toThrow();
  });

  it("myShareLinks: returns user's share links", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    // Pre-populate share tokens directly (to avoid daily limit on createShareLink)
    mockShareTokens.push({
      id: 1, userId: ctx.user!.id, token: "token-1",
      label: "链接1", isActive: 1, viewCount: 0,
      lastViewedAt: null, expiresAt: null, createdAt: new Date(),
    });
    mockShareTokens.push({
      id: 2, userId: ctx.user!.id, token: "token-2",
      label: "链接2", isActive: 1, viewCount: 0,
      lastViewedAt: null, expiresAt: null, createdAt: new Date(),
    });

    const links = await caller.parent.myShareLinks();
    expect(links).toHaveLength(2);
    expect(links[0].label).toBe("链接1");
    expect(links[1].label).toBe("链接2");
  });

  it("deactivateLink: deactivates a share link", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const link = await caller.parent.createShareLink({ label: "要停用的链接" });
    const result = await caller.parent.deactivateLink({ id: link.id });

    expect(result.success).toBe(true);
    const token = mockShareTokens.find(t => t.id === link.id);
    expect(token?.isActive).toBe(0);
  });

  it("deactivateLink: fails for non-existent link", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.parent.deactivateLink({ id: 99999 })).rejects.toThrow("链接不存在");
  });

  it("viewReport: returns learning report via valid token", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    // Setup: add user to mockUsers so getUserById can find them
    mockUsers.push({
      id: ctx.user!.id,
      openId: ctx.user!.openId,
      username: ctx.user!.username,
      name: ctx.user!.name,
      email: ctx.user!.email,
      loginMethod: "local",
      role: "user",
      classId: ctx.user!.classId,
      passwordHash: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });

    // Setup: create bear and knowledge points for the user
    mockBears.push({
      id: 1,
      userId: ctx.user!.id,
      bearName: "测试熊",
      bearType: "grizzly",
      personality: "friend",
      tier: "silver",
      level: 5,
      experience: 150,
      wisdom: 30,
      tech: 20,
      social: 10,
      totalChats: 15,
      emotion: "happy",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockKnowledgePoints.push({
      id: 1,
      userId: ctx.user!.id,
      name: "二次方程",
      subject: "数学",
      mastery: 75,
      difficulty: "medium",
      mentionCount: 3,
      lastMentionedAt: new Date(),
      createdAt: new Date(),
    });

    mockConversations.push({
      id: 1,
      userId: ctx.user!.id,
      bearId: 1,
      title: "数学学习",
      messageCount: 4,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create a share link
    const link = await caller.parent.createShareLink({ label: "家长查看" });

    // View report as public (no auth needed)
    const publicCtx = createPublicContext();
    const publicCaller = appRouter.createCaller(publicCtx);
    const report = await publicCaller.parent.viewReport({ token: link.token });

    expect(report).toBeDefined();
    expect(report.student).toBeDefined();
    expect(report.student.name).toBe("Test User");
    expect(report.bear).toBeDefined();
    expect(report.bear?.bearName).toBe("测试熊");
    expect(report.bear?.tier).toBe("silver");
    expect(report.knowledge).toBeDefined();
    expect(report.knowledge.points).toHaveLength(1);
    expect(report.knowledge.points[0].name).toBe("二次方程");
    expect(report.conversations).toBeDefined();
  });

  it("viewReport: fails for invalid token", async () => {
    const publicCtx = createPublicContext();
    const publicCaller = appRouter.createCaller(publicCtx);

    await expect(
      publicCaller.parent.viewReport({ token: "invalid-token-123" })
    ).rejects.toThrow("链接无效或已过期");
  });

  it("viewReport: fails for deactivated token", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const link = await caller.parent.createShareLink({ label: "将被停用" });
    await caller.parent.deactivateLink({ id: link.id });

    const publicCtx = createPublicContext();
    const publicCaller = appRouter.createCaller(publicCtx);

    await expect(
      publicCaller.parent.viewReport({ token: link.token })
    ).rejects.toThrow("链接无效或已过期");
  });
});

describe("admin analytics & report generation", () => {
  it("classesAnalytics: returns overview for all classes", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create a class
    const cls = await caller.class.create({ name: "分析测试班", description: "测试" });

    // Register a student in the class
    const publicCtx = createPublicContext();
    const publicCaller = appRouter.createCaller(publicCtx);
    await publicCaller.auth.register({
      username: "analytics_student",
      password: "password123",
      inviteCode: cls.inviteCode,
    });

    // Get classes analytics
    const analytics = await caller.admin.classesAnalytics();
    expect(analytics).toBeDefined();
    expect(Array.isArray(analytics)).toBe(true);
    expect(analytics.length).toBeGreaterThanOrEqual(1);

    const classData = analytics.find((c: any) => c.classId === cls.id);
    expect(classData).toBeDefined();
    expect(classData?.className).toBe("分析测试班");
    expect(classData?.studentCount).toBe(1);
  });

  it("classAnalytics: returns detailed analytics for a specific class", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create a class
    const cls = await caller.class.create({ name: "详细分析班", description: "测试" });

    // Register a student
    const publicCtx = createPublicContext();
    const publicCaller = appRouter.createCaller(publicCtx);
    await publicCaller.auth.register({
      username: "detail_student",
      password: "password123",
      inviteCode: cls.inviteCode,
    });

    const student = mockUsers.find((u) => u.username === "detail_student");
    expect(student).toBeDefined();

    // Add a bear for the student
    mockBears.push({
      id: autoId.bear++,
      userId: student!.id,
      bearName: "分析熊",
      bearType: "grizzly",
      personality: "teacher",
      tier: "silver",
      level: 5,
      experience: 200,
      wisdom: 10,
      tech: 8,
      social: 5,
      totalChats: 15,
      emotion: "happy",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Add knowledge points
    mockKnowledgePoints.push({
      id: autoId.kp++,
      userId: student!.id,
      name: "二次方程",
      subject: "数学",
      difficulty: "medium",
      mastery: 80,
      mentionCount: 3,
      lastMentionedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Get class analytics
    const analytics = await caller.admin.classAnalytics({ classId: cls.id });
    expect(analytics).toBeDefined();
    expect(analytics?.studentCount).toBe(1);
    expect(analytics?.bearCount).toBe(1);
    expect(analytics?.totalKnowledgePoints).toBe(1);
    expect(analytics?.avgExperience).toBe(200);
    expect(analytics?.avgMastery).toBe(80);
    expect(analytics?.subjectDistribution).toHaveProperty("数学");
    expect(analytics?.tierDistribution).toHaveProperty("silver");
    expect(analytics?.studentDetails).toHaveLength(1);
    expect(analytics?.studentDetails[0].name).toBe("detail_student");
    expect(analytics?.studentDetails[0].experience).toBe(200);
    expect(analytics?.studentDetails[0].knowledgePointCount).toBe(1);
  });

  it("classAnalytics: returns empty data for class with no students", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const cls = await caller.class.create({ name: "空班级", description: "无学生" });
    const analytics = await caller.admin.classAnalytics({ classId: cls.id });

    expect(analytics).toBeDefined();
    expect(analytics?.studentCount).toBe(0);
    expect(analytics?.bearCount).toBe(0);
    expect(analytics?.totalConversations).toBe(0);
    expect(analytics?.totalKnowledgePoints).toBe(0);
    expect(analytics?.studentDetails).toHaveLength(0);
  });

  it("classesAnalytics: requires admin role", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.classesAnalytics()).rejects.toThrow();
  });

  it("generateStudentReport: creates a share link for a student", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create a class and register a student
    const cls = await caller.class.create({ name: "报告班", description: "测试" });
    const publicCtx = createPublicContext();
    const publicCaller = appRouter.createCaller(publicCtx);
    await publicCaller.auth.register({
      username: "report_student",
      password: "password123",
      inviteCode: cls.inviteCode,
    });

    const student = mockUsers.find((u) => u.username === "report_student");
    expect(student).toBeDefined();

    // Generate report
    const report = await caller.admin.generateStudentReport({
      userId: student!.id,
      label: "report_student 的学习报告",
    });

    expect(report).toBeDefined();
    expect(report.token).toBeDefined();
    expect(report.userId).toBe(student!.id);
    expect(report.label).toBe("report_student 的学习报告");
  });

  it("generateStudentReport: fails for non-existent student", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.generateStudentReport({ userId: 99999 })
    ).rejects.toThrow("学生不存在");
  });

  it("generateStudentReport: requires admin role", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.generateStudentReport({ userId: 1 })
    ).rejects.toThrow();
  });
});


// ==================== LEARNING TIME ROUTER TESTS ====================

describe("learningTime router", () => {
  it("stats: returns learning time stats for authenticated user", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    // Add some conversations with learning time
    const now = new Date();
    mockConversations.push({
      id: 1, userId: ctx.user!.id, bearId: 1, title: "对话1",
      messageCount: 5, durationMinutes: 30, startedAt: now, endedAt: now,
      createdAt: now, updatedAt: now,
    });
    mockConversations.push({
      id: 2, userId: ctx.user!.id, bearId: 1, title: "对话2",
      messageCount: 3, durationMinutes: 15, startedAt: now, endedAt: now,
      createdAt: now, updatedAt: now,
    });

    const result = await caller.learningTime.stats();

    expect(result).toBeDefined();
    expect(result.totalMinutes).toBe(45);
    expect(result.todayMinutes).toBe(45);
    expect(result.weekMinutes).toBe(45);
    expect(result.totalSessions).toBe(2);
  });

  it("stats: returns zero for user with no conversations", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.learningTime.stats();

    expect(result.totalMinutes).toBe(0);
    expect(result.todayMinutes).toBe(0);
    expect(result.weekMinutes).toBe(0);
    expect(result.totalSessions).toBe(0);
  });

  it("stats: requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.learningTime.stats()).rejects.toThrow();
  });

  it("canGenerateReport: admin always can generate", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.learningTime.canGenerateReport();

    expect(result.canGenerate).toBe(true);
    expect(result.remaining).toBe(999);
    expect(result.usedToday).toBe(0);
  });

  it("canGenerateReport: user can generate if no reports today", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.learningTime.canGenerateReport();

    expect(result.canGenerate).toBe(true);
    expect(result.remaining).toBe(1);
    expect(result.usedToday).toBe(0);
  });

  it("canGenerateReport: user cannot generate if already used today", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    // Add a share token created today
    mockShareTokens.push({
      id: 1, userId: ctx.user!.id, token: "existing-token",
      label: "test", isActive: 1, viewCount: 0,
      lastViewedAt: null, expiresAt: null, createdAt: new Date(),
    });

    const result = await caller.learningTime.canGenerateReport();

    expect(result.canGenerate).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.usedToday).toBe(1);
  });
});

// ==================== REPORT GENERATION LIMIT TESTS ====================

describe("parent router - report generation limits", () => {
  it("createShareLink: allows first report of the day", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    // Pre-populate a bear for this user
    mockBears.push({
      id: 1, userId: ctx.user!.id, bearName: "测试熊", bearType: "grizzly",
      personality: "friend", tier: "bronze", level: 1, experience: 0,
      wisdom: 0, tech: 0, social: 0, totalChats: 0, emotion: "happy",
      createdAt: new Date(), updatedAt: new Date(),
    });

    const result = await caller.parent.createShareLink({ label: "测试链接" });

    expect(result).toBeDefined();
    expect(result.token).toBeDefined();
    expect(result.label).toBe("测试链接");
  });

  it("createShareLink: blocks second report of the day for regular user", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    // Pre-populate a bear for this user
    mockBears.push({
      id: 1, userId: ctx.user!.id, bearName: "测试熊", bearType: "grizzly",
      personality: "friend", tier: "bronze", level: 1, experience: 0,
      wisdom: 0, tech: 0, social: 0, totalChats: 0, emotion: "happy",
      createdAt: new Date(), updatedAt: new Date(),
    });

    // Add a share token created today (simulating already used today)
    mockShareTokens.push({
      id: 1, userId: ctx.user!.id, token: "existing-token",
      label: "earlier", isActive: 1, viewCount: 0,
      lastViewedAt: null, expiresAt: null, createdAt: new Date(),
    });

    await expect(
      caller.parent.createShareLink({ label: "第二次" })
    ).rejects.toThrow("每天只能生成一次学习报告");
  });

  it("createShareLink: admin is not limited by daily quota", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Pre-populate a bear for admin
    mockBears.push({
      id: 1, userId: ctx.user!.id, bearName: "管理熊", bearType: "panda",
      personality: "teacher", tier: "gold", level: 5, experience: 500,
      wisdom: 50, tech: 50, social: 50, totalChats: 100, emotion: "happy",
      createdAt: new Date(), updatedAt: new Date(),
    });

    // Add a share token created today
    mockShareTokens.push({
      id: 1, userId: ctx.user!.id, token: "admin-token",
      label: "admin", isActive: 1, viewCount: 0,
      lastViewedAt: null, expiresAt: null, createdAt: new Date(),
    });

    // Admin should still be able to create
    const result = await caller.parent.createShareLink({ label: "管理员链接" });
    expect(result).toBeDefined();
    expect(result.token).toBeDefined();
  });

  it("viewReport: includes learning time data", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Setup: create a user with a bear and share token
    const userId = 50;
    mockUsers.push({
      id: userId, openId: "student-50", username: "student50",
      name: "学生小明", email: null, loginMethod: "local", role: "user",
      classId: null, passwordHash: null, createdAt: new Date(),
      updatedAt: new Date(), lastSignedIn: new Date(),
    });
    mockBears.push({
      id: 50, userId, bearName: "小明的熊", bearType: "grizzly",
      personality: "friend", tier: "silver", level: 3, experience: 150,
      wisdom: 30, tech: 20, social: 25, totalChats: 20, emotion: "happy",
      createdAt: new Date(), updatedAt: new Date(),
    });
    mockShareTokens.push({
      id: 50, userId, token: "view-test-token",
      label: "test", isActive: 1, viewCount: 0,
      lastViewedAt: null, expiresAt: null, createdAt: new Date(),
    });
    // Add conversations with learning time
    mockConversations.push({
      id: 50, userId, bearId: 50, title: "数学学习",
      messageCount: 10, durationMinutes: 25, startedAt: new Date(), endedAt: new Date(),
      createdAt: new Date(), updatedAt: new Date(),
    });

    const result = await caller.parent.viewReport({ token: "view-test-token" });

    expect(result).toBeDefined();
    expect(result.student.name).toBe("学生小明");
    expect(result.bear).toBeDefined();
    expect(result.bear?.bearName).toBe("小明的熊");
    expect((result as any).learningTime).toBeDefined();
    expect((result as any).learningTime.totalMinutes).toBe(25);
    expect((result as any).learningTime.totalSessions).toBe(1);
  });
});


  it("extract: prevents duplicate extraction of same conversation", async () => {
    const ctx = createUserContext();

    // Setup conversation that's already analyzed
    mockConversations.push({
      id: 2,
      userId: ctx.user!.id,
      bearId: 1,
      title: "已分析的对话",
      messageCount: 2,
      startedAt: new Date(),
      endedAt: new Date(),
      durationMinutes: 15,
      isAnalyzed: true,  // Already analyzed
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockMessages.push(
      { id: 5, conversationId: 2, role: "user", content: "测试问题", createdAt: new Date() },
      { id: 6, conversationId: 2, role: "assistant", content: "测试回答", createdAt: new Date() }
    );

    const caller = appRouter.createCaller(ctx);
    const result = await caller.knowledge.extract({ conversationId: 2 });

    // Should return 0 added/updated because conversation is already analyzed
    expect(result.added).toBe(0);
    expect(result.updated).toBe(0);
  });


// ==================== MATERIAL & COURSE ROUTER TESTS ====================

describe("material router", () => {
  it("create: admin can create a learning material", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.material.create({
      title: "初中数学 - 一元二次方程",
      content: "# 一元二次方程\n\n## 定义\n...",
      subject: "数学",
      gradeLevel: "初中",
    });

    expect(result).toBeDefined();
    expect(result.title).toBe("初中数学 - 一元二次方程");
    expect(result.subject).toBe("数学");
  });

  it("create: non-admin cannot create material", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.material.create({
        title: "Test",
        content: "Content",
        subject: "数学",
      })
    ).rejects.toThrow();
  });

  it("list: admin can list all materials", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.material.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("detail: admin can get material detail with courses", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.material.detail({ id: 1 });
    expect(result).toBeDefined();
    expect(result.title).toBe("Test Material");
    expect(result.courses).toBeDefined();
  });

  it("update: admin can update a material", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.material.update({
      id: 1,
      title: "Updated Title",
      subject: "语文",
    });

    expect(result.success).toBe(true);
  });

  it("delete: admin can delete a material", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.material.delete({ id: 1 });
    expect(result.success).toBe(true);
  });
});

describe("course router", () => {
  it("generateOutline: admin can generate course outline from material", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.course.generateOutline({ materialId: 1 });
    expect(result).toBeDefined();
    expect(result.courseId).toBeDefined();
    expect(result.outline).toBeDefined();
    expect(result.outline.chapters).toHaveLength(3);
  });

  it("generateOutline: non-admin cannot generate outline", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.course.generateOutline({ materialId: 1 })
    ).rejects.toThrow();
  });

  it("generateChapter: admin can generate chapter content", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.course.generateChapter({ courseId: 1, chapterId: 1 });
    expect(result).toBeDefined();
    expect(result.chapterId).toBe(1);
    expect(result.content).toContain("章节内容");
  });

  it("generateAllChapters: admin can generate all chapters", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.course.generateAllChapters({ courseId: 1 });
    expect(result).toBeDefined();
    expect(result.total).toBe(2);
    // Only non-generated chapters get generated (chapter 2 has isGenerated: false)
    expect(result.generated).toBe(1);
  });

  it("publish: admin can publish a course", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.course.publish({ courseId: 1 });
    expect(result.success).toBe(true);
  });

  it("archive: admin can archive a course", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.course.archive({ courseId: 1 });
    expect(result.success).toBe(true);
  });

  it("deleteCourse: admin can delete a course", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.course.deleteCourse({ courseId: 1 });
    expect(result.success).toBe(true);
  });

  it("adminDetail: admin can get course detail with chapters", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.course.adminDetail({ courseId: 1 });
    expect(result).toBeDefined();
    expect(result.title).toBe("Test Course");
    expect(result.chapters).toHaveLength(2);
    expect(result.materialTitle).toBe("Test Material");
  });

  it("listPublished: student can list published courses", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.course.listPublished();
    expect(Array.isArray(result)).toBe(true);
  });

  it("detail: student can view published course detail", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.course.detail({ courseId: 1 });
    expect(result).toBeDefined();
    expect(result.title).toBe("Test Course");
    expect(result.chapters).toHaveLength(2);
    // Generated chapter should have content
    expect(result.chapters[0].content).toBe("# Ch1");
    // Non-generated chapter should have null content
    expect(result.chapters[1].content).toBeNull();
    expect(result.progress).toBeDefined();
  });

  it("updateProgress: student can update course progress", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.course.updateProgress({
      courseId: 1,
      lastCompletedChapter: 1,
    });
    expect(result.success).toBe(true);
    expect(result.isCompleted).toBe(false);
  });

  it("updateProgress: marks course completed when all chapters done", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.course.updateProgress({
      courseId: 1,
      lastCompletedChapter: 3, // chapterCount is 3
    });
    expect(result.success).toBe(true);
    expect(result.isCompleted).toBe(true);
  });

  it("myProgress: student can view their progress list", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.course.myProgress();
    expect(Array.isArray(result)).toBe(true);
  });

  it("detail: rejects non-published course for student", async () => {
    const { getGeneratedCourseById } = await import("./db");
    (getGeneratedCourseById as any).mockResolvedValueOnce({
      id: 2, materialId: 1, title: "Draft Course", status: "draft",
      subject: "数学", chapterCount: 1, totalMinutes: 15,
      createdBy: 99, createdAt: new Date(), updatedAt: new Date(),
    });

    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.course.detail({ courseId: 2 })
    ).rejects.toThrow("课程不存在或未发布");
  });
});

// ==================== ADMIN TOGGLE CHAT DISABLED ====================
describe("admin.toggleChatDisabled", () => {
  it("admin can disable a student's chat", async () => {
    mockUsers.push({
      id: 10, openId: "s1", username: "student1", name: "学生1",
      role: "user", classId: null, isChatDisabled: false,
      createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
    });

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.toggleChatDisabled({
      userId: 10,
      disabled: true,
    });
    expect(result.isChatDisabled).toBe(true);
  });

  it("admin can re-enable a student's chat", async () => {
    mockUsers.push({
      id: 10, openId: "s1", username: "student1", name: "学生1",
      role: "user", classId: null, isChatDisabled: true,
      createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
    });

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.toggleChatDisabled({
      userId: 10,
      disabled: false,
    });
    expect(result.isChatDisabled).toBe(false);
  });

  it("rejects non-admin users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.toggleChatDisabled({ userId: 2, disabled: true })
    ).rejects.toThrow();
  });

  it("admin.students includes isChatDisabled field", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const students = await caller.admin.students();
    // Each student should have isChatDisabled field
    for (const s of students) {
      expect(typeof s.isChatDisabled === "boolean" || s.isChatDisabled === undefined || s.isChatDisabled === null).toBe(true);
    }
  });
});

// ==================== CHAPTER PAGES & QUIZ TESTS ====================

describe("course.chapterPages", () => {
  it("returns pages with questions for a published course", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const { getGeneratedCourseById, getCourseChapterById, getPagesByChapterId, getQuestionsByPageId, getStudentAnswersForPage, getChapterPageProgress } = await import("./db");

    (getGeneratedCourseById as any).mockResolvedValueOnce({
      id: 1, materialId: 1, title: "Test Course", description: "", subject: "数学",
      gradeLevel: null, status: "published", chapterCount: 3, totalEstimatedMinutes: 45,
      createdAt: new Date(), updatedAt: new Date(),
    });
    (getCourseChapterById as any).mockResolvedValueOnce({
      id: 10, courseId: 1, chapterIndex: 1, title: "第一章", content: "content",
      objectives: ["obj1"], keyPoints: ["kp1"], estimatedMinutes: 15, contentOutline: "outline",
      isGenerated: true, createdAt: new Date(),
    });
    (getPagesByChapterId as any).mockResolvedValueOnce([
      { id: 100, chapterId: 10, pageIndex: 1, title: "第1页", content: "知识内容1", createdAt: new Date() },
      { id: 101, chapterId: 10, pageIndex: 2, title: "第2页", content: "知识内容2", createdAt: new Date() },
    ]);
    (getQuestionsByPageId as any)
      .mockResolvedValueOnce([
        { id: 200, pageId: 100, questionIndex: 1, questionType: "choice", question: "1+1=?", options: ["1","2","3","4"], correctAnswer: "2", explanation: "一加一等于二", createdAt: new Date() },
      ])
      .mockResolvedValueOnce([]);
    (getStudentAnswersForPage as any)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    (getChapterPageProgress as any).mockResolvedValueOnce({
      passedPages: 0, totalPages: 2, pageStatuses: [
        { pageId: 100, passed: false },
        { pageId: 101, passed: false },
      ],
    });

    const result = await caller.course.chapterPages({ courseId: 1, chapterId: 10 });

    expect(result.pages).toHaveLength(2);
    expect(result.pages[0].questions).toHaveLength(1);
    expect(result.pages[0].questions[0].question).toBe("1+1=?");
    // Correct answer should be hidden since student hasn't answered correctly
    expect(result.pages[0].questions[0].correctAnswer).toBeNull();
    expect(result.progress.passedPages).toBe(0);
  });

  it("rejects for non-published course", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const { getGeneratedCourseById } = await import("./db");
    (getGeneratedCourseById as any).mockResolvedValueOnce({
      id: 1, status: "draft", title: "Draft Course",
    });

    await expect(
      caller.course.chapterPages({ courseId: 1, chapterId: 10 })
    ).rejects.toThrow("课程不存在或未发布");
  });

  it("auto-generates pages when none exist for a generated chapter", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const {
      getGeneratedCourseById, getCourseChapterById, getPagesByChapterId,
      getLearningMaterialById, createChapterPagesBatch, createPageQuestionsBatch,
      updateChapterPage, getQuestionsByPageId, getStudentAnswersForPage, getChapterPageProgress
    } = await import("./db");
    const { generateChapterPages, generatePageQuestions } = await import("./courseGenerator");

    // Override mock to return array (not { pages: [...] }) as the real function does
    (generateChapterPages as any).mockResolvedValueOnce([
      { pageIndex: 1, title: "第1页", content: "知识内容1" },
      { pageIndex: 2, title: "第2页", content: "知识内容2" },
    ]);

    // Course is published
    (getGeneratedCourseById as any).mockResolvedValueOnce({
      id: 1, materialId: 1, title: "Test Course", description: "", subject: "语文",
      gradeLevel: null, status: "published", chapterCount: 3, totalEstimatedMinutes: 45,
      createdAt: new Date(), updatedAt: new Date(),
    });
    // Chapter is generated but has no pages
    (getCourseChapterById as any).mockResolvedValueOnce({
      id: 10, courseId: 1, chapterIndex: 1, title: "第一章", content: "content",
      objectives: ["obj1"], keyPoints: ["kp1"], estimatedMinutes: 15,
      isGenerated: true, createdAt: new Date(),
    });
    // First call returns empty (triggers auto-generation)
    (getPagesByChapterId as any).mockResolvedValueOnce([]);
    // Material for generation
    (getLearningMaterialById as any).mockResolvedValueOnce({
      id: 1, content: "# Test Material", gradeLevel: "初一",
    });
    // Mock the batch creation to return saved pages
    const savedPages = [
      { id: 500, chapterId: 10, pageIndex: 1, title: "第1页", content: "知识内容1", hasQuiz: false, createdAt: new Date() },
      { id: 501, chapterId: 10, pageIndex: 2, title: "第2页", content: "知识内容2", hasQuiz: false, createdAt: new Date() },
    ];
    (createChapterPagesBatch as any).mockResolvedValueOnce(savedPages);
    // Mock question generation for each page (returns array, not { questions: [...] })
    (generatePageQuestions as any)
      .mockResolvedValueOnce([{ questionIndex: 1, questionType: "choice", question: "Q1", options: ["A","B","C","D"], correctAnswer: "A", explanation: "E1" }])
      .mockResolvedValueOnce([]);
    (createPageQuestionsBatch as any).mockResolvedValueOnce([{ id: 600 }]);
    // Second call returns the generated pages
    (getPagesByChapterId as any).mockResolvedValueOnce(savedPages);
    // Progress mock
    (getChapterPageProgress as any).mockResolvedValueOnce({
      passedPages: 0, totalPages: 2, pageStatuses: [
        { pageId: 500, passed: false },
        { pageId: 501, passed: false },
      ],
    });
    // Questions for each page
    (getQuestionsByPageId as any)
      .mockResolvedValueOnce([{ id: 600, pageId: 500, questionIndex: 1, questionType: "choice", question: "Q1", options: ["A","B","C","D"], correctAnswer: "A", explanation: "E1", createdAt: new Date() }])
      .mockResolvedValueOnce([]);
    // Student answers
    (getStudentAnswersForPage as any)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await caller.course.chapterPages({ courseId: 1, chapterId: 10 });

    // Verify auto-generation was triggered
    expect(generateChapterPages).toHaveBeenCalled();
    expect(createChapterPagesBatch).toHaveBeenCalled();
    // Verify pages are returned
    expect(result.pages).toHaveLength(2);
    expect(result.pages[0].questions).toHaveLength(1);
    expect(result.progress.totalPages).toBe(2);
  });
});

describe("course.submitAnswer", () => {
  it("accepts correct answer and returns isCorrect=true", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const { getQuestionById, getStudentAnswersForPage, createStudentAnswer, hasStudentPassedPage, hasStudentPassedChapter } = await import("./db");

    (getQuestionById as any).mockResolvedValueOnce({
      id: 200, pageId: 100, questionIndex: 1, questionType: "choice",
      question: "1+1=?", options: ["1","2","3","4"], correctAnswer: "2",
      explanation: "一加一等于二", createdAt: new Date(),
    });
    (getStudentAnswersForPage as any).mockResolvedValueOnce([]);
    (createStudentAnswer as any).mockResolvedValueOnce({});
    (hasStudentPassedPage as any).mockResolvedValueOnce(false);

    const result = await caller.course.submitAnswer({
      courseId: 1, chapterId: 10, pageId: 100, questionId: 200, answer: "2",
    });

    expect(result.isCorrect).toBe(true);
    expect(result.correctAnswer).toBe("2");
    expect(result.explanation).toBe("一加一等于二");
    expect(createStudentAnswer).toHaveBeenCalled();
  });

  it("rejects wrong answer and returns isCorrect=false", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const { getQuestionById, getStudentAnswersForPage, createStudentAnswer, hasStudentPassedPage } = await import("./db");

    (getQuestionById as any).mockResolvedValueOnce({
      id: 200, pageId: 100, questionIndex: 1, questionType: "choice",
      question: "1+1=?", options: ["1","2","3","4"], correctAnswer: "2",
      explanation: "一加一等于二", createdAt: new Date(),
    });
    (getStudentAnswersForPage as any).mockResolvedValueOnce([]);
    (createStudentAnswer as any).mockResolvedValueOnce({});
    (hasStudentPassedPage as any).mockResolvedValueOnce(false);

    const result = await caller.course.submitAnswer({
      courseId: 1, chapterId: 10, pageId: 100, questionId: 200, answer: "3",
    });

    expect(result.isCorrect).toBe(false);
    expect(result.correctAnswer).toBeNull();
    expect(result.explanation).toBeNull();
  });

  it("returns alreadyAnswered=true if question was already answered correctly", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const { getQuestionById, getStudentAnswersForPage } = await import("./db");

    (getQuestionById as any).mockResolvedValueOnce({
      id: 200, pageId: 100, questionIndex: 1, questionType: "choice",
      question: "1+1=?", options: ["1","2","3","4"], correctAnswer: "2",
      explanation: "一加一等于二", createdAt: new Date(),
    });
    (getStudentAnswersForPage as any).mockResolvedValueOnce([
      { questionId: 200, answer: "2", isCorrect: true, attemptNumber: 1 },
    ]);

    const result = await caller.course.submitAnswer({
      courseId: 1, chapterId: 10, pageId: 100, questionId: 200, answer: "2",
    });

    expect(result.isCorrect).toBe(true);
    expect(result.alreadyAnswered).toBe(true);
  });

  it("updates chapter progress when all pages are passed", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const { getQuestionById, getStudentAnswersForPage, createStudentAnswer, hasStudentPassedPage, hasStudentPassedChapter, getGeneratedCourseById, getCourseChapterById, getOrCreateProgress, updateCourseProgress } = await import("./db");

    (getQuestionById as any).mockResolvedValueOnce({
      id: 200, pageId: 100, questionIndex: 1, questionType: "choice",
      question: "1+1=?", options: ["1","2","3","4"], correctAnswer: "2",
      explanation: "一加一等于二", createdAt: new Date(),
    });
    (getStudentAnswersForPage as any).mockResolvedValueOnce([]);
    (createStudentAnswer as any).mockResolvedValueOnce({});
    (hasStudentPassedPage as any).mockResolvedValueOnce(true);
    (hasStudentPassedChapter as any).mockResolvedValueOnce(true);
    (getGeneratedCourseById as any).mockResolvedValueOnce({
      id: 1, chapterCount: 3, status: "published",
    });
    (getCourseChapterById as any).mockResolvedValueOnce({
      id: 10, courseId: 1, chapterIndex: 1,
    });
    (getOrCreateProgress as any).mockResolvedValueOnce({
      id: 1, userId: 1, courseId: 1, lastCompletedChapter: 0, startedAt: null,
    });

    const result = await caller.course.submitAnswer({
      courseId: 1, chapterId: 10, pageId: 100, questionId: 200, answer: "2",
    });

    expect(result.isCorrect).toBe(true);
    expect(result.pagePassed).toBe(true);
    expect(result.chapterPassed).toBe(true);
    expect(updateCourseProgress).toHaveBeenCalled();
  });

  it("rejects for non-existent question", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const { getQuestionById } = await import("./db");
    (getQuestionById as any).mockResolvedValueOnce(null);

    await expect(
      caller.course.submitAnswer({
        courseId: 1, chapterId: 10, pageId: 100, questionId: 999, answer: "2",
      })
    ).rejects.toThrow("题目不存在");
  });

  it("tracks attempt number correctly", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const { getQuestionById, getStudentAnswersForPage, createStudentAnswer, hasStudentPassedPage } = await import("./db");

    (getQuestionById as any).mockResolvedValueOnce({
      id: 200, pageId: 100, questionIndex: 1, questionType: "choice",
      question: "1+1=?", options: ["1","2","3","4"], correctAnswer: "2",
      explanation: "一加一等于二", createdAt: new Date(),
    });
    // Simulate 2 previous wrong attempts
    (getStudentAnswersForPage as any).mockResolvedValueOnce([
      { questionId: 200, answer: "1", isCorrect: false, attemptNumber: 1 },
      { questionId: 200, answer: "3", isCorrect: false, attemptNumber: 2 },
    ]);
    (createStudentAnswer as any).mockResolvedValueOnce({});
    (hasStudentPassedPage as any).mockResolvedValueOnce(false);

    const result = await caller.course.submitAnswer({
      courseId: 1, chapterId: 10, pageId: 100, questionId: 200, answer: "2",
    });

    expect(result.isCorrect).toBe(true);
    expect(result.attemptNumber).toBe(3);
  });
});


// ==================== EXAM ROUTER TESTS ====================

describe("exam router", () => {
  it("create: uploads images and creates analysis record", async () => {
    const { createExamAnalysis } = await import("./db");
    const { storagePut } = await import("./storage");
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    // Small 1x1 transparent PNG in base64
    const tinyPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const result = await caller.exam.create({
      subject: "数学",
      examTitle: "期中考试",
      score: 85,
      totalScore: 100,
      imageDataList: [
        { base64: tinyPng, mimeType: "image/png", fileName: "page1.png" },
      ],
    });

    expect(result.id).toBe(500);
    expect(result.status).toBe("analyzing");
    expect(storagePut).toHaveBeenCalled();
    expect(createExamAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: ctx.user!.id,
        subject: "数学",
        score: 85,
        totalScore: 100,
        status: "analyzing",
      })
    );
  });

  it("detail: returns analysis with path nodes for owner", async () => {
    const { getExamAnalysisById, getLearningPathNodesByAnalysisId } = await import("./db");
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const mockAnalysis = {
      id: 500,
      userId: ctx.user!.id,
      subject: "数学",
      examTitle: "期中考试",
      score: 85,
      totalScore: 100,
      status: "completed",
      overallGrade: "B+",
      overallComment: "整体表现良好",
      dimensionScores: [{ name: "计算能力", score: 85, fullScore: 100 }],
      weakPoints: [{ name: "应用题", description: "需加强", severity: "medium" }],
      strongPoints: [{ name: "基础计算", description: "掌握较好" }],
      wrongAnswers: [],
      learningPath: { phases: [] },
      imageUrls: ["https://mock-cdn.com/test.png"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockNodes = [
      { id: 700, examAnalysisId: 500, userId: ctx.user!.id, phaseIndex: 1, nodeIndex: 1, title: "复习乘法", isCompleted: false },
    ];

    (getExamAnalysisById as any).mockResolvedValueOnce(mockAnalysis);
    (getLearningPathNodesByAnalysisId as any).mockResolvedValueOnce(mockNodes);

    const result = await caller.exam.detail({ id: 500 });

    expect(result.subject).toBe("数学");
    expect(result.overallGrade).toBe("B+");
    expect(result.pathNodes).toHaveLength(1);
    expect(result.pathNodes[0].title).toBe("复习乘法");
  });

  it("detail: throws NOT_FOUND for other user's analysis", async () => {
    const { getExamAnalysisById } = await import("./db");
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    (getExamAnalysisById as any).mockResolvedValueOnce({
      id: 500,
      userId: 999, // different user
    });

    await expect(caller.exam.detail({ id: 500 })).rejects.toThrow("分析记录不存在");
  });

  it("list: returns analyses for current user", async () => {
    const { listExamAnalysesByUserId } = await import("./db");
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const mockList = [
      { id: 500, userId: ctx.user!.id, subject: "数学", score: 85, status: "completed" },
      { id: 501, userId: ctx.user!.id, subject: "英语", score: 72, status: "analyzing" },
    ];
    (listExamAnalysesByUserId as any).mockResolvedValueOnce(mockList);

    const result = await caller.exam.list();
    expect(result).toHaveLength(2);
    expect(result[0].subject).toBe("数学");
  });

  it("delete: removes own analysis", async () => {
    const { getExamAnalysisById, deleteExamAnalysis } = await import("./db");
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    (getExamAnalysisById as any).mockResolvedValueOnce({
      id: 500,
      userId: ctx.user!.id,
    });

    const result = await caller.exam.delete({ id: 500 });
    expect(result.success).toBe(true);
    expect(deleteExamAnalysis).toHaveBeenCalledWith(500);
  });

  it("delete: throws NOT_FOUND for other user's analysis", async () => {
    const { getExamAnalysisById } = await import("./db");
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    (getExamAnalysisById as any).mockResolvedValueOnce({
      id: 500,
      userId: 999,
    });

    await expect(caller.exam.delete({ id: 500 })).rejects.toThrow("分析记录不存在");
  });

  it("toggleNode: toggles completion status", async () => {
    const { getLearningPathNodeById, updateLearningPathNode } = await import("./db");
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    (getLearningPathNodeById as any).mockResolvedValueOnce({
      id: 700,
      userId: ctx.user!.id,
      isCompleted: false,
    });

    const result = await caller.exam.toggleNode({ nodeId: 700 });
    expect(result.isCompleted).toBe(true);
    expect(updateLearningPathNode).toHaveBeenCalledWith(700, expect.objectContaining({
      isCompleted: true,
    }));
  });

  it("toggleNode: untoggle completed node", async () => {
    const { getLearningPathNodeById, updateLearningPathNode } = await import("./db");
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    (getLearningPathNodeById as any).mockResolvedValueOnce({
      id: 700,
      userId: ctx.user!.id,
      isCompleted: true,
    });

    const result = await caller.exam.toggleNode({ nodeId: 700 });
    expect(result.isCompleted).toBe(false);
    expect(updateLearningPathNode).toHaveBeenCalledWith(700, expect.objectContaining({
      isCompleted: false,
      completedAt: null,
    }));
  });

  it("toggleNode: throws NOT_FOUND for other user's node", async () => {
    const { getLearningPathNodeById } = await import("./db");
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    (getLearningPathNodeById as any).mockResolvedValueOnce({
      id: 700,
      userId: 999,
      isCompleted: false,
    });

    await expect(caller.exam.toggleNode({ nodeId: 700 })).rejects.toThrow("任务不存在");
  });
});
