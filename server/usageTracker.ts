/**
 * API Usage Tracker — records every API call for monitoring and cost estimation.
 * 
 * Pricing is approximate and based on public pricing pages (CNY per 1M tokens or per call).
 * Prices are stored as constants so admins can adjust them easily.
 */
import { getDb } from "./db";
import { apiUsageLogs } from "../drizzle/schema";
import { sql, and, gte, lte, desc } from "drizzle-orm";

// ==================== PRICING TABLE (CNY per 1M tokens) ====================
// For LLM: price is per 1M tokens (input/output separately)
// For TTS: price is per 1M characters
// For Image: price is per image
// For Video: price is per second

interface PricingEntry {
  inputPer1M?: number;   // CNY per 1M input tokens
  outputPer1M?: number;  // CNY per 1M output tokens
  perCall?: number;      // CNY per call (for image/tts/video)
}

const PRICING: Record<string, PricingEntry> = {
  // === LLM Models ===
  // OpenAI
  "gpt-4o": { inputPer1M: 17.5, outputPer1M: 70 },
  "gpt-4o-mini": { inputPer1M: 1.05, outputPer1M: 4.2 },
  "gpt-4-turbo": { inputPer1M: 70, outputPer1M: 210 },
  "gpt-3.5-turbo": { inputPer1M: 3.5, outputPer1M: 10.5 },
  // Anthropic
  "claude-sonnet-4-20250514": { inputPer1M: 21, outputPer1M: 105 },
  "claude-3-5-sonnet-20241022": { inputPer1M: 21, outputPer1M: 105 },
  "claude-3-haiku-20240307": { inputPer1M: 1.75, outputPer1M: 8.75 },
  // DeepSeek
  "deepseek-chat": { inputPer1M: 1, outputPer1M: 2 },
  "deepseek-reasoner": { inputPer1M: 4, outputPer1M: 16 },
  // Kimi (Moonshot)
  "moonshot-v1-8k": { inputPer1M: 12, outputPer1M: 12 },
  "moonshot-v1-32k": { inputPer1M: 24, outputPer1M: 24 },
  "moonshot-v1-128k": { inputPer1M: 60, outputPer1M: 60 },
  // 豆包 (Doubao)
  "doubao-1.5-pro-32k": { inputPer1M: 0.8, outputPer1M: 2 },
  "doubao-1.5-pro-256k": { inputPer1M: 5, outputPer1M: 9 },
  "doubao-pro-32k": { inputPer1M: 0.8, outputPer1M: 2 },
  // 通义千问 (Qwen)
  "qwen-turbo": { inputPer1M: 0.3, outputPer1M: 0.6 },
  "qwen-plus": { inputPer1M: 0.8, outputPer1M: 2 },
  "qwen-max": { inputPer1M: 2, outputPer1M: 6 },
  // 智谱 (Zhipu)
  "glm-4-plus": { inputPer1M: 50, outputPer1M: 50 },
  "glm-4-flash": { inputPer1M: 0.1, outputPer1M: 0.1 },
  // Google Gemini (builtin)
  "gemini-2.5-flash": { inputPer1M: 0.5, outputPer1M: 2 },
  // === Image Generation (per image) ===
  "dall-e-3": { perCall: 0.28 },
  "cogview-4": { perCall: 0.25 },
  "seedream-3.0": { perCall: 0.04 },
  "wanx-v1": { perCall: 0.12 },
  // === TTS (per call, ~500 chars average) ===
  "tts-1": { perCall: 0.105 },
  "tts-1-hd": { perCall: 0.21 },
  "speech-02-hd": { perCall: 0.05 },
  "cosyvoice-v1": { perCall: 0.02 },
  "doubao-tts": { perCall: 0.02 },
  // === Video (per call) ===
  "cogvideox": { perCall: 0.5 },
  "seedance-1.0": { perCall: 0.3 },
  "wanx-video-v1": { perCall: 0.4 },
};

// Fallback pricing for unknown models
const FALLBACK_PRICING: Record<string, PricingEntry> = {
  llm: { inputPer1M: 5, outputPer1M: 15 },
  tts: { perCall: 0.05 },
  image: { perCall: 0.2 },
  video: { perCall: 0.5 },
  stt: { perCall: 0.05 },
  search: { perCall: 0.01 },
};

