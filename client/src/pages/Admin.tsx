/*
 * 熊 Agent — 管理员后台（老师端）
 * 功能：班级管理、邀请码生成、学生概览
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Users, BookOpen, Plus, Copy, ChevronDown, ChevronUp, Loader2, BarChart3 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { BEAR_TIERS } from "@/lib/bearAssets";

const TIER_INDEX: Record<string, number> = {
  bronze: 0, silver: 1, gold: 2, platinum: 3, diamond: 4, starlight: 5, king: 6,
};

export default function Admin() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [newClassName, setNewClassName] = useState("");
  const [newClassDesc, setNewClassDesc] = useState("");
  const [expandedClass, setExpandedClass] = useState<number | null>(null);

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      toast.error("无权访问管理后台");
      navigate("/");
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  // Data queries
  const statsQuery = trpc.admin.stats.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });
  const classesQuery = trpc.class.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });
  const studentsQuery = trpc.admin.students.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

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
    onError: (err) => {
      toast.error(err.message || "创建失败");
    },
  });

  const handleCreateClass = () => {
    if (!newClassName.trim()) {
      toast.error("请输入班级名称");
      return;
    }
    createClassMutation.mutate({
      name: newClassName.trim(),
      description: newClassDesc.trim() || undefined,
    });
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`邀请码已复制: ${code}`);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "oklch(0.52 0.09 55)" }} />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") return null;

  const stats = statsQuery.data;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8 max-w-5xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "oklch(0.52 0.09 55 / 0.1)" }}>
              <Shield className="w-5 h-5" style={{ color: "oklch(0.52 0.09 55)" }} />
            </div>
            <div>
              <h1 className="text-2xl font-black" style={{ color: "oklch(0.30 0.06 55)" }}>管理后台</h1>
              <p className="text-sm text-muted-foreground">管理班级、查看学生学习情况</p>
            </div>
          </div>
        </motion.div>

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
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bear-card p-5 flex items-center gap-4"
                >
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bear-card p-6 mb-8">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
            <Plus className="w-5 h-5" style={{ color: "oklch(0.52 0.09 55)" }} /> 创建新班级
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="班级名称，如：三年级二班"
              className="flex-1"
            />
            <Input
              value={newClassDesc}
              onChange={(e) => setNewClassDesc(e.target.value)}
              placeholder="班级描述（可选）"
              className="flex-1"
            />
            <Button
              onClick={handleCreateClass}
              disabled={createClassMutation.isPending || !newClassName.trim()}
              className="text-white font-bold"
              style={{ background: "oklch(0.52 0.09 55)" }}
            >
              {createClassMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1" /> 创建
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Classes List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
            <BookOpen className="w-5 h-5" style={{ color: "oklch(0.50 0.10 155)" }} /> 班级列表
          </h2>

          {classesQuery.isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "oklch(0.52 0.09 55)" }} />
            </div>
          ) : classesQuery.data && classesQuery.data.length > 0 ? (
            <div className="space-y-3">
              {classesQuery.data.map((cls) => (
                <div key={cls.id} className="bear-card overflow-hidden">
                  <div
                    className="p-5 flex items-center gap-4 cursor-pointer hover:bg-[oklch(0.52_0.09_55/0.02)] transition"
                    onClick={() => setExpandedClass(expandedClass === cls.id ? null : cls.id)}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "oklch(0.50 0.10 155 / 0.1)" }}>
                      <BookOpen className="w-5 h-5" style={{ color: "oklch(0.50 0.10 155)" }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold" style={{ color: "oklch(0.30 0.06 55)" }}>{cls.name}</h3>
                      {cls.description && <p className="text-xs text-muted-foreground">{cls.description}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); copyInviteCode(cls.inviteCode); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition hover:opacity-80"
                        style={{ background: "oklch(0.52 0.09 55 / 0.08)", color: "oklch(0.42 0.09 55)" }}
                      >
                        <Copy className="w-3 h-3" />
                        {cls.inviteCode}
                      </button>
                      {expandedClass === cls.id ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expanded: Students */}
                  {expandedClass === cls.id && (
                    <div className="border-t border-[oklch(0.52_0.09_55/0.08)] px-5 py-4 bg-[oklch(0.52_0.09_55/0.02)]">
                      {classStudentsQuery.isLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-5 h-5 animate-spin" style={{ color: "oklch(0.52 0.09 55)" }} />
                        </div>
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
                                <th className="pb-2">对话数</th>
                              </tr>
                            </thead>
                            <tbody>
                              {classStudentsQuery.data.map((student) => {
                                const tier = student.bear ? BEAR_TIERS[TIER_INDEX[student.bear.tier] ?? 0] : null;
                                return (
                                  <tr key={student.id} className="border-b border-[oklch(0.52_0.09_55/0.04)] last:border-0">
                                    <td className="py-2.5 pr-4 font-medium" style={{ color: "oklch(0.30 0.06 55)" }}>
                                      {student.name || student.username}
                                    </td>
                                    <td className="py-2.5 pr-4">
                                      {student.bear ? (
                                        <span className="text-xs">{student.bear.bearName}</span>
                                      ) : (
                                        <span className="text-xs text-muted-foreground">未领养</span>
                                      )}
                                    </td>
                                    <td className="py-2.5 pr-4">
                                      {tier ? (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: tier.bgColor, color: tier.color }}>
                                          {tier.rank}
                                        </span>
                                      ) : (
                                        <span className="text-xs text-muted-foreground">-</span>
                                      )}
                                    </td>
                                    <td className="py-2.5 pr-4 text-xs font-mono">
                                      {student.bear ? `Lv.${student.bear.level}` : "-"}
                                    </td>
                                    <td className="py-2.5 pr-4 text-xs font-mono">
                                      {student.bear ? student.bear.experience : "-"}
                                    </td>
                                    <td className="py-2.5 text-xs font-mono">
                                      {student.bear ? student.bear.totalChats : "-"}
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
        </motion.div>

        {/* All Students Overview */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
            <Users className="w-5 h-5" style={{ color: "oklch(0.52 0.09 55)" }} /> 全部学生
          </h2>

          {studentsQuery.isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "oklch(0.52 0.09 55)" }} />
            </div>
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
                    </tr>
                  </thead>
                  <tbody>
                    {studentsQuery.data.map((student) => {
                      const tier = student.bear ? BEAR_TIERS[TIER_INDEX[student.bear.tier] ?? 0] : null;
                      return (
                        <tr key={student.id} className="border-t border-[oklch(0.52_0.09_55/0.06)] hover:bg-[oklch(0.52_0.09_55/0.02)] transition">
                          <td className="p-3 font-medium" style={{ color: "oklch(0.30 0.06 55)" }}>
                            {student.name || student.username}
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">{student.className}</td>
                          <td className="p-3 text-xs">
                            {student.bear ? student.bear.bearName : <span className="text-muted-foreground">未领养</span>}
                          </td>
                          <td className="p-3">
                            {tier ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: tier.bgColor, color: tier.color }}>
                                {tier.rank}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-3 text-xs font-mono">{student.bear ? student.bear.experience : "-"}</td>
                          <td className="p-3 text-xs font-mono">{student.bear ? student.bear.totalChats : "-"}</td>
                          <td className="p-3 text-xs text-muted-foreground">
                            {student.lastSignedIn ? new Date(student.lastSignedIn).toLocaleDateString("zh-CN") : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bear-card p-10 text-center">
              <p className="text-muted-foreground">暂无学生注册</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
