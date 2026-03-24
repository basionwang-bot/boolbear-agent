/**
 * Text-to-Speech helper
 *
 * Primary: MiniMax TTS API (China endpoint: api.minimax.chat)
 * Uses ENV.minimaxApiKey directly — no external provider config needed
 */
import { ENV } from "./env";

export type TTSOptions = {
  text: string;
  voiceId?: string;
  speed?: number;
};

export type TTSResult = {
  audioUrl: string;
  contentType: string;
};

export type TTSError = {
  error: string;
  code: "TEXT_TOO_LONG" | "SERVICE_ERROR" | "INVALID_PARAMS" | "NO_PROVIDER";
  details?: string;
};

const MAX_TEXT_LENGTH = 10000;

/**
 * Convert text to speech audio using MiniMax TTS API (China)
 * Returns a direct audio URL (valid for ~24 hours)
 */
export async function textToSpeech(
  options: TTSOptions
): Promise<TTSResult | TTSError> {
  try {
    const text = options.text.trim();
    if (!text) {
      return {
        error: "Text cannot be empty",
        code: "INVALID_PARAMS",
        details: "Provide non-empty text to convert to speech",
      };
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return {
        error: `Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters`,
        code: "TEXT_TOO_LONG",
        details: `Text length: ${text.length}`,
      };
    }

    const speed = options.speed ?? 1.0;
    if (speed < 0.5 || speed > 2.0) {
      return {
        error: "Speed must be between 0.5 and 2.0",
        code: "INVALID_PARAMS",
        details: `Provided speed: ${speed}`,
      };
    }

    const apiKey = ENV.minimaxApiKey;
    if (!apiKey) {
      return {
        error: "MiniMax API key not configured",
        code: "NO_PROVIDER",
        details: "Set MINIMAX_API_KEY environment variable",
      };
    }

    return await callMinimaxTts(text, apiKey, options.voiceId, speed);
  } catch (error) {
    return {
      error: "Text-to-speech conversion failed",
      code: "SERVICE_ERROR",
      details: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Call MiniMax TTS API (v1/t2a_v2) — China endpoint
 * Uses output_format: "url" to get a direct audio URL
 */
async function callMinimaxTts(
  text: string,
  apiKey: string,
  voiceId?: string,
  speed?: number
): Promise<TTSResult | TTSError> {
  try {
    const url = "https://api.minimax.chat/v1/t2a_v2";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "speech-2.8-hd",
        text,
        stream: false,
        voice_setting: {
          voice_id: voiceId || "Chinese (Mandarin)_Warm_Girl",
          speed: speed ?? 1.0,
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

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return {
        error: "MiniMax TTS request failed",
        code: "SERVICE_ERROR",
        details: `${response.status} ${response.statusText}${errorText ? `: ${errorText}` : ""}`,
      };
    }

    const data = (await response.json()) as any;

    if (data.base_resp && data.base_resp.status_code !== 0) {
      return {
        error: "MiniMax TTS API error",
        code: "SERVICE_ERROR",
        details: `${data.base_resp.status_code}: ${data.base_resp.status_msg}`,
      };
    }

    const audioUrl = data.data?.audio;
    if (!audioUrl) {
      return {
        error: "MiniMax TTS returned no audio URL",
        code: "SERVICE_ERROR",
        details: JSON.stringify(data),
      };
    }

    return {
      audioUrl,
      contentType: "audio/mpeg",
    };
  } catch (error) {
    return {
      error: "MiniMax TTS call failed",
      code: "SERVICE_ERROR",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
