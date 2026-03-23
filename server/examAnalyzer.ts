/**
 * Exam Analyzer
 * Uses LLM vision capabilities to analyze exam paper images,
 * identify weak points, and generate personalized learning paths.
 */
import { invokeLLM } from "./_core/llm";
import { trackUsage } from "./usageTracker";

// ─── Types ───────────────────────────────────────────────────────────

export interface DimensionScore {
  name: string;
  score: number; // 0-100
  fullScore: number;
  comment: string;
}

export interface WeakPoint {
  name: string;
  description: string;
  severity: "high" | "medium" | "low";
  relatedQuestions: string[];
}

export interface StrongPoint {
  name: string;
  description: string;
}

export interface WrongAnswer {
  questionNumber: string;
  questionSummary: string;
  studentAnswer: string;
  correctAnswer: string;
  errorType: string; // e.g. "概念混淆", "计算错误", "审题不清"
  explanation: string;
  knowledgePoint: string;
}

export interface LearningPhase {
  phaseIndex: number;
  title: string;
  description: string;
  duration: string; // e.g. "1周", "3天"
  focus: string;
  tasks: LearningTask[];
}

export interface LearningTask {
  taskIndex: number;
  title: string;
  description: string;
  taskType: "study" | "practice" | "review" | "test";
  priority: "high" | "medium" | "low";
  knowledgePoint: string;
  estimatedMinutes: number;
  resources: string; // suggested resources or methods
}

export interface ExamAnalysisResult {
  overallGrade: string;
  overallComment: string;
  dimensionScores: DimensionScore[];
  weakPoints: WeakPoint[];
  strongPoints: StrongPoint[];
  wrongAnswers: WrongAnswer[];
  learningPath: LearningPhase[];
}

// ─── Analyzer ────────────────────────────────────────────────────────

/**
 * Analyze exam paper images using LLM vision.
 * Returns comprehensive analysis including weak points and learning path.
 */
