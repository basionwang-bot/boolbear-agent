/*
 * 家长看板 — 通过分享链接查看孩子的学习报告
 * 无需登录，通过 URL 中的 token 参数访问
 */
import { trpc } from "@/lib/trpc";
import { BEAR_IMAGES, BEAR_TIERS, BEAR_SKINS } from "@/lib/bearAssets";
import { useRoute } from "wouter";
import { Loader2, BookOpen, Brain, Star, MessageCircle, TrendingUp, Award, Clock, BarChart3, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useMemo } from "react";

// 段位名称映射
const TIER_MAP: Record<string, { name: string; rank: string; color: string }> = {
  bronze: { name: "小熊崽", rank: "青铜", color: "#CD7F32" },
  silver: { name: "学徒熊", rank: "白银", color: "#8B9DAF" },
  gold: { name: "学者熊", rank: "黄金", color: "#D4A017" },
  platinum: { name: "研究熊", rank: "铂金", color: "#4ECDC4" },
  diamond: { name: "魔法熊", rank: "钻石", color: "#5B9BD5" },
  starlight: { name: "星辰熊", rank: "星耀", color: "#9B59B6" },
  king: { name: "王者熊", rank: "王者", color: "#E74C3C" },
};

const BEAR_TYPE_MAP: Record<string, { name: string; image: string }> = {
  grizzly: { name: "可可", image: BEAR_IMAGES.grizzly },
  panda: { name: "圆圆", image: BEAR_IMAGES.panda },
  polar: { name: "冰冰", image: BEAR_IMAGES.polar },
};

const PERSONALITY_MAP: Record<string, string> = {
  teacher: "严师型",
  friend: "朋友型",
  cool: "酷酷型",
};

const DIFFICULTY_MAP: Record<string, { label: string; color: string }> = {
  easy: { label: "基础", color: "oklch(0.50 0.10 155)" },
  medium: { label: "中等", color: "oklch(0.75 0.12 65)" },
  hard: { label: "困难", color: "oklch(0.65 0.20 15)" },
};

const SUBJECT_COLORS: Record<string, string> = {
  "数学": "#E74C3C",
  "语文": "#3498DB",
  "英语": "#2ECC71",
  "物理": "#9B59B6",
  "化学": "#F39C12",
  "生物": "#1ABC9C",
  "历史": "#E67E22",
  "地理": "#16A085",
  "政治": "#8E44AD",
  "编程": "#2C3E50",
};

