import { describe, it, expect } from "vitest";

describe("MiniMax TTS API Key Validation", () => {
  it("should have MINIMAX_API_KEY environment variable set", () => {
    const apiKey = process.env.MINIMAX_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe("");
    expect(apiKey!.length).toBeGreaterThan(10);
  });

  it("should successfully call MiniMax TTS API with a short test text", async () => {
    const apiKey = process.env.MINIMAX_API_KEY;
    if (!apiKey) {
      console.warn("Skipping: MINIMAX_API_KEY not set");
      return;
    }

    const response = await fetch("https://api.minimax.io/v1/t2a_v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "speech-2.8-hd",
        text: "你好",
        stream: false,
        voice_setting: {
          voice_id: "Chinese (Mandarin)_Warm_Girl",
          speed: 1.0,
          vol: 1,
          pitch: 0,
        },
        audio_setting: {
          sample_rate: 32000,
          bitrate: 128000,
          format: "mp3",
          channel: 1,
        },
        language_boost: "Chinese",
        output_format: "url",
      }),
    });

    expect(response.ok).toBe(true);

    const data = (await response.json()) as any;
    expect(data.base_resp.status_code).toBe(0);
    expect(data.data?.audio).toBeDefined();
    expect(typeof data.data.audio).toBe("string");
    // The audio URL should be a valid URL
    expect(data.data.audio).toMatch(/^https?:\/\//);
  }, 30000); // 30s timeout for API call
});
