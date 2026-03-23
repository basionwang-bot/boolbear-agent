/**
 * Classroom Generator — OpenMAIC-inspired 2-stage generation pipeline
 * 
 * Stage 1: User requirement → LLM generates scene outlines (slide/quiz/discussion)
 * Stage 2: Each outline → LLM generates full scene content (elements, actions, quiz questions)
 * 
 * Adapted for BoolBear Agent with bear teacher personality integration.
 */
import { invokeLLM } from "./_core/llm";
import { trackUsage } from "./usageTracker";

// ─── Types ───────────────────────────────────────────────────────────

export interface SceneOutline {
  id: string;
  type: "slide" | "quiz" | "discussion";
  title: string;
  description: string;
  keyPoints: string[];
  teachingObjective?: string;
  estimatedDuration: number; // seconds
  order: number;
  /** Quiz config (for quiz type) */
  quizConfig?: {
    questionCount: number;
    difficulty: "easy" | "medium" | "hard";
    questionTypes: ("single" | "multiple" | "short_answer")[];
  };
  /** Discussion config (for discussion type) */
  discussionConfig?: {
    topic: string;
    prompt?: string;
  };
}

export interface SlideElement {
  id: string;
  type: "text" | "shape" | "image";
  left: number;
  top: number;
  width: number;
  height: number;
  content?: string;
  defaultColor?: string;
  defaultFontName?: string;
  fill?: string;
  borderRadius?: number;
  opacity?: number;
}

export interface SlideContent {
  background: {
    type: "solid" | "gradient";
    color?: string;
    gradient?: {
      type: "linear" | "radial";
      colors: { pos: number; color: string }[];
      rotate: number;
    };
  };
  elements: SlideElement[];
}

export interface TeachingAction {
  type: "speech" | "spotlight" | "discussion";
  content?: string; // for speech
  params?: {
    elementId?: string; // for spotlight
    topic?: string; // for discussion
    prompt?: string;
  };
}

export interface QuizQuestion {
  id: string;
  type: "single" | "multiple" | "short_answer";
  question: string;
  options?: { label: string; value: string }[];
  answer: string[];
  analysis: string;
  points: number;
}

export interface GeneratedScene {
  outline: SceneOutline;
  slideContent?: SlideContent;
  actions?: TeachingAction[];
  quizQuestions?: QuizQuestion[];
}

export interface TeacherConfig {
  name: string;
  avatar: string;
  personality: string;
  systemPrompt: string;
}

export interface StudentAgent {
  id: string;
  name: string;
  avatar: string;
  personality: string;
}

// ─── Stage 1: Generate Scene Outlines ─────────────────────────────────

/**
 * Generate scene outlines from user requirements.
 * This is the first stage of the 2-stage pipeline.
 */
