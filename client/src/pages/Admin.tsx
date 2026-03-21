/*
 * 熊 Agent — 管理员后台（老师端）
 * 功能：班级管理、邀请码生成、学生概览、删除用户、班级数据可视化、生成学习报告
 */
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Users, BookOpen, Plus, Copy, ChevronDown, ChevronUp,
  Loader2, BarChart3, Trash2, FileText, TrendingUp, Brain,
  Activity, ExternalLink, Eye, Award
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { BEAR_TIERS } from "@/lib/bearAssets";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from "recharts";

const TIER_INDEX: Record<string, number> = {
  bronze: 0, silver: 1, gold: 2, platinum: 3, diamond: 4, starlight: 5, king: 6,
};

const TIER_COLORS: Record<string, string> = {
  bronze: "#CD7F32", silver: "#8B9DAF", gold: "#D4A017",
  platinum: "#4ECDC4", diamond: "#5B9BD5", starlight: "#9B59B6", king: "#E74C3C",
};

const TIER_NAMES: Record<string, string> = {
  bronze: "青铜", silver: "白银", gold: "黄金",
  platinum: "铂金", diamond: "钻石", starlight: "星耀", king: "王者",
};

const SUBJECT_COLORS: Record<string, string> = {
  "数学": "#E74C3C", "语文": "#3498DB", "英语": "#2ECC71",
  "物理": "#9B59B6", "化学": "#F39C12", "生物": "#1ABC9C",
  "历史": "#E67E22", "地理": "#16A085", "政治": "#8E44AD",
  "编程": "#2C3E50", "科学": "#27AE60", "音乐": "#E91E63",
};

const PIE_COLORS = ["#E74C3C", "#3498DB", "#2ECC71", "#9B59B6", "#F39C12", "#1ABC9C", "#E67E22", "#16A085", "#8E44AD", "#2C3E50"];

type AdminTab = "manage" | "analytics";

