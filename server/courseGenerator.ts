/**
 * Course Generator
 * Uses LLM to generate course outlines, chapter pages (bite-sized), and quiz questions.
 */
import { invokeLLM } from "./_core/llm";
import { trackUsage } from "./usageTracker";

// ─── Types ───────────────────────────────────────────────────────────

export interface CourseOutlineChapter {
  index: number;
  title: string;
  objectives: string[];
  estimatedMinutes: number;
  keyPoints: string[];
}

export interface CourseOutline {
  title: string;
  description: string;
  chapters: CourseOutlineChapter[];
}

export interface PageContent {
  pageIndex: number;
  title: string;
  content: string; // Markdown, short & focused
}

export interface QuizQuestion {
  questionIndex: number;
  questionType: "choice" | "truefalse";
  question: string;
  options: string[];
  correctAnswer: string; // "A"/"B"/"C"/"D" for choice, "true"/"false" for truefalse
  explanation: string;
}

// ─── Course Outline Generation ───────────────────────────────────────

/**
 * Generate a structured course outline from learning material content.
 */
export async function generateCourseOutline(
  materialTitle: string,
  materialContent: string,
  subject: string,
  gradeLevel?: string | null
): Promise<CourseOutline> {
  const gradeLevelHint = gradeLevel ? `\n目标学习群体：${gradeLevel}` : "";

  const result = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `你是一个资深的教育课程设计专家。请根据提供的学习资料，生成一个结构化的课程大纲。

要求：
1. 将资料内容分解为 5-8 个章节，确保覆盖所有核心知识点
2. 每个章节应该有清晰的标题和 2-3 个学习目标
3. 估算每个章节的学习时长（分钟），通常 15-45 分钟
4. 列出每个章节的 2-4 个关键知识点
5. 确保章节之间逻辑连贯，难度从基础到进阶递进
6. 课程标题应该简洁有吸引力${gradeLevelHint}

学科：${subject}`,
      },
      {
        role: "user",
        content: `请根据以下学习资料生成课程大纲：\n\n标题：${materialTitle}\n\n${materialContent}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "course_outline",
        strict: true,
        schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "课程标题" },
            description: { type: "string", description: "课程简介（50-100字）" },
            chapters: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  index: { type: "integer", description: "章节序号，从1开始" },
                  title: { type: "string", description: "章节标题" },
                  objectives: {
                    type: "array",
                    items: { type: "string" },
                    description: "学习目标列表",
                  },
                  estimatedMinutes: { type: "integer", description: "预计学习时长（分钟）" },
                  keyPoints: {
                    type: "array",
                    items: { type: "string" },
                    description: "关键知识点列表",
                  },
                },
                required: ["index", "title", "objectives", "estimatedMinutes", "keyPoints"],
                additionalProperties: false,
              },
            },
          },
          required: ["title", "description", "chapters"],
          additionalProperties: false,
        },
      },
    },
  });

  trackUsage({
    providerName: "builtin", category: "llm",
    model: result.model || "gemini-2.5-flash", caller: "course_generate",
    inputTokens: result.usage?.prompt_tokens || 0,
    outputTokens: result.usage?.completion_tokens || 0,
    totalTokens: result.usage?.total_tokens || 0,
    success: true,
  });

  const content = result.choices[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("LLM returned empty response for course outline");
  }

  const parsed: CourseOutline = JSON.parse(content);

  if (!parsed.chapters || parsed.chapters.length === 0) {
    throw new Error("Generated outline has no chapters");
  }

  return {
    title: parsed.title || materialTitle,
    description: parsed.description || "",
    chapters: parsed.chapters.map((ch, i) => ({
      index: i + 1,
      title: ch.title || `第${i + 1}章`,
      objectives: Array.isArray(ch.objectives) ? ch.objectives : [],
      estimatedMinutes: Math.max(10, Math.min(60, ch.estimatedMinutes || 30)),
      keyPoints: Array.isArray(ch.keyPoints) ? ch.keyPoints : [],
    })),
  };
}

// ─── Chapter Content (legacy, kept for backward compat) ──────────────

/**
 * Generate detailed content for a single course chapter.
 * This is the legacy function; new flow uses generateChapterPages instead.
 */
export async function generateChapterContent(
  materialContent: string,
  chapterTitle: string,
  chapterObjectives: string[],
  keyPoints: string[],
  subject: string,
  gradeLevel?: string | null
): Promise<string> {
  const gradeLevelHint = gradeLevel ? `\n目标学习群体：${gradeLevel}` : "";

  const result = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `你是一个教育内容创作专家。请根据学习资料和章节要求，生成详细的教学内容。

要求：
1. 内容应该清晰易懂，适合学生自主学习
2. 使用 Markdown 格式，包含标题、列表、重点标注等
3. 包含以下结构：
   - 📖 知识讲解（核心概念和原理）
   - 📝 例题解析（2-3 个典型例题，附详细解题步骤）
   - 💡 要点总结（章节核心知识点归纳）
   - ✏️ 练习题（3-5 道练习题，附答案）
4. 内容丰富充实，长度控制在 1500-3000 字
5. 语言生动有趣，适当使用类比和生活化的例子${gradeLevelHint}

学科：${subject}`,
      },
      {
        role: "user",
        content: `学习资料参考：\n${materialContent.slice(0, 3000)}\n\n请生成「${chapterTitle}」章节的详细教学内容。\n\n学习目标：${chapterObjectives.join("、")}\n关键知识点：${keyPoints.join("、")}`,
      },
    ],
  });

  trackUsage({
    providerName: "builtin", category: "llm",
    model: result.model || "gemini-2.5-flash", caller: "course_generate",
    inputTokens: result.usage?.prompt_tokens || 0,
    outputTokens: result.usage?.completion_tokens || 0,
    totalTokens: result.usage?.total_tokens || 0,
    success: true,
  });

  const content = result.choices[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error(`LLM returned empty response for chapter: ${chapterTitle}`);
  }

  return content;
}

// ─── Chapter Pages Generation (NEW) ─────────────────────────────────

/**
 * Generate ~15 bite-sized pages for a chapter.
 * Each page has a short title and focused Markdown content (100-300 words).
 */
export async function generateChapterPages(
  materialContent: string,
  chapterTitle: string,
  chapterObjectives: string[],
  keyPoints: string[],
  subject: string,
  gradeLevel?: string | null,
  pageCount: number = 15
): Promise<PageContent[]> {
  const gradeLevelHint = gradeLevel ? `\n目标学习群体：${gradeLevel}` : "";

  const result = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `你是一个资深的教育课程设计专家，擅长将知识拆分为小步骤让学生循序渐进地学习。

请将章节内容拆分为 ${pageCount} 个学习页面。每个页面的要求：

1. **内容少而精**：每页只讲解一个小知识点或一个概念，150-300字
2. **循序渐进**：从最基础的概念开始，逐步深入，每页建立在前一页的基础上
3. **语言生动**：用通俗易懂的语言，适当使用类比和例子
4. **格式清晰**：使用 Markdown 格式，可以包含：
   - 重点用 **粗体** 标注
   - 公式或关键定义用 > 引用块
   - 步骤用有序列表
   - 适当使用表情符号增加趣味性
5. **页面结构建议**：
   - 前 2-3 页：引入概念、基础定义
   - 中间 7-9 页：核心知识讲解、例题演示
   - 最后 2-3 页：总结归纳、拓展思考

每页标题要简短有吸引力（10字以内）。${gradeLevelHint}

学科：${subject}`,
      },
      {
        role: "user",
        content: `学习资料参考：\n${materialContent.slice(0, 4000)}\n\n请为「${chapterTitle}」章节生成 ${pageCount} 个学习页面。\n\n学习目标：${chapterObjectives.join("、")}\n关键知识点：${keyPoints.join("、")}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "chapter_pages",
        strict: true,
        schema: {
          type: "object",
          properties: {
            pages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  pageIndex: { type: "integer", description: "页码，从1开始" },
                  title: { type: "string", description: "页面标题（10字以内）" },
                  content: { type: "string", description: "页面内容（Markdown格式，150-300字）" },
                },
                required: ["pageIndex", "title", "content"],
                additionalProperties: false,
              },
            },
          },
          required: ["pages"],
          additionalProperties: false,
        },
      },
    },
  });

  trackUsage({
    providerName: "builtin", category: "llm",
    model: result.model || "gemini-2.5-flash", caller: "course_generate",
    inputTokens: result.usage?.prompt_tokens || 0,
    outputTokens: result.usage?.completion_tokens || 0,
    totalTokens: result.usage?.total_tokens || 0,
    success: true,
  });

  const content = result.choices[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error(`LLM returned empty response for chapter pages: ${chapterTitle}`);
  }

  const parsed = JSON.parse(content) as { pages: PageContent[] };

  if (!parsed.pages || parsed.pages.length === 0) {
    throw new Error("Generated chapter has no pages");
  }

  return parsed.pages.map((p, i) => ({
    pageIndex: i + 1,
    title: p.title || `第${i + 1}页`,
    content: p.content || "",
  }));
}