export async function generateSceneOutlines(
  requirement: string,
  subject?: string,
  language: string = "zh-CN",
  teacherName?: string,
): Promise<SceneOutline[]> {
  const isZh = language === "zh-CN";
  const startTime = Date.now();

  const systemPrompt = isZh ? `你是一个专业的课程内容设计师，擅长将用户需求转化为结构化的场景大纲。

## 核心任务
根据用户的需求文本，自动推断课程细节并生成一系列场景大纲。

## 场景类型
- **slide**: 幻灯片演示页面，包含文字、图表等视觉元素
- **quiz**: 测验评估，包含选择题和简答题
- **discussion**: 互动讨论环节，由AI学生发起讨论

## 设计原则
1. 每个场景有明确的教学目的
2. 场景之间形成自然的教学递进
3. 课程时长控制在15-25分钟
4. 幻灯片场景为主（60-70%），穿插测验（20-30%）和讨论（10%）
5. 每个幻灯片场景1-3分钟，测验场景2-3分钟
6. 讨论场景最多1-2个，放在关键概念之后
7. 内容要丰富密集，确保学生能学到实质性知识

## 输出格式
输出一个JSON数组，每个元素是一个场景大纲对象：
\`\`\`json
[
  {
    "id": "scene_1",
    "type": "slide",
    "title": "场景标题",
    "description": "1-2句描述教学目的",
    "keyPoints": ["要点1", "要点2", "要点3"],
    "teachingObjective": "学习目标",
    "estimatedDuration": 120,
    "order": 1
  },
  {
    "id": "scene_2",
    "type": "quiz",
    "title": "知识检测",
    "description": "检测学生对XX概念的理解",
    "keyPoints": ["测试点1", "测试点2"],
    "order": 2,
    "quizConfig": {
      "questionCount": 3,
      "difficulty": "medium",
      "questionTypes": ["single", "multiple"]
    }
  },
  {
    "id": "scene_3",
    "type": "discussion",
    "title": "课堂讨论",
    "description": "探讨XX的实际应用",
    "keyPoints": ["讨论方向1"],
    "order": 3,
    "discussionConfig": {
      "topic": "讨论主题",
      "prompt": "引导思考的提示"
    }
  }
]
\`\`\`

只输出JSON数组，不要有其他文字。` :
`You are a professional course content designer. Generate structured scene outlines from user requirements.

## Scene Types
- **slide**: Presentation slides with text, charts, visual elements
- **quiz**: Assessment with choice and short answer questions  
- **discussion**: Interactive discussion initiated by AI students

## Design Principles
1. Each scene has a clear teaching purpose
2. Natural progression between scenes
3. Total duration: 15-25 minutes
4. Slides: 60-70%, Quizzes: 20-30%, Discussion: 10%
5. Rich, dense content for effective learning

Output a JSON array of scene outline objects. Only output JSON, no other text.`;

  const userPrompt = isZh
    ? `请为以下需求生成课程场景大纲：

需求：${requirement}
${subject ? `学科：${subject}` : ""}
${teacherName ? `教师名称：${teacherName}（请在场景设计中考虑教师的角色）` : ""}

请生成8-12个场景，确保内容丰富且有教学递进。`
    : `Generate course scene outlines for:

Requirement: ${requirement}
${subject ? `Subject: ${subject}` : ""}
${teacherName ? `Teacher: ${teacherName}` : ""}

Generate 8-12 scenes with rich content and teaching progression.`;

  const result = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  });

  const durationMs = Date.now() - startTime;
  await trackUsage({
    providerName: "builtin",
    category: "llm",
    caller: "classroom_generate_outlines",
    durationMs,
    success: true,
  });

  const rawContent = result.choices?.[0]?.message?.content;
  const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent) || "[]";
  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    // Try to extract JSON array from response
    const match = content.match(/\[[\s\S]*\]/);
    if (match) {
      parsed = JSON.parse(match[0]);
    } else {
      throw new Error("Failed to parse scene outlines from LLM response");
    }
  }

  // Handle both { outlines: [...] } and direct array formats
  const outlines: SceneOutline[] = Array.isArray(parsed) ? parsed : (parsed.outlines || parsed.scenes || []);

  // Ensure IDs and order
  return outlines.map((outline: any, index: number) => ({
    id: outline.id || `scene_${index + 1}`,
    type: outline.type || "slide",
    title: outline.title || `场景 ${index + 1}`,
    description: outline.description || "",
    keyPoints: outline.keyPoints || [],
    teachingObjective: outline.teachingObjective,
    estimatedDuration: outline.estimatedDuration || 120,
    order: index + 1,
    quizConfig: outline.quizConfig,
    discussionConfig: outline.discussionConfig,
  }));
}

// ─── Stage 2: Generate Scene Content ──────────────────────────────────

/**
 * Generate slide content for a single slide scene.
 */
