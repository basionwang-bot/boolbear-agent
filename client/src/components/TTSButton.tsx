/**
 * TTS 播放按钮组件（使用浏览器原生 Web Speech API）
 * 在小熊回复消息旁显示一个小巧的播放/停止图标按钮
 * 零配置，无需后端 API
 */
import { useState, useCallback, useEffect } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";

interface TTSButtonProps {
  text: string;
  className?: string;
}

/** Strip markdown so the speech sounds natural */
function cleanTextForSpeech(raw: string): string {
  return raw
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/#{1,6}\s/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[-*>|]/g, " ")
    .replace(/\n{2,}/g, "。")
    .replace(/\n/g, "，")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export default function TTSButton({ text, className = "" }: TTSButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "playing" | "error">("idle");

  // Check if Web Speech API is available
  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleClick = useCallback(() => {
    if (!isSupported) return;

    const synth = window.speechSynthesis;

    // If playing, stop
    if (status === "playing") {
      synth.cancel();
      setStatus("idle");
      return;
    }

    // If loading, ignore
    if (status === "loading") return;

    const cleaned = cleanTextForSpeech(text);
    if (!cleaned) return;

    // Truncate very long text (browser TTS can struggle with long text)
    const truncated = cleaned.length > 2000 ? cleaned.slice(0, 2000) : cleaned;

    // Cancel any ongoing speech
    synth.cancel();

    setStatus("loading");

    const utterance = new SpeechSynthesisUtterance(truncated);

    // Try to find a Chinese voice
    const voices = synth.getVoices();
    const zhVoice = voices.find(
      (v) => v.lang.startsWith("zh") && v.name.toLowerCase().includes("female")
    ) || voices.find((v) => v.lang.startsWith("zh"));
    if (zhVoice) {
      utterance.voice = zhVoice;
    }
    utterance.lang = "zh-CN";
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    utterance.onstart = () => setStatus("playing");
    utterance.onend = () => setStatus("idle");
    utterance.onerror = (e) => {
      // "interrupted" is not a real error (happens when we cancel)
      if (e.error === "interrupted" || e.error === "canceled") {
        setStatus("idle");
      } else {
        console.error("TTS error:", e.error);
        setStatus("error");
        setTimeout(() => setStatus("idle"), 2000);
      }
    };

    synth.speak(utterance);
  }, [text, status, isSupported]);

  if (!isSupported) return null;

  const iconSize = "w-3 h-3";

  return (
    <button
      onClick={handleClick}
      disabled={status === "loading"}
      title={
        status === "loading"
          ? "正在准备..."
          : status === "playing"
          ? "点击停止"
          : status === "error"
          ? "播放失败，点击重试"
          : "播放语音"
      }
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full transition-all
        ${
          status === "playing"
            ? "bg-[oklch(0.52_0.09_55/0.25)] text-[oklch(0.42_0.09_55)]"
            : status === "error"
            ? "bg-red-50 text-red-400 hover:bg-red-100"
            : "text-muted-foreground/60 hover:text-[oklch(0.52_0.09_55)] hover:bg-[oklch(0.52_0.09_55/0.1)]"
        }
        disabled:opacity-50 disabled:cursor-wait
        ${className}`}
    >
      {status === "loading" ? (
        <Loader2 className={`${iconSize} animate-spin`} />
      ) : status === "playing" ? (
        <VolumeX className={iconSize} />
      ) : (
        <Volume2 className={`${iconSize} ${status === "error" ? "text-red-400" : ""}`} />
      )}
    </button>
  );
}
