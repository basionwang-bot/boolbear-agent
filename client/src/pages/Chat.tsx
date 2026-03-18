/**
 * Chat — 对话页
 * 设计风格：深海生物发光 (Bioluminescence)
 * 左侧龙虾状态面板 + 右侧对话流 + 底部输入区
 */
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Zap, Brain, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import ParticleBackground from "@/components/ParticleBackground";

const LOBSTER_HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/lobster-hero-5E7aSMe59zcws2kjVc7LDP.webp";
const CHAT_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/chat-bg-Q7cT24boLUD4ZeoKm74BGj.webp";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const MOCK_RESPONSES = [
  "这是一个很好的问题！让我用一个简单的例子来解释。想象你有一个装满水的杯子...\n\n**关键概念：**\n1. 首先，我们需要理解基本原理\n2. 然后，通过类比来加深理解\n3. 最后，用实际例子来验证\n\n你觉得这样解释清楚了吗？如果还有疑问，我们可以继续深入讨论！ 🦞",
  "哈哈，这个知识点确实有点绕！不过别担心，我来帮你梳理一下。\n\n> 核心公式：E = mc²\n\n这个公式告诉我们，质量和能量是可以互相转换的。就像你吃了一碗饭（质量），就有了跑步的力气（能量）一样！\n\n需要我出一道练习题来巩固一下吗？ 💪",
  "你今天已经学了 45 分钟了，真棒！🎉\n\n让我总结一下今天的学习要点：\n\n- ✅ 掌握了二次函数的基本形式\n- ✅ 理解了顶点坐标的计算方法\n- 🔄 还需要练习：判别式的应用\n\n建议你休息 10 分钟后，我们来做几道判别式的练习题，好不好？",
];