export async function generateSlideContent(
  outline: SceneOutline,
  courseTitle: string,
  allOutlines: SceneOutline[],
  teacherName?: string,
  language: string = "zh-CN",
): Promise<{ slideContent: SlideContent; actions: TeachingAction[] }> {
  const isZh = language === "zh-CN";
  const isFirst = outline.order === 1;
  const isLast = outline.order === allOutlines.length;
  const position = isFirst ? "开场" : isLast ? "结尾" : "中间";
  const startTime = Date.now();

  const systemPrompt = isZh ? `你是一个教育内容设计师。请为幻灯片场景生成内容和教学动作。

## 幻灯片设计原则
- 幻灯片是视觉辅助，不是讲稿
- 文字简洁，使用关键词和短语
- 每页3-5个要点
- 画布尺寸：1000 × 562（16:9比例）

## 输出格式
输出一个JSON对象，包含 slideContent 和 actions：

\`\`\`json
{
  "slideContent": {
    "background": { "type": "solid", "color": "#ffffff" },
    "elements": [
      {
        "id": "title_1",
        "type": "text",
        "left": 60,
        "top": 40,
        "width": 880,
        "height": 60,
        "content": "<p style=\\"font-size: 28px; font-weight: bold;\\">标题文字</p>",
        "defaultColor": "#1a1a2e"
      },
      {
        "id": "point_1",
        "type": "text",
        "left": 60,
        "top": 130,
        "width": 880,
        "height": 40,
        "content": "<p style=\\"font-size: 18px;\\">• 要点内容</p>",
        "defaultColor": "#333333"
      }
    ]
  },
  "actions": [
    { "type": "speech", "content": "开场白或过渡语..." },
    { "type": "spotlight", "params": { "elementId": "title_1" } },
    { "type": "speech", "content": "详细讲解标题内容..." },
    { "type": "spotlight", "params": { "elementId": "point_1" } },
    { "type": "speech", "content": "讲解要点1..." }
  ]
}
\`\`\`

## 教学动作规则
1. speech: 教师口述内容，自然流畅
2. spotlight: 高亮某个元素，elementId 必须来自 elements 列表
3. 先 spotlight 再 speech（先指后说）
4. 生成5-10个动作对象
5. ${isFirst ? "开场需要问候和课程介绍" : isLast ? "结尾需要总结和结束语" : "中间页自然过渡，不要重新问候"}

只输出JSON对象，不要有其他文字。` :
`You are an educational content designer. Generate slide content and teaching actions.

## Slide Design
- Slides are visual aids, not scripts
- Concise text with keywords and phrases
- 3-5 key points per slide
- Canvas: 1000 × 562 (16:9)

Output a JSON object with slideContent and actions. Only output JSON.`;

  const userPrompt = isZh
    ? `课程：${courseTitle}
场景：${outline.title}
描述：${outline.description}
要点：${outline.keyPoints.join("、")}
位置：第${outline.order}页/${allOutlines.length}页（${position}）
${teacherName ? `教师：${teacherName}` : ""}

请生成这个幻灯片的内容和教学动作。背景色请使用柔和的颜色（如浅蓝、浅绿、浅黄等），文字要清晰可读。`
    : `Course: ${courseTitle}
Scene: ${outline.title}
Description: ${outline.description}
Key Points: ${outline.keyPoints.join(", ")}
Position: Page ${outline.order}/${allOutlines.length} (${position})
${teacherName ? `Teacher: ${teacherName}` : ""}

Generate slide content and teaching actions.`;

  const result = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  });

  const durationMs = Date.now() - startTime;
  await trackUsage({
    providerName: "builtin",
    category: "llm",
    caller: "classroom_generate_slide",
    durationMs,
    success: true,
  });

  const rawContent2 = result.choices?.[0]?.message?.content;
  const content = typeof rawContent2 === "string" ? rawContent2 : JSON.stringify(rawContent2) || "{}";
  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      parsed = JSON.parse(match[0]);
    } else {
      throw new Error("Failed to parse slide content");
    }
  }

  return {
    slideContent: parsed.slideContent || {
      background: { type: "solid", color: "#f0f4f8" },
      elements: [{
        id: "fallback_title",
        type: "text",
        left: 60,
        top: 200,
        width: 880,
        height: 60,
        content: `<p style="font-size: 28px; font-weight: bold;">${outline.title}</p>`,
        defaultColor: "#1a1a2e",
      }],
    },
    actions: parsed.actions || [
      { type: "speech", content: outline.description },
    ],
  };
}

/**
 * Generate quiz questions for a quiz scene.
 */
