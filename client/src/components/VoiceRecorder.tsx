/**
 * 语音录制按钮组件
 * 点击开始录音 → 再次点击停止 → 自动转写为文字
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Loader2, X, Square } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface VoiceRecorderProps {
  onTranscribed: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceRecorder({
  onTranscribed,
  disabled = false,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const transcribeMutation = trpc.voice.transcribe.useMutation({
    onSuccess: (data) => {
      if (data.text && data.text.trim()) {
        onTranscribed(data.text.trim());
        toast.success(`语音识别成功（${data.duration?.toFixed(1) || "?"}秒）`);
      } else {
        toast.warning("未识别到语音内容，请重试");
      }
      setIsTranscribing(false);
    },
    onError: (err) => {
      toast.error("语音识别失败：" + err.message);
      setIsTranscribing(false);
    },
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
      streamRef.current = stream;
      setPermissionDenied(false);

      // Determine supported MIME type
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        // Clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        // Build blob
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];

        if (blob.size < 100) {
          toast.warning("录音时间太短，请重试");
          setIsRecording(false);
          setDuration(0);
          return;
        }

        // Convert to base64
        setIsTranscribing(true);
        setIsRecording(false);
        setDuration(0);

        try {
          const arrayBuffer = await blob.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(arrayBuffer).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              ""
            )
          );

          transcribeMutation.mutate({
            audioBase64: base64,
            mimeType: mimeType.split(";")[0], // Remove codecs part
            language: "zh",
          });
        } catch {
          toast.error("音频处理失败");
          setIsTranscribing(false);
        }
      };

      recorder.start(250); // Collect data every 250ms
      setIsRecording(true);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((d) => {
          // Auto-stop at 60 seconds
          if (d >= 59) {
            stopRecording();
            return 0;
          }
          return d + 1;
        });
      }, 1000);
    } catch (err: any) {
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        setPermissionDenied(true);
        toast.error("请允许使用麦克风权限");
      } else {
        toast.error("无法启动录音：" + (err.message || "未知错误"));
      }
    }
  }, [transcribeMutation]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const cancelRecording = useCallback(() => {
    // Stop recording without processing
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      };
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    chunksRef.current = [];
    setIsRecording(false);
    setDuration(0);
  }, []);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Transcribing state
  if (isTranscribing) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-2"
      >
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center"
          style={{ background: "oklch(0.52 0.09 55 / 0.15)" }}
        >
          <Loader2
            className="w-5 h-5 animate-spin"
            style={{ color: "oklch(0.52 0.09 55)" }}
          />
        </div>
        <span
          className="text-xs font-medium"
          style={{ color: "oklch(0.52 0.09 55)" }}
        >
          识别中...
        </span>
      </motion.div>
    );
  }

  // Recording state
  if (isRecording) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-2"
      >
        {/* Cancel button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={cancelRecording}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition"
          title="取消录音"
        >
          <X className="w-4 h-4 text-gray-500" />
        </motion.button>

        {/* Recording indicator + timer */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-200">
          {/* Pulsing dot */}
          <motion.div
            className="w-2.5 h-2.5 rounded-full bg-red-500"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="text-sm font-mono font-semibold text-red-600">
            {formatDuration(duration)}
          </span>
        </div>

        {/* Stop button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={stopRecording}
          className="w-11 h-11 rounded-full flex items-center justify-center text-white shadow-md"
          style={{ background: "oklch(0.55 0.20 25)" }}
          title="停止录音并识别"
        >
          <Square className="w-4 h-4 fill-current" />
        </motion.button>
      </motion.div>
    );
  }

  // Default state: mic button
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={startRecording}
      disabled={disabled}
      className="w-11 h-11 rounded-full flex items-center justify-center transition shadow-sm disabled:opacity-40"
      style={{
        background: permissionDenied
          ? "oklch(0.70 0.05 55 / 0.3)"
          : "oklch(0.52 0.09 55 / 0.12)",
        color: permissionDenied
          ? "oklch(0.50 0.05 55)"
          : "oklch(0.52 0.09 55)",
      }}
      title={
        permissionDenied ? "麦克风权限被拒绝，请在浏览器设置中允许" : "按住说话"
      }
    >
      {permissionDenied ? (
        <MicOff className="w-5 h-5" />
      ) : (
        <Mic className="w-5 h-5" />
      )}
    </motion.button>
  );
}
