/**
 * TTS 播放按钮组件
 * 在小熊回复消息旁显示播放/暂停按钮
 * 点击后调用后端 TTS API 将文字转为语音并播放
 */
import { useState, useRef, useCallback } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface TTSButtonProps {
  text: string;
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  speed?: number;
  className?: string;
}

export default function TTSButton({
  text,
  voice = "nova",
  speed = 1.0,
  className = "",
}: TTSButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "playing" | "error">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cachedUrlRef = useRef<string | null>(null);

  const ttsMutation = trpc.voice.tts.useMutation();

  const handleClick = useCallback(async () => {
    // If playing, pause
    if (status === "playing" && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setStatus("idle");
      return;
    }

    // If loading, ignore
    if (status === "loading") return;

    // Strip markdown formatting for cleaner speech
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/`(.*?)`/g, "$1")
      .replace(/#{1,6}\s/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[🐻🎉🌟💪✨🎓📚🔥⭐️🏆👋😊🐾]/g, "")
      .trim();

    if (!cleanText) return;

    // Truncate if too long
    const truncated = cleanText.length > 4000 ? cleanText.slice(0, 4000) + "..." : cleanText;

    try {
      setStatus("loading");

      // Use cached URL if available
      let audioUrl = cachedUrlRef.current;

      if (!audioUrl) {
        const result = await ttsMutation.mutateAsync({
          text: truncated,
          voice,
          speed,
        });
        audioUrl = result.audioUrl;
        cachedUrlRef.current = audioUrl;
      }

      // Play audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setStatus("idle");
      };
      audio.onerror = () => {
        setStatus("error");
        cachedUrlRef.current = null;
        setTimeout(() => setStatus("idle"), 2000);
      };

      await audio.play();
      setStatus("playing");
    } catch (err) {
      console.error("TTS error:", err);
      setStatus("error");
      cachedUrlRef.current = null;
      setTimeout(() => setStatus("idle"), 2000);
    }
  }, [text, voice, speed, status, ttsMutation]);

  const getIcon = () => {
    switch (status) {
      case "loading":
        return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
      case "playing":
        return <VolumeX className="w-3.5 h-3.5" />;
      case "error":
        return <Volume2 className="w-3.5 h-3.5 text-red-400" />;
      default:
        return <Volume2 className="w-3.5 h-3.5" />;
    }
  };

  const getTooltip = () => {
    switch (status) {
      case "loading":
        return "正在生成语音...";
      case "playing":
        return "点击停止";
      case "error":
        return "语音生成失败，点击重试";
      default:
        return "播放语音";
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={status === "loading"}
      title={getTooltip()}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all
        ${status === "playing"
          ? "bg-[oklch(0.52_0.09_55/0.2)] text-[oklch(0.42_0.09_55)]"
          : status === "error"
          ? "bg-red-50 text-red-400 hover:bg-red-100"
          : "bg-[oklch(0.52_0.09_55/0.08)] text-[oklch(0.52_0.09_55)] hover:bg-[oklch(0.52_0.09_55/0.15)]"
        }
        disabled:opacity-50 disabled:cursor-wait
        ${className}`}
    >
      {getIcon()}
      <span className="hidden sm:inline">
        {status === "loading"
          ? "生成中"
          : status === "playing"
          ? "停止"
          : status === "error"
          ? "重试"
          : "播放"}
      </span>
    </button>
  );
}