export async function generateQuizContent(
  outline: SceneOutline,
  courseTitle: string,
  allOutlines: SceneOutline[],
  language: string = "zh-CN",
): Promise<QuizQuestion[]> {
  const isZh = language === "zh-CN";
  const config = outline.quizConfig || { questionCount: 3, difficulty: "medium", questionTypes: ["single"] };
  const startTime = Date.now();

  // Gather context from preceding slides
  const precedingSlides = allOutlines
    .filter(o => o.order < outline.order && o.type === "slide")
    .map(o => `${o.title}: ${o.keyPoints.join("、")}`)
    .join("\n");

  const systemPrompt = isZh ? `你是一个专业的教育评估设计师。请根据课程内容生成测验题目。

## 题目类型
- single: 单选题（4个选项，1个正确）
- multiple: 多选题（4个选项，2-3个正确）
- short_answer: 简答题

## 输出格式
输出一个JSON数组：
\`\`\`json
[
  {
    "id": "q1",
    "type": "single",
    "question": "题目文本",
    "options": [
      { "label": "选项A内容", "value": "A" },
      { "label": "选项B内容", "value": "B" },
      { "label": "选项C内容", "value": "C" },
      { "label": "选项D内容", "value": "D" }
    ],
    "answer": ["A"],
    "analysis": "解析：为什么A是正确答案...",
    "points": 10
  }
]
\`\`\`

只输出JSON数组，不要有其他文字。` :
`You are a professional educational assessment designer. Generate quiz questions.

Output a JSON array of question objects. Only output JSON.`;

  const userPrompt = isZh
    ? `课程：${courseTitle}
测验主题：${outline.title}
测试要点：${outline.keyPoints.join("、")}
前面学习的内容：
${precedingSlides}

请生成${config.questionCount}道题目，难度：${config.difficulty}
题目类型：${config.questionTypes.join("、")}`
    : `Course: ${courseTitle}
Quiz: ${outline.title}
Test Points: ${outline.keyPoints.join(", ")}
Previous Content:
${precedingSlides}

Generate ${config.questionCount} questions, difficulty: ${config.difficulty}
Types: ${config.questionTypes.join(", ")}`;

  const result = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  });

  const durationMs = Date.now() - startTime;
  await trackUsage({
    providerName: "builtin",
    category: "llm",
    caller: "classroom_generate_quiz",
    durationMs,
    success: true,
  });

  const rawContent = result.choices?.[0]?.message?.content;
  const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent) || "[]";
  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    const match = content.match(/\[[\s\S]*\]/);
    if (match) {
      parsed = JSON.parse(match[0]);
    } else {
      throw new Error("Failed to parse quiz content");
    }
  }

  const questions: QuizQuestion[] = Array.isArray(parsed) ? parsed : (parsed.questions || []);
  return questions.map((q: any, i: number) => ({
    id: q.id || `q${i + 1}`,
    type: q.type || "single",
    question: q.question || "",
    options: q.options,
    answer: Array.isArray(q.answer) ? q.answer : [q.answer],
    analysis: q.analysis || "",
    points: q.points || 10,
  }));
}

// ─── Full Pipeline ────────────────────────────────────────────────────

/**
 * Generate default student agents based on the course topic.
 */
export function generateDefaultAgents(language: string = "zh-CN"): StudentAgent[] {
  const isZh = language === "zh-CN";
  return [
    {
      id: "student-1",
      name: isZh ? "小明" : "Alex",
      avatar: "🧑‍🎓",
      personality: isZh ? "好奇心强，喜欢提问，善于发现问题" : "Curious, loves asking questions",
    },
    {
      id: "student-2",
      name: isZh ? "小红" : "Emma",
      avatar: "👩‍🎓",
      personality: isZh ? "认真踏实，善于总结，喜欢做笔记" : "Diligent, good at summarizing",
    },
  ];
}

/**
 * Generate teacher config based on bear personality.
 */
