/**
 * 试卷诊断分享报告页 — 公开访问，无需登录
 * 针对微信内置浏览器优化，适配移动端
 */
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useRoute } from "wouter";
import {
  Star, TrendingUp, BookOpen, Brain, Target, Clock,
  ChevronDown, ChevronUp, Award, Zap, AlertTriangle,
  CheckCircle2, MapPin, Flag, Loader2
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { BEAR_IMAGES } from "@/lib/bearAssets";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip
} from "recharts";

// ─── Constants ───────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  high: { color: "oklch(0.60 0.20 25)", bg: "oklch(0.60 0.20 25 / 0.08)", label: "严重" },
  medium: { color: "oklch(0.70 0.15 70)", bg: "oklch(0.70 0.15 70 / 0.08)", label: "中等" },
  low: { color: "oklch(0.55 0.12 155)", bg: "oklch(0.55 0.12 155 / 0.08)", label: "轻微" },
};

const TASK_TYPE_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  study: { icon: BookOpen, label: "学习", color: "oklch(0.55 0.15 250)" },
  practice: { icon: Target, label: "练习", color: "oklch(0.55 0.15 155)" },
  review: { icon: Brain, label: "复习", color: "oklch(0.65 0.15 55)" },
  test: { icon: Zap, label: "测试", color: "oklch(0.60 0.20 25)" },
};

const BEAR_TYPE_IMAGES: Record<string, string> = {
  grizzly: BEAR_IMAGES.grizzly,
  panda: BEAR_IMAGES.panda,
  polar: BEAR_IMAGES.polar,
};

// ─── Main Component ─────────────────────────────────────────────────

