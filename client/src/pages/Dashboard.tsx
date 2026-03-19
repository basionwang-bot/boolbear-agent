/*
 * 熊 Agent — 成长看板
 * 温暖治愈系风格，展示小熊真实成长数据
 */
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, Zap, Shield, MessageCircle, Award, Loader2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import { BEAR_IMAGES, BEAR_TIERS } from "@/lib/bearAssets";
import { toast } from "sonner";

const TIER_INDEX: Record<string, number> = {
  bronze: 0, silver: 1, gold: 2, platinum: 3, diamond: 4, starlight: 5, king: 6,
};

const BEAR_TYPE_IMAGES: Record<string, string> = {
  grizzly: BEAR_IMAGES.grizzly,
  panda: BEAR_IMAGES.panda,
  polar: BEAR_IMAGES.polar,
};

const achievements = [
  { name: "初次对话", desc: "和小熊完成第一次对话", icon: MessageCircle, minChats: 1 },
  { name: "学习新手", desc: "累计对话 10 次", icon: MessageCircle, minChats: 10 },
  { name: "好奇宝宝", desc: "累计对话 50 次", icon: Brain, minChats: 50 },
  { name: "知识猎人", desc: "累计对话 100 次", icon: Zap, minChats: 100 },
  { name: "学习达人", desc: "累计对话 200 次", icon: Award, minChats: 200 },
];

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const bearQuery = trpc.bear.mine.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && bearQuery.isFetched && !bearQuery.data) {
      toast.info("请先领养一只小熊");
      navigate("/adopt");
    }
  }, [authLoading, isAuthenticated, bearQuery.isFetched, bearQuery.data, navigate]);

  if (authLoading || bearQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "oklch(0.52 0.09 55)" }} />
      </div>
    );
  }

  const bear = bearQuery.data;
  if (!bear) return null;

  const tierIdx = TIER_INDEX[bear.tier] ?? 0;
  const currentTier = BEAR_TIERS[tierIdx];
  const nextTier = BEAR_TIERS[tierIdx + 1];
  const bearImage = BEAR_TYPE_IMAGES[bear.bearType] || BEAR_IMAGES.grizzly;
  const nextTierExp = nextTier?.minExp ?? currentTier.minExp + 500;
  const expProgress = ((bear.experience - currentTier.minExp) / (nextTierExp - currentTier.minExp)) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-black" style={{ color: "oklch(0.30 0.06 55)" }}>成长看板</h1>
          <p className="text-muted-foreground mt-1">追踪你和{bear.bearName}的学习旅程</p>
        </motion.div>

        {/* Top: Bear Profile + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Bear Profile */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bear-card p-6 text-center">
            <motion.img
              src={bearImage}
              alt={bear.bearName}
              className="w-36 h-36 mx-auto mb-4 object-contain"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <h2 className="text-xl font-black" style={{ color: "oklch(0.30 0.06 55)" }}>{bear.bearName}</h2>
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
                <span className="font-mono font-bold" style={{ color: currentTier.color }}>{bear.experience}</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden bg-[oklch(0.52_0.09_55/0.1)]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, expProgress)}%` }}
                  transition={{ duration: 1.5 }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${currentTier.color}, oklch(0.75 0.12 65))` }}
                />
              </div>
              {nextTier && (
                <p className="text-[10px] text-muted-foreground">距离{nextTier.rank}段位还需 {nextTierExp - bear.experience} 经验</p>
              )}
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Brain, label: "智慧值", value: bear.wisdom.toString(), color: "oklch(0.52 0.09 55)", bg: "oklch(0.52 0.09 55 / 0.08)" },
              { icon: Zap, label: "技术值", value: bear.tech.toString(), color: "oklch(0.50 0.10 155)", bg: "oklch(0.50 0.10 155 / 0.08)" },
              { icon: Shield, label: "社交值", value: bear.social.toString(), color: "oklch(0.75 0.12 65)", bg: "oklch(0.75 0.12 65 / 0.08)" },
              { icon: MessageCircle, label: "对话次数", value: bear.totalChats.toString(), color: "oklch(0.65 0.20 15)", bg: "oklch(0.65 0.20 15 / 0.08)" },
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
          </div>
        </div>

        {/* Attributes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bear-card p-6">
            <h3 className="font-bold text-lg mb-5 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
              <Brain className="w-5 h-5" style={{ color: "oklch(0.52 0.09 55)" }} /> 能力属性
            </h3>
            <div className="space-y-5">
              {[
                { label: "智慧", value: bear.wisdom, color: "oklch(0.52 0.09 55)", icon: Brain },
                { label: "技术", value: bear.tech, color: "oklch(0.50 0.10 155)", icon: Zap },
                { label: "社交", value: bear.social, color: "oklch(0.75 0.12 65)", icon: Shield },
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
                        whileInView={{ width: `${Math.min(100, attr.value)}%` }}
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

          {/* Achievements */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bear-card p-6">
            <h3 className="font-bold text-lg mb-5 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
              <Award className="w-5 h-5" style={{ color: "oklch(0.65 0.15 85)" }} /> 成就系统
            </h3>
            <div className="space-y-3">
              {achievements.map((ach) => {
                const Icon = ach.icon;
                const unlocked = bear.totalChats >= ach.minChats;
                return (
                  <div
                    key={ach.name}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${!unlocked ? "opacity-40" : ""}`}
                    style={unlocked ? { background: "oklch(0.80 0.15 85 / 0.08)" } : {}}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: unlocked ? "oklch(0.80 0.15 85 / 0.15)" : "oklch(0.90 0.01 85)" }}
                    >
                      <Icon className="w-5 h-5" style={{ color: unlocked ? "oklch(0.65 0.15 85)" : "oklch(0.70 0.01 85)" }} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm" style={{ color: "oklch(0.30 0.06 55)" }}>{ach.name}</h4>
                      <p className="text-xs text-muted-foreground">{ach.desc}</p>
                    </div>
                    {unlocked && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "oklch(0.50 0.10 155 / 0.1)", color: "oklch(0.40 0.10 155)" }}>
                        已解锁
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Tier Roadmap */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-8">
          <h2 className="text-xl font-black mb-4" style={{ color: "oklch(0.30 0.06 55)" }}>段位进化之路</h2>
          <div className="flex items-center gap-2 overflow-x-auto pb-4">
            {BEAR_TIERS.map((tier, i) => {
              const isCurrent = i === tierIdx;
              const isPast = i < tierIdx;
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
