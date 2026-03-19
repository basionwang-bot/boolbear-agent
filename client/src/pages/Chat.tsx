/*
 * 熊 Agent — 对话页
 * 温暖的熊窝书房背景，模拟流式对话
 */
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, RotateCcw, Brain, Zap, Shield } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import { BEAR_IMAGES } from "@/lib/bearAssets";

interface Message {
  id: string;
  role: "user" | "bear";
  content: string;
  timestamp: Date;
}

const MOCK_REPLIES = [
  "嘿！这是一个很好的问题！让我想想怎么用最简单的方式解释给你听……\n\n**关键概念：**\n1. 首先，我们需要理解基本原理\n2. 然后，通过类比来加深理解\n3. 最后，用实际例子来验证\n\n你觉得这样解释清楚了吗？",
  "哇，你今天学习好认真！让我来帮你分析一下这个知识点。首先，我们需要理解基本概念……就像在森林里找路一样，先确定方向，再一步步走！",
  "冰冰觉得：这个问题的关键在于理解底层逻辑。让我一步一步带你走。\n\n> 核心公式：E = mc²\n\n这个公式告诉我们，质量和能量是可以互相转换的。就像你吃了一碗蜂蜜（质量），就有了爬树的力气（能量）一样！",
  "圆圆正在查资料中……找到了！这个知识点其实可以这样理解：把复杂的概念拆分成小块，就像吃竹子一样，一节一节来。",
  "可可觉得你问得太棒了！这说明你已经在深入思考了。来，我们一起把这个问题搞清楚！\n\n你今天已经学了 45 分钟了，真棒！建议你休息 10 分钟后，我们来做几道练习题，好不好？",
];

