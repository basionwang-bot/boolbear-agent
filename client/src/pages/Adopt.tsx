/**
 * Adopt — 领养龙虾页
 * 设计风格：深海生物发光 (Bioluminescence)
 * 多步骤问卷，定义龙虾的性格和擅长领域
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import ParticleBackground from "@/components/ParticleBackground";
import GlowCard from "@/components/GlowCard";

const LOBSTER_BRONZE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/lobster-bronze-d2Tm6niFfZRw72gpwiGRaj.webp";

const steps = [
  { id: 1, title: "给你的龙虾起个名字", subtitle: "它将成为你的专属学习伙伴" },
  { id: 2, title: "选择龙虾的角色", subtitle: "不同角色有不同的教学风格" },
  { id: 3, title: "你最需要哪些帮助？", subtitle: "龙虾会重点在这些领域辅导你" },
  { id: 4, title: "你喜欢什么讲解方式？", subtitle: "龙虾会用你最喜欢的方式教你" },
  { id: 5, title: "领养成功！", subtitle: "你的龙虾已经准备好了" },
];

const roles = [
  { id: "teacher", emoji: "👨‍🏫", name: "老师型", desc: "认真负责，讲课清楚" },
  { id: "senior", emoji: "🧑‍🎓", name: "学长型", desc: "经验丰富，亲切随和" },
  { id: "tutor", emoji: "📚", name: "家教型", desc: "安静细心，一对一陪伴" },
  { id: "friend", emoji: "🤝", name: "朋友型", desc: "什么都聊，顺便学习" },
];

const usages = [
  { id: "explain", emoji: "💡", name: "讲题解惑" },
  { id: "check", emoji: "✅", name: "查错改题" },
  { id: "plan", emoji: "📋", name: "学习规划" },
  { id: "english", emoji: "🌍", name: "英语练习" },
  { id: "writing", emoji: "✍️", name: "写作辅导" },
  { id: "chat", emoji: "💬", name: "泛知识聊天" },
];

const explainStyles = [
  { id: "step_by_step", emoji: "📝", name: "步骤细致", desc: "把复杂问题拆成小步骤" },
  { id: "big_picture", emoji: "🗺️", name: "思路优先", desc: "先建立整体思路再补细节" },
  { id: "examples", emoji: "🎯", name: "爱举例子", desc: "用生活例子解释抽象概念" },
  { id: "socratic", emoji: "❓", name: "提问引导", desc: "先提问让你思考再引导" },
];

export default function Adopt() {
  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState("");
  const [role, setRole] = useState("");
  const [selectedUsages, setSelectedUsages] = useState<string[]>([]);
  const [explainStyle, setExplainStyle] = useState("");
  const [, navigate] = useLocation();

  const canNext = () => {
    if (step === 1) return nickname.trim().length > 0;
    if (step === 2) return role !== "";
    if (step === 3) return selectedUsages.length > 0;
    if (step === 4) return explainStyle !== "";
    return true;
  };

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleUsage = (id: string) => {
    setSelectedUsages((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    );
  };

  const handleComplete = () => {
    toast.success("领养成功！你的龙虾已经准备好了！");
    navigate("/chat");
  };

  return (
    <div className="min-h-screen relative">
      <ParticleBackground count={25} />
      <Navbar />

      <div className="pt-24 pb-12 flex items-center justify-center min-h-screen">
        <div className="container max-w-2xl">
          {/* Progress */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 mb-8"
          >
            {steps.slice(0, -1).map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all duration-500 ${
                    step > s.id ? "glow-cyan" : step === s.id ? "glow-cyan" : ""
                  }`}
                  style={{
                    background: step >= s.id ? "oklch(0.82 0.15 195)" : "oklch(0.2 0.03 260)",
                    color: step >= s.id ? "oklch(0.12 0.025 260)" : "oklch(0.5 0.02 260)",
                  }}
                >
                  {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                </div>
                {i < steps.length - 2 && (
                  <div
                    className="w-12 h-0.5 rounded transition-all duration-500"
                    style={{
                      background: step > s.id ? "oklch(0.82 0.15 195)" : "oklch(0.25 0.03 260)",
                    }}
                  />
                )}
              </div>
            ))}
          </motion.div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <GlowCard glowColor={step === 5 ? "gold" : "cyan"} className="py-8 px-8">
                {/* Header */}
                <div className="text-center mb-8">
                  <h2 className="font-display text-2xl font-bold text-foreground">{steps[step - 1].title}</h2>
                  <p className="text-sm text-muted-foreground mt-2">{steps[step - 1].subtitle}</p>
                </div>

                {/* Step 1: Nickname */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="flex justify-center">
                      <img src={LOBSTER_BRONZE} alt="小龙虾" className="w-32 h-32 object-contain animate-breathe" />
                    </div>
                    <div className="max-w-sm mx-auto">
                      <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="例如：小龙虾、学习伙伴..."
                        maxLength={20}
                        className="w-full px-4 py-3 rounded-xl text-center font-display text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-glow/30"
                        style={{
                          background: "oklch(0.18 0.03 260)",
                          border: "1px solid oklch(0.25 0.03 260)",
                        }}
                      />
                      <p className="text-xs text-muted-foreground text-center mt-2">{nickname.length}/20</p>
                    </div>
                  </div>
                )}

                {/* Step 2: Role */}
                {step === 2 && (
                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                    {roles.map((r) => (
                      <motion.button
                        key={r.id}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setRole(r.id)}
                        className={`p-4 rounded-xl text-center transition-all duration-300 ${
                          role === r.id ? "glow-cyan" : ""
                        }`}
                        style={{
                          background: role === r.id ? "oklch(0.82 0.15 195 / 0.1)" : "oklch(0.18 0.03 260)",
                          border: `1px solid ${role === r.id ? "oklch(0.82 0.15 195 / 0.4)" : "oklch(0.25 0.03 260)"}`,
                        }}
                      >
                        <span className="text-3xl">{r.emoji}</span>
                        <div className="font-display text-sm font-semibold text-foreground mt-2">{r.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{r.desc}</div>
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Step 3: Usages */}
                {step === 3 && (
                  <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                    {usages.map((u) => {
                      const isSelected = selectedUsages.includes(u.id);
                      return (
                        <motion.button
                          key={u.id}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => toggleUsage(u.id)}
                          className={`p-3 rounded-xl text-center transition-all duration-300 ${
                            isSelected ? "glow-cyan" : ""
                          }`}
                          style={{
                            background: isSelected ? "oklch(0.82 0.15 195 / 0.1)" : "oklch(0.18 0.03 260)",
                            border: `1px solid ${isSelected ? "oklch(0.82 0.15 195 / 0.4)" : "oklch(0.25 0.03 260)"}`,
                          }}
                        >
                          <span className="text-2xl">{u.emoji}</span>
                          <div className="text-xs font-medium text-foreground mt-1.5">{u.name}</div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {/* Step 4: Explain Style */}
                {step === 4 && (
                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                    {explainStyles.map((s) => (
                      <motion.button
                        key={s.id}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setExplainStyle(s.id)}
                        className={`p-4 rounded-xl text-center transition-all duration-300 ${
                          explainStyle === s.id ? "glow-cyan" : ""
                        }`}
                        style={{
                          background: explainStyle === s.id ? "oklch(0.82 0.15 195 / 0.1)" : "oklch(0.18 0.03 260)",
                          border: `1px solid ${explainStyle === s.id ? "oklch(0.82 0.15 195 / 0.4)" : "oklch(0.25 0.03 260)"}`,
                        }}
                      >
                        <span className="text-3xl">{s.emoji}</span>
                        <div className="font-display text-sm font-semibold text-foreground mt-2">{s.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{s.desc}</div>
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Step 5: Complete */}
                {step === 5 && (
                  <div className="text-center space-y-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    >
                      <div className="relative inline-block">
                        <div
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: "radial-gradient(circle, oklch(0.85 0.15 85 / 0.3) 0%, transparent 70%)",
                            transform: "scale(1.8)",
                            animation: "pulse-glow 2s ease-in-out infinite",
                          }}
                        />
                        <img
                          src={LOBSTER_BRONZE}
                          alt="你的龙虾"
                          className="w-40 h-40 object-contain animate-breathe relative z-10"
                        />
                      </div>
                    </motion.div>

                    <div className="space-y-2">
                      <h3 className="font-display text-2xl font-bold text-amber-gold text-glow-orange">
                        「{nickname || "小龙虾"}」
                      </h3>
                      <p className="text-muted-foreground">
                        {roles.find((r) => r.id === role)?.name || "朋友型"} · 青铜 IV · Lv.1
                      </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-2">
                      {selectedUsages.map((u) => {
                        const usage = usages.find((x) => x.id === u);
                        return (
                          <span
                            key={u}
                            className="px-3 py-1 rounded-md text-xs font-medium"
                            style={{
                              background: "oklch(0.82 0.15 195 / 0.1)",
                              color: "oklch(0.82 0.15 195)",
                              border: "1px solid oklch(0.82 0.15 195 / 0.2)",
                            }}
                          >
                            {usage?.emoji} {usage?.name}
                          </span>
                        );
                      })}
                    </div>

                    <Button
                      onClick={handleComplete}
                      size="lg"
                      className="bg-coral-orange hover:bg-coral-orange/90 text-white font-display font-semibold px-10 glow-orange transition-all duration-300 hover:glow-orange-strong"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      开始冒险
                    </Button>
                  </div>
                )}

                {/* Navigation Buttons */}
                {step < 5 && (
                  <div className="flex justify-between mt-8">
                    <Button
                      variant="outline"
                      onClick={handlePrev}
                      disabled={step === 1}
                      className="border-border text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      上一步
                    </Button>
                    <Button
                      onClick={handleNext}
                      disabled={!canNext()}
                      className="bg-cyan-glow hover:bg-cyan-glow/90 text-background font-semibold px-6 disabled:opacity-40"
                    >
                      下一步
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </GlowCard>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
