import { ENV } from "./_core/env";
import * as db from "./db";
import type { Bear } from "../drizzle/schema";

// ==================== TIER SYSTEM ====================

const TIER_THRESHOLDS = [
  { tier: "bronze", minExp: 0 },
  { tier: "silver", minExp: 100 },
  { tier: "gold", minExp: 300 },
  { tier: "platinum", minExp: 600 },
  { tier: "diamond", minExp: 1000 },
  { tier: "starlight", minExp: 1500 },
  { tier: "king", minExp: 2500 },
] as const;

export function calculateTier(experience: number): typeof TIER_THRESHOLDS[number]["tier"] {
  let result: typeof TIER_THRESHOLDS[number]["tier"] = "bronze";
  for (const t of TIER_THRESHOLDS) {
    if (experience >= t.minExp) result = t.tier;
  }
  return result;
}

export function calculateLevel(experience: number): number {
  return Math.min(100, Math.floor(experience / 10) + 1);
}

/** Award experience after a conversation turn */
export async function awardExperience(bearId: number, messageContent: string) {
  const bear = await db.getBearById(bearId);
  if (!bear) return null;

  // Base XP per message + bonus for longer messages
  const baseXp = 5;
  const lengthBonus = Math.min(10, Math.floor(messageContent.length / 50));
  const totalXp = baseXp + lengthBonus;

  const newExperience = bear.experience + totalXp;
  const newTier = calculateTier(newExperience);
  const newLevel = calculateLevel(newExperience);

  // Attribute boosts (random distribution)
  const wisdomBoost = Math.floor(Math.random() * 3);
  const techBoost = Math.floor(Math.random() * 3);
  const socialBoost = Math.floor(Math.random() * 2);

  await db.updateBear(bearId, {
    experience: newExperience,
    tier: newTier,
    level: newLevel,
    wisdom: bear.wisdom + wisdomBoost,
    tech: bear.tech + techBoost,
    social: bear.social + socialBoost,
    totalChats: bear.totalChats + 1,
    emotion: newTier !== bear.tier ? "levelup" : "studying",
  });

  return {
    xpGained: totalXp,
    newExperience,
    newTier,
    newLevel,
    tierChanged: newTier !== bear.tier,
  };
}

// ==================== SYSTEM PROMPT ====================

const PERSONALITY_PROMPTS: Record<string, string> = {
  teacher: `你是一位耐心的老师型学习伙伴。你善于用循序渐进的方式讲解知识，会先确认学生的理解程度，然后用苏格拉底式提问引导学生思考。你会给出清晰的步骤和示例，但不会直接给答案。语气温和专业。`,
  friend: `你是一位热情的朋友型学习伙伴。你用轻松活泼的语气和学生交流，善于用生活中的例子来解释复杂概念。你会鼓励学生，在他们遇到困难时给予支持和打气。偶尔会开个小玩笑来活跃气氛。`,
  cool: `你是一位酷酷的学习伙伴。你说话简洁有力，直击要点。你善于用最精炼的语言解释复杂问题，偶尔会用一些网络流行语。你看起来很酷但内心很关心学生的学习进度。`,
};

const BEAR_TYPE_NAMES: Record<string, string> = {
  grizzly: "可可",
  panda: "圆圆",
  polar: "冰冰",
};

export function buildSystemPrompt(bear: Bear): string {
  const bearTypeName = BEAR_TYPE_NAMES[bear.bearType] || "小熊";
  const personalityPrompt = PERSONALITY_PROMPTS[bear.personality] || PERSONALITY_PROMPTS.friend;
  const tierName = bear.tier;

  return `你是一只名叫"${bear.bearName}"的AI学习小熊（${bearTypeName}），你是学生的学习伙伴。

${personalityPrompt}

你的当前状态：
- 段位：${tierName}
- 等级：${bear.level}
- 智慧值：${bear.wisdom} | 技术值：${bear.tech} | 社交值：${bear.social}

注意事项：
1. 你的回复要简洁明了，适合学生阅读
2. 如果学生问的问题超出你的能力范围，诚实告知并建议寻求老师帮助
3. 鼓励学生多思考，不要直接给出完整答案
4. 偶尔可以用小熊的口吻说话（比如"让我想想..."、"这个问题很有趣呢"）
5. 回复使用中文，除非学生用英文提问`;
}

// ==================== STREAMING CHAT ====================

const resolveApiUrl = () =>
  ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
    ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
    : "https://forge.manus.im/v1/chat/completions";

export async function streamChat(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  onChunk: (chunk: string) => void,
  onDone: (fullContent: string) => void,
  onError: (error: Error) => void
) {
  try {
    const apiUrl = resolveApiUrl();
    const apiKey = ENV.forgeApiKey;

    if (!apiKey) {
      throw new Error("API key not configured");
    }

    const payload = {
      model: "gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: true,
      max_tokens: 2048,
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API error: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let fullContent = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            fullContent += content;
            onChunk(content);
          }
        } catch {
          // Skip malformed JSON chunks
        }
      }
    }

    onDone(fullContent);
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}
