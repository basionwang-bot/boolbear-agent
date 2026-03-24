/**
 * Text-to-Speech helper using configured external TTS providers
 *
 * Supports multiple TTS providers:
 * - OpenAI TTS (v1/audio/speech endpoint)
 * - MiniMax TTS
 * - Qwen TTS (CosyVoice)
 * - Doubao TTS (字节跳动)
 */
import { decryptApiKey } from "../crypto";

export type TTSVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

export type TTSOptions = {
  text: string;
  voice?: TTSVoice;
  speed?: number; // 0.25 to 4.0, default 1.0
  providerId?: number; // AI provider config ID, if not specified use default
};

export type TTSResult = {
  audioBuffer: Buffer;
  contentType: string;
};

export type TTSError = {
  error: string;
  code: "TEXT_TOO_LONG" | "SERVICE_ERROR" | "INVALID_PARAMS" | "NO_PROVIDER";
  details?: string;
};

const MAX_TEXT_LENGTH = 4096;

/**
 * Convert text to speech audio using configured TTS provider
 */
export async function textToSpeech(
  options: TTSOptions,
  getProviderConfig?: (category: string) => Promise<any>
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
    if (speed < 0.25 || speed > 4.0) {
      return {
        error: "Speed must be between 0.25 and 4.0",
        code: "INVALID_PARAMS",
        details: `Provided speed: ${speed}`,
      };
    }

    // Get TTS provider config
    if (!getProviderConfig) {
      return {
        error: "TTS provider configuration not available",
        code: "SERVICE_ERROR",
        details: "getProviderConfig function not provided",
      };
    }

    const config = await getProviderConfig("tts");
    if (!config) {
      return {
        error: "No TTS provider configured",
        code: "NO_PROVIDER",
        details: "Please configure a TTS provider in admin settings",
      };
    }

    // Decrypt API key
    let apiKey: string;
    try {
      apiKey = decryptApiKey(config.apiKeyEncrypted, config.apiKeyIv, config.apiKeyTag);
    } catch (err) {
      return {
        error: "Failed to decrypt TTS provider API key",
        code: "SERVICE_ERROR",
        details: err instanceof Error ? err.message : "Unknown error",
      };
    }

    // Route to appropriate TTS provider
    const providerId = config.providerId || "";

    if (providerId.includes("openai")) {
      return await callOpenAiTts(text, options.voice || "nova", speed, apiKey, config.baseUrl);
    } else if (providerId.includes("doubao")) {
      return await callDoubaoTts(text, apiKey, config.baseUrl);
    } else if (providerId.includes("qwen")) {
      return await callQwenTts(text, apiKey, config.baseUrl);
    } else if (providerId.includes("minimax")) {
      return await callMinimaxTts(text, apiKey, config.baseUrl);
    } else {
      return {
        error: `Unsupported TTS provider: ${providerId}`,
        code: "SERVICE_ERROR",
        details: "Supported providers: openai_tts, doubao_tts, qwen_tts, minimax_tts",
      };
    }
  } catch (error) {
    return {
      error: "Text-to-speech conversion failed",
      code: "SERVICE_ERROR",
      details: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Call OpenAI TTS API (v1/audio/speech)
 */
async function callOpenAiTts(
  text: string,
  voice: TTSVoice,
  speed: number,
  apiKey: string,
  baseUrl?: string
): Promise<TTSResult | TTSError> {
  try {
    const url = new URL(
      "audio/speech",
      baseUrl?.endsWith("/") ? baseUrl : (baseUrl || "https://api.openai.com/v1") + "/"
    ).toString();

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "tts-1",
        input: text,
        voice,
        speed,
        response_format: "mp3",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return {
        error: "OpenAI TTS request failed",
        code: "SERVICE_ERROR",
        details: `${response.status} ${response.statusText}${errorText ? `: ${errorText}` : ""}`,
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    if (audioBuffer.length === 0) {
      return {
        error: "OpenAI TTS returned empty audio",
        code: "SERVICE_ERROR",
        details: "Response body was empty",
      };
    }

    return {
      audioBuffer,
      contentType: "audio/mpeg",
    };
  } catch (error) {
    return {
      error: "OpenAI TTS call failed",
      code: "SERVICE_ERROR",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Call Doubao TTS API (字节跳动)
 */
async function callDoubaoTts(
  text: string,
  apiKey: string,
  baseUrl?: string
): Promise<TTSResult | TTSError> {
  try {
    const url = new URL(
      "tts",
      baseUrl?.endsWith("/") ? baseUrl : (baseUrl || "https://openspeech.bytedance.com/api/v1") + "/"
    ).toString();

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        text,
        voice: "zh_female_cancan",
        rate: 1.0,
        format: "mp3",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return {
        error: "Doubao TTS request failed",
        code: "SERVICE_ERROR",
        details: `${response.status} ${response.statusText}${errorText ? `: ${errorText}` : ""}`,
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    if (audioBuffer.length === 0) {
      return {
        error: "Doubao TTS returned empty audio",
        code: "SERVICE_ERROR",
        details: "Response body was empty",
      };
    }

    return {
      audioBuffer,
      contentType: "audio/mpeg",
    };
  } catch (error) {
    return {
      error: "Doubao TTS call failed",
      code: "SERVICE_ERROR",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Call Qwen TTS API (通义千问 CosyVoice)
 */
async function callQwenTts(
  text: string,
  apiKey: string,
  baseUrl?: string
): Promise<TTSResult | TTSError> {
  try {
    const url = new URL(
      "text-to-audio",
      baseUrl?.endsWith("/") ? baseUrl : (baseUrl || "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2audio") + "/"
    ).toString();

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "cosyvoice-v3-plus",
        input: {
          text,
        },
        parameters: {
          voice: "longnv",
          format: "mp3",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return {
        error: "Qwen TTS request failed",
        code: "SERVICE_ERROR",
        details: `${response.status} ${response.statusText}${errorText ? `: ${errorText}` : ""}`,
      };
    }

    const data = await response.json() as any;
    if (data.output?.audio_url) {
      // Qwen returns a URL, we need to fetch the actual audio
      const audioResponse = await fetch(data.output.audio_url);
      const arrayBuffer = await audioResponse.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuffer);

      if (audioBuffer.length === 0) {
        return {
          error: "Qwen TTS returned empty audio",
          code: "SERVICE_ERROR",
          details: "Downloaded audio was empty",
        };
      }

      return {
        audioBuffer,
        contentType: "audio/mpeg",
      };
    } else {
      return {
        error: "Qwen TTS response missing audio_url",
        code: "SERVICE_ERROR",
        details: JSON.stringify(data),
      };
    }
  } catch (error) {
    return {
      error: "Qwen TTS call failed",
      code: "SERVICE_ERROR",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Call MiniMax TTS API
 */
async function callMinimaxTts(
  text: string,
  apiKey: string,
  baseUrl?: string
): Promise<TTSResult | TTSError> {
  try {
    const url = new URL(
      "speech",
      baseUrl?.endsWith("/") ? baseUrl : (baseUrl || "https://api.minimax.chat/v1") + "/"
    ).toString();

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "speech-01-turbo",
        text,
        stream: false,
        audio_setting: {
          format: "mp3",
          sample_rate: 16000,
        },
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

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    if (audioBuffer.length === 0) {
      return {
        error: "MiniMax TTS returned empty audio",
        code: "SERVICE_ERROR",
        details: "Response body was empty",
      };
    }

    return {
      audioBuffer,
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
