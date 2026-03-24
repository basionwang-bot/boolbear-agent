/**
 * ChatGlowRing — Apple AI 风格聊天窗口炫彩光环
 * TTS 播放时在聊天窗口四周亮起旋转彩色光环
 * 纯 CSS + requestAnimationFrame 实现，无需 Canvas
 */
import { useEffect, useRef } from "react";

interface ChatGlowRingProps {
  isPlaying: boolean;
}

export default function ChatGlowRing({ isPlaying }: ChatGlowRingProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const opacityRef = useRef(0);
  const animRef = useRef<number>(0);
  const angleRef = useRef(0);

  useEffect(() => {
    const outer = outerRef.current;
    const glow = glowRef.current;
    if (!outer || !glow) return;

    const tick = () => {
      // 淡入淡出
      const target = isPlaying ? 1 : 0;
      const diff = target - opacityRef.current;
      const step = isPlaying ? 0.04 : 0.025;
      if (Math.abs(diff) < step) {
        opacityRef.current = target;
      } else {
        opacityRef.current += diff > 0 ? step : -step;
      }

      const op = opacityRef.current;

      // 旋转速度：播放时 1.5°/frame，停止时继续转但减速
      angleRef.current = (angleRef.current + (op > 0.01 ? 1.5 : 0)) % 360;
      const a = angleRef.current;

      if (op > 0.005) {
        const gradient = `conic-gradient(
          from ${a}deg,
          #FF6B6B,
          #FF922B,
          #FFD43B,
          #51CF66,
          #339AF0,
          #7950F2,
          #F06595,
          #FF6B6B
        )`;

        // 边框光环：用 padding + mask 技巧只显示边框
        outer.style.opacity = String(Math.min(op * 1.2, 1));
        outer.style.background = gradient;

        // 外层模糊光晕
        glow.style.opacity = String(op * 0.6);
        glow.style.background = gradient;
      } else {
        outer.style.opacity = "0";
        glow.style.opacity = "0";
      }

      if (op > 0.005 || isPlaying) {
        animRef.current = requestAnimationFrame(tick);
      }
    };

    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying]);

  return (
    <>
      {/* 边框光环层：3px 彩色边框 */}
      <div
        ref={outerRef}
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          opacity: 0,
          borderRadius: "inherit",
          padding: "3px",
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      {/* 外层柔和光晕：向外扩散 12px */}
      <div
        ref={glowRef}
        className="absolute pointer-events-none z-0"
        style={{
          inset: "-8px",
          opacity: 0,
          borderRadius: "inherit",
          filter: "blur(14px)",
        }}
      />
    </>
  );
}
