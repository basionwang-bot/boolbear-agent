/**
 * Knowledge Point Extractor
 * Uses LLM to analyze conversation messages and extract learning knowledge points.
 */
import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import { trackUsage } from "./usageTracker";

export interface ExtractedKnowledgePoint {
  name: string;
  subject: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  mastery: number;
}

/**
 * Extract knowledge points from a conversation's messages using LLM.
 */
export async function extractKnowledgePoints(
  conversationId: number,
  userId: number
): Promise<ExtractedKnowledgePoint[]> {
  // Get all messages from the conversation
  const msgs = await db.getMessagesByConversationId(conversationId);
  if (msgs.length < 2) return []; // Need at least a Q&A pair

  // Build conversation text for analysis (limit to last 50 messages to avoid token overflow)
  const recentMsgs = msgs.slice(-50);
  const conversationText = recentMsgs
    .map((m) => `${m.role === "user" ? "学生" : "小熊老师"}: ${m.content}`)
    .join("\n");

  const systemPrompt = `你是一个教育分析助手。请分析以下学生和AI学习伙伴的对话，提取出学生正在学习的知识点。

要求：
1. 识别对话中涉及的具体知识点（如"一元二次方程"、"光合作用"、"英语过去式"等）
2. 为每个知识点分类学科（数学、语文、英语、物理、化学、生物、历史、地理、政治、信息技术、其他）
3. 评估学生对该知识点的掌握程度（0-100分）
4. 评估知识点难度（easy/medium/hard）
5. 给出简短描述

请以JSON数组格式返回，每个元素包含：name, subject, description, difficulty, mastery
如果对话中没有明确的学习内容，返回空数组 []。
最多提取5个最重要的知识点。`;

  try {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `请分析以下对话并提取知识点：\n\n${conversationText}` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "knowledge_points",
          strict: true,
          schema: {
            type: "object",
            properties: {
              points: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "知识点名称" },
                    subject: { type: "string", description: "学科分类" },
                    description: { type: "string", description: "知识点描述" },
                    difficulty: { type: "string", enum: ["easy", "medium", "hard"], description: "难度" },
                    mastery: { type: "integer", description: "掌握程度0-100" },
                  },
                  required: ["name", "subject", "description", "difficulty", "mastery"],
                  additionalProperties: false,
                },
              },
            },
            required: ["points"],
            additionalProperties: false,
          },
        },
      },
    });

    // Track usage
    const usage = result.usage;
    trackUsage({
      providerName: "builtin",
      category: "llm",
      model: result.model || "gemini-2.5-flash",
      caller: "knowledge_extract",
      userId,
      inputTokens: usage?.prompt_tokens || 0,
      outputTokens: usage?.completion_tokens || 0,
      totalTokens: usage?.total_tokens || 0,
      success: true,
    });

    const content = result.choices[0]?.message?.content;
    if (!content || typeof content !== "string") return [];

    const parsed = JSON.parse(content);
    const points: ExtractedKnowledgePoint[] = (parsed.points || []).map((p: any) => ({
      name: String(p.name || "").slice(0, 128),
      subject: String(p.subject || "其他").slice(0, 64),
      description: String(p.description || ""),
      difficulty: ["easy", "medium", "hard"].includes(p.difficulty) ? p.difficulty : "medium",
      mastery: Math.max(0, Math.min(100, Number(p.mastery) || 30)),
    }));

    return points;
  } catch (error) {
    console.error("[KnowledgeExtractor] LLM extraction failed:", error);
    trackUsage({
      providerName: "builtin",
      category: "llm",
      caller: "knowledge_extract",
      userId,
      success: false,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Extract knowledge points from a conversation and save/update them in the database.
 * Only extracts if the conversation hasn't been analyzed before (prevents duplicate extraction).
 */
export async function extractAndSaveKnowledgePoints(
  conversationId: number,
  userId: number
): Promise<{ added: number; updated: number }> {
  // Check if conversation has already been analyzed
  const conversation = await db.getConversationById(conversationId);
  if (!conversation) {
    return { added: 0, updated: 0 };
  }

  // Skip if already analyzed
  if (conversation.isAnalyzed) {
    console.log(`[KnowledgeExtractor] Conversation ${conversationId} already analyzed, skipping`);
    return { added: 0, updated: 0 };
  }

  const extracted = await extractKnowledgePoints(conversationId, userId);
  let added = 0;
  let updated = 0;

  for (const point of extracted) {
    // Check if this knowledge point already exists for this user
    const existing = await db.getKnowledgePointByNameAndUser(userId, point.name);

    if (existing) {
      // Update existing: increase mention count, update mastery (weighted average)
      const newMastery = Math.round((existing.mastery * 0.6) + (point.mastery * 0.4));
      await db.updateKnowledgePoint(existing.id, {
        mastery: Math.min(100, newMastery),
        mentionCount: existing.mentionCount + 1,
        lastMentionedAt: new Date(),
        description: point.description || existing.description,
        conversationId,
      });
      updated++;
    } else {
      // Create new knowledge point
      await db.createKnowledgePoint({
        userId,
        conversationId,
        name: point.name,
        subject: point.subject,
        description: point.description,
        mastery: point.mastery,
        difficulty: point.difficulty,
        mentionCount: 1,
        lastMentionedAt: new Date(),
      });
      added++;
    }
  }

  // Mark conversation as analyzed to prevent duplicate extraction
  await db.updateConversation(conversationId, { isAnalyzed: true });

  return { added, updated };
}
