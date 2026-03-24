/**
 * BearAudioRing — Apple AI 风格炫彩光环
 * 在小熊头像周围绘制动态彩色光环，TTS 播放时亮起并随音频频率跳动
 */
import { useEffect, useRef, useCallback } from "react";

interface BearAudioRingProps {
  /** 是否正在播放语音 */
  isPlaying: boolean;
  /** 关联的 Audio 元素，用于 Web Audio API 频率分析 */
  audioElement?: HTMLAudioElement | null;
  /** 头像尺寸（px），光环会在此基础上向外扩展 */
  avatarSize?: number;
  className?: string;
}

// 炫彩渐变色停（类似 Apple AI 的彩虹色）
const GRADIENT_STOPS = [
  { offset: 0,    color: "oklch(0.75 0.20 15)" },   // 珊瑚红
  { offset: 0.16, color: "oklch(0.78 0.18 55)" },   // 琥珀橙
  { offset: 0.33, color: "oklch(0.80 0.16 130)" },  // 草绿
  { offset: 0.50, color: "oklch(0.75 0.20 200)" },  // 天蓝
  { offset: 0.66, color: "oklch(0.72 0.22 270)" },  // 紫罗兰
  { offset: 0.83, color: "oklch(0.74 0.24 320)" },  // 粉玫瑰
  { offset: 1.0,  color: "oklch(0.75 0.20 15)" },   // 回到珊瑚红（闭合）
];

function oklchToRgb(oklchStr: string): string {
  // Map our predefined oklch values to RGB for canvas
  const map: Record<string, string> = {
    "oklch(0.75 0.20 15)":  "#FF6B6B",
    "oklch(0.78 0.18 55)":  "#FFA94D",
    "oklch(0.80 0.16 130)": "#69DB7C",
    "oklch(0.75 0.20 200)": "#4DABF7",
    "oklch(0.72 0.22 270)": "#9775FA",
    "oklch(0.74 0.24 320)": "#F783AC",
  };
  return map[oklchStr] || "#FFFFFF";
}

export default function BearAudioRing({
  isPlaying,
  audioElement,
  avatarSize = 36,
  className = "",
}: BearAudioRingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const phaseRef = useRef(0);
  const opacityRef = useRef(0); // 0=隐藏, 1=完全显示（用于淡入淡出）

  const canvasSize = avatarSize + 32; // 光环向外扩展 16px
  const cx = canvasSize / 2;
  const cy = canvasSize / 2;
  const innerR = avatarSize / 2 + 3;  // 光环内径（紧贴头像外圈）
  const outerR = avatarSize / 2 + 14; // 光环外径

  // 初始化 Web Audio API
  const initAudio = useCallback(() => {
    if (!audioElement || analyserRef.current) return;
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      const source = ctx.createMediaElementSource(audioElement);
      sourceRef.current = source;
      source.connect(analyser);
      analyser.connect(ctx.destination);
    } catch {
      // Web Audio API 不可用时静默失败，仍显示动画
    }
  }, [audioElement]);

  // 获取当前音量（0-1）
  const getVolume = useCallback((): number => {
    if (!analyserRef.current) return 0.5; // 无分析器时用默认值
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(data);
    const avg = data.reduce((s, v) => s + v, 0) / data.length;
    return Math.min(avg / 128, 1);
  }, []);

  // 绘制单帧
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasSize, canvasSize);

    const opacity = opacityRef.current;
    if (opacity <= 0.01) return;

    const volume = isPlaying ? getVolume() : 0;
    // 光环厚度随音量跳动（4px ~ 11px）
    const ringThickness = innerR + (outerR - innerR) * (0.35 + volume * 0.65);
    // 旋转速度随音量加快
    phaseRef.current += 0.012 + volume * 0.025;

    // 创建旋转渐变（conic gradient 效果用多段 arc 模拟）
    const segments = 120;
    for (let i = 0; i < segments; i++) {
      const startAngle = (i / segments) * Math.PI * 2 + phaseRef.current;
      const endAngle = ((i + 1.5) / segments) * Math.PI * 2 + phaseRef.current;

      // 颜色插值
      const t = (i / segments + (phaseRef.current / (Math.PI * 2))) % 1;
      const colorIdx = t * (GRADIENT_STOPS.length - 1);
      const lo = Math.floor(colorIdx);
      const hi = Math.min(lo + 1, GRADIENT_STOPS.length - 1);
      const frac = colorIdx - lo;

      const c1 = oklchToRgb(GRADIENT_STOPS[lo].color);
      const c2 = oklchToRgb(GRADIENT_STOPS[hi].color);

      // 简单混色
      const r1 = parseInt(c1.slice(1, 3), 16);
      const g1 = parseInt(c1.slice(3, 5), 16);
      const b1 = parseInt(c1.slice(5, 7), 16);
      const r2 = parseInt(c2.slice(1, 3), 16);
      const g2 = parseInt(c2.slice(3, 5), 16);
      const b2 = parseInt(c2.slice(5, 7), 16);
      const r = Math.round(r1 + (r2 - r1) * frac);
      const g = Math.round(g1 + (g2 - g1) * frac);
      const b = Math.round(b1 + (b2 - b1) * frac);

      ctx.beginPath();
      ctx.arc(cx, cy, (innerR + ringThickness) / 2, startAngle, endAngle);
      ctx.lineWidth = ringThickness - innerR + 4;
      ctx.strokeStyle = `rgba(${r},${g},${b},${opacity * 0.9})`;
      ctx.stroke();
    }

    // 外层柔和光晕（blur 效果用多层半透明圆弧模拟）
    for (let layer = 0; layer < 3; layer++) {
      const glowR = outerR + layer * 4;
      const glowOpacity = opacity * (0.15 - layer * 0.04);
      const gradient = ctx.createRadialGradient(cx, cy, innerR, cx, cy, glowR + 6);
      gradient.addColorStop(0, `rgba(180,120,255,${glowOpacity})`);
      gradient.addColorStop(0.5, `rgba(100,180,255,${glowOpacity * 0.6})`);
      gradient.addColorStop(1, `rgba(255,100,150,0)`);
      ctx.beginPath();
      ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
      ctx.lineWidth = 6;
      ctx.strokeStyle = gradient;
      ctx.stroke();
    }
  }, [isPlaying, canvasSize, cx, cy, innerR, outerR, getVolume]);

  // 动画循环
  const animate = useCallback(() => {
    const targetOpacity = isPlaying ? 1 : 0;
    const current = opacityRef.current;
    // 淡入快（0.08），淡出慢（0.04）
    const step = targetOpacity > current ? 0.08 : 0.04;
    opacityRef.current = Math.abs(current - targetOpacity) < step
      ? targetOpacity
      : current + (targetOpacity > current ? step : -step);

    drawFrame();

    if (opacityRef.current > 0 || isPlaying) {
      animFrameRef.current = requestAnimationFrame(animate);
    }
  }, [isPlaying, drawFrame]);

  // 启动/停止动画
  useEffect(() => {
    if (isPlaying) {
      initAudio();
      if (audioCtxRef.current?.state === "suspended") {
        audioCtxRef.current.resume();
      }
    }

    cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, animate, initAudio]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      if (sourceRef.current) {
        try { sourceRef.current.disconnect(); } catch {}
      }
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch {}
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize}
      height={canvasSize}
      className={`absolute pointer-events-none ${className}`}
      style={{
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        filter: "blur(0.5px)",
      }}
    />
  );
}
