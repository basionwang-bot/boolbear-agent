/**
 * ParticleBackground — 深海生物发光粒子背景
 * 使用 CSS animation 实现缓慢上升的发光粒子效果
 */
import { useMemo } from "react";

interface Particle {
  id: number;
  left: string;
  size: number;
  delay: string;
  duration: string;
  opacity: number;
  color: string;
}

export default function ParticleBackground({ count = 30 }: { count?: number }) {
  const particles = useMemo<Particle[]>(() => {
    const colors = [
      "oklch(0.82 0.15 195)", // cyan
      "oklch(0.82 0.16 160)", // mint
      "oklch(0.82 0.15 195 / 0.6)", // dim cyan
    ];
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 4 + 2,
      delay: `${Math.random() * 15}s`,
      duration: `${Math.random() * 10 + 12}s`,
      opacity: Math.random() * 0.5 + 0.2,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
  }, [count]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.left,
            bottom: `-${p.size}px`,
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            opacity: p.opacity,
            animation: `float-up ${p.duration} ${p.delay} linear infinite`,
          }}
        />
      ))}
    </div>
  );
}
