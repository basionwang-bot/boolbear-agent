/*
 * 熊 Agent 导航栏
 * 风格：温暖治愈系，圆润柔和
 * 核心功能直接展示，次要功能收入"更多"下拉
 */
import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, Home, MessageCircle, BarChart3, Users, Heart, BookOpen,
  LogIn, LogOut, Shield, GraduationCap, FileSearch, ChevronDown, MoreHorizontal
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { BEAR_IMAGES } from "@/lib/bearAssets";

// 主导航：最常用的核心功能
const primaryLinks = [
  { href: "/", label: "首页", icon: Home },
  { href: "/chat", label: "聊天", icon: MessageCircle },
  { href: "/courses", label: "课程", icon: GraduationCap },
  { href: "/exam", label: "诊断", icon: FileSearch },
  { href: "/dashboard", label: "看板", icon: BarChart3 },
];

// 次要导航：收入"更多"下拉
const secondaryLinks = [
  { href: "/adopt", label: "领养小熊", icon: Heart },
  { href: "/square", label: "熊熊广场", icon: Users },
  { href: "/gallery", label: "熊熊图鉴", icon: BookOpen },
];

// 移动端全部导航
const allLinks = [...primaryLinks, ...secondaryLinks];

export default function Navbar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, loading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  // 点击外部关闭"更多"下拉
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isSecondaryActive = secondaryLinks.some((l) => location === l.href);

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/85 border-b border-[oklch(0.52_0.09_55/0.08)] shadow-sm">
      <div className="container flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <img
            src={BEAR_IMAGES.grizzly}
            alt="熊 Agent"
            className="w-8 h-8 rounded-full ring-2 ring-[oklch(0.52_0.09_55/0.15)] group-hover:ring-[oklch(0.52_0.09_55/0.4)] transition-all"
          />
          <span className="font-extrabold text-base tracking-tight hidden sm:inline" style={{ color: "oklch(0.52 0.09 55)" }}>
            熊 Agent
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-0.5">
          {primaryLinks.map((link) => {
            const isActive = location === link.href;
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <motion.span
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-200 ${
                    isActive
                      ? "text-white shadow-sm"
                      : "text-foreground/65 hover:text-foreground hover:bg-[oklch(0.52_0.09_55/0.06)]"
                  }`}
                  style={isActive ? { background: "oklch(0.52 0.09 55)" } : {}}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {link.label}
                </motion.span>
              </Link>
            );
          })}

          {/* "更多" 下拉菜单 */}
          <div className="relative" ref={moreRef}>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setMoreOpen(!moreOpen)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-200 ${
                isSecondaryActive
                  ? "text-white shadow-sm"
                  : "text-foreground/65 hover:text-foreground hover:bg-[oklch(0.52_0.09_55/0.06)]"
              }`}
              style={isSecondaryActive ? { background: "oklch(0.52 0.09 55)" } : {}}
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
              更多
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`} />
            </motion.button>

            <AnimatePresence>
              {moreOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full right-0 mt-1.5 w-44 bg-white rounded-xl shadow-lg border border-[oklch(0.52_0.09_55/0.1)] overflow-hidden py-1"
                >
                  {secondaryLinks.map((link) => {
                    const isActive = location === link.href;
                    const Icon = link.icon;
                    return (
                      <Link key={link.href} href={link.href}>
                        <span
                          onClick={() => setMoreOpen(false)}
                          className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-all ${
                            isActive
                              ? "text-white"
                              : "text-foreground/70 hover:bg-[oklch(0.52_0.09_55/0.06)] hover:text-foreground"
                          }`}
                          style={isActive ? { background: "oklch(0.52 0.09 55)" } : {}}
                        >
                          <Icon className="w-4 h-4" />
                          {link.label}
                        </span>
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Admin link */}
          {isAuthenticated && user?.role === "admin" && (
            <Link href="/admin">
              <motion.span
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-200 ${
                  location === "/admin"
                    ? "text-white shadow-sm"
                    : "text-foreground/65 hover:text-foreground hover:bg-[oklch(0.52_0.09_55/0.06)]"
                }`}
                style={location === "/admin" ? { background: "oklch(0.52 0.09 55)" } : {}}
              >
                <Shield className="w-3.5 h-3.5" />
                管理
              </motion.span>
            </Link>
          )}
        </div>

        {/* Auth Area (Desktop) */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {loading ? (
            <div className="w-7 h-7 rounded-full bg-secondary animate-pulse" />
          ) : isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[oklch(0.52_0.09_55/0.06)]">
                <div className="w-5 h-5 rounded-full bg-[oklch(0.52_0.09_55/0.15)] flex items-center justify-center">
                  <span className="text-[10px] font-bold" style={{ color: "oklch(0.52 0.09 55)" }}>
                    {(user?.name || user?.username || "U").charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-xs font-semibold max-w-[80px] truncate" style={{ color: "oklch(0.35 0.06 55)" }}>
                  {user?.name || user?.username || "用户"}
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all"
              >
                <LogOut className="w-3 h-3" />
                退出
              </motion.button>
            </div>
          ) : (
            <Link href="/auth">
              <motion.span
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-white"
                style={{ background: "oklch(0.52 0.09 55)" }}
              >
                <LogIn className="w-3.5 h-3.5" />
                登录
              </motion.span>
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="lg:hidden p-2 rounded-xl hover:bg-[oklch(0.52_0.09_55/0.08)] transition"
          style={{ color: "oklch(0.52 0.09 55)" }}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden overflow-hidden bg-white/95 backdrop-blur-md border-b border-[oklch(0.52_0.09_55/0.08)]"
          >
            <div className="container py-3 flex flex-col gap-0.5">
              {allLinks.map((link) => {
                const isActive = location === link.href;
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href}>
                    <span
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? "text-white"
                          : "text-foreground/70 hover:bg-[oklch(0.52_0.09_55/0.06)]"
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
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      location === "/admin"
                        ? "text-white"
                        : "text-foreground/70 hover:bg-[oklch(0.52_0.09_55/0.06)]"
                    }`}
                    style={location === "/admin" ? { background: "oklch(0.52 0.09 55)" } : {}}
                  >
                    <Shield className="w-4 h-4" />
                    管理
                  </span>
                </Link>
              )}

              {/* Mobile Auth */}
              <div className="mt-2 pt-2 border-t border-[oklch(0.52_0.09_55/0.08)]">
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
