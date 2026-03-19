/*
 * 熊 Agent — 注册/登录页面
 * 简洁温暖的认证界面，支持用户名+密码+邀请码注册
 */
import { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn, UserPlus, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { BEAR_IMAGES } from "@/lib/bearAssets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const utils = trpc.useUtils();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Validate invite code (debounced)
  const codeQuery = trpc.class.validateCode.useQuery(
    { inviteCode },
    { enabled: mode === "register" && inviteCode.length >= 4, retry: false }
  );

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success("注册成功！欢迎来到熊 Agent");
      utils.auth.me.invalidate();
      navigate("/adopt");
    },
    onError: (err) => {
      toast.error(err.message || "注册失败");
    },
  });

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("登录成功！");
      utils.auth.me.invalidate();
      navigate("/");
    },
    onError: (err) => {
      toast.error(err.message || "登录失败");
    },
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (mode === "register") {
        if (!inviteCode) {
          toast.error("请输入班级邀请码");
          return;
        }
        registerMutation.mutate({ username, password, inviteCode });
      } else {
        loginMutation.mutate({ username, password });
      }
    },
    [mode, username, password, inviteCode, registerMutation, loginMutation]
  );

  const isLoading = registerMutation.isPending || loginMutation.isPending;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 opacity-10">
          <img src={BEAR_IMAGES.grizzly} alt="" className="w-32" />
        </div>
        <div className="absolute bottom-10 right-10 opacity-10">
          <img src={BEAR_IMAGES.panda} alt="" className="w-28" />
        </div>
        <div className="absolute top-1/2 right-20 opacity-5">
          <img src={BEAR_IMAGES.polar} alt="" className="w-36" />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.img
            src={BEAR_IMAGES.group}
            alt="熊 Agent"
            className="w-32 h-32 mx-auto mb-4 drop-shadow-lg"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <h1 className="text-3xl font-black" style={{ color: "oklch(0.30 0.06 55)" }}>
            熊 Agent
          </h1>
          <p className="text-muted-foreground mt-1">AI 学习伙伴养成平台</p>
        </div>

        {/* Auth Card */}
        <div className="bear-card p-6 sm:p-8">
          {/* Tab Switcher */}
          <div className="flex gap-1 bg-secondary rounded-xl p-1 mb-6">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                mode === "login"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LogIn className="w-4 h-4" />
              登录
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                mode === "register"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold">
                用户名
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="输入你的用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={2}
                maxLength={32}
                className="h-11"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">
                密码
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === "register" ? "设置密码（至少6位）" : "输入密码"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={mode === "register" ? 6 : 1}
                  maxLength={64}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Invite Code (register only) */}
            {mode === "register" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <Label htmlFor="inviteCode" className="text-sm font-semibold">
                  班级邀请码
                </Label>
                <div className="relative">
                  <Input
                    id="inviteCode"
                    type="text"
                    placeholder="请输入老师给的邀请码"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    required
                    className="h-11 pr-10 uppercase tracking-widest"
                  />
                  {inviteCode.length >= 4 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {codeQuery.isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      ) : codeQuery.data?.valid ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {codeQuery.data?.valid && (
                  <p className="text-xs text-green-600 font-medium">
                    班级：{codeQuery.data.className}
                  </p>
                )}
                {inviteCode.length >= 4 && codeQuery.data && !codeQuery.data.valid && (
                  <p className="text-xs text-red-500 font-medium">邀请码无效，请检查后重试</p>
                )}
              </motion.div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 text-base font-bold rounded-xl text-white"
              style={{ background: "oklch(0.52 0.09 55)" }}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : mode === "login" ? (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  登录
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  注册
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          熊 Agent — 让 AI 学习变得温暖有趣
        </p>
      </motion.div>
    </div>
  );
}
