import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock storagePut
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({
    key: "voice/1/test123.webm",
    url: "https://storage.example.com/voice/1/test123.webm",
  }),
}));

// Mock transcribeAudio
vi.mock("./_core/voiceTranscription", () => ({
  transcribeAudio: vi.fn().mockResolvedValue({
    task: "transcribe",
    language: "zh",
    duration: 3.5,
    text: "你好世界",
    segments: [],
  }),
}));

// Mock textToSpeech
vi.mock("./_core/tts", () => ({
  textToSpeech: vi.fn().mockResolvedValue({
    audioBuffer: Buffer.from("fake-mp3-audio-data"),
    contentType: "audio/mpeg",
  }),
}));

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("voice.transcribe", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Re-setup TTS mock after reset
    const { textToSpeech } = await import("./_core/tts");
    (textToSpeech as ReturnType<typeof vi.fn>).mockResolvedValue({
      audioUrl: "https://api.minimax.chat/audio/test123.mp3",
      contentType: "audio/mpeg",
    });
  });

  it("should transcribe audio successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a small valid base64 audio (just some bytes for testing)
    const testAudioBase64 = Buffer.from("fake-audio-data-for-testing").toString("base64");

    const result = await caller.voice.transcribe({
      audioBase64: testAudioBase64,
      mimeType: "audio/webm",
      language: "zh",
    });

    expect(result).toHaveProperty("text");
    expect(result).toHaveProperty("language");
    expect(result).toHaveProperty("duration");
    expect(result.text).toBe("你好世界");
    expect(result.language).toBe("zh");
    expect(result.duration).toBe(3.5);
  });

  it("should reject unauthenticated requests", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    const testAudioBase64 = Buffer.from("test").toString("base64");

    await expect(
      caller.voice.transcribe({
        audioBase64: testAudioBase64,
        mimeType: "audio/webm",
      })
    ).rejects.toThrow();
  });

  it("should reject oversized audio (>16MB)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a base64 string that decodes to > 16MB
    // 16MB = 16 * 1024 * 1024 = 16777216 bytes
    // We need base64 that decodes to > 16MB
    // base64 encoding ratio is ~4/3, so we need ~22MB of base64
    const bigBuffer = Buffer.alloc(17 * 1024 * 1024, "A");
    const bigBase64 = bigBuffer.toString("base64");

    await expect(
      caller.voice.transcribe({
        audioBase64: bigBase64,
        mimeType: "audio/webm",
      })
    ).rejects.toThrow(/过大/);
  });

  it("should handle transcription errors gracefully", async () => {
    const { transcribeAudio } = await import("./_core/voiceTranscription");
    (transcribeAudio as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      error: "Transcription service unavailable",
      code: "SERVICE_ERROR",
    });

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const testAudioBase64 = Buffer.from("test-audio").toString("base64");

    await expect(
      caller.voice.transcribe({
        audioBase64: testAudioBase64,
        mimeType: "audio/webm",
      })
    ).rejects.toThrow();
  });

  it("should default to webm mime type when not specified", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const testAudioBase64 = Buffer.from("test-audio").toString("base64");

    const result = await caller.voice.transcribe({
      audioBase64: testAudioBase64,
    });

    expect(result.text).toBe("你好世界");
  });

  it("should handle different audio formats", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const testAudioBase64 = Buffer.from("test-audio").toString("base64");

    // Test mp3
    const result1 = await caller.voice.transcribe({
      audioBase64: testAudioBase64,
      mimeType: "audio/mp3",
    });
    expect(result1.text).toBe("你好世界");

    // Test wav
    const result2 = await caller.voice.transcribe({
      audioBase64: testAudioBase64,
      mimeType: "audio/wav",
    });
    expect(result2.text).toBe("你好世界");

    // Test ogg
    const result3 = await caller.voice.transcribe({
      audioBase64: testAudioBase64,
      mimeType: "audio/ogg",
    });
    expect(result3.text).toBe("你好世界");
  });
});

describe("voice.tts", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Re-setup TTS mock after reset
    const { textToSpeech } = await import("./_core/tts");
    (textToSpeech as ReturnType<typeof vi.fn>).mockResolvedValue({
      audioUrl: "https://api.minimax.chat/audio/test123.mp3",
      contentType: "audio/mpeg",
    });
  });

  it("should convert text to speech successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.voice.tts({
      text: "你好，我是你的小熊老师",
      voice: "nova",
      speed: 1.0,
    });

    expect(result).toHaveProperty("audioUrl");
    expect(result).toHaveProperty("contentType");
    expect(result.contentType).toBe("audio/mpeg");
    expect(result.audioUrl).toContain("https://");
  });

  it("should reject unauthenticated TTS requests", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.voice.tts({
        text: "test",
      })
    ).rejects.toThrow();
  });

  it("should reject empty text", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.voice.tts({
        text: "",
      })
    ).rejects.toThrow();
  });

  it("should reject text exceeding 4096 characters", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const longText = "a".repeat(4097);

    await expect(
      caller.voice.tts({
        text: longText,
      })
    ).rejects.toThrow();
  });

  it("should use default voice and speed when not specified", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.voice.tts({
      text: "测试语音",
    });

    expect(result.audioUrl).toContain("https://");
    expect(result.contentType).toBe("audio/mpeg");
  });

  it("should handle TTS service errors gracefully", async () => {
    const { textToSpeech } = await import("./_core/tts");
    (textToSpeech as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      error: "TTS service unavailable",
      code: "SERVICE_ERROR",
    });

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.voice.tts({
        text: "测试",
      })
    ).rejects.toThrow();
  });

  it("should accept different voice options", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const voiceIds = ["male-qn-qingse", "female-shaonv", "male-qn-jingying", "female-yujie"] as const;
    for (const voiceId of voiceIds) {
      const result = await caller.voice.tts({
        text: "测试",
        voiceId,
      });
      expect(result.audioUrl).toBeTruthy();
    }
  });
});
