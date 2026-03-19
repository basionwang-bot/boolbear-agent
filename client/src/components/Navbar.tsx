/**
 * Navbar — 深海风格顶部导航栏
 * 玻璃拟态效果，带发光边框底线
 */
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { MessageCircle, LayoutDashboard, Users, Home, Sparkles } from "lucide-react";

const navItems = [
  { path: "/", label: "首页", icon: Home },
  { path: "/chat", label: "对话", icon: MessageCircle },
  { path: "/dashboard", label: "养成", icon: LayoutDashboard },
  { path: "/square", label: "广场", icon: Users },
  { path: "/gallery", label: "展示库", icon: Sparkles },
];

export default function Navbar() {
  const [location] = useLocation();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-cyan-glow/20"
      style={{
        background: "oklch(0.12 0.025 260 / 0.85)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center gap-3 group">
            <span className="text-2xl">🦞</span>
            <span className="font-display font-bold text-lg text-cyan-glow text-glow-cyan tracking-wide">
              龙虾 Agent
            </span>
          </div>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
                    ${isActive
                      ? "text-cyan-glow glow-cyan"
                      : "text-muted-foreground hover:text-foreground"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 rounded-lg border border-cyan-glow/30"
                      style={{ background: "oklch(0.82 0.15 195 / 0.08)" }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-lg border border-cyan-glow/30 glow-cyan"
            style={{ background: "oklch(0.2 0.03 260)" }}
          >
            🦊
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
}