/** Estimate cost in CNY based on model and usage */
function estimateCost(
  model: string | null,
  category: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = (model && PRICING[model]) || FALLBACK_PRICING[category] || FALLBACK_PRICING.llm;

  if (pricing.perCall !== undefined) {
    return pricing.perCall;
  }

  const inputCost = (inputTokens / 1_000_000) * (pricing.inputPer1M || 0);
  const outputCost = (outputTokens / 1_000_000) * (pricing.outputPer1M || 0);
  return inputCost + outputCost;
}

// ==================== TRACKING API ====================

export interface TrackUsageParams {
  configId?: number | null;
  providerName: string;
  category: string;
  model?: string | null;
  caller: string;
  userId?: number | null;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  durationMs?: number;
  success?: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

/** Record an API usage event (fire-and-forget, never throws) */
export async function trackUsage(params: TrackUsageParams): Promise<void> {
  try {
    const inputTokens = params.inputTokens || 0;
    const outputTokens = params.outputTokens || 0;
    const totalTokens = params.totalTokens || (inputTokens + outputTokens);
    const cost = estimateCost(params.model || null, params.category, inputTokens, outputTokens);

    const db = await getDb();
    if (!db) return;
    await db.insert(apiUsageLogs).values({
      configId: params.configId || null,
      providerName: params.providerName,
      category: params.category,
      model: params.model || null,
      caller: params.caller,
      userId: params.userId || null,
      inputTokens,
      outputTokens,
      totalTokens,
      estimatedCostCny: cost.toFixed(6),
      durationMs: params.durationMs || null,
      success: params.success !== false,
      errorMessage: params.errorMessage || null,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    });
  } catch (err) {
    // Never let tracking failures break the main flow
    console.error("[UsageTracker] Failed to record usage:", err);
  }
}

// ==================== QUERY API ====================

export interface UsageStats {
  totalCalls: number;
  successCalls: number;
  failedCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCostCny: number;
  avgDurationMs: number;
}

export interface UsageByProvider {
  providerName: string;
  category: string;
  configId: number | null;
  calls: number;
  tokens: number;
  costCny: number;
}

export interface UsageByDay {
  date: string;
  calls: number;
  tokens: number;
  costCny: number;
}

export interface UsageByCaller {
  caller: string;
  calls: number;
  tokens: number;
  costCny: number;
}

/** Get overall usage stats for a time range */
export async function getUsageStats(startDate?: Date, endDate?: Date): Promise<UsageStats> {
  const conditions = [];
  if (startDate) conditions.push(gte(apiUsageLogs.createdAt, startDate));
  if (endDate) conditions.push(lte(apiUsageLogs.createdAt, endDate));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const db = await getDb();
  if (!db) return { totalCalls: 0, successCalls: 0, failedCalls: 0, totalInputTokens: 0, totalOutputTokens: 0, totalTokens: 0, totalCostCny: 0, avgDurationMs: 0 };
  const result = await db
    .select({
      totalCalls: sql<number>`COUNT(*)`,
      successCalls: sql<number>`SUM(CASE WHEN ${apiUsageLogs.success} = true THEN 1 ELSE 0 END)`,
      failedCalls: sql<number>`SUM(CASE WHEN ${apiUsageLogs.success} = false THEN 1 ELSE 0 END)`,
      totalInputTokens: sql<number>`COALESCE(SUM(${apiUsageLogs.inputTokens}), 0)`,
      totalOutputTokens: sql<number>`COALESCE(SUM(${apiUsageLogs.outputTokens}), 0)`,
      totalTokens: sql<number>`COALESCE(SUM(${apiUsageLogs.totalTokens}), 0)`,
      totalCostCny: sql<number>`COALESCE(SUM(${apiUsageLogs.estimatedCostCny}), 0)`,
      avgDurationMs: sql<number>`COALESCE(AVG(${apiUsageLogs.durationMs}), 0)`,
    })
    .from(apiUsageLogs)
    .where(where);

  const row = result[0];
  return {
    totalCalls: Number(row.totalCalls) || 0,
    successCalls: Number(row.successCalls) || 0,
    failedCalls: Number(row.failedCalls) || 0,
    totalInputTokens: Number(row.totalInputTokens) || 0,
    totalOutputTokens: Number(row.totalOutputTokens) || 0,
    totalTokens: Number(row.totalTokens) || 0,
    totalCostCny: Number(row.totalCostCny) || 0,
    avgDurationMs: Math.round(Number(row.avgDurationMs) || 0),
  };
}

/** Get usage grouped by provider */
export async function getUsageByProvider(startDate?: Date, endDate?: Date): Promise<UsageByProvider[]> {
  const conditions = [];
  if (startDate) conditions.push(gte(apiUsageLogs.createdAt, startDate));
  if (endDate) conditions.push(lte(apiUsageLogs.createdAt, endDate));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      providerName: apiUsageLogs.providerName,
      category: apiUsageLogs.category,
      configId: apiUsageLogs.configId,
      calls: sql<number>`COUNT(*)`,
      tokens: sql<number>`COALESCE(SUM(${apiUsageLogs.totalTokens}), 0)`,
      costCny: sql<number>`COALESCE(SUM(${apiUsageLogs.estimatedCostCny}), 0)`,
    })
    .from(apiUsageLogs)
    .where(where)
    .groupBy(apiUsageLogs.providerName, apiUsageLogs.category, apiUsageLogs.configId);

  return rows.map((r: any) => ({
    providerName: r.providerName,
    category: r.category,
    configId: r.configId,
    calls: Number(r.calls),
    tokens: Number(r.tokens),
    costCny: Number(r.costCny),
  }));
}

