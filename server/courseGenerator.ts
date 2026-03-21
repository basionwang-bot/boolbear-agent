/**
 * Course Generator
 * Uses LLM to generate course outlines and chapter content from learning materials.
 */
import { invokeLLM } from "./_core/llm";

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

  const content = result.choices[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("LLM returned empty response for course outline");
  }

  const parsed: CourseOutline = JSON.parse(content);

  // Validate and sanitize
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

/**
 * Generate detailed content for a single course chapter.
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

  const content = result.choices[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error(`LLM returned empty response for chapter: ${chapterTitle}`);
  }

  return content;
}
