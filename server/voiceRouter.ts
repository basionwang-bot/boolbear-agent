/**
 * 语音路由
 * - 语音转文字（STT）：音频上传到 S3 → Whisper 转写
 * - 文字转语音（TTS）：MiniMax TTS API → 返回音频 URL
 */
import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { transcribeAudio } from "./_core/voiceTranscription";
import { textToSpeech } from "./_core/tts";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

export const voiceRouter = router({
  /**
   * 上传音频并转写为文字
   */
  transcribe: protectedProcedure
    .input(
      z.object({
        audioBase64: z.string().describe("Base64 编码的音频数据"),
        mimeType: z
          .string()
          .default("audio/webm")
          .describe("音频 MIME 类型"),
        language: z
          .string()
          .optional()
          .describe("语言代码，如 zh、en"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;

      let audioBuffer: Buffer;
      try {
        audioBuffer = Buffer.from(input.audioBase64, "base64");
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "无效的音频数据",
        });
      }

      const sizeMB = audioBuffer.length / (1024 * 1024);
      if (sizeMB > 16) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `音频文件过大（${sizeMB.toFixed(1)}MB），最大支持 16MB`,
        });
      }

      const ext = input.mimeType.includes("webm")
        ? "webm"
        : input.mimeType.includes("mp3") || input.mimeType.includes("mpeg")
        ? "mp3"
        : input.mimeType.includes("wav")
        ? "wav"
        : input.mimeType.includes("ogg")
        ? "ogg"
        : input.mimeType.includes("m4a") || input.mimeType.includes("mp4")
        ? "m4a"
        : "webm";

      const fileKey = `voice/${userId}/${nanoid(12)}.${ext}`;

      let audioUrl: string;
      try {
        const result = await storagePut(fileKey, audioBuffer, input.mimeType);
        audioUrl = result.url;
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "音频上传失败：" + (err.message || "未知错误"),
        });
      }

      const result = await transcribeAudio({
        audioUrl,
        language: input.language || "zh",
        prompt: "请将语音转换为文字，保持原始语言",
      });

      if ("error" in result) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error,
          cause: result,
        });
      }

      return {
        text: result.text,
        language: result.language,
        duration: result.duration,
      };
    }),

  /**
   * 文字转语音（TTS）
   * 使用 MiniMax TTS API 将文字转换为语音
   * 返回音频 URL（有效期 24 小时）
   */
  tts: protectedProcedure
    .input(
      z.object({
        text: z.string().min(1).max(10000).describe("要转换的文字"),
        voiceId: z
          .string()
          .optional()
          .describe("MiniMax 音色 ID"),
        speed: z
          .number()
          .min(0.5)
          .max(2.0)
          .default(1.0)
          .describe("语速"),
      })
    )
    .mutation(async ({ input }) => {
      const result = await textToSpeech({
        text: input.text,
        voiceId: input.voiceId,
        speed: input.speed,
      });

      if ("error" in result) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error,
          cause: result,
        });
      }

      return {
        audioUrl: result.audioUrl,
        contentType: result.contentType,
      };
    }),
});
