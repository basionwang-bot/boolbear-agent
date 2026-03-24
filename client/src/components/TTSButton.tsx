/**
 * TTS 播放按钮组件
 * 调用后端 MiniMax TTS API 将小熊回复转为语音并播放
 * 小巧的圆形图标按钮，仅显示图标
 * 根据管理员 TTS 开关决定是否显示
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface TTSButtonProps {
  text: string;
  className?: string;
  /** 播放状态变化回调，用于触发外部光环效果 */
  onPlayingChange?: (isPlaying: boolean) => void;
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
    .replace(/\s{2,}/g, " ")
    .trim();
}

export default function TTSButton({ text, className = "", onPlayingChange }: TTSButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "playing" | "error">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cachedUrlRef = useRef<string | null>(null);

  // Check if TTS is enabled by admin
  const ttsEnabledQuery = trpc.aiConfig.isTtsEnabled.useQuery(undefined, {
    staleTime: 60_000,
    retry: false,
  });

  const ttsMutation = trpc.voice.tts.useMutation();

  // Notify parent when playing state changes
  useEffect(() => {
    onPlayingChange?.(status === "playing");
  }, [status, onPlayingChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleClick = useCallback(async () => {
    // If playing, stop
    if (status === "playing" && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setStatus("idle");
      return;
    }

    // If loading, ignore
    if (status === "loading") return;

    const cleaned = cleanTextForSpeech(text);
    if (!cleaned) return;

    // Truncate if too long
    const truncated = cleaned.length > 4000 ? cleaned.slice(0, 4000) : cleaned;

    try {
      setStatus("loading");

      // Use cached URL if available
      let audioUrl = cachedUrlRef.current;

      if (!audioUrl) {
        const result = await ttsMutation.mutateAsync({
          text: truncated,
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
  }, [text, status, ttsMutation]);

  // Don't render if TTS is disabled or still loading
  if (ttsEnabledQuery.isLoading || !ttsEnabledQuery.data?.enabled) {
    return null;
  }

  const iconSize = "w-3 h-3";

  return (
    <button
      onClick={handleClick}
      disabled={status === "loading"}
      title={
        status === "loading"
          ? "正在生成语音..."
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