export function generateTeacherConfig(
  bearName?: string,
  bearType?: string,
  personality?: string,
  language: string = "zh-CN",
): TeacherConfig {
  const isZh = language === "zh-CN";
  const name = bearName || (isZh ? "小熊老师" : "Bear Teacher");

  const bearAvatars: Record<string, string> = {
    grizzly: "🐻",
    panda: "🐼",
    polar: "🐻‍❄️",
  };
  const avatar = bearAvatars[bearType || "grizzly"] || "🐻";

  const personalityPrompts: Record<string, string> = {
    teacher: isZh
      ? "你是一位严谨认真的老师，讲解清晰有条理，注重知识的准确性和系统性。"
      : "You are a rigorous teacher who explains clearly and systematically.",
    friend: isZh
      ? "你是一位亲切友好的老师，用轻松有趣的方式讲解知识，善于用生活中的例子帮助理解。"
      : "You are a friendly teacher who explains in a fun, relatable way.",
    cool: isZh
      ? "你是一位酷酷的老师，讲解简洁有力，善于用类比和比喻让复杂概念变得简单。"
      : "You are a cool teacher who explains concisely with great analogies.",
  };

  return {
    name,
    avatar,
    personality: personality || "friend",
    systemPrompt: personalityPrompts[personality || "friend"] || personalityPrompts.friend,
  };
}

/**
 * Run the full 2-stage generation pipeline.
 * Returns generated scenes ready to be saved to database.
 */
export async function runClassroomPipeline(
  requirement: string,
  options: {
    subject?: string;
    language?: string;
    teacherConfig?: TeacherConfig;
    onProgress?: (stage: string, progress: number, message: string) => void;
  } = {},
): Promise<{
  title: string;
  outlines: SceneOutline[];
  scenes: GeneratedScene[];
  teacherConfig: TeacherConfig;
  studentAgents: StudentAgent[];
}> {
  const language = options.language || "zh-CN";
  const teacherConfig = options.teacherConfig || generateTeacherConfig(undefined, undefined, undefined, language);
  const studentAgents = generateDefaultAgents(language);

  // Stage 1: Generate outlines
  options.onProgress?.("outlines", 10, "正在分析需求，生成课程大纲...");
  const outlines = await generateSceneOutlines(
    requirement,
    options.subject,
    language,
    teacherConfig.name,
  );
  options.onProgress?.("outlines", 40, `已生成 ${outlines.length} 个场景大纲`);

  // Extract title from first outline or requirement
  const title = outlines[0]?.title?.replace(/^(课程介绍|引言|开场|Introduction)[:：\s]*/, "") || requirement.slice(0, 50);

  // Stage 2: Generate scene content (parallel)
  const totalScenes = outlines.length;
  let completedCount = 0;

  const scenes = await Promise.all(
    outlines.map(async (outline) => {
      let scene: GeneratedScene = { outline };

      try {
        if (outline.type === "slide") {
          const { slideContent, actions } = await generateSlideContent(
            outline,
            title,
            outlines,
            teacherConfig.name,
            language,
          );
          scene.slideContent = slideContent;
          scene.actions = actions;
        } else if (outline.type === "quiz") {
          scene.quizQuestions = await generateQuizContent(
            outline,
            title,
            outlines,
            language,
          );
        } else if (outline.type === "discussion") {
          // Discussion scenes don't need pre-generated content
          // They use the multi-agent system at runtime
        }
      } catch (error) {
        console.error(`Failed to generate scene ${outline.id}:`, error);
        // Fallback: create a basic slide
        if (outline.type === "slide") {
          scene.slideContent = {
            background: { type: "solid", color: "#f0f4f8" },
            elements: [{
              id: "fallback_title",
              type: "text",
              left: 60,
              top: 200,
              width: 880,
              height: 60,
              content: `<p style="font-size: 28px; font-weight: bold;">${outline.title}</p>`,
              defaultColor: "#1a1a2e",
            }],
          };
          scene.actions = [{ type: "speech", content: outline.description }];
        }
      }

      completedCount++;
      const progress = 40 + Math.floor((completedCount / totalScenes) * 55);
      options.onProgress?.("scenes", progress, `已生成 ${completedCount}/${totalScenes} 个场景`);

      return scene;
    }),
  );

  options.onProgress?.("complete", 100, "课堂生成完成！");

  return {
    title,
    outlines,
    scenes,
    teacherConfig,
    studentAgents,
  };
}
