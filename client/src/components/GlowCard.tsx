/**
 * GlowCard — 发光边框卡片组件
 * 深海生物发光风格，hover 时光芒增强
 */
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: "cyan" | "orange" | "gold" | "mint";
  delay?: number;
}

const glowStyles = {
  cyan: {
    border: "oklch(0.82 0.15 195 / 0.2)",
    shadow: "0 0 15px oklch(0.82 0.15 195 / 0.15), 0 0 30px oklch(0.82 0.15 195 / 0.05)",
    hoverShadow: "0 0 20px oklch(0.82 0.15 195 / 0.3), 0 0 40px oklch(0.82 0.15 195 / 0.15)",
  },
  orange: {
    border: "oklch(0.7 0.18 40 / 0.2)",
    shadow: "0 0 15px oklch(0.7 0.18 40 / 0.15), 0 0 30px oklch(0.7 0.18 40 / 0.05)",
    hoverShadow: "0 0 20px oklch(0.7 0.18 40 / 0.3), 0 0 40px oklch(0.7 0.18 40 / 0.15)",
  },
  gold: {
    border: "oklch(0.85 0.15 85 / 0.2)",
    shadow: "0 0 15px oklch(0.85 0.15 85 / 0.15), 0 0 30px oklch(0.85 0.15 85 / 0.05)",
    hoverShadow: "0 0 20px oklch(0.85 0.15 85 / 0.3), 0 0 40px oklch(0.85 0.15 85 / 0.15)",
  },
  mint: {
    border: "oklch(0.82 0.16 160 / 0.2)",
    shadow: "0 0 15px oklch(0.82 0.16 160 / 0.15), 0 0 30px oklch(0.82 0.16 160 / 0.05)",
    hoverShadow: "0 0 20px oklch(0.82 0.16 160 / 0.3), 0 0 40px oklch(0.82 0.16 160 / 0.15)",
  },
};

export default function GlowCard({
  children,
  className = "",
  glowColor = "cyan",
  delay = 0,
}: GlowCardProps) {
  const style = glowStyles[glowColor];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ scale: 1.02 }}
      className={`
        rounded-xl p-6 transition-all duration-500
        ${className}
      `}
      style={{
        background: "oklch(0.16 0.03 260 / 0.6)",
        backdropFilter: "blur(16px)",
        border: `1px solid ${style.border}`,
        boxShadow: style.shadow,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = style.hoverShadow;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = style.shadow;
      }}
    >
      {children}
    </motion.div>
  );
}