// ─── Quiz Question Generation (NEW) ─────────────────────────────────

/**
 * Generate quiz questions for a specific page.
 * Returns 2-3 questions: mix of multiple choice and true/false.
 */
export async function generatePageQuestions(
  pageContent: string,
  pageTitle: string,
  chapterTitle: string,
  subject: string,
  gradeLevel?: string | null
): Promise<QuizQuestion[]> {
  const gradeLevelHint = gradeLevel ? `\n目标学习群体：${gradeLevel}` : "";

  const result = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `你是一只可爱的学习小熊，正在帮助学生检测学习效果。请根据页面内容生成 2-3 道测验题。

题目要求：
1. **紧扣页面内容**：题目必须基于当前页面讲解的知识点
2. **题型混合**：至少包含 1 道选择题和 1 道判断题
3. **选择题**：4 个选项（A/B/C/D），只有 1 个正确答案
4. **判断题**：判断一个陈述是否正确（对/错）
5. **难度适中**：不要太简单也不要太难，确保认真学习的学生能答对
6. **解析清晰**：每道题都要有简短的解析说明为什么答案是对的

注意：
- 选择题的 options 格式为 ["A. 选项内容", "B. 选项内容", "C. 选项内容", "D. 选项内容"]
- 选择题的 correctAnswer 只填字母，如 "A"、"B"、"C"、"D"
- 判断题的 options 格式为 ["对", "错"]
- 判断题的 correctAnswer 填 "true"（对）或 "false"（错）${gradeLevelHint}

学科：${subject}`,
      },
      {
        role: "user",
        content: `章节：${chapterTitle}\n页面标题：${pageTitle}\n\n页面内容：\n${pageContent}\n\n请生成 2-3 道测验题。`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "page_questions",
        strict: true,
        schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  questionIndex: { type: "integer", description: "题目序号，从1开始" },
                  questionType: { type: "string", enum: ["choice", "truefalse"], description: "题目类型" },
                  question: { type: "string", description: "题目内容" },
                  options: {
                    type: "array",
                    items: { type: "string" },
                    description: "选项列表",
                  },
                  correctAnswer: { type: "string", description: "正确答案" },
                  explanation: { type: "string", description: "答案解析" },
                },
                required: ["questionIndex", "questionType", "question", "options", "correctAnswer", "explanation"],
                additionalProperties: false,
              },
            },
          },
          required: ["questions"],
          additionalProperties: false,
        },
      },
    },
  });

  trackUsage({
    providerName: "builtin", category: "llm",
    model: result.model || "gemini-2.5-flash", caller: "course_generate",
    inputTokens: result.usage?.prompt_tokens || 0,
    outputTokens: result.usage?.completion_tokens || 0,
    totalTokens: result.usage?.total_tokens || 0,
    success: true,
  });

  const content = result.choices[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error(`LLM returned empty response for page questions: ${pageTitle}`);
  }

  const parsed = JSON.parse(content) as { questions: QuizQuestion[] };

  if (!parsed.questions || parsed.questions.length === 0) {
    throw new Error("Generated page has no questions");
  }

  return parsed.questions.map((q, i) => ({
    questionIndex: i + 1,
    questionType: q.questionType === "truefalse" ? "truefalse" : "choice",
    question: q.question || "",
    options: Array.isArray(q.options) ? q.options : [],
    correctAnswer: q.correctAnswer || "",
    explanation: q.explanation || "",
  }));
}
