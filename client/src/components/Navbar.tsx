/*
 * 熊 Agent 导航栏
 * 风格：温暖治愈系，圆润柔和
 * 支持登录/登出状态显示
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Home, MessageCircle, BarChart3, Users, Heart, BookOpen, LogIn, LogOut, Shield, GraduationCap, FileSearch } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { BEAR_IMAGES } from "@/lib/bearAssets";

const navLinks = [
  { href: "/", label: "熊窝首页", icon: Home },
  { href: "/chat", label: "和熊聊天", icon: MessageCircle },
  { href: "/dashboard", label: "成长看板", icon: BarChart3 },
  { href: "/square", label: "熊熊广场", icon: Users },
  { href: "/adopt", label: "领养小熊", icon: Heart },
  { href: "/gallery", label: "熊熊图鉴", icon: BookOpen },
  { href: "/courses", label: "学习课程", icon: GraduationCap },
  { href: "/exam", label: "试卷诊断", icon: FileSearch },
];

export default function Navbar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, loading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

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

          {/* Admin link for admin users */}
          {isAuthenticated && user?.role === "admin" && (
            <Link href="/admin">
              <motion.span
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                  location === "/admin"
                    ? "text-white shadow-md"
                    : "text-foreground/70 hover:bg-[oklch(0.52_0.09_55/0.08)]"
                }`}
                style={location === "/admin" ? { background: "oklch(0.52 0.09 55)" } : {}}
              >
                <Shield className="w-4 h-4" />
                管理
              </motion.span>
            </Link>
          )}
        </div>

        {/* Auth Buttons (Desktop) */}
        <div className="hidden md:flex items-center gap-2">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-secondary animate-pulse" />
          ) : isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold" style={{ color: "oklch(0.30 0.06 55)" }}>
                {user?.name || user?.username || "用户"}
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                退出
              </motion.button>
            </div>
          ) : (
            <Link href="/auth">
              <motion.span
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold text-white"
                style={{ background: "oklch(0.52 0.09 55)" }}
              >
                <LogIn className="w-4 h-4" />
                登录
              </motion.span>
            </Link>
          )}
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

              {/* Admin link for mobile */}
              {isAuthenticated && user?.role === "admin" && (
                <Link href="/admin">
                  <span
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      location === "/admin"
                        ? "text-white"
                        : "text-foreground/70 hover:bg-[oklch(0.52_0.09_55/0.08)]"
                    }`}
                    style={location === "/admin" ? { background: "oklch(0.52 0.09 55)" } : {}}
                  >
                    <Shield className="w-4 h-4" />
                    管理
                  </span>
                </Link>
              )}

              {/* Mobile Auth */}
              <div className="mt-2 pt-2 border-t border-[oklch(0.52_0.09_55/0.1)]">
                {isAuthenticated ? (
                  <div className="flex items-center justify-between px-4 py-2">
                    <span className="text-sm font-semibold" style={{ color: "oklch(0.30 0.06 55)" }}>
                      {user?.name || "用户"}
                    </span>
                    <button
                      onClick={() => { handleLogout(); setMobileOpen(false); }}
                      className="flex items-center gap-1 text-xs text-muted-foreground"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      退出
                    </button>
                  </div>
                ) : (
                  <Link href="/auth">
                    <span
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                      style={{ background: "oklch(0.52 0.09 55)" }}
                    >
                      <LogIn className="w-4 h-4" />
                      登录 / 注册
                    </span>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
