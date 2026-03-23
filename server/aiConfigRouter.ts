/**
 * AI Provider Configuration Router — admin-only CRUD for managing
 * external AI service API keys (LLM, TTS, Image, Video, ASR, WebSearch).
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { encryptApiKey, decryptApiKey, maskApiKey } from "./crypto";

/** Known provider presets with display names and default base URLs */
const PROVIDER_PRESETS: Record<string, { displayName: string; baseUrl?: string; models?: string[] }> = {
  // LLM providers
  openai: { displayName: "OpenAI", baseUrl: "https://api.openai.com/v1", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"] },
  anthropic: { displayName: "Anthropic", baseUrl: "https://api.anthropic.com", models: ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"] },
  deepseek: { displayName: "DeepSeek", baseUrl: "https://api.deepseek.com/v1", models: ["deepseek-chat", "deepseek-reasoner"] },
  kimi: { displayName: "Kimi (月之暗面)", baseUrl: "https://api.moonshot.cn/v1", models: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"] },
  doubao: { displayName: "豆包 (字节跳动)", baseUrl: "https://ark.cn-beijing.volces.com/api/v3", models: ["doubao-1.5-pro-32k", "doubao-1.5-lite-32k"] },
  qwen: { displayName: "通义千问 (阿里)", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", models: ["qwen-plus", "qwen-turbo", "qwen-max"] },
  zhipu: { displayName: "智谱 AI", baseUrl: "https://open.bigmodel.cn/api/paas/v4", models: ["glm-4-plus", "glm-4-flash"] },
  // TTS providers
  openai_tts: { displayName: "OpenAI TTS", baseUrl: "https://api.openai.com/v1", models: ["tts-1", "tts-1-hd"] },
  minimax_tts: { displayName: "MiniMax TTS", baseUrl: "https://api.minimax.chat/v1", models: ["speech-01-turbo"] },
  // Image providers
  openai_image: { displayName: "OpenAI DALL-E", baseUrl: "https://api.openai.com/v1", models: ["dall-e-3", "dall-e-2"] },
  zhipu_image: { displayName: "智谱 CogView", baseUrl: "https://open.bigmodel.cn/api/paas/v4", models: ["cogview-3-plus"] },
  // Video providers
  zhipu_video: { displayName: "智谱 CogVideo", baseUrl: "https://open.bigmodel.cn/api/paas/v4", models: ["cogvideox"] },
};

const categoryEnum = z.enum(["llm", "tts", "asr", "image", "video", "web_search"]);

const createInput = z.object({
  category: categoryEnum,
  providerId: z.string().min(1).max(64),
  displayName: z.string().min(1).max(128),
  apiKey: z.string().min(1),
  baseUrl: z.string().max(512).optional(),
  models: z.array(z.string()).optional(),
  isDefault: z.boolean().optional(),
});

const updateInput = z.object({
  id: z.number(),
  displayName: z.string().min(1).max(128).optional(),
  apiKey: z.string().min(1).optional(),
  baseUrl: z.string().max(512).nullable().optional(),
  models: z.array(z.string()).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const aiConfigRouter = router({
  /** List all AI provider configs (API keys are masked) */
  list: adminProcedure.query(async () => {
    const configs = await db.getAllAiProviderConfigs();
    return configs.map(c => ({
      ...c,
      apiKeyMasked: maskApiKey(decryptApiKey(c.apiKeyEncrypted, c.apiKeyIv, c.apiKeyTag)),
      apiKeyEncrypted: undefined,
      apiKeyIv: undefined,
      apiKeyTag: undefined,
    }));
  }),

  /** List configs by category */
  listByCategory: adminProcedure
    .input(z.object({ category: categoryEnum }))
    .query(async ({ input }) => {
      const configs = await db.getAiProviderConfigsByCategory(input.category);
      return configs.map(c => ({
        ...c,
        apiKeyMasked: maskApiKey(decryptApiKey(c.apiKeyEncrypted, c.apiKeyIv, c.apiKeyTag)),
        apiKeyEncrypted: undefined,
        apiKeyIv: undefined,
        apiKeyTag: undefined,
      }));
    }),

  /** Get provider presets for UI dropdowns */
  presets: adminProcedure.query(() => {
    return Object.entries(PROVIDER_PRESETS).map(([id, preset]) => ({
      providerId: id,
      ...preset,
    }));
  }),

  /** Create a new AI provider config */
  create: adminProcedure
    .input(createInput)
    .mutation(async ({ ctx, input }) => {
      const { encrypted, iv, tag } = encryptApiKey(input.apiKey);

      const id = await db.createAiProviderConfig({
        category: input.category,
        providerId: input.providerId,
        displayName: input.displayName,
        apiKeyEncrypted: encrypted,
        apiKeyIv: iv,
        apiKeyTag: tag,
        baseUrl: input.baseUrl || null,
        models: input.models || null,
        isDefault: input.isDefault || false,
        isActive: true,
        createdBy: ctx.user.id,
      });

      // If set as default, clear other defaults in the same category
      if (input.isDefault) {
        await db.setDefaultAiProvider(id, input.category);
      }

      return { id };
    }),

  /** Update an existing AI provider config */
  update: adminProcedure
    .input(updateInput)
    .mutation(async ({ input }) => {
      const existing = await db.getAiProviderConfigById(input.id);
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "配置不存在" });
      }

      const updateData: Record<string, any> = {};

      if (input.displayName !== undefined) updateData.displayName = input.displayName;
      if (input.baseUrl !== undefined) updateData.baseUrl = input.baseUrl;
      if (input.models !== undefined) updateData.models = input.models;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;

      // Re-encrypt if API key is being updated
      if (input.apiKey) {
        const { encrypted, iv, tag } = encryptApiKey(input.apiKey);
        updateData.apiKeyEncrypted = encrypted;
        updateData.apiKeyIv = iv;
        updateData.apiKeyTag = tag;
      }

      if (Object.keys(updateData).length > 0) {
        await db.updateAiProviderConfig(input.id, updateData);
      }

      // Handle default setting
      if (input.isDefault) {
        await db.setDefaultAiProvider(input.id, existing.category);
      }

      return { success: true };
    }),

  /** Delete an AI provider config */
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const existing = await db.getAiProviderConfigById(input.id);
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "配置不存在" });
      }
      await db.deleteAiProviderConfig(input.id);
      return { success: true };
    }),

  /** Test an API key connection by making a minimal API call */
  testConnection: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const config = await db.getAiProviderConfigById(input.id);
      if (!config) {
        throw new TRPCError({ code: "NOT_FOUND", message: "配置不存在" });
      }

      const apiKey = decryptApiKey(config.apiKeyEncrypted, config.apiKeyIv, config.apiKeyTag);
      const baseUrl = config.baseUrl || PROVIDER_PRESETS[config.providerId]?.baseUrl || "";
      const models = (config.models as string[] | null) || PROVIDER_PRESETS[config.providerId]?.models || [];
      const testModel = models[0] || "gpt-4o-mini";

      let success = false;
      let message = "";

      try {
        if (config.category === "llm") {
          // Test LLM with a minimal chat completion
          const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
          const res = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: testModel,
              messages: [{ role: "user", content: "Hi" }],
              max_tokens: 5,
            }),
            signal: AbortSignal.timeout(15000),
          });

          if (res.ok) {
            success = true;
            message = `连接成功 (${testModel})`;
          } else {
            const errText = await res.text().catch(() => "");
            message = `连接失败: ${res.status} ${res.statusText}${errText ? " - " + errText.slice(0, 200) : ""}`;
          }
        } else if (config.category === "tts") {
          // Test TTS with a models list or a minimal request
          const url = `${baseUrl.replace(/\/$/, "")}/models`;
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${apiKey}` },
            signal: AbortSignal.timeout(10000),
          });
          success = res.ok;
          message = res.ok ? "连接成功" : `连接失败: ${res.status}`;
        } else if (config.category === "image") {
          // Test image API with a models list
          const url = `${baseUrl.replace(/\/$/, "")}/models`;
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${apiKey}` },
            signal: AbortSignal.timeout(10000),
          });
          success = res.ok;
          message = res.ok ? "连接成功" : `连接失败: ${res.status}`;
        } else {
          // Generic test: try listing models
          const url = `${baseUrl.replace(/\/$/, "")}/models`;
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${apiKey}` },
            signal: AbortSignal.timeout(10000),
          });
          success = res.ok;
          message = res.ok ? "连接成功" : `连接失败: ${res.status}`;
        }
      } catch (err: any) {
        message = `连接错误: ${err.message || "未知错误"}`;
      }

      // Save test result
      await db.updateAiProviderTestResult(input.id, success);

      return { success, message };
    }),
});