export default function ExamShareReport() {
  const [, params] = useRoute("/exam/share/:token");
  const token = params?.token || "";

  const { data, isLoading, error } = trpc.exam.shareDetail.useQuery(
    { shareToken: token },
    { enabled: !!token, retry: 1 }
  );

  // Set OG meta tags for WeChat sharing
  useEffect(() => {
    if (!data) return;
    document.title = `${data.examTitle || `${data.subject}考试`}诊断报告 — ${data.studentName}`;

    // Set meta tags for WeChat sharing
    const setMeta = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("property", property);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    setMeta("og:title", `📝 ${data.examTitle || `${data.subject}考试`}诊断报告`);
    setMeta("og:description", `${data.studentName}的${data.bearName}获得了 ${data.score}/${data.totalScore} 分 | AI 已生成个性化学习路径`);
    setMeta("og:image", BEAR_TYPE_IMAGES[data.bearType] || BEAR_IMAGES.grizzly);
    setMeta("og:type", "article");
  }, [data]);

  const scorePercent = useMemo(() => {
    if (!data) return 0;
    return Math.round((data.score / data.totalScore) * 100);
  }, [data]);

  const [expandedPhase, setExpandedPhase] = useState<number | null>(1);
  const [expandedWrong, setExpandedWrong] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.97 0.01 85)" }}>
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: "oklch(0.52 0.09 55)" }} />
          <p className="text-sm" style={{ color: "oklch(0.50 0.05 55)" }}>正在加载诊断报告...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "oklch(0.97 0.01 85)" }}>
        <div className="text-center max-w-sm">
          <img src={BEAR_IMAGES.thinking} alt="" className="w-24 mx-auto mb-4 opacity-60" />
          <h2 className="text-lg font-bold mb-2" style={{ color: "oklch(0.30 0.06 55)" }}>报告不存在或已过期</h2>
          <p className="text-sm text-muted-foreground">请联系分享者获取最新链接</p>
        </div>
      </div>
    );
  }

  // Organize learning path nodes by phase
  const nodesByPhase = (data.pathNodes || []).reduce((acc: Record<number, any[]>, node: any) => {
    const phase = node.phaseIndex ?? 0;
    if (!acc[phase]) acc[phase] = [];
    acc[phase].push(node);
    return acc;
  }, {} as Record<number, any[]>);

  const phases = (data.learningPath as any)?.phases || (data.learningPath as any) || [];

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.97 0.01 85)" }}>
      {/* ═══ Header Banner ═══ */}
      <div
        className="relative overflow-hidden px-5 pt-8 pb-6"
        style={{ background: "linear-gradient(135deg, oklch(0.52 0.09 55), oklch(0.58 0.12 75))" }}
      >
        {/* Decorative bear */}
        <div className="absolute -right-6 -top-2 opacity-15">
          <img src={BEAR_TYPE_IMAGES[data.bearType] || BEAR_IMAGES.grizzly} alt="" className="w-36" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <img
              src={BEAR_TYPE_IMAGES[data.bearType] || BEAR_IMAGES.grizzly}
              alt=""
              className="w-10 h-10 rounded-full ring-2 ring-white/30"
            />
            <div>
              <div className="text-white/90 text-xs">{data.studentName}的{data.bearName}</div>
              <div className="text-white font-bold text-sm">试卷诊断报告</div>
            </div>
          </div>

          <h1 className="text-xl font-black text-white mb-1">
            {data.examTitle || `${data.subject}考试`}
          </h1>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white">
              {data.subject}
            </span>
            {data.overallGrade && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white">
                {data.overallGrade}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-8 -mt-2">
        {/* ═══ Score Card ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 shadow-sm mb-4"
        >
          <div className="flex items-center gap-5">
            {/* Score Circle */}
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="oklch(0.92 0.02 55)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke={scorePercent >= 80 ? "oklch(0.55 0.15 155)" : scorePercent >= 60 ? "oklch(0.70 0.15 70)" : "oklch(0.60 0.20 25)"}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${scorePercent * 2.64} 264`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black" style={{ color: "oklch(0.30 0.06 55)" }}>{data.score}</span>
                <span className="text-[10px] text-muted-foreground">/ {data.totalScore}</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm leading-relaxed" style={{ color: "oklch(0.40 0.04 55)" }}>
                {data.overallComment}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ═══ Radar Chart ═══ */}
        {data.dimensionScores && data.dimensionScores.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-5 shadow-sm mb-4"
          >
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
              <Brain className="w-4 h-4" style={{ color: "oklch(0.52 0.09 55)" }} />
              知识维度分析
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={data.dimensionScores}>
                  <PolarGrid stroke="oklch(0.88 0.02 55)" />
                  <PolarAngleAxis
                    dataKey="dimension"
                    tick={{ fontSize: 11, fill: "oklch(0.40 0.04 55)" }}
                  />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="得分"
                    dataKey="score"
                    stroke="oklch(0.52 0.09 55)"
                    fill="oklch(0.52 0.09 55)"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* ═══ Strengths & Weaknesses ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 gap-4 mb-4"
        >
          {/* Strengths */}
          {data.strongPoints && data.strongPoints.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
                <Star className="w-4 h-4" style={{ color: "oklch(0.70 0.15 70)" }} />
                优势领域
              </h3>
              <div className="space-y-2">
                {data.strongPoints.map((p: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "oklch(0.55 0.15 155)" }} />
                    <span style={{ color: "oklch(0.35 0.04 55)" }}>{p.point || p}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weaknesses */}
          {data.weakPoints && data.weakPoints.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
                <AlertTriangle className="w-4 h-4" style={{ color: "oklch(0.60 0.20 25)" }} />
                需要加强
              </h3>
              <div className="space-y-2">
                {data.weakPoints.map((p: any, i: number) => {
                  const severity = SEVERITY_CONFIG[(p.severity as string) || "medium"] || SEVERITY_CONFIG.medium;
                  return (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 mt-0.5"
                        style={{ background: severity.bg, color: severity.color }}
                      >
                        {severity.label}
                      </span>
                      <span style={{ color: "oklch(0.35 0.04 55)" }}>{p.point || p}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>

        {/* ═══ Wrong Answers ═══ */}
        {data.wrongAnswers && data.wrongAnswers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-5 shadow-sm mb-4"
          >
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
              <Target className="w-4 h-4" style={{ color: "oklch(0.60 0.20 25)" }} />
              错题分析 ({data.wrongAnswers.length} 题)
            </h3>
            <div className="space-y-2">
              {data.wrongAnswers.map((q: any, i: number) => (
                <div key={i} className="rounded-xl overflow-hidden border border-[oklch(0.90_0.02_55)]">
                  <button
                    onClick={() => setExpandedWrong(expandedWrong === i ? null : i)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: "oklch(0.60 0.20 25 / 0.08)", color: "oklch(0.60 0.20 25)" }}>
                        {q.knowledgePoint || `第${i + 1}题`}
                      </span>
                      <span className="text-sm truncate" style={{ color: "oklch(0.35 0.04 55)" }}>
                        {q.question?.slice(0, 40)}
                      </span>
                    </div>
                    {expandedWrong === i ? <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />}
                  </button>
                  {expandedWrong === i && (
                    <div className="px-4 pb-4 space-y-2 text-sm">
                      {q.studentAnswer && (
                        <div className="flex gap-2">
                          <span className="text-muted-foreground shrink-0">学生答案：</span>
                          <span style={{ color: "oklch(0.60 0.20 25)" }}>{q.studentAnswer}</span>
                        </div>
                      )}
                      {q.correctAnswer && (
                        <div className="flex gap-2">
                          <span className="text-muted-foreground shrink-0">正确答案：</span>
                          <span style={{ color: "oklch(0.55 0.15 155)" }}>{q.correctAnswer}</span>
                        </div>
                      )}
                      {q.explanation && (
                        <div className="mt-2 p-3 rounded-lg text-xs leading-relaxed" style={{ background: "oklch(0.52 0.09 55 / 0.05)", color: "oklch(0.35 0.04 55)" }}>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══ Learning Path ═══ */}
        {phases.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl p-5 shadow-sm mb-4"
          >
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
              <MapPin className="w-4 h-4" style={{ color: "oklch(0.52 0.09 55)" }} />
              个性化学习路径
            </h3>

            <div className="space-y-3">
              {phases.map((phase: any, pi: number) => {
                const phaseNodes = nodesByPhase[phase.phaseIndex ?? pi + 1] || [];
                const completedCount = phaseNodes.filter((n: any) => n.isCompleted).length;
                const isExpanded = expandedPhase === pi;

                return (
                  <div key={pi} className="rounded-xl border border-[oklch(0.90_0.02_55)] overflow-hidden">
                    <button
                      onClick={() => setExpandedPhase(isExpanded ? null : pi)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                        style={{ background: "oklch(0.52 0.09 55)" }}
                      >
                        {pi + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm" style={{ color: "oklch(0.30 0.06 55)" }}>{phase.title}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          {phase.duration && <span><Clock className="w-3 h-3 inline" /> {phase.duration}</span>}
                          {phaseNodes.length > 0 && <span>{completedCount}/{phaseNodes.length} 已完成</span>}
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />}
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4">
                        {phase.description && (
                          <p className="text-xs text-muted-foreground mb-3 pl-10">{phase.description}</p>
                        )}
                        <div className="space-y-2 pl-3">
                          {phaseNodes.map((node: any) => {
                            const taskConfig = TASK_TYPE_CONFIG[node.taskType] || TASK_TYPE_CONFIG.study;
                            const TaskIcon = taskConfig.icon;
                            return (
                              <div
                                key={node.id}
                                className="flex items-start gap-2.5 py-2 px-3 rounded-lg"
                                style={{ background: node.isCompleted ? "oklch(0.55 0.12 155 / 0.05)" : "oklch(0.96 0.01 55)" }}
                              >
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                                  style={{ background: `${taskConfig.color}15` }}
                                >
                                  <TaskIcon className="w-3 h-3" style={{ color: taskConfig.color }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium" style={{ color: node.isCompleted ? "oklch(0.55 0.12 155)" : "oklch(0.30 0.06 55)" }}>
                                    {node.title}
                                  </div>
                                  {node.description && (
                                    <div className="text-xs text-muted-foreground mt-0.5">{node.description}</div>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${taskConfig.color}12`, color: taskConfig.color }}>
                                      {taskConfig.label}
                                    </span>
                                    {node.estimatedMinutes && (
                                      <span className="text-[10px] text-muted-foreground">
                                        <Clock className="w-3 h-3 inline" /> {node.estimatedMinutes}分钟
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {node.isCompleted && (
                                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-1" style={{ color: "oklch(0.55 0.15 155)" }} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ═══ Footer CTA ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center py-6"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <img src={BEAR_IMAGES.happy} alt="" className="w-10 opacity-70" />
          </div>
          <p className="text-xs text-muted-foreground mb-1">由 熊 Agent AI 生成</p>
          <p className="text-[10px] text-muted-foreground/60">让 AI 学习变得温暖有趣</p>
        </motion.div>
      </div>
    </div>
  );
}
