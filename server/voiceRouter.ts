/**
 * 语音转文字路由
 * 处理音频上传到 S3 和 Whisper 转写
 */
import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { transcribeAudio } from "./_core/voiceTranscription";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

export const voiceRouter = router({
  /**
   * 上传音频并转写为文字
   * 前端发送 base64 编码的音频数据
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

      // 1. 解码 base64 音频
      let audioBuffer: Buffer;
      try {
        audioBuffer = Buffer.from(input.audioBase64, "base64");
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "无效的音频数据",
        });
      }

      // 检查文件大小（16MB 限制）
      const sizeMB = audioBuffer.length / (1024 * 1024);
      if (sizeMB > 16) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `音频文件过大（${sizeMB.toFixed(1)}MB），最大支持 16MB`,
        });
      }

      // 2. 上传到 S3
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

      // 3. 调用 Whisper 转写
      const result = await transcribeAudio({
        audioUrl,
        language: input.language || "zh",
        prompt: "请将语音转换为文字，保持原始语言",
      });

      // 检查是否返回错误
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
});
