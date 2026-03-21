/*
 * 熊 Agent — 成长看板
 * 温暖治愈系风格，展示小熊真实成长数据 + 知识点梳理
 */
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Zap, Shield, MessageCircle, Award, Loader2, BookOpen, Sparkles, RefreshCw, ChevronRight, GraduationCap, BarChart3 } from "lucide-react";
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

// Subject color mapping
const SUBJECT_COLORS: Record<string, { color: string; bg: string }> = {
  "数学": { color: "oklch(0.52 0.15 250)", bg: "oklch(0.52 0.15 250 / 0.08)" },
  "语文": { color: "oklch(0.55 0.15 30)", bg: "oklch(0.55 0.15 30 / 0.08)" },
  "英语": { color: "oklch(0.50 0.15 155)", bg: "oklch(0.50 0.15 155 / 0.08)" },
  "物理": { color: "oklch(0.55 0.12 280)", bg: "oklch(0.55 0.12 280 / 0.08)" },
  "化学": { color: "oklch(0.55 0.15 140)", bg: "oklch(0.55 0.15 140 / 0.08)" },
  "生物": { color: "oklch(0.50 0.15 155)", bg: "oklch(0.50 0.15 155 / 0.08)" },
  "历史": { color: "oklch(0.52 0.09 55)", bg: "oklch(0.52 0.09 55 / 0.08)" },
  "地理": { color: "oklch(0.55 0.12 200)", bg: "oklch(0.55 0.12 200 / 0.08)" },
  "信息技术": { color: "oklch(0.50 0.15 260)", bg: "oklch(0.50 0.15 260 / 0.08)" },
};

const getSubjectStyle = (subject: string) => {
  return SUBJECT_COLORS[subject] || { color: "oklch(0.52 0.09 55)", bg: "oklch(0.52 0.09 55 / 0.08)" };
};

const getDifficultyLabel = (d: string) => {
  switch (d) {
    case "easy": return { text: "基础", color: "oklch(0.50 0.15 155)", bg: "oklch(0.50 0.15 155 / 0.1)" };
    case "medium": return { text: "中等", color: "oklch(0.55 0.15 85)", bg: "oklch(0.55 0.15 85 / 0.1)" };
    case "hard": return { text: "困难", color: "oklch(0.55 0.15 25)", bg: "oklch(0.55 0.15 25 / 0.1)" };
    default: return { text: "中等", color: "oklch(0.55 0.15 85)", bg: "oklch(0.55 0.15 85 / 0.1)" };
  }
};

