/*
 * 熊 Agent 导航栏
 * 风格：温暖治愈系，圆润柔和
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Home, MessageCircle, BarChart3, Users, Heart, BookOpen } from "lucide-react";
import { BEAR_IMAGES } from "@/lib/bearAssets";

const navLinks = [
  { href: "/", label: "熊窝首页", icon: Home },
  { href: "/chat", label: "和熊聊天", icon: MessageCircle },
  { href: "/dashboard", label: "成长看板", icon: BarChart3 },
  { href: "/square", label: "熊熊广场", icon: Users },
  { href: "/adopt", label: "领养小熊", icon: Heart },
  { href: "/gallery", label: "熊熊图鉴", icon: BookOpen },
];

export default function Navbar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-[oklch(0.52_0.09_55/0.1)]">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <img
            src={BEAR_IMAGES.grizzly}
            alt="熊 Agent"
            className="w-9 h-9 rounded-full ring-2 ring-[oklch(0.52_0.09_55/0.2)] group-hover:ring-[oklch(0.52_0.09_55/0.5)] transition-all"
          />
          <span className="font-extrabold text-lg tracking-tight" style={{ color: "oklch(0.52 0.09 55)" }}>
            熊 Agent
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = location === link.href;
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? "text-white shadow-md"
                      : "text-foreground/70 hover:bg-[oklch(0.52_0.09_55/0.08)]"
                  }`}
                  style={isActive ? { background: "oklch(0.52 0.09 55)" } : {}}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full -z-10"
                      style={{ background: "oklch(0.52 0.09 55)" }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.span>
              </Link>
            );
          })}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 rounded-xl hover:bg-[oklch(0.52_0.09_55/0.1)] transition"
          style={{ color: "oklch(0.52 0.09 55)" }}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden bg-white/95 backdrop-blur-md border-b border-[oklch(0.52_0.09_55/0.1)]"
          >
            <div className="container py-3 flex flex-col gap-1">
              {navLinks.map((link) => {
                const isActive = location === link.href;
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href}>
                    <span
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? "text-white"
                          : "text-foreground/70 hover:bg-[oklch(0.52_0.09_55/0.08)]"
                      }`}
                      style={isActive ? { background: "oklch(0.52 0.09 55)" } : {}}
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
