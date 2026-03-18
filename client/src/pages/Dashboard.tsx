/**
 * Dashboard — 养成看板
 * 设计风格：深海生物发光 (Bioluminescence)
 * 卡片式仪表盘，展示龙虾属性、学习数据和成就
 */
import { motion } from "framer-motion";
import { Brain, Zap, Shield, Star, TrendingUp, Calendar, MessageCircle, Award } from "lucide-react";
import Navbar from "@/components/Navbar";
import ParticleBackground from "@/components/ParticleBackground";
import GlowCard from "@/components/GlowCard";

const LOBSTER_HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/lobster-hero-5E7aSMe59zcws2kjVc7LDP.webp";

const TIER_NAMES = ["青铜", "白银", "黄金", "铂金", "钻石", "星耀", "王者"];

const weeklyData = [
  { day: "周一", value: 45 },
  { day: "周二", value: 62 },
  { day: "周三", value: 38 },
  { day: "周四", value: 71 },
  { day: "周五", value: 55 },
  { day: "周六", value: 80 },
  { day: "周日", value: 30 },
];

const achievements = [
  { icon: "🌊", name: "初入深海", desc: "完成第一次对话", unlocked: true },
  { icon: "🔥", name: "连续学习", desc: "连续 7 天学习", unlocked: true },
  { icon: "💎", name: "知识宝石", desc: "累计对话 100 次", unlocked: true },
  { icon: "⚡", name: "闪电问答", desc: "单次对话超过 20 轮", unlocked: false },
  { icon: "🏆", name: "黄金段位", desc: "达到黄金段位", unlocked: true },
  { icon: "👑", name: "王者之路", desc: "达到王者段位", unlocked: false },
];

const recentSubjects = [
  { name: "数学", count: 45, color: "oklch(0.82 0.15 195)" },
  { name: "物理", count: 32, color: "oklch(0.82 0.16 160)" },
  { name: "英语", count: 28, color: "oklch(0.7 0.18 40)" },
  { name: "化学", count: 15, color: "oklch(0.85 0.15 85)" },
];

