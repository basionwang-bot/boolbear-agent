/*
 * 裸熊 Agent — 成长看板
 * 温暖治愈系风格，展示小熊成长数据
 */
import { motion } from "framer-motion";
import { Brain, Zap, Shield, Clock, MessageCircle, Trophy, Star, TrendingUp, Award } from "lucide-react";
import Navbar from "@/components/Navbar";
import { BEAR_IMAGES, BEAR_TIERS } from "@/lib/bearAssets";

const weeklyData = [
  { day: "周一", chats: 12, minutes: 45 },
  { day: "周二", chats: 8, minutes: 30 },
  { day: "周三", chats: 15, minutes: 55 },
  { day: "周四", chats: 6, minutes: 20 },
  { day: "周五", chats: 18, minutes: 65 },
  { day: "周六", chats: 22, minutes: 80 },
  { day: "周日", chats: 10, minutes: 35 },
];

const achievements = [
  { name: "初次对话", desc: "和小熊完成第一次对话", icon: MessageCircle, unlocked: true },
  { name: "学习达人", desc: "累计学习 10 小时", icon: Clock, unlocked: true },
  { name: "好奇宝宝", desc: "提出 100 个问题", icon: Star, unlocked: true },
  { name: "知识猎人", desc: "掌握 5 个学科领域", icon: Trophy, unlocked: false },
  { name: "连续学习", desc: "连续 7 天学习打卡", icon: TrendingUp, unlocked: false },
];

const recentSubjects = [
  { name: "数学", count: 45, color: "oklch(0.52 0.09 55)" },
  { name: "物理", count: 32, color: "oklch(0.50 0.10 155)" },
  { name: "英语", count: 28, color: "oklch(0.78 0.08 230)" },
  { name: "化学", count: 15, color: "oklch(0.65 0.20 15)" },
];