/** Get daily usage for trend chart */
export async function getUsageByDay(startDate?: Date, endDate?: Date): Promise<UsageByDay[]> {
  const conditions = [];
  if (startDate) conditions.push(gte(apiUsageLogs.createdAt, startDate));
  if (endDate) conditions.push(lte(apiUsageLogs.createdAt, endDate));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      date: sql<string>`DATE(${apiUsageLogs.createdAt})`,
      calls: sql<number>`COUNT(*)`,
      tokens: sql<number>`COALESCE(SUM(${apiUsageLogs.totalTokens}), 0)`,
      costCny: sql<number>`COALESCE(SUM(${apiUsageLogs.estimatedCostCny}), 0)`,
    })
    .from(apiUsageLogs)
    .where(where)
    .groupBy(sql`DATE(${apiUsageLogs.createdAt})`)
    .orderBy(sql`DATE(${apiUsageLogs.createdAt})`);

  return rows.map((r: any) => ({
    date: String(r.date),
    calls: Number(r.calls),
    tokens: Number(r.tokens),
    costCny: Number(r.costCny),
  }));
}

/** Get usage grouped by caller (chat, course_generate, etc.) */
export async function getUsageByCaller(startDate?: Date, endDate?: Date): Promise<UsageByCaller[]> {
  const conditions = [];
  if (startDate) conditions.push(gte(apiUsageLogs.createdAt, startDate));
  if (endDate) conditions.push(lte(apiUsageLogs.createdAt, endDate));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      caller: apiUsageLogs.caller,
      calls: sql<number>`COUNT(*)`,
      tokens: sql<number>`COALESCE(SUM(${apiUsageLogs.totalTokens}), 0)`,
      costCny: sql<number>`COALESCE(SUM(${apiUsageLogs.estimatedCostCny}), 0)`,
    })
    .from(apiUsageLogs)
    .where(where)
    .groupBy(apiUsageLogs.caller);

  return rows.map((r: any) => ({
    caller: r.caller,
    calls: Number(r.calls),
    tokens: Number(r.tokens),
    costCny: Number(r.costCny),
  }));
}

/** Get recent usage logs (paginated) */
export async function getRecentLogs(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(apiUsageLogs)
    .orderBy(desc(apiUsageLogs.createdAt))
    .limit(limit)
    .offset(offset);

  return rows;
}

/** Get total log count */
export async function getLogCount(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`COUNT(*)` }).from(apiUsageLogs);
  return Number(result[0].count);
}