export async function analyzeExamPaper(
  imageUrls: string[],
  subject: string,
  score: number,
  totalScore: number,
  examTitle?: string
): Promise<ExamAnalysisResult> {
  const scorePercentage = Math.round((score / totalScore) * 100);

  const imageContent = imageUrls.map(url => ({
    type: "image_url" as const,
    image_url: { url, detail: "high" as const },
  }));

  const result = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `你是一位资深的教育分析专家，擅长通过分析学生的考试试卷来诊断学习问题并制定个性化学习计划。

你需要仔细查看学生上传的试卷图片，分析以下内容：
1. 识别试卷上的题目、学生的作答、批改标记和得分
2. 分析每道错题的错误原因和涉及的知识点
3. 评估学生在各个知识维度的掌握程度
4. 找出学生的薄弱点和优势
5. 制定分阶段的个性化学习路径

请以JSON格式返回分析结果。`
      },
      {
        role: "user",
        content: [
          {
            type: "text" as const,
            text: `请分析这份${subject}${examTitle ? `（${examTitle}）` : ""}试卷。

学生得分：${score}/${totalScore}（${scorePercentage}%）

请仔细查看试卷图片，识别所有题目和学生的作答情况，然后返回以下JSON格式的分析结果：

{
  "overallGrade": "等级评价，如 A+, A, B+, B, C+, C, D",
  "overallComment": "200字以内的整体评价，包括优势和需要改进的方面",
  "dimensionScores": [
    {
      "name": "知识维度名称（如：基础知识、阅读理解、写作表达等，根据学科特点设置5-7个维度）",
      "score": 85,
      "fullScore": 100,
      "comment": "该维度的简短评价"
    }
  ],
  "weakPoints": [
    {
      "name": "薄弱点名称",
      "description": "详细描述该薄弱点的表现",
      "severity": "high/medium/low",
      "relatedQuestions": ["相关题号"]
    }
  ],
  "strongPoints": [
    {
      "name": "优势点名称",
      "description": "详细描述该优势的表现"
    }
  ],
  "wrongAnswers": [
    {
      "questionNumber": "题号",
      "questionSummary": "题目简要描述",
      "studentAnswer": "学生的答案",
      "correctAnswer": "正确答案",
      "errorType": "错误类型（如：概念混淆、计算错误、审题不清、知识遗漏、方法不当）",
      "explanation": "详细解释为什么错了以及正确的解题思路",
      "knowledgePoint": "涉及的知识点"
    }
  ],
  "learningPath": [
    {
      "phaseIndex": 1,
      "title": "阶段标题（如：基础巩固期）",
      "description": "本阶段的目标和重点",
      "duration": "预计时长（如：1周）",
      "focus": "本阶段聚焦的核心问题",
      "tasks": [
        {
          "taskIndex": 1,
          "title": "任务标题",
          "description": "具体的学习任务描述，包括学什么、怎么学",
          "taskType": "study/practice/review/test",
          "priority": "high/medium/low",
          "knowledgePoint": "对应知识点",
          "estimatedMinutes": 30,
          "resources": "建议的学习资源或方法"
        }
      ]
    }
  ]
}

要求：
- dimensionScores 根据${subject}学科特点设置5-7个评估维度
- 学习路径分3-5个阶段，从基础到进阶
- 每个阶段包含3-6个具体任务
- 优先解决高严重度的薄弱点
- 学习路径要具体可执行，不要泛泛而谈
- 如果无法识别试卷内容，仍然根据分数和学科给出合理的分析`
          },
          ...imageContent,
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "exam_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            overallGrade: { type: "string" },
            overallComment: { type: "string" },
            dimensionScores: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  score: { type: "number" },
                  fullScore: { type: "number" },
                  comment: { type: "string" },
                },
                required: ["name", "score", "fullScore", "comment"],
                additionalProperties: false,
              },
            },
            weakPoints: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  severity: { type: "string", enum: ["high", "medium", "low"] },
                  relatedQuestions: { type: "array", items: { type: "string" } },
                },
                required: ["name", "description", "severity", "relatedQuestions"],
                additionalProperties: false,
              },
            },
            strongPoints: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                },
                required: ["name", "description"],
                additionalProperties: false,
              },
            },
            wrongAnswers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  questionNumber: { type: "string" },
                  questionSummary: { type: "string" },
                  studentAnswer: { type: "string" },
                  correctAnswer: { type: "string" },
                  errorType: { type: "string" },
                  explanation: { type: "string" },
                  knowledgePoint: { type: "string" },
                },
                required: ["questionNumber", "questionSummary", "studentAnswer", "correctAnswer", "errorType", "explanation", "knowledgePoint"],
                additionalProperties: false,
              },
            },
            learningPath: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  phaseIndex: { type: "number" },
                  title: { type: "string" },
                  description: { type: "string" },
                  duration: { type: "string" },
                  focus: { type: "string" },
                  tasks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        taskIndex: { type: "number" },
                        title: { type: "string" },
                        description: { type: "string" },
                        taskType: { type: "string", enum: ["study", "practice", "review", "test"] },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        knowledgePoint: { type: "string" },
                        estimatedMinutes: { type: "number" },
                        resources: { type: "string" },
                      },
                      required: ["taskIndex", "title", "description", "taskType", "priority", "knowledgePoint", "estimatedMinutes", "resources"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["phaseIndex", "title", "description", "duration", "focus", "tasks"],
                additionalProperties: false,
              },
            },
          },
          required: ["overallGrade", "overallComment", "dimensionScores", "weakPoints", "strongPoints", "wrongAnswers", "learningPath"],
          additionalProperties: false,
        },
      },
    },
  });

  trackUsage({
    providerName: "builtin", category: "llm",
    model: result.model || "gemini-2.5-flash", caller: "exam_analyze",
    inputTokens: result.usage?.prompt_tokens || 0,
    outputTokens: result.usage?.completion_tokens || 0,
    totalTokens: result.usage?.total_tokens || 0,
    success: true,
  });

  const content = result.choices[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("LLM returned empty response for exam analysis");
  }

  return JSON.parse(content) as ExamAnalysisResult;
}