export default function ParentReport() {
  const [, params] = useRoute("/parent/:token");
  const token = params?.token || "";

  const { data: report, isLoading, error } = trpc.parent.viewReport.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  // 计算学科分布
  const subjectData = useMemo(() => {
    if (!report?.knowledge.stats.subjects) return [];
    return Object.entries(report.knowledge.stats.subjects)
      .sort(([, a], [, b]) => b - a)
      .map(([subject, count]) => ({
        subject,
        count,
        color: SUBJECT_COLORS[subject] || "#95A5A6",
      }));
  }, [report]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bear-gradient">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: "oklch(0.52 0.09 55)" }} />
          <p className="text-muted-foreground text-lg">正在加载学习报告...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bear-gradient">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "oklch(0.30 0.06 55)" }}>
              链接无效或已过期
            </h2>
            <p className="text-muted-foreground">
              请联系孩子的老师或学生重新生成分享链接
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { student, bear, knowledge, conversations, learningTime } = report as any;
  const tierInfo = bear ? TIER_MAP[bear.tier] || TIER_MAP.bronze : null;
  const bearTypeInfo = bear ? BEAR_TYPE_MAP[bear.bearType] || BEAR_TYPE_MAP.grizzly : null;
  const tierData = bear ? BEAR_TIERS.find(t => t.name === tierInfo?.name) : null;
  const nextTier = tierData ? BEAR_TIERS[BEAR_TIERS.indexOf(tierData) + 1] : null;
  const expProgress = bear && tierData && nextTier
    ? Math.round(((bear.experience - tierData.minExp) / (nextTier.minExp - tierData.minExp)) * 100)
    : bear ? 100 : 0;

  return (
    <div className="min-h-screen bear-gradient">
      {/* Header */}
      <header className="py-6 border-b border-[oklch(0.52_0.09_55/0.1)]">
        <div className="container">
          <div className="flex items-center gap-3">
            <img src={BEAR_IMAGES.grizzly} alt="logo" className="w-10 h-10 rounded-full" />
            <div>
              <h1 className="text-xl font-black" style={{ color: "oklch(0.30 0.06 55)" }}>
                布尔熊 Agent — 学习报告
              </h1>
              <p className="text-sm text-muted-foreground">
                {student.name} 的学习成长记录
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        {/* 学生概览 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 学生信息卡 */}
          <Card className="bear-card lg:col-span-1">
            <CardContent className="pt-6 text-center">
              {bear && bearTypeInfo ? (
                <>
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <img
                      src={bearTypeInfo.image}
                      alt={bear.bearName}
                      className="w-full h-full object-contain drop-shadow-lg"
                    />
                    {tierInfo && (
                      <div
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white"
                        style={{ background: tierInfo.color }}
                      >
                        {tierInfo.rank} · {tierInfo.name}
                      </div>
                    )}
                  </div>
                  <h2 className="text-2xl font-black mb-1" style={{ color: "oklch(0.30 0.06 55)" }}>
                    {bear.bearName}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    {student.name} 的学习伙伴 · {PERSONALITY_MAP[bear.personality] || "朋友型"}
                  </p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>班级：{student.className}</p>
                    <p>加入时间：{new Date(student.createdAt).toLocaleDateString("zh-CN")}</p>
                    <p>最近活跃：{new Date(student.lastSignedIn).toLocaleDateString("zh-CN")}</p>
                  </div>
                </>
              ) : (
                <div className="py-8">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Star className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">还没有领养小熊</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 核心数据 */}
          <Card className="bear-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
                <TrendingUp className="w-5 h-5" style={{ color: "oklch(0.52 0.09 55)" }} />
                学习数据概览
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
                <div className="text-center p-4 rounded-xl" style={{ background: "oklch(0.52 0.09 55 / 0.06)" }}>
                  <div className="text-3xl font-black" style={{ color: "oklch(0.52 0.09 55)" }}>
                    {bear?.experience || 0}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">总经验值</div>
                </div>
                <div className="text-center p-4 rounded-xl" style={{ background: "oklch(0.50 0.10 155 / 0.06)" }}>
                  <div className="text-3xl font-black" style={{ color: "oklch(0.50 0.10 155)" }}>
                    {bear?.totalChats || 0}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">对话次数</div>
                </div>
                <div className="text-center p-4 rounded-xl" style={{ background: "oklch(0.78 0.08 230 / 0.08)" }}>
                  <div className="text-3xl font-black" style={{ color: "oklch(0.60 0.10 230)" }}>
                    {knowledge.stats.total}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">知识点数</div>
                </div>
                <div className="text-center p-4 rounded-xl" style={{ background: "oklch(0.80 0.15 85 / 0.08)" }}>
                  <div className="text-3xl font-black" style={{ color: "oklch(0.65 0.15 85)" }}>
                    {knowledge.stats.avgMastery}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">平均掌握度</div>
                </div>
                <div className="text-center p-4 rounded-xl" style={{ background: "oklch(0.55 0.12 280 / 0.06)" }}>
                  <div className="text-3xl font-black" style={{ color: "oklch(0.55 0.12 280)" }}>
                    {learningTime?.totalMinutes ?? 0}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">学习时长(分钟)</div>
                </div>
              </div>

              {/* 经验值进度 */}
              {bear && tierInfo && (
                <div className="p-4 rounded-xl border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold" style={{ color: tierInfo.color }}>
                      {tierInfo.rank} · {tierInfo.name}
                    </span>
                    {nextTier && (
                      <span className="text-xs text-muted-foreground">
                        距离 {nextTier.name} 还需 {nextTier.minExp - bear.experience} 经验
                      </span>
                    )}
                  </div>
                  <Progress value={expProgress} className="h-3" />
                  <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    <span>{bear.experience} EXP</span>
                    {nextTier && <span>{nextTier.minExp} EXP</span>}
                  </div>
                </div>
              )}

              {/* 属性雷达 */}
              {bear && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center p-3 rounded-xl" style={{ background: "oklch(0.52 0.09 55 / 0.06)" }}>
                    <GraduationCap className="w-6 h-6 mx-auto mb-1" style={{ color: "oklch(0.52 0.09 55)" }} />
                    <div className="text-lg font-bold" style={{ color: "oklch(0.52 0.09 55)" }}>{bear.wisdom}</div>
                    <div className="text-xs text-muted-foreground">智慧</div>
                  </div>
                  <div className="text-center p-3 rounded-xl" style={{ background: "oklch(0.50 0.10 155 / 0.06)" }}>
                    <BarChart3 className="w-6 h-6 mx-auto mb-1" style={{ color: "oklch(0.50 0.10 155)" }} />
                    <div className="text-lg font-bold" style={{ color: "oklch(0.50 0.10 155)" }}>{bear.tech}</div>
                    <div className="text-xs text-muted-foreground">技术</div>
                  </div>
                  <div className="text-center p-3 rounded-xl" style={{ background: "oklch(0.78 0.08 230 / 0.08)" }}>
                    <MessageCircle className="w-6 h-6 mx-auto mb-1" style={{ color: "oklch(0.60 0.10 230)" }} />
                    <div className="text-lg font-bold" style={{ color: "oklch(0.60 0.10 230)" }}>{bear.social}</div>
                    <div className="text-xs text-muted-foreground">社交</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 知识点掌握情况 */}
        <Card className="bear-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
              <Brain className="w-5 h-5" style={{ color: "oklch(0.50 0.10 155)" }} />
              知识点掌握情况
              <Badge variant="secondary" className="ml-2">{knowledge.stats.total} 个知识点</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {knowledge.points.length > 0 ? (
              <>
                {/* 学科分布 */}
                {subjectData.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground">学科分布</h3>
                    <div className="flex flex-wrap gap-3">
                      {subjectData.map(({ subject, count, color }) => (
                        <div
                          key={subject}
                          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white"
                          style={{ background: color }}
                        >
                          {subject}
                          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 知识点列表 */}
                <div className="space-y-3">
                  {knowledge.points.map((kp: any, i: number) => {
                    const diff = DIFFICULTY_MAP[kp.difficulty] || DIFFICULTY_MAP.medium;
                    return (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border hover:shadow-sm transition-shadow">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold" style={{ color: "oklch(0.30 0.06 55)" }}>
                              {kp.name}
                            </span>
                            <Badge variant="outline" className="text-xs" style={{ borderColor: diff.color, color: diff.color }}>
                              {diff.label}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="text-xs text-white"
                              style={{ background: SUBJECT_COLORS[kp.subject] || "#95A5A6" }}
                            >
                              {kp.subject}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex-1">
                              <Progress value={kp.mastery} className="h-2" />
                            </div>
                            <span className="text-sm font-bold min-w-[3rem] text-right" style={{
                              color: kp.mastery >= 80 ? "oklch(0.50 0.10 155)" : kp.mastery >= 50 ? "oklch(0.75 0.12 65)" : "oklch(0.65 0.20 15)"
                            }}>
                              {kp.mastery}%
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground shrink-0">
                          <div>讨论 {kp.mentionCount} 次</div>
                          <div>{new Date(kp.lastMentionedAt).toLocaleDateString("zh-CN")}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground">还没有学习记录，鼓励孩子多和小熊聊天学习吧！</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 最近对话记录 */}
        <Card className="bear-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
              <MessageCircle className="w-5 h-5" style={{ color: "oklch(0.75 0.12 65)" }} />
              最近学习记录
              <Badge variant="secondary" className="ml-2">{conversations.length} 次对话</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {conversations.length > 0 ? (
              <div className="space-y-3">
                {conversations.map((conv: any) => (
                  <div key={conv.id} className="p-4 rounded-xl border border-border hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold" style={{ color: "oklch(0.30 0.06 55)" }}>
                        {conv.title}
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 ml-4">
                        <Clock className="w-3 h-3" />
                        {new Date(conv.updatedAt).toLocaleDateString("zh-CN")}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {conv.topicPreview}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {conv.messageCount} 条消息
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground">还没有对话记录</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 页脚 */}
        <footer className="text-center py-6 text-sm text-muted-foreground">
          <p>布尔熊 Agent — 让 AI 学习变得温暖有趣</p>
          <p className="mt-1 text-xs">此报告由系统自动生成，数据实时更新</p>
        </footer>
      </main>
    </div>
  );
}