export default function Dashboard() {
  const lobster = {
    name: "小龙虾",
    tier: "黄金",
    segment: "II",
    level: 10,
    exp: 720,
    maxExp: 1000,
    wisdom: 85,
    tech: 62,
    stamina: 45,
    totalChats: 156,
    streak: 12,
    totalExp: 4720,
  };

  return (
    <div className="min-h-screen relative">
      <ParticleBackground count={20} />
      <Navbar />

      <div className="pt-24 pb-12">
        <div className="container space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <h1 className="font-display text-3xl font-bold text-foreground">养成看板</h1>
            <p className="text-muted-foreground">查看你的龙虾成长数据和学习记录</p>
          </motion.div>

          {/* Top Row: Lobster Card + Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lobster Profile Card */}
            <GlowCard glowColor="cyan" className="lg:col-span-1" delay={0.1}>
              <div className="text-center space-y-4">
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
                    className="w-36 h-36 object-contain animate-breathe relative z-10"
                  />
                </div>

                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">{lobster.name}</h2>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span
                      className="px-3 py-1 rounded-md text-sm font-mono font-bold"
                      style={{
                        background: "oklch(0.85 0.15 85 / 0.15)",
                        color: "oklch(0.85 0.15 85)",
                        border: "1px solid oklch(0.85 0.15 85 / 0.3)",
                      }}
                    >
                      {lobster.tier} {lobster.segment}
                    </span>
                    <span className="text-sm text-muted-foreground font-mono">Lv.{lobster.level}</span>
                  </div>
                </div>

                {/* EXP */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">经验值</span>
                    <span className="font-mono text-cyan-glow">{lobster.exp}/{lobster.maxExp}</span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden" style={{ background: "oklch(0.2 0.03 260)" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(lobster.exp / lobster.maxExp) * 100}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full rounded-full relative"
                      style={{ background: "linear-gradient(90deg, oklch(0.82 0.15 195), oklch(0.82 0.16 160))" }}
                    >
                      <div
                        className="absolute inset-0 animate-shimmer"
                        style={{ background: "linear-gradient(90deg, transparent, oklch(1 0 0 / 0.2), transparent)" }}
                      />
                    </motion.div>
                  </div>
                </div>

                {/* Tier Progress */}
                <div className="flex justify-between items-center pt-2">
                  {TIER_NAMES.map((t, i) => (
                    <div key={t} className="flex flex-col items-center gap-1">
                      <div
                        className={`w-4 h-4 rounded-full ${i <= 2 ? "glow-cyan" : ""}`}
                        style={{
                          background: i <= 2 ? "oklch(0.82 0.15 195)" : "oklch(0.25 0.03 260)",
                          border: i === 2 ? "2px solid oklch(0.85 0.15 85)" : "none",
                        }}
                      />
                      <span className={`text-[9px] ${i <= 2 ? "text-cyan-glow" : "text-muted-foreground/50"}`}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </GlowCard>

            {/* Quick Stats Grid */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              <QuickStat icon={MessageCircle} label="总对话数" value={lobster.totalChats} unit="次" color="cyan" delay={0.15} />
              <QuickStat icon={Calendar} label="连续学习" value={lobster.streak} unit="天" color="orange" delay={0.2} />
              <QuickStat icon={Star} label="累计经验" value={lobster.totalExp} unit="EXP" color="gold" delay={0.25} />
              <QuickStat icon={TrendingUp} label="本周进步" value={23} unit="%" color="mint" delay={0.3} />
            </div>
          </div>

          {/* Middle Row: Attributes + Weekly Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attributes */}
            <GlowCard glowColor="cyan" delay={0.3}>
              <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-cyan-glow" />
                能力属性
              </h3>
              <div className="space-y-5">
                <AttributeBar label="智慧" value={lobster.wisdom} max={100} color="oklch(0.82 0.15 195)" icon="🧠" />
                <AttributeBar label="技术" value={lobster.tech} max={100} color="oklch(0.82 0.16 160)" icon="⚡" />
                <AttributeBar label="耐力" value={lobster.stamina} max={100} color="oklch(0.7 0.18 40)" icon="🛡️" />
                <AttributeBar label="魅力" value={38} max={100} color="oklch(0.85 0.15 85)" icon="✨" />
              </div>
            </GlowCard>

            {/* Weekly Activity */}
            <GlowCard glowColor="mint" delay={0.35}>
              <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-mint-glow" />
                本周学习时长
              </h3>
              <div className="flex items-end justify-between gap-2 h-40 mt-4">
                {weeklyData.map((d, i) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(d.value / 100) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.4 + i * 0.1 }}
                      className="w-full rounded-t-md relative overflow-hidden"
                      style={{
                        background: `linear-gradient(to top, oklch(0.82 0.15 195 / 0.6), oklch(0.82 0.16 160 / 0.3))`,
                        border: "1px solid oklch(0.82 0.15 195 / 0.2)",
                        minHeight: "4px",
                      }}
                    />
                    <span className="text-[10px] text-muted-foreground">{d.day}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-4 text-xs text-muted-foreground">
                <span>总计 <span className="text-cyan-glow font-mono">381</span> 分钟</span>
                <span>日均 <span className="text-mint-glow font-mono">54</span> 分钟</span>
              </div>
            </GlowCard>
          </div>

          {/* Bottom Row: Achievements + Subject Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Achievements */}
            <GlowCard glowColor="gold" delay={0.4}>
              <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-gold" />
                成就徽章
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {achievements.map((a) => (
                  <motion.div
                    key={a.name}
                    whileHover={{ scale: a.unlocked ? 1.05 : 1 }}
                    className={`text-center p-3 rounded-lg transition-all ${
                      a.unlocked ? "" : "opacity-40 grayscale"
                    }`}
                    style={{
                      background: a.unlocked ? "oklch(0.85 0.15 85 / 0.08)" : "oklch(0.2 0.02 260)",
                      border: `1px solid ${a.unlocked ? "oklch(0.85 0.15 85 / 0.2)" : "oklch(0.25 0.03 260)"}`,
                    }}
                  >
                    <span className="text-2xl">{a.icon}</span>
                    <div className="text-xs font-medium text-foreground mt-1">{a.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{a.desc}</div>
                  </motion.div>
                ))}
              </div>
            </GlowCard>

            {/* Subject Distribution */}
            <GlowCard glowColor="orange" delay={0.45}>
              <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-coral-orange" />
                学科分布
              </h3>
              <div className="space-y-4">
                {recentSubjects.map((s) => {
                  const total = recentSubjects.reduce((sum, x) => sum + x.count, 0);
                  const pct = Math.round((s.count / total) * 100);
                  return (
                    <div key={s.name} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground font-medium">{s.name}</span>
                        <span className="font-mono text-xs" style={{ color: s.color }}>{s.count} 次 · {pct}%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "oklch(0.2 0.03 260)" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ background: s.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlowCard>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickStat({
  icon: Icon,
  label,
  value,
  unit,
  color,
  delay,
}: {
  icon: any;
  label: string;
  value: number;
  unit: string;
  color: "cyan" | "orange" | "gold" | "mint";
  delay: number;
}) {
  const colorMap = {
    cyan: "oklch(0.82 0.15 195)",
    orange: "oklch(0.7 0.18 40)",
    gold: "oklch(0.85 0.15 85)",
    mint: "oklch(0.82 0.16 160)",
  };
  const c = colorMap[color];

  return (
    <GlowCard glowColor={color} delay={delay} className="flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${c.replace(")", " / 0.1)")}`, border: `1px solid ${c.replace(")", " / 0.2)")}` }}
      >
        <Icon className="w-6 h-6" style={{ color: c }} />
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-mono text-2xl font-bold" style={{ color: c }}>
          {value.toLocaleString()}
          <span className="text-xs text-muted-foreground ml-1 font-sans">{unit}</span>
        </div>
      </div>
    </GlowCard>
  );
}

function AttributeBar({
  label,
  value,
  max,
  color,
  icon,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  icon: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="text-foreground font-medium">{label}</span>
        </div>
        <span className="font-mono text-sm" style={{ color }}>{value}/{max}</span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "oklch(0.2 0.03 260)" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="h-full rounded-full relative"
          style={{ background: color }}
        >
          <div
            className="absolute inset-0 animate-shimmer"
            style={{ background: "linear-gradient(90deg, transparent, oklch(1 0 0 / 0.15), transparent)" }}
          />
        </motion.div>
      </div>
    </div>
  );
}