const bearStats = {
  name: "可可",
  tier: "黄金",
  level: 10,
  exp: 720,
  maxExp: 1000,
  wisdom: 85,
  tech: 62,
  traits: ["朋友型", "爱举例子", "幽默"],
  domains: ["数学", "物理", "编程"],
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bear",
      content: "嗨！我是你的学习小熊可可！今天想学点什么呢？随便问我吧，我会用最有趣的方式帮你理解！",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const responseIndex = useRef(0);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim() || isTyping) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    const reply = MOCK_REPLIES[responseIndex.current % MOCK_REPLIES.length];
    responseIndex.current++;

    setTimeout(() => {
      const bearMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "bear",
        content: reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, bearMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <Navbar />

      <div className="flex-1 flex relative">
        {/* Left Sidebar: Bear Status */}
        <motion.aside
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex w-80 flex-col border-r border-[oklch(0.52_0.09_55/0.1)] p-6 space-y-5 overflow-y-auto bg-white"
        >
          {/* Bear Avatar */}
          <div className="text-center space-y-3">
            <motion.img
              src={BEAR_IMAGES.grizzly}
              alt="可可"
              className="w-32 h-32 mx-auto object-contain"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <div>
              <h3 className="font-extrabold text-xl" style={{ color: "oklch(0.30 0.06 55)" }}>{bearStats.name}</h3>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: "#FFFBE6", color: "#B8860B", border: "1px solid #FFD70040" }}
                >
                  {bearStats.tier}
                </span>
                <span className="text-xs text-muted-foreground">Lv.{bearStats.level}</span>
              </div>
            </div>
          </div>

          {/* EXP Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">经验值</span>
              <span className="font-mono font-semibold" style={{ color: "oklch(0.52 0.09 55)" }}>{bearStats.exp}/{bearStats.maxExp}</span>
            </div>
            <div className="relative h-3 rounded-full overflow-hidden bg-[oklch(0.52_0.09_55/0.1)]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(bearStats.exp / bearStats.maxExp) * 100}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, oklch(0.52 0.09 55), oklch(0.65 0.12 65))" }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-3">
            <StatRow icon={Brain} label="智慧" value={bearStats.wisdom} max={100} color="oklch(0.52 0.09 55)" />
            <StatRow icon={Zap} label="技术" value={bearStats.tech} max={100} color="oklch(0.50 0.10 155)" />
            <StatRow icon={Shield} label="耐力" value={45} max={100} color="oklch(0.75 0.12 65)" />
          </div>

          {/* Traits */}
          <div className="space-y-2">
            <h4 className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">性格特征</h4>
            <div className="flex flex-wrap gap-1.5">
              {bearStats.traits.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ background: "oklch(0.52 0.09 55 / 0.08)", color: "oklch(0.42 0.09 55)" }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Domains */}
          <div className="space-y-2">
            <h4 className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">擅长领域</h4>
            <div className="flex flex-wrap gap-1.5">
              {bearStats.domains.map((d) => (
                <span
                  key={d}
                  className="px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ background: "oklch(0.50 0.10 155 / 0.08)", color: "oklch(0.40 0.10 155)" }}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>

          {/* Emotion Status */}
          <div className="mt-auto pt-4 border-t border-[oklch(0.52_0.09_55/0.1)]">
            <div className="flex items-center gap-3">
              <motion.img
                src={isTyping ? BEAR_IMAGES.thinking : BEAR_IMAGES.studying}
                alt="状态"
                className="w-12 h-12"
                animate={isTyping ? { rotate: [0, -3, 3, 0] } : { scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div>
                <p className="text-xs font-semibold" style={{ color: "oklch(0.30 0.06 55)" }}>
                  {isTyping ? "思考中..." : "心情很好！"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {isTyping ? "正在组织语言" : "随时准备帮你学习"}
                </p>
              </div>
            </div>
          </div>
        </motion.aside>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative">
          {/* Chat Background */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: `url(${BEAR_IMAGES.chatBg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />

          {/* Chat Header (mobile) */}
          <div className="lg:hidden px-4 py-3 border-b border-[oklch(0.52_0.09_55/0.1)] flex items-center gap-3 bg-white/90 backdrop-blur-sm relative z-10">
            <img src={BEAR_IMAGES.grizzly} alt="可可" className="w-10 h-10 rounded-full" />
            <div>
              <h2 className="font-bold text-sm" style={{ color: "oklch(0.30 0.06 55)" }}>可可 · 你的学习伙伴</h2>
              <p className="text-xs text-muted-foreground">黄金段位 · 经验值 {bearStats.exp}</p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 relative z-10">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {msg.role === "bear" && (
                    <img src={BEAR_IMAGES.grizzly} alt="可可" className="w-9 h-9 rounded-full shrink-0 mt-1" />
                  )}
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      msg.role === "user"
                        ? "text-white rounded-br-md"
                        : "bg-white text-foreground rounded-bl-md border border-[oklch(0.52_0.09_55/0.1)]"
                    }`}
                    style={msg.role === "user" ? { background: "oklch(0.52 0.09 55)" } : {}}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    <div className="text-[10px] mt-2 text-right opacity-60">
                      {msg.timestamp.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-9 h-9 rounded-full shrink-0 mt-1 flex items-center justify-center text-sm font-bold text-white" style={{ background: "oklch(0.50 0.10 155)" }}>
                      我
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                <img src={BEAR_IMAGES.grizzly} alt="可可" className="w-9 h-9 rounded-full shrink-0" />
                <div className="bg-white px-5 py-4 rounded-2xl rounded-bl-md border border-[oklch(0.52_0.09_55/0.1)] shadow-sm">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{ background: "oklch(0.52 0.09 55)" }}
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-[oklch(0.52_0.09_55/0.1)] bg-white/90 backdrop-blur-sm relative z-10">
            <div className="flex items-center gap-3 max-w-3xl mx-auto">
              <div className="flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="问小熊任何问题……"
                  className="w-full px-4 py-3 rounded-2xl bg-[oklch(0.97_0.01_85)] border border-[oklch(0.52_0.09_55/0.15)] text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.52_0.09_55/0.3)] transition"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="w-11 h-11 rounded-full flex items-center justify-center text-white disabled:opacity-40 transition shadow-md"
                style={{ background: "oklch(0.52 0.09 55)" }}
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
            <div className="flex items-center gap-4 mt-2 px-1 max-w-3xl mx-auto">
              <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition">
                <Sparkles className="w-3 h-3" /> AI 建议
              </button>
              <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition">
                <RotateCcw className="w-3 h-3" /> 重新生成
              </button>
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
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="w-3.5 h-3.5" style={{ color }} />
          {label}
        </span>
        <span className="font-mono font-semibold" style={{ color }}>{value}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden bg-[oklch(0.52_0.09_55/0.08)]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}