const getMasteryLabel = (m: number) => {
  if (m >= 80) return { text: "掌握", color: "oklch(0.50 0.15 155)" };
  if (m >= 50) return { text: "熟悉", color: "oklch(0.55 0.15 85)" };
  if (m >= 30) return { text: "了解", color: "oklch(0.52 0.09 55)" };
  return { text: "初学", color: "oklch(0.55 0.15 25)" };
};

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "knowledge">("overview");
  const [extracting, setExtracting] = useState(false);

  const bearQuery = trpc.bear.mine.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });

  const knowledgeQuery = trpc.knowledge.list.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });

  const knowledgeStatsQuery = trpc.knowledge.stats.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });

  const extractAllMutation = trpc.knowledge.extractAll.useMutation({
    onSuccess: (data) => {
      toast.success(`分析完成！发现 ${data.added} 个新知识点，更新 ${data.updated} 个已有知识点`);
      knowledgeQuery.refetch();
      knowledgeStatsQuery.refetch();
    },
    onError: (err) => {
      toast.error("分析失败：" + err.message);
    },
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

  const handleExtractAll = async () => {
    setExtracting(true);
    try {
      await extractAllMutation.mutateAsync();
    } finally {
      setExtracting(false);
    }
  };

  // Group knowledge points by subject
  const groupedBySubject = useMemo(() => {
    const points = knowledgeQuery.data || [];
    const groups: Record<string, typeof points> = {};
    for (const p of points) {
      if (!groups[p.subject]) groups[p.subject] = [];
      groups[p.subject].push(p);
    }
    return groups;
  }, [knowledgeQuery.data]);

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

  const stats = knowledgeStatsQuery.data;
  const knowledgePoints = knowledgeQuery.data || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl font-black" style={{ color: "oklch(0.30 0.06 55)" }}>成长看板</h1>
          <p className="text-muted-foreground mt-1">追踪你和{bear.bearName}的学习旅程</p>
        </motion.div>

        {/* Tab Switch */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === "overview" ? "text-white shadow-md" : "text-muted-foreground hover:bg-muted"}`}
            style={activeTab === "overview" ? { background: "oklch(0.52 0.09 55)" } : {}}
          >
            <BarChart3 className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
            成长总览
          </button>
          <button
            onClick={() => setActiveTab("knowledge")}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === "knowledge" ? "text-white shadow-md" : "text-muted-foreground hover:bg-muted"}`}
            style={activeTab === "knowledge" ? { background: "oklch(0.50 0.10 155)" } : {}}
          >
            <BookOpen className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
            知识点梳理
            {stats && stats.total > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">{stats.total}</span>
            )}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "overview" ? (
            <motion.div key="overview" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
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

              {/* Attributes + Achievements */}
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
            </motion.div>
          ) : (
            <motion.div key="knowledge" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {/* Knowledge Points Section */}

              {/* Stats Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bear-card p-5 text-center">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "oklch(0.50 0.15 155 / 0.08)" }}>
                    <BookOpen className="w-5 h-5" style={{ color: "oklch(0.50 0.15 155)" }} />
                  </div>
                  <p className="text-2xl font-black" style={{ color: "oklch(0.50 0.15 155)" }}>{stats?.total || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">已学知识点</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bear-card p-5 text-center">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "oklch(0.52 0.15 250 / 0.08)" }}>
                    <GraduationCap className="w-5 h-5" style={{ color: "oklch(0.52 0.15 250)" }} />
                  </div>
                  <p className="text-2xl font-black" style={{ color: "oklch(0.52 0.15 250)" }}>{Object.keys(stats?.subjects || {}).length}</p>
                  <p className="text-xs text-muted-foreground mt-1">涉及学科</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bear-card p-5 text-center">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "oklch(0.55 0.15 85 / 0.08)" }}>
                    <Sparkles className="w-5 h-5" style={{ color: "oklch(0.55 0.15 85)" }} />
                  </div>
                  <p className="text-2xl font-black" style={{ color: "oklch(0.55 0.15 85)" }}>{stats?.avgMastery || 0}%</p>
                  <p className="text-xs text-muted-foreground mt-1">平均掌握度</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="bear-card p-5 text-center">
                  <button
                    onClick={handleExtractAll}
                    disabled={extracting}
                    className="w-full h-full flex flex-col items-center justify-center gap-2 hover:opacity-80 transition-opacity disabled:opacity-50"
                  >
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "oklch(0.52 0.09 55 / 0.08)" }}>
                      <RefreshCw className={`w-5 h-5 ${extracting ? "animate-spin" : ""}`} style={{ color: "oklch(0.52 0.09 55)" }} />
                    </div>
                    <p className="text-xs font-bold" style={{ color: "oklch(0.52 0.09 55)" }}>
                      {extracting ? "分析中..." : "分析对话"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">提取知识点</p>
                  </button>
                </motion.div>
              </div>

              {/* Subject Distribution */}
              {stats && Object.keys(stats.subjects).length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bear-card p-6 mb-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
                    <BarChart3 className="w-5 h-5" style={{ color: "oklch(0.52 0.09 55)" }} /> 学科分布
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(stats.subjects)
                      .sort(([, a], [, b]) => b - a)
                      .map(([subject, count]) => {
                        const style = getSubjectStyle(subject);
                        const percentage = Math.round((count / stats.total) * 100);
                        return (
                          <div key={subject} className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full" style={{ background: style.color }} />
                                <span className="font-medium" style={{ color: "oklch(0.30 0.06 55)" }}>{subject}</span>
                              </span>
                              <span className="text-xs text-muted-foreground">{count} 个知识点 · {percentage}%</span>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden bg-[oklch(0.52_0.09_55/0.06)]">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 1 }}
                                className="h-full rounded-full"
                                style={{ background: style.color }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </motion.div>
              )}

              {/* Knowledge Points by Subject */}
              {Object.keys(groupedBySubject).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(groupedBySubject).map(([subject, points]) => {
                    const style = getSubjectStyle(subject);
                    return (
                      <motion.div
                        key={subject}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bear-card overflow-hidden"
                      >
                        {/* Subject Header */}
                        <div className="px-6 py-4 flex items-center justify-between" style={{ background: style.bg }}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${style.color}20` }}>
                              <BookOpen className="w-4 h-4" style={{ color: style.color }} />
                            </div>
                            <div>
                              <h3 className="font-bold" style={{ color: style.color }}>{subject}</h3>
                              <p className="text-xs text-muted-foreground">{points.length} 个知识点</p>
                            </div>
                          </div>
                        </div>

                        {/* Knowledge Points List */}
                        <div className="divide-y divide-[oklch(0.52_0.09_55/0.06)]">
                          {points.map((point) => {
                            const diff = getDifficultyLabel(point.difficulty);
                            const mastery = getMasteryLabel(point.mastery);
                            return (
                              <div key={point.id} className="px-6 py-4 hover:bg-muted/30 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-bold text-sm" style={{ color: "oklch(0.30 0.06 55)" }}>{point.name}</h4>
                                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: diff.bg, color: diff.color }}>
                                        {diff.text}
                                      </span>
                                    </div>
                                    {point.description && (
                                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{point.description}</p>
                                    )}
                                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                                      <span>提及 {point.mentionCount} 次</span>
                                      <span>·</span>
                                      <span>最近学习：{new Date(point.lastMentionedAt).toLocaleDateString("zh-CN")}</span>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <div className="text-sm font-bold" style={{ color: mastery.color }}>{point.mastery}%</div>
                                    <div className="text-[10px]" style={{ color: mastery.color }}>{mastery.text}</div>
                                    <div className="w-16 h-1.5 rounded-full overflow-hidden mt-1.5 bg-[oklch(0.52_0.09_55/0.06)]">
                                      <div className="h-full rounded-full" style={{ width: `${point.mastery}%`, background: mastery.color }} />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bear-card p-12 text-center">
                  <img src={BEAR_IMAGES.studying} alt="学习中" className="w-24 h-24 mx-auto mb-4 object-contain opacity-60" />
                  <h3 className="text-lg font-bold mb-2" style={{ color: "oklch(0.30 0.06 55)" }}>还没有知识点记录</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    和小熊聊天学习后，点击"分析对话"按钮，AI 会自动梳理你学过的知识点
                  </p>
                  <button
                    onClick={handleExtractAll}
                    disabled={extracting}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-bold text-sm disabled:opacity-50"
                    style={{ background: "oklch(0.50 0.10 155)" }}
                  >
                    <RefreshCw className={`w-4 h-4 ${extracting ? "animate-spin" : ""}`} />
                    {extracting ? "分析中..." : "分析我的对话"}
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