export default function Admin() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("manage");
  const [newClassName, setNewClassName] = useState("");
  const [newClassDesc, setNewClassDesc] = useState("");
  const [expandedClass, setExpandedClass] = useState<number | null>(null);
  const [deleteConfirmUserId, setDeleteConfirmUserId] = useState<number | null>(null);
  const [deleteConfirmUsername, setDeleteConfirmUsername] = useState<string>("");
  const [selectedAnalyticsClass, setSelectedAnalyticsClass] = useState<number | null>(null);
  const [reportGeneratingUserId, setReportGeneratingUserId] = useState<number | null>(null);
  const [generatedReportUrl, setGeneratedReportUrl] = useState<string | null>(null);

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      toast.error("无权访问管理后台");
      navigate("/");
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  const isAdmin = isAuthenticated && user?.role === "admin";

  // Data queries
  const statsQuery = trpc.admin.stats.useQuery(undefined, { enabled: isAdmin });
  const classesQuery = trpc.class.list.useQuery(undefined, { enabled: isAdmin });
  const studentsQuery = trpc.admin.students.useQuery(undefined, { enabled: isAdmin });

  // Analytics queries
  const classesAnalyticsQuery = trpc.admin.classesAnalytics.useQuery(undefined, {
    enabled: isAdmin && activeTab === "analytics",
  });
  const classAnalyticsQuery = trpc.admin.classAnalytics.useQuery(
    { classId: selectedAnalyticsClass! },
    { enabled: isAdmin && activeTab === "analytics" && !!selectedAnalyticsClass }
  );

  // Class students query (when expanded)
  const classStudentsQuery = trpc.class.students.useQuery(
    { classId: expandedClass! },
    { enabled: !!expandedClass }
  );

  const createClassMutation = trpc.class.create.useMutation({
    onSuccess: (data) => {
      toast.success(`班级创建成功！邀请码: ${data?.inviteCode}`);
      setNewClassName("");
      setNewClassDesc("");
      classesQuery.refetch();
      statsQuery.refetch();
    },
    onError: (err) => toast.error(err.message || "创建失败"),
  });

  const deleteUserMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("用户已删除");
      setDeleteConfirmUserId(null);
      setDeleteConfirmUsername("");
      studentsQuery.refetch();
      statsQuery.refetch();
    },
    onError: (err) => toast.error(err.message || "删除失败"),
  });

  const generateReportMutation = trpc.admin.generateStudentReport.useMutation({
    onSuccess: (data) => {
      const reportUrl = `${window.location.origin}/parent/${data?.token || ''}`;
      setGeneratedReportUrl(reportUrl);
      setReportGeneratingUserId(null);
      toast.success("学习报告已生成");
    },
    onError: (err) => {
      toast.error(err.message || "生成报告失败");
      setReportGeneratingUserId(null);
    },
  });

  const handleCreateClass = () => {
    if (!newClassName.trim()) { toast.error("请输入班级名称"); return; }
    createClassMutation.mutate({ name: newClassName.trim(), description: newClassDesc.trim() || undefined });
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`邀请码已复制: ${code}`);
  };

  const handleDeleteUser = (userId: number, username: string) => {
    setDeleteConfirmUserId(userId);
    setDeleteConfirmUsername(username);
  };

  const confirmDeleteUser = () => {
    if (deleteConfirmUserId) deleteUserMutation.mutate({ userId: deleteConfirmUserId });
  };

  const handleGenerateReport = (userId: number, name: string) => {
    setReportGeneratingUserId(userId);
    generateReportMutation.mutate({ userId, label: `${name} 的学习报告` });
  };

  const copyReportUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("报告链接已复制");
  };

  // Analytics computed data
  const tierChartData = useMemo(() => {
    if (!classAnalyticsQuery.data?.tierDistribution) return [];
    return Object.entries(classAnalyticsQuery.data.tierDistribution).map(([tier, count]) => ({
      name: TIER_NAMES[tier] || tier,
      value: count as number,
      fill: TIER_COLORS[tier] || "#95A5A6",
    }));
  }, [classAnalyticsQuery.data]);

  const subjectChartData = useMemo(() => {
    if (!classAnalyticsQuery.data?.subjectDistribution) return [];
    return Object.entries(classAnalyticsQuery.data.subjectDistribution)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([subject, count]) => ({
        name: subject,
        count: count as number,
        fill: SUBJECT_COLORS[subject] || "#95A5A6",
      }));
  }, [classAnalyticsQuery.data]);

  const studentBarData = useMemo(() => {
    if (!classAnalyticsQuery.data?.studentDetails) return [];
    return classAnalyticsQuery.data.studentDetails
      .sort((a: any, b: any) => (b.experience || 0) - (a.experience || 0))
      .slice(0, 15)
      .map((s: any) => ({
        name: s.name || s.username,
        经验值: s.experience || 0,
        知识点: s.knowledgePointCount || 0,
        对话数: s.conversationCount || 0,
      }));
  }, [classAnalyticsQuery.data]);

  const classOverviewData = useMemo(() => {
    if (!classesAnalyticsQuery.data) return [];
    return classesAnalyticsQuery.data.map((c: any) => ({
      name: c.className,
      学生数: c.studentCount,
      活跃人数: c.activeStudents7d,
      知识点: c.totalKnowledgePoints,
      平均经验: c.avgExperience,
    }));
  }, [classesAnalyticsQuery.data]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "oklch(0.52 0.09 55)" }} />
      </div>
    );
  }

  if (!isAdmin) return null;

  const stats = statsQuery.data;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8 max-w-6xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "oklch(0.52 0.09 55 / 0.1)" }}>
              <Shield className="w-5 h-5" style={{ color: "oklch(0.52 0.09 55)" }} />
            </div>
            <div>
              <h1 className="text-2xl font-black" style={{ color: "oklch(0.30 0.06 55)" }}>管理后台</h1>
              <p className="text-sm text-muted-foreground">管理班级、查看学习数据、生成学习报告</p>
            </div>
          </div>
        </motion.div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("manage")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === "manage"
                ? "text-white shadow-lg"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
            style={activeTab === "manage" ? { background: "oklch(0.52 0.09 55)" } : {}}
          >
            <Users className="w-4 h-4" /> 班级管理
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === "analytics"
                ? "text-white shadow-lg"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
            style={activeTab === "analytics" ? { background: "oklch(0.50 0.10 155)" } : {}}
          >
            <BarChart3 className="w-4 h-4" /> 数据分析
          </button>
        </div>

        {/* ===================== MANAGE TAB ===================== */}
        {activeTab === "manage" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="manage">
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                  { label: "总学生数", value: stats.totalStudents, icon: Users, color: "oklch(0.52 0.09 55)" },
                  { label: "班级数", value: stats.totalClasses, icon: BookOpen, color: "oklch(0.50 0.10 155)" },
                  { label: "已领养小熊", value: stats.totalBears, icon: BarChart3, color: "oklch(0.75 0.12 65)" },
                ].map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bear-card p-5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${s.color} / 0.1)`.replace(")", "") }}>
                        <Icon className="w-6 h-6" style={{ color: s.color }} />
                      </div>
                      <div>
                        <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Create Class */}
            <div className="bear-card p-6 mb-8">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
                <Plus className="w-5 h-5" style={{ color: "oklch(0.52 0.09 55)" }} /> 创建新班级
              </h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="班级名称，如：三年级二班" className="flex-1" />
                <Input value={newClassDesc} onChange={(e) => setNewClassDesc(e.target.value)} placeholder="班级描述（可选）" className="flex-1" />
                <Button onClick={handleCreateClass} disabled={createClassMutation.isPending || !newClassName.trim()} className="text-white font-bold" style={{ background: "oklch(0.52 0.09 55)" }}>
                  {createClassMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" /> 创建</>}
                </Button>
              </div>
            </div>

            {/* Classes List */}
            <div>
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
                <BookOpen className="w-5 h-5" style={{ color: "oklch(0.50 0.10 155)" }} /> 班级列表
              </h2>
              {classesQuery.isLoading ? (
                <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "oklch(0.52 0.09 55)" }} /></div>
              ) : classesQuery.data && classesQuery.data.length > 0 ? (
                <div className="space-y-3">
                  {classesQuery.data.map((cls) => (
                    <div key={cls.id} className="bear-card overflow-hidden">
                      <div className="p-5 flex items-center gap-4 cursor-pointer hover:bg-[oklch(0.52_0.09_55/0.02)] transition" onClick={() => setExpandedClass(expandedClass === cls.id ? null : cls.id)}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "oklch(0.50 0.10 155 / 0.1)" }}>
                          <BookOpen className="w-5 h-5" style={{ color: "oklch(0.50 0.10 155)" }} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold" style={{ color: "oklch(0.30 0.06 55)" }}>{cls.name}</h3>
                          {cls.description && <p className="text-xs text-muted-foreground">{cls.description}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={(e) => { e.stopPropagation(); copyInviteCode(cls.inviteCode); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition hover:opacity-80" style={{ background: "oklch(0.52 0.09 55 / 0.08)", color: "oklch(0.42 0.09 55)" }}>
                            <Copy className="w-3 h-3" />{cls.inviteCode}
                          </button>
                          {expandedClass === cls.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </div>

                      {/* Expanded: Students */}
                      {expandedClass === cls.id && (
                        <div className="border-t border-[oklch(0.52_0.09_55/0.08)] px-5 py-4 bg-[oklch(0.52_0.09_55/0.02)]">
                          {classStudentsQuery.isLoading ? (
                            <div className="flex items-center justify-center py-4"><Loader2 className="w-5 h-5 animate-spin" style={{ color: "oklch(0.52 0.09 55)" }} /></div>
                          ) : classStudentsQuery.data && classStudentsQuery.data.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-left text-xs text-muted-foreground border-b border-[oklch(0.52_0.09_55/0.08)]">
                                    <th className="pb-2 pr-4">学生</th>
                                    <th className="pb-2 pr-4">小熊</th>
                                    <th className="pb-2 pr-4">段位</th>
                                    <th className="pb-2 pr-4">等级</th>
                                    <th className="pb-2 pr-4">经验值</th>
                                    <th className="pb-2 pr-4">对话数</th>
                                    <th className="pb-2">操作</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {classStudentsQuery.data.map((student) => {
                                    const tier = student.bear ? BEAR_TIERS[TIER_INDEX[student.bear.tier] ?? 0] : null;
                                    return (
                                      <tr key={student.id} className="border-b border-[oklch(0.52_0.09_55/0.04)] last:border-0">
                                        <td className="py-2.5 pr-4 font-medium" style={{ color: "oklch(0.30 0.06 55)" }}>{student.name || student.username}</td>
                                        <td className="py-2.5 pr-4">{student.bear ? <span className="text-xs">{student.bear.bearName}</span> : <span className="text-xs text-muted-foreground">未领养</span>}</td>
                                        <td className="py-2.5 pr-4">{tier ? <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: tier.bgColor, color: tier.color }}>{tier.rank}</span> : <span className="text-xs text-muted-foreground">-</span>}</td>
                                        <td className="py-2.5 pr-4 text-xs font-mono">{student.bear ? `Lv.${student.bear.level}` : "-"}</td>
                                        <td className="py-2.5 pr-4 text-xs font-mono">{student.bear ? student.bear.experience : "-"}</td>
                                        <td className="py-2.5 pr-4 text-xs font-mono">{student.bear ? student.bear.totalChats : "-"}</td>
                                        <td className="py-2.5">
                                          <div className="flex items-center gap-1">
                                            <button
                                              onClick={() => handleGenerateReport(student.id, student.name || student.username || "学生")}
                                              disabled={reportGeneratingUserId === student.id}
                                              className="p-1.5 rounded text-xs hover:bg-blue-50 transition"
                                              style={{ color: "oklch(0.50 0.10 155)" }}
                                              title="生成学习报告"
                                            >
                                              {reportGeneratingUserId === student.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                                            </button>
                                            <button onClick={() => handleDeleteUser(student.id, student.name || student.username || "学生")} className="p-1.5 rounded text-xs text-red-600 hover:bg-red-50 transition" title="删除用户">
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">暂无学生加入此班级</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bear-card p-10 text-center">
                  <p className="text-muted-foreground">还没有创建班级</p>
                  <p className="text-xs text-muted-foreground mt-1">创建班级后，将邀请码分享给学生即可</p>
                </div>
              )}
            </div>

            {/* All Students Overview */}
            <div className="mt-8">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
                <Users className="w-5 h-5" style={{ color: "oklch(0.52 0.09 55)" }} /> 全部学生
              </h2>
              {studentsQuery.isLoading ? (
                <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "oklch(0.52 0.09 55)" }} /></div>
              ) : studentsQuery.data && studentsQuery.data.length > 0 ? (
                <div className="bear-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-muted-foreground bg-[oklch(0.52_0.09_55/0.03)]">
                          <th className="p-3">学生</th>
                          <th className="p-3">班级</th>
                          <th className="p-3">小熊</th>
                          <th className="p-3">段位</th>
                          <th className="p-3">经验值</th>
                          <th className="p-3">对话数</th>
                          <th className="p-3">最后登录</th>
                          <th className="p-3">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentsQuery.data.map((student) => {
                          const tier = student.bear ? BEAR_TIERS[TIER_INDEX[student.bear.tier] ?? 0] : null;
                          return (
                            <tr key={student.id} className="border-t border-[oklch(0.52_0.09_55/0.06)] hover:bg-[oklch(0.52_0.09_55/0.02)] transition">
                              <td className="p-3 font-medium" style={{ color: "oklch(0.30 0.06 55)" }}>{student.name || student.username}</td>
                              <td className="p-3 text-xs text-muted-foreground">{student.className}</td>
                              <td className="p-3 text-xs">{student.bear ? student.bear.bearName : <span className="text-muted-foreground">未领养</span>}</td>
                              <td className="p-3">{tier ? <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: tier.bgColor, color: tier.color }}>{tier.rank}</span> : <span className="text-xs text-muted-foreground">-</span>}</td>
                              <td className="p-3 text-xs font-mono">{student.bear ? student.bear.experience : "-"}</td>
                              <td className="p-3 text-xs font-mono">{student.bear ? student.bear.totalChats : "-"}</td>
                              <td className="p-3 text-xs text-muted-foreground">{student.lastSignedIn ? new Date(student.lastSignedIn).toLocaleDateString("zh-CN") : "-"}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleGenerateReport(student.id, student.name || student.username || "学生")}
                                    disabled={reportGeneratingUserId === student.id}
                                    className="p-1.5 rounded text-xs hover:bg-blue-50 transition"
                                    style={{ color: "oklch(0.50 0.10 155)" }}
                                    title="生成学习报告"
                                  >
                                    {reportGeneratingUserId === student.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                                  </button>
                                  <button onClick={() => handleDeleteUser(student.id, student.name || student.username || "学生")} className="p-1.5 rounded text-xs text-red-600 hover:bg-red-50 transition" title="删除用户">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bear-card p-10 text-center"><p className="text-muted-foreground">暂无学生</p></div>
              )}
            </div>
          </motion.div>
        )}

        {/* ===================== ANALYTICS TAB ===================== */}
        {activeTab === "analytics" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="analytics">
            {/* Classes Overview Cards */}
            {classesAnalyticsQuery.isLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "oklch(0.50 0.10 155)" }} /></div>
            ) : classesAnalyticsQuery.data && classesAnalyticsQuery.data.length > 0 ? (
              <>
                {/* Overall Class Comparison Chart */}
                <div className="bear-card p-6 mb-6">
                  <h2 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
                    <TrendingUp className="w-5 h-5" style={{ color: "oklch(0.50 0.10 155)" }} />
                    班级总览对比
                  </h2>
                  {classOverviewData.length > 0 && (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={classOverviewData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.52 0.09 55 / 0.1)" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{ borderRadius: "12px", border: "1px solid oklch(0.52 0.09 55 / 0.1)", fontSize: "12px" }}
                        />
                        <Legend wrapperStyle={{ fontSize: "12px" }} />
                        <Bar dataKey="学生数" fill="#CD7F32" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="活跃人数" fill="#2ECC71" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="知识点" fill="#3498DB" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="平均经验" fill="#9B59B6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Class Selector Cards */}
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
                  <Activity className="w-5 h-5" style={{ color: "oklch(0.52 0.09 55)" }} />
                  选择班级查看详情
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {classesAnalyticsQuery.data.map((cls: any) => (
                    <motion.div
                      key={cls.classId}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedAnalyticsClass(cls.classId)}
                      className={`bear-card p-5 cursor-pointer transition-all ${
                        selectedAnalyticsClass === cls.classId
                          ? "ring-2 shadow-lg"
                          : "hover:shadow-md"
                      }`}
                      style={selectedAnalyticsClass === cls.classId ? { borderColor: "oklch(0.50 0.10 155)" } : {}}
                    >
                      <h3 className="font-bold mb-3" style={{ color: "oklch(0.30 0.06 55)" }}>{cls.className}</h3>
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="p-2 rounded-lg" style={{ background: "oklch(0.52 0.09 55 / 0.06)" }}>
                          <div className="text-lg font-black" style={{ color: "oklch(0.52 0.09 55)" }}>{cls.studentCount}</div>
                          <div className="text-[10px] text-muted-foreground">学生</div>
                        </div>
                        <div className="p-2 rounded-lg" style={{ background: "oklch(0.50 0.10 155 / 0.06)" }}>
                          <div className="text-lg font-black" style={{ color: "oklch(0.50 0.10 155)" }}>{cls.activeStudents7d}</div>
                          <div className="text-[10px] text-muted-foreground">7日活跃</div>
                        </div>
                        <div className="p-2 rounded-lg" style={{ background: "oklch(0.78 0.08 230 / 0.08)" }}>
                          <div className="text-lg font-black" style={{ color: "oklch(0.60 0.10 230)" }}>{cls.totalKnowledgePoints}</div>
                          <div className="text-[10px] text-muted-foreground">知识点</div>
                        </div>
                        <div className="p-2 rounded-lg" style={{ background: "oklch(0.80 0.15 85 / 0.08)" }}>
                          <div className="text-lg font-black" style={{ color: "oklch(0.65 0.15 85)" }}>{cls.avgExperience}</div>
                          <div className="text-[10px] text-muted-foreground">平均经验</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Class Detail Analytics */}
                <AnimatePresence mode="wait">
                  {selectedAnalyticsClass && (
                    <motion.div
                      key={selectedAnalyticsClass}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      {classAnalyticsQuery.isLoading ? (
                        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "oklch(0.50 0.10 155)" }} /></div>
                      ) : classAnalyticsQuery.data ? (
                        <>
                          {/* Summary Stats */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                            {[
                              { label: "总对话数", value: classAnalyticsQuery.data.totalConversations, color: "oklch(0.52 0.09 55)", icon: "💬" },
                              { label: "总消息数", value: classAnalyticsQuery.data.totalMessages, color: "oklch(0.50 0.10 155)", icon: "📝" },
                              { label: "知识点总数", value: classAnalyticsQuery.data.totalKnowledgePoints, color: "oklch(0.60 0.10 230)", icon: "🧠" },
                              { label: "平均掌握度", value: `${classAnalyticsQuery.data.avgMastery}%`, color: "oklch(0.65 0.15 85)", icon: "📊" },
                            ].map((s) => (
                              <div key={s.label} className="bear-card p-4 text-center">
                                <div className="text-2xl mb-1">{s.icon}</div>
                                <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                                <div className="text-xs text-muted-foreground">{s.label}</div>
                              </div>
                            ))}
                          </div>

                          {/* Charts Row */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            {/* Tier Distribution Pie */}
                            {tierChartData.length > 0 && (
                              <div className="bear-card p-6">
                                <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
                                  <Award className="w-4 h-4" style={{ color: "oklch(0.52 0.09 55)" }} />
                                  段位分布
                                </h3>
                                <ResponsiveContainer width="100%" height={250}>
                                  <PieChart>
                                    <Pie
                                      data={tierChartData}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={50}
                                      outerRadius={90}
                                      paddingAngle={3}
                                      dataKey="value"
                                      label={({ name, value }) => `${name}: ${value}`}
                                    >
                                      {tierChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                      ))}
                                    </Pie>
                                    <Tooltip />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                            )}

                            {/* Subject Distribution Bar */}
                            {subjectChartData.length > 0 && (
                              <div className="bear-card p-6">
                                <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
                                  <Brain className="w-4 h-4" style={{ color: "oklch(0.50 0.10 155)" }} />
                                  知识点学科分布
                                </h3>
                                <ResponsiveContainer width="100%" height={250}>
                                  <BarChart data={subjectChartData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.52 0.09 55 / 0.1)" />
                                    <XAxis type="number" tick={{ fontSize: 12 }} />
                                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={50} />
                                    <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid oklch(0.52 0.09 55 / 0.1)", fontSize: "12px" }} />
                                    <Bar dataKey="count" name="知识点数" radius={[0, 4, 4, 0]}>
                                      {subjectChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            )}
                          </div>

                          {/* Student Rankings */}
                          {studentBarData.length > 0 && (
                            <div className="bear-card p-6 mb-6">
                              <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
                                <TrendingUp className="w-4 h-4" style={{ color: "oklch(0.52 0.09 55)" }} />
                                学生学习排行
                              </h3>
                              <ResponsiveContainer width="100%" height={Math.max(200, studentBarData.length * 40)}>
                                <BarChart data={studentBarData} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.52 0.09 55 / 0.1)" />
                                  <XAxis type="number" tick={{ fontSize: 12 }} />
                                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={60} />
                                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid oklch(0.52 0.09 55 / 0.1)", fontSize: "12px" }} />
                                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                                  <Bar dataKey="经验值" fill="#CD7F32" radius={[0, 4, 4, 0]} />
                                  <Bar dataKey="知识点" fill="#3498DB" radius={[0, 4, 4, 0]} />
                                  <Bar dataKey="对话数" fill="#2ECC71" radius={[0, 4, 4, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          )}

                          {/* Student Detail Table with Report Button */}
                          {classAnalyticsQuery.data.studentDetails && classAnalyticsQuery.data.studentDetails.length > 0 && (
                            <div className="bear-card overflow-hidden">
                              <div className="p-5 border-b border-[oklch(0.52_0.09_55/0.08)]">
                                <h3 className="font-bold flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
                                  <Users className="w-4 h-4" style={{ color: "oklch(0.52 0.09 55)" }} />
                                  学生明细
                                </h3>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-left text-xs text-muted-foreground bg-[oklch(0.52_0.09_55/0.03)]">
                                      <th className="p-3">学生</th>
                                      <th className="p-3">小熊</th>
                                      <th className="p-3">段位</th>
                                      <th className="p-3">经验值</th>
                                      <th className="p-3">对话数</th>
                                      <th className="p-3">消息数</th>
                                      <th className="p-3">知识点</th>
                                      <th className="p-3">最后活跃</th>
                                      <th className="p-3">操作</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {classAnalyticsQuery.data.studentDetails.map((s: any) => {
                                      const tier = s.tier ? BEAR_TIERS[TIER_INDEX[s.tier] ?? 0] : null;
                                      return (
                                        <tr key={s.id} className="border-t border-[oklch(0.52_0.09_55/0.06)] hover:bg-[oklch(0.52_0.09_55/0.02)] transition">
                                          <td className="p-3 font-medium" style={{ color: "oklch(0.30 0.06 55)" }}>{s.name}</td>
                                          <td className="p-3 text-xs">{s.bearName || <span className="text-muted-foreground">未领养</span>}</td>
                                          <td className="p-3">{tier ? <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: tier.bgColor, color: tier.color }}>{tier.rank}</span> : "-"}</td>
                                          <td className="p-3 text-xs font-mono">{s.experience}</td>
                                          <td className="p-3 text-xs font-mono">{s.conversationCount}</td>
                                          <td className="p-3 text-xs font-mono">{s.messageCount}</td>
                                          <td className="p-3 text-xs font-mono">{s.knowledgePointCount}</td>
                                          <td className="p-3 text-xs text-muted-foreground">{s.lastSignedIn ? new Date(s.lastSignedIn).toLocaleDateString("zh-CN") : "-"}</td>
                                          <td className="p-3">
                                            <button
                                              onClick={() => handleGenerateReport(s.id, s.name)}
                                              disabled={reportGeneratingUserId === s.id}
                                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition hover:opacity-80 text-white"
                                              style={{ background: "oklch(0.50 0.10 155)" }}
                                            >
                                              {reportGeneratingUserId === s.id ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                              ) : (
                                                <FileText className="w-3 h-3" />
                                              )}
                                              生成报告
                                            </button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="bear-card p-10 text-center">
                          <p className="text-muted-foreground">暂无数据</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {!selectedAnalyticsClass && (
                  <div className="bear-card p-16 text-center">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-muted-foreground text-lg">请选择一个班级查看详细数据分析</p>
                    <p className="text-xs text-muted-foreground mt-2">点击上方班级卡片即可查看</p>
                  </div>
                )}
              </>
            ) : (
              <div className="bear-card p-16 text-center">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground text-lg">还没有班级数据</p>
                <p className="text-xs text-muted-foreground mt-2">创建班级并邀请学生后，这里将显示学习数据分析</p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmUserId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-background rounded-2xl p-6 max-w-sm w-full shadow-lg">
            <h3 className="text-lg font-bold mb-2" style={{ color: "oklch(0.30 0.06 55)" }}>确认删除用户</h3>
            <p className="text-sm text-muted-foreground mb-4">
              确认删除用户 <span className="font-bold" style={{ color: "oklch(0.30 0.06 55)" }}>{deleteConfirmUsername}</span> 吗？此操作不可恢复，将删除该用户的所有数据（包括小熊、对话记录等）。
            </p>
            <div className="flex gap-3">
              <Button onClick={() => { setDeleteConfirmUserId(null); setDeleteConfirmUsername(""); }} variant="outline" className="flex-1">取消</Button>
              <Button onClick={confirmDeleteUser} disabled={deleteUserMutation.isPending} className="flex-1 text-white font-bold" style={{ background: "#E74C3C" }}>
                {deleteUserMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4 mr-1" /> 确认删除</>}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Report Generated Dialog */}
      {generatedReportUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-background rounded-2xl p-6 max-w-md w-full shadow-lg">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
              <FileText className="w-5 h-5" style={{ color: "oklch(0.50 0.10 155)" }} />
              学习报告已生成
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              报告链接已生成，可以分享给家长查看。链接有效期 30 天。
            </p>
            <div className="bg-muted rounded-xl p-3 mb-4 flex items-center gap-2">
              <input
                type="text"
                value={generatedReportUrl}
                readOnly
                className="flex-1 bg-transparent text-xs font-mono outline-none"
              />
              <button
                onClick={() => copyReportUrl(generatedReportUrl)}
                className="p-2 rounded-lg hover:bg-background transition"
                title="复制链接"
              >
                <Copy className="w-4 h-4" style={{ color: "oklch(0.52 0.09 55)" }} />
              </button>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setGeneratedReportUrl(null)} variant="outline" className="flex-1">关闭</Button>
              <Button
                onClick={() => window.open(generatedReportUrl, "_blank")}
                className="flex-1 text-white font-bold"
                style={{ background: "oklch(0.50 0.10 155)" }}
              >
                <Eye className="w-4 h-4 mr-1" /> 查看报告
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