export default function Dashboard() {
  const currentTier = BEAR_TIERS[2];
  const bear = {
    name: "大大",
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
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-black" style={{ color: "oklch(0.30 0.06 55)" }}>成长看板</h1>
          <p className="text-muted-foreground mt-1">追踪你和小熊的学习旅程</p>
        </motion.div>

        {/* Top: Bear Profile + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Bear Profile */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bear-card p-6 text-center">
            <motion.img
              src={BEAR_IMAGES.grizzly}
              alt="大大"
              className="w-36 h-36 mx-auto mb-4 object-contain"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <h2 className="text-xl font-black" style={{ color: "oklch(0.30 0.06 55)" }}>{bear.name}</h2>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: currentTier.bgColor, color: currentTier.color }}>
                {currentTier.rank} · {currentTier.name}
              </span>
              <span className="text-sm text-muted-foreground">Lv.{bear.level}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{currentTier.description}</p>

            <div className="mt-5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">经验值</span>
                <span className="font-mono font-bold" style={{ color: currentTier.color }}>{bear.exp}/{bear.maxExp}</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden bg-[oklch(0.52_0.09_55/0.1)]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(bear.exp / bear.maxExp) * 100}%` }}
                  transition={{ duration: 1.5 }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${currentTier.color}, oklch(0.75 0.12 65))` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">距离下一段位还需 {bear.maxExp - bear.exp} 经验</p>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Brain, label: "智慧值", value: "85", color: "oklch(0.52 0.09 55)", bg: "oklch(0.52 0.09 55 / 0.08)" },
              { icon: Zap, label: "技术值", value: "62", color: "oklch(0.50 0.10 155)", bg: "oklch(0.50 0.10 155 / 0.08)" },
              { icon: Clock, label: "学习时长", value: "48h", color: "oklch(0.78 0.08 230)", bg: "oklch(0.78 0.08 230 / 0.12)" },
              { icon: MessageCircle, label: "对话次数", value: "326", color: "oklch(0.65 0.20 15)", bg: "oklch(0.65 0.20 15 / 0.08)" },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.1 }} className="bear-card p-5 text-center">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: stat.bg }}>
                    <Icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                  <p className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </motion.div>
              );
            })}

            {/* Weekly Chart */}
            <div className="col-span-2 sm:col-span-4 bear-card p-5">
              <h3 className="font-bold text-sm mb-4" style={{ color: "oklch(0.30 0.06 55)" }}>本周学习统计</h3>
              <div className="flex items-end gap-3 h-32">
                {weeklyData.map((d, i) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(d.minutes / 80) * 100}%` }}
                      transition={{ delay: 0.5 + i * 0.08, duration: 0.6 }}
                      className="w-full rounded-t-lg min-h-[4px]"
                      style={{ background: `oklch(0.52 0.09 55 / ${0.3 + (d.minutes / 80) * 0.7})` }}
                    />
                    <span className="text-[10px] text-muted-foreground">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Attributes + Subjects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Attributes */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bear-card p-6">
            <h3 className="font-bold text-lg mb-5 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
              <Brain className="w-5 h-5" style={{ color: "oklch(0.52 0.09 55)" }} /> 能力属性
            </h3>
            <div className="space-y-5">
              {[
                { label: "智慧", value: bear.wisdom, color: "oklch(0.52 0.09 55)", icon: Brain },
                { label: "技术", value: bear.tech, color: "oklch(0.50 0.10 155)", icon: Zap },
                { label: "耐力", value: bear.stamina, color: "oklch(0.75 0.12 65)", icon: Shield },
              ].map((attr) => {
                const Icon = attr.icon;
                return (
                  <div key={attr.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Icon className="w-4 h-4" style={{ color: attr.color }} /> {attr.label}
                      </span>
                      <span className="font-mono font-bold" style={{ color: attr.color }}>{attr.value}/100</span>
                    </div>
                    <div className="h-2.5 rounded-full overflow-hidden bg-[oklch(0.52_0.09_55/0.08)]">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${attr.value}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2 }}
                        className="h-full rounded-full"
                        style={{ background: attr.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Subject Distribution */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bear-card p-6">
            <h3 className="font-bold text-lg mb-5 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
              <Zap className="w-5 h-5" style={{ color: "oklch(0.50 0.10 155)" }} /> 学科分布
            </h3>
            <div className="space-y-4">
              {recentSubjects.map((s) => {
                const total = recentSubjects.reduce((sum, x) => sum + x.count, 0);
                const pct = Math.round((s.count / total) * 100);
                return (
                  <div key={s.name} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium" style={{ color: "oklch(0.30 0.06 55)" }}>{s.name}</span>
                      <span className="font-mono text-xs" style={{ color: s.color }}>{s.count} 次 · {pct}%</span>
                    </div>
                    <div className="h-2.5 rounded-full overflow-hidden bg-[oklch(0.52_0.09_55/0.08)]">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                        className="h-full rounded-full"
                        style={{ background: s.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Achievements */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-xl font-black mb-4 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
            <Award className="w-5 h-5" style={{ color: "oklch(0.65 0.15 85)" }} /> 成就系统
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((ach, i) => {
              const Icon = ach.icon;
              return (
                <motion.div
                  key={ach.name}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className={`bear-card p-4 flex items-center gap-4 ${!ach.unlocked ? "opacity-50" : ""}`}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: ach.unlocked ? "oklch(0.80 0.15 85 / 0.15)" : "oklch(0.90 0.01 85)" }}
                  >
                    <Icon className="w-6 h-6" style={{ color: ach.unlocked ? "oklch(0.65 0.15 85)" : "oklch(0.70 0.01 85)" }} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm" style={{ color: "oklch(0.30 0.06 55)" }}>{ach.name}</h4>
                    <p className="text-xs text-muted-foreground">{ach.desc}</p>
                  </div>
                  {ach.unlocked && (
                    <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "oklch(0.50 0.10 155 / 0.1)", color: "oklch(0.40 0.10 155)" }}>
                      已解锁
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Tier Roadmap */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-8">
          <h2 className="text-xl font-black mb-4" style={{ color: "oklch(0.30 0.06 55)" }}>段位进化之路</h2>
          <div className="flex items-center gap-2 overflow-x-auto pb-4">
            {BEAR_TIERS.map((tier, i) => {
              const isCurrent = i === 2;
              const isPast = i < 2;
              return (
                <div key={tier.rank} className="flex items-center shrink-0">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className={`bear-card p-3 text-center w-28 ${isCurrent ? "ring-2" : ""}`}
                    style={isCurrent ? { borderColor: tier.color, boxShadow: `0 0 12px ${tier.color}30` } : {}}
                  >
                    <img src={tier.image} alt={tier.name} className="w-14 h-14 mx-auto mb-1 object-contain" />
                    <p className="text-xs font-bold" style={{ color: isPast || isCurrent ? tier.color : "oklch(0.70 0.01 85)" }}>{tier.name}</p>
                    <p className="text-[10px] text-muted-foreground">{tier.rank}</p>
                  </motion.div>
                  {i < BEAR_TIERS.length - 1 && (
                    <div className="w-6 h-0.5 mx-1" style={{ background: isPast ? "oklch(0.52 0.09 55)" : "oklch(0.90 0.01 85)" }} />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