const lobsterStats = {
  name: "小龙虾",
  tier: "黄金",
  segment: "II",
  level: 10,
  exp: 720,
  maxExp: 1000,
  wisdom: 85,
  tech: 62,
  traits: "朋友型, 爱举例子",
  domains: "数学, 物理",
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content: "你好呀！我是你的学习龙虾 🦞 今天想学什么呢？可以问我任何问题，我会用最适合你的方式来讲解！",
      timestamp: "10:30",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const responseIndex = useRef(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate streaming response
    const response = MOCK_RESPONSES[responseIndex.current % MOCK_RESPONSES.length];
    responseIndex.current++;

    setTimeout(() => {
      const botMsg: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: response,
        timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <ParticleBackground count={15} />
      <Navbar />

      <div className="flex-1 flex pt-16 relative">
        {/* Left Sidebar: Lobster Status */}
        <motion.aside
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex w-80 flex-col border-r border-border/50 p-6 space-y-6 overflow-y-auto"
          style={{ background: "oklch(0.14 0.028 260 / 0.8)" }}
        >
          {/* Lobster Avatar */}
          <div className="text-center space-y-3">
            <div className="relative inline-block">
              <div
                className="absolute inset-0 rounded-full animate-pulse-glow"
                style={{
                  background: "radial-gradient(circle, oklch(0.82 0.15 195 / 0.2) 0%, transparent 70%)",
                  transform: "scale(1.5)",
                }}
              />
              <img
                src={LOBSTER_HERO}
                alt="龙虾"
                className="w-32 h-32 object-contain animate-breathe relative z-10"
              />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-foreground">{lobsterStats.name}</h3>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span
                  className="px-2 py-0.5 rounded text-xs font-mono font-bold"
                  style={{
                    background: "oklch(0.85 0.15 85 / 0.15)",
                    color: "oklch(0.85 0.15 85)",
                    border: "1px solid oklch(0.85 0.15 85 / 0.3)",
                  }}
                >
                  {lobsterStats.tier} {lobsterStats.segment}
                </span>
                <span className="text-xs text-muted-foreground font-mono">Lv.{lobsterStats.level}</span>
              </div>
            </div>
          </div>

          {/* EXP Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">经验值</span>
              <span className="font-mono text-cyan-glow">{lobsterStats.exp}/{lobsterStats.maxExp}</span>
            </div>
            <div className="relative h-3 rounded-full overflow-hidden" style={{ background: "oklch(0.2 0.03 260)" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(lobsterStats.exp / lobsterStats.maxExp) * 100}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full rounded-full relative"
                style={{ background: "linear-gradient(90deg, oklch(0.82 0.15 195), oklch(0.82 0.16 160))" }}
              >
                <div
                  className="absolute inset-0 animate-shimmer"
                  style={{
                    background: "linear-gradient(90deg, transparent, oklch(1 0 0 / 0.2), transparent)",
                  }}
                />
              </motion.div>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-3">
            <StatRow icon={Brain} label="智慧" value={lobsterStats.wisdom} max={100} color="oklch(0.82 0.15 195)" />
            <StatRow icon={Zap} label="技术" value={lobsterStats.tech} max={100} color="oklch(0.82 0.16 160)" />
            <StatRow icon={Shield} label="耐力" value={45} max={100} color="oklch(0.7 0.18 40)" />
          </div>

          {/* Traits */}
          <div className="space-y-2">
            <h4 className="text-xs text-muted-foreground font-medium uppercase tracking-wider">性格特征</h4>
            <div className="flex flex-wrap gap-1.5">
              {lobsterStats.traits.split(", ").map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-md text-xs font-medium"
                  style={{
                    background: "oklch(0.82 0.15 195 / 0.1)",
                    color: "oklch(0.82 0.15 195)",
                    border: "1px solid oklch(0.82 0.15 195 / 0.2)",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Domains */}
          <div className="space-y-2">
            <h4 className="text-xs text-muted-foreground font-medium uppercase tracking-wider">擅长领域</h4>
            <div className="flex flex-wrap gap-1.5">
              {lobsterStats.domains.split(", ").map((d) => (
                <span
                  key={d}
                  className="px-2.5 py-1 rounded-md text-xs font-medium"
                  style={{
                    background: "oklch(0.7 0.18 40 / 0.1)",
                    color: "oklch(0.7 0.18 40)",
                    border: "1px solid oklch(0.7 0.18 40 / 0.2)",
                  }}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        </motion.aside>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative">
          {/* Chat Background */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url(${CHAT_BG})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 relative z-10">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-base ${
                      msg.role === "assistant" ? "glow-cyan" : ""
                    }`}
                    style={{
                      background: msg.role === "assistant" ? "oklch(0.2 0.04 195)" : "oklch(0.2 0.03 260)",
                      border: `1px solid ${msg.role === "assistant" ? "oklch(0.82 0.15 195 / 0.3)" : "oklch(0.3 0.02 260)"}`,
                    }}
                  >
                    {msg.role === "assistant" ? "🦞" : "🦊"}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"
                    }`}
                    style={{
                      background: msg.role === "user"
                        ? "oklch(0.82 0.15 195 / 0.15)"
                        : "oklch(0.18 0.03 260 / 0.8)",
                      border: `1px solid ${
                        msg.role === "user"
                          ? "oklch(0.82 0.15 195 / 0.2)"
                          : "oklch(0.25 0.03 260)"
                      }`,
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <div className="whitespace-pre-wrap text-foreground">{msg.content}</div>
                    <div className="text-[10px] text-muted-foreground mt-2 text-right">{msg.timestamp}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-base glow-cyan"
                  style={{ background: "oklch(0.2 0.04 195)", border: "1px solid oklch(0.82 0.15 195 / 0.3)" }}
                >
                  🦞
                </div>
                <div
                  className="rounded-2xl rounded-tl-sm px-5 py-4"
                  style={{ background: "oklch(0.18 0.03 260 / 0.8)", border: "1px solid oklch(0.25 0.03 260)" }}
                >
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{ background: "oklch(0.82 0.15 195)" }}
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="relative z-10 p-4 border-t border-border/50" style={{ background: "oklch(0.14 0.028 260 / 0.9)", backdropFilter: "blur(20px)" }}>
            <div className="flex gap-3 items-end max-w-4xl mx-auto">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="输入你的问题..."
                  rows={1}
                  className="w-full resize-none rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-glow/30"
                  style={{
                    background: "oklch(0.18 0.03 260)",
                    border: "1px solid oklch(0.25 0.03 260)",
                  }}
                />
              </div>
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="bg-coral-orange hover:bg-coral-orange/90 text-white rounded-xl px-4 py-3 h-auto glow-orange disabled:opacity-40 disabled:glow-none transition-all"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2 max-w-4xl mx-auto">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="w-3 h-3 text-cyan-glow" />
                <span>本次对话可获得 <span className="text-cyan-glow font-mono">+15</span> 经验值</span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">Kimi · moonshot-v1-8k</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ icon: Icon, label, value, max, color }: { icon: any; label: string; value: number; max: number; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5" style={{ color }} />
          <span className="text-muted-foreground">{label}</span>
        </div>
        <span className="font-mono" style={{ color }}>{value}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(0.2 0.03 260)" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}
