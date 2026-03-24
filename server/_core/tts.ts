/**
 * Text-to-Speech helper using internal Forge API (OpenAI-compatible TTS endpoint)
 *
 * Uses the same Forge API infrastructure as LLM and Whisper.
 * Endpoint: v1/audio/speech
 */
import { ENV } from "./env";

export type TTSVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

export type TTSOptions = {
  text: string;
  voice?: TTSVoice;
  speed?: number; // 0.25 to 4.0, default 1.0
};

export type TTSResult = {
  audioBuffer: Buffer;
  contentType: string;
};

export type TTSError = {
  error: string;
  code: "TEXT_TOO_LONG" | "SERVICE_ERROR" | "INVALID_PARAMS";
  details?: string;
};

const MAX_TEXT_LENGTH = 4096;

/**
 * Convert text to speech audio using the Forge TTS API
 */
export async function textToSpeech(
  options: TTSOptions
): Promise<TTSResult | TTSError> {
  try {
    if (!ENV.forgeApiUrl) {
      return {
        error: "TTS service is not configured",
        code: "SERVICE_ERROR",
        details: "BUILT_IN_FORGE_API_URL is not set",
      };
    }
    if (!ENV.forgeApiKey) {
      return {
        error: "TTS service authentication is missing",
        code: "SERVICE_ERROR",
        details: "BUILT_IN_FORGE_API_KEY is not set",
      };
    }

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
    if (speed < 0.25 || speed > 4.0) {
      return {
        error: "Speed must be between 0.25 and 4.0",
        code: "INVALID_PARAMS",
        details: `Provided speed: ${speed}`,
      };
    }

    const baseUrl = ENV.forgeApiUrl.endsWith("/")
      ? ENV.forgeApiUrl
      : `${ENV.forgeApiUrl}/`;
    const fullUrl = new URL("v1/audio/speech", baseUrl).toString();

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ENV.forgeApiKey}`,
      },
      body: JSON.stringify({
        model: "tts-1",
        input: text,
        voice: options.voice ?? "nova",
        speed,
        response_format: "mp3",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return {
        error: "TTS service request failed",
        code: "SERVICE_ERROR",
        details: `${response.status} ${response.statusText}${errorText ? `: ${errorText}` : ""}`,
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    if (audioBuffer.length === 0) {
      return {
        error: "TTS service returned empty audio",
        code: "SERVICE_ERROR",
        details: "Response body was empty",
      };
    }

    return {
      audioBuffer,
      contentType: response.headers.get("content-type") || "audio/mpeg",
    };
  } catch (error) {
    return {
      error: "Text-to-speech conversion failed",
      code: "SERVICE_ERROR",
      details: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
