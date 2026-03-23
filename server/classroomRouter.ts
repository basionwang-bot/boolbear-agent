/**
 * Classroom Router — OpenMAIC-inspired multi-agent interactive classroom
 * 
 * Endpoints:
 * - create: Create a new classroom from topic/requirement
 * - list: List user's classrooms
 * - detail: Get classroom with all scenes
 * - delete: Delete a classroom
 * - progress: Get/update student progress
 * - submitQuiz: Submit quiz answers
 * - discussionMessages: Get discussion messages for a scene
 * - discuss: Send a message in a discussion (triggers multi-agent response)
 */
import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { trackUsage } from "./usageTracker";
import {
  runClassroomPipeline,
  generateTeacherConfig,
  type TeacherConfig,
  type StudentAgent,
} from "./classroomGenerator";

export const classroomRouter = router({
  /** Create a new classroom from topic/requirement */
  create: protectedProcedure
    .input(z.object({
      requirement: z.string().min(2).max(2000),
      subject: z.string().max(64).optional(),
      language: z.string().max(16).optional().default("zh-CN"),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get user's bear for teacher personality
      const activeBear = await db.getBearByUserId(ctx.user.id);

      const teacherConfig = generateTeacherConfig(
        activeBear?.bearName,
        activeBear?.bearType,
        activeBear?.personality,
        input.language,
      );

      // Create classroom record
      const classroomId = await db.createClassroom({
        userId: ctx.user.id,
        title: input.requirement.slice(0, 50) + "...",
        requirement: input.requirement,
        subject: input.subject || null,
        language: input.language,
        status: "generating",
        sceneCount: 0,
        totalDuration: 0,
        teacherConfig: teacherConfig as any,
        studentAgents: [] as any,
      });

      // Run generation pipeline in background (don't await)
      generateClassroomInBackground(classroomId, input.requirement, {
        subject: input.subject,
        language: input.language,
        teacherConfig,
      }).catch(err => {
        console.error(`[Classroom] Background generation failed for ${classroomId}:`, err);
      });

      return { classroomId, status: "generating" };
    }),

  /** List user's classrooms */
  list: protectedProcedure.query(async ({ ctx }) => {
    const rooms = await db.getClassroomsByUser(ctx.user.id);
    return rooms.map(r => ({
      id: r.id,
      title: r.title,
      subject: r.subject,
      status: r.status,
      sceneCount: r.sceneCount,
      totalDuration: r.totalDuration,
      createdAt: r.createdAt,
    }));
  }),

  /** Get classroom detail with all scenes */
  detail: protectedProcedure
    .input(z.object({ classroomId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const classroom = await db.getClassroomById(input.classroomId);
      if (!classroom) {
        throw new TRPCError({ code: "NOT_FOUND", message: "课堂不存在" });
      }
      // Allow owner or any student to view
      const scenes = await db.getClassroomScenes(input.classroomId);
      const progress = await db.getOrCreateClassroomProgress(ctx.user.id, input.classroomId);

      return {
        ...classroom,
        scenes: scenes.map(s => ({
          id: s.id,
          sceneIndex: s.sceneIndex,
          sceneType: s.sceneType,
          title: s.title,
          description: s.description,
          keyPoints: s.keyPoints,
          estimatedDuration: s.estimatedDuration,
          slideContent: s.slideContent,
          actions: s.actions,
          quizQuestions: s.quizQuestions,
          discussionConfig: s.discussionConfig,
          isGenerated: s.isGenerated,
        })),
        progress: {
          currentSceneIndex: progress.currentSceneIndex,
          quizScores: progress.quizScores,
          timeSpentSeconds: progress.timeSpentSeconds,
          status: progress.status,
        },
      };
    }),

  /** Delete a classroom */
  delete: protectedProcedure
    .input(z.object({ classroomId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const classroom = await db.getClassroomById(input.classroomId);
      if (!classroom || classroom.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "课堂不存在" });
      }
      await db.deleteClassroom(input.classroomId);
      return { success: true };
    }),

  /** Update student progress */
  updateProgress: protectedProcedure
    .input(z.object({
      classroomId: z.number().int().positive(),
      currentSceneIndex: z.number().int().min(0),
      timeSpentSeconds: z.number().int().min(0).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const progress = await db.getOrCreateClassroomProgress(ctx.user.id, input.classroomId);
      const classroom = await db.getClassroomById(input.classroomId);
      if (!classroom) throw new TRPCError({ code: "NOT_FOUND", message: "课堂不存在" });

      const isCompleted = input.currentSceneIndex >= classroom.sceneCount;
      await db.updateClassroomProgress(progress.id, {
        currentSceneIndex: input.currentSceneIndex,
        timeSpentSeconds: input.timeSpentSeconds ?? progress.timeSpentSeconds,
        status: isCompleted ? "completed" : "in_progress",
        startedAt: progress.startedAt || new Date(),
        completedAt: isCompleted ? new Date() : undefined,
      });

      return { success: true, isCompleted };
    }),

  /** Submit quiz answers */
  submitQuiz: protectedProcedure
    .input(z.object({
      classroomId: z.number().int().positive(),
      sceneId: z.number().int().positive(),
      answers: z.array(z.object({
        questionId: z.string(),
        answer: z.array(z.string()),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const scene = (await db.getClassroomScenes(input.classroomId))
        .find(s => s.id === input.sceneId);
      if (!scene || scene.sceneType !== "quiz") {
        throw new TRPCError({ code: "NOT_FOUND", message: "测验场景不存在" });
      }

      const questions = (scene.quizQuestions as any[]) || [];
      let correctCount = 0;
      let totalPoints = 0;
      let earnedPoints = 0;

      const results = input.answers.map(a => {
        const question = questions.find((q: any) => q.id === a.questionId);
        if (!question) return { questionId: a.questionId, isCorrect: false, analysis: "" };

        totalPoints += question.points || 10;
        const correctAnswer = question.answer || [];
        const isCorrect = JSON.stringify(a.answer.sort()) === JSON.stringify(correctAnswer.sort());

        if (isCorrect) {
          correctCount++;
          earnedPoints += question.points || 10;
        }

        return {
          questionId: a.questionId,
          isCorrect,
          correctAnswer: question.answer,
          analysis: question.analysis,
          points: question.points || 10,
        };
      });

      // Update progress with quiz score
      const progress = await db.getOrCreateClassroomProgress(ctx.user.id, input.classroomId);
      const existingScores = (progress.quizScores as any) || {};
      existingScores[input.sceneId] = {
        score: earnedPoints,
        total: totalPoints,
        correctCount,
        totalCount: questions.length,
      };
      await db.updateClassroomProgress(progress.id, {
        quizScores: existingScores as any,
      });

      return {
        results,
        summary: {
          correctCount,
          totalCount: questions.length,
          earnedPoints,
          totalPoints,
          passed: correctCount >= Math.ceil(questions.length * 0.6),
        },
      };
    }),

  /** Get discussion messages for a scene */
  discussionMessages: protectedProcedure
    .input(z.object({
      classroomId: z.number().int().positive(),
      sceneId: z.number().int().positive().optional(),
    }))
    .query(async ({ input }) => {
      return db.getClassroomMessagesByScene(input.classroomId, input.sceneId);
    }),

  /** Send a message in a discussion (triggers multi-agent response) */
  discuss: protectedProcedure
    .input(z.object({
      classroomId: z.number().int().positive(),
      sceneId: z.number().int().positive().optional(),
      message: z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const classroom = await db.getClassroomById(input.classroomId);
      if (!classroom) throw new TRPCError({ code: "NOT_FOUND", message: "课堂不存在" });

      const teacherConfig = classroom.teacherConfig as TeacherConfig;
      const studentAgents = (classroom.studentAgents as StudentAgent[]) || [];

      // Save user message
      await db.insertClassroomMessage({
        classroomId: input.classroomId,
        sceneId: input.sceneId || null,
        senderRole: "user",
        senderId: `user-${ctx.user.id}`,
        senderName: ctx.user.name || "同学",
        content: input.message,
      });

      // Get scene context
      let sceneContext = "";
      if (input.sceneId) {
        const scenes = await db.getClassroomScenes(input.classroomId);
        const scene = scenes.find(s => s.id === input.sceneId);
        if (scene) {
          sceneContext = `当前场景：${scene.title}\n描述：${scene.description}\n要点：${(scene.keyPoints as string[])?.join("、") || ""}`;
        }
      }

      // Get recent messages for context
      const recentMessages = await db.getClassroomMessagesByScene(input.classroomId, input.sceneId);
      const messageHistory = recentMessages.slice(-10).map(m => ({
        role: m.senderRole === "user" ? "user" as const : "assistant" as const,
        content: `[${m.senderName}]: ${m.content}`,
      }));

      // Generate multi-agent responses
      const responses: Array<{ role: string; name: string; content: string }> = [];

      // Teacher responds first
      try {
        const teacherResponse = await generateAgentResponse(
          teacherConfig,
          "teacher",
          messageHistory,
          input.message,
          sceneContext,
          classroom.requirement,
        );
        responses.push({
          role: "teacher",
          name: teacherConfig.name,
          content: teacherResponse,
        });

        await db.insertClassroomMessage({
          classroomId: input.classroomId,
          sceneId: input.sceneId || null,
          senderRole: "teacher",
          senderId: "teacher-1",
          senderName: teacherConfig.name,
          content: teacherResponse,
        });
      } catch (err) {
        console.error("[Classroom] Teacher response failed:", err);
      }

      // Randomly pick a student to respond (50% chance)
      if (studentAgents.length > 0 && Math.random() > 0.5) {
        const student = studentAgents[Math.floor(Math.random() * studentAgents.length)];
        try {
          const studentResponse = await generateStudentResponse(
            student,
            messageHistory,
            input.message,
            responses[0]?.content || "",
            sceneContext,
          );
          responses.push({
            role: "student",
            name: student.name,
            content: studentResponse,
          });

          await db.insertClassroomMessage({
            classroomId: input.classroomId,
            sceneId: input.sceneId || null,
            senderRole: "student",
            senderId: student.id,
            senderName: student.name,
            content: studentResponse,
          });
        } catch (err) {
          console.error("[Classroom] Student response failed:", err);
        }
      }

      return { responses };
    }),

  /** Start a discussion scene (teacher initiates, students respond) */
  startDiscussion: protectedProcedure
    .input(z.object({
      classroomId: z.number().int().positive(),
      sceneId: z.number().int().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      const classroom = await db.getClassroomById(input.classroomId);
      if (!classroom) throw new TRPCError({ code: "NOT_FOUND", message: "课堂不存在" });

      const scenes = await db.getClassroomScenes(input.classroomId);
      const scene = scenes.find(s => s.id === input.sceneId);
      if (!scene || scene.sceneType !== "discussion") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "不是讨论场景" });
      }

      const teacherConfig = classroom.teacherConfig as TeacherConfig;
      const studentAgents = (classroom.studentAgents as StudentAgent[]) || [];
      const discussionConfig = scene.discussionConfig as any;

      const responses: Array<{ role: string; name: string; content: string }> = [];

      // Teacher opens the discussion
      const teacherOpening = await generateAgentResponse(
        teacherConfig,
        "teacher",
        [],
        "",
        `讨论主题：${discussionConfig?.topic || scene.title}\n引导提示：${discussionConfig?.prompt || scene.description}`,
        classroom.requirement,
      );

      responses.push({ role: "teacher", name: teacherConfig.name, content: teacherOpening });
      await db.insertClassroomMessage({
        classroomId: input.classroomId,
        sceneId: input.sceneId,
        senderRole: "teacher",
        senderId: "teacher-1",
        senderName: teacherConfig.name,
        content: teacherOpening,
      });

      // Each student responds
      for (const student of studentAgents) {
        try {
          const studentResponse = await generateStudentResponse(
            student,
            [{ role: "assistant", content: `[${teacherConfig.name}]: ${teacherOpening}` }],
            "",
            teacherOpening,
            `讨论主题：${discussionConfig?.topic || scene.title}`,
          );
          responses.push({ role: "student", name: student.name, content: studentResponse });
          await db.insertClassroomMessage({
            classroomId: input.classroomId,
            sceneId: input.sceneId,
            senderRole: "student",
            senderId: student.id,
            senderName: student.name,
            content: studentResponse,
          });
        } catch (err) {
          console.error(`[Classroom] Student ${student.id} response failed:`, err);
        }
      }

      return { responses };
    }),
});

// ─── Background Generation ────────────────────────────────────────────

async function generateClassroomInBackground(
  classroomId: number,
  requirement: string,
  options: {
    subject?: string;
    language?: string;
    teacherConfig: TeacherConfig;
  },
) {
  try {
    const result = await runClassroomPipeline(requirement, {
      subject: options.subject,
      language: options.language,
      teacherConfig: options.teacherConfig,
    });

    // Save scenes to database
    const sceneRecords = result.scenes.map((scene, index) => ({
      classroomId,
      sceneIndex: index + 1,
      sceneType: scene.outline.type as "slide" | "quiz" | "discussion",
      title: scene.outline.title,
      description: scene.outline.description,
      keyPoints: scene.outline.keyPoints as any,
      estimatedDuration: scene.outline.estimatedDuration,
      slideContent: scene.slideContent as any || null,
      actions: scene.actions as any || null,
      quizQuestions: scene.quizQuestions as any || null,
      discussionConfig: scene.outline.discussionConfig as any || null,
      isGenerated: true,
    }));

    await db.insertClassroomScenes(sceneRecords);

    // Update classroom status
    const totalDuration = result.outlines.reduce((sum, o) => sum + o.estimatedDuration, 0);
    await db.updateClassroom(classroomId, {
      title: result.title,
      status: "ready",
      sceneCount: result.scenes.length,
      totalDuration,
      teacherConfig: result.teacherConfig as any,
      studentAgents: result.studentAgents as any,
    });

    console.log(`[Classroom] Generated classroom ${classroomId}: ${result.title} (${result.scenes.length} scenes)`);
  } catch (error) {
    console.error(`[Classroom] Generation failed for ${classroomId}:`, error);
    await db.updateClassroom(classroomId, {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// ─── Agent Response Generation ────────────────────────────────────────

async function generateAgentResponse(
  config: TeacherConfig,
  role: string,
  messageHistory: Array<{ role: "user" | "assistant"; content: string }>,
  userMessage: string,
  sceneContext: string,
  courseRequirement: string,
): Promise<string> {
  const startTime = Date.now();

  const systemPrompt = `${config.systemPrompt}

你是课堂中的${config.name}。课程主题：${courseRequirement}

${sceneContext ? `\n${sceneContext}` : ""}

回复规则：
1. 保持角色一致性，用${config.name}的口吻说话
2. 回复简洁有力，不超过150字
3. 如果是讨论开场，提出引导性问题
4. 如果是回应学生，给予鼓励并深入引导
5. 适当使用表情符号增加亲和力`;

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
    ...messageHistory,
  ];

  if (userMessage) {
    messages.push({ role: "user", content: userMessage });
  } else {
    messages.push({ role: "user", content: "请开始讨论" });
  }

  const result = await invokeLLM({ messages });
  const durationMs = Date.now() - startTime;
  await trackUsage({
    providerName: "builtin",
    category: "llm",
    caller: "classroom_agent_response",
    durationMs,
    success: true,
  });

  const content = result.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : "让我想想...";
}

async function generateStudentResponse(
  student: StudentAgent,
  messageHistory: Array<{ role: "user" | "assistant"; content: string }>,
  userMessage: string,
  teacherMessage: string,
  sceneContext: string,
): Promise<string> {
  const startTime = Date.now();

  const systemPrompt = `你是一个名叫${student.name}的学生。性格特点：${student.personality}

${sceneContext}

回复规则：
1. 用学生的口吻说话，自然真实
2. 回复简短，不超过80字
3. 可以提出疑问、分享理解、或表达观点
4. 偶尔犯一些小错误是正常的
5. 适当使用表情符号`;

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
    ...messageHistory,
  ];

  if (teacherMessage) {
    messages.push({ role: "user", content: `老师说：${teacherMessage}` });
  }
  if (userMessage) {
    messages.push({ role: "user", content: `同学说：${userMessage}` });
  }
  if (!teacherMessage && !userMessage) {
    messages.push({ role: "user", content: "请发表你的看法" });
  }

  const result = await invokeLLM({ messages });
  const durationMs = Date.now() - startTime;
  await trackUsage({
    providerName: "builtin",
    category: "llm",
    caller: "classroom_student_response",
    durationMs,
    success: true,
  });

  const content = result.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : "嗯...让我想想";
}
