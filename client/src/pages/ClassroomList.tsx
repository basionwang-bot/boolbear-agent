/**
 * 互动课堂列表页 — OpenMAIC 风格
 * 创建课堂 + 查看已有课堂列表
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, Plus, Loader2, Clock, BookOpen,
  Trash2, ChevronRight, Sparkles, AlertCircle
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { BEAR_IMAGES } from "@/lib/bearAssets";

const SUBJECT_OPTIONS = [
  { value: "", label: "自动识别" },
  { value: "数学", label: "数学" },
  { value: "语文", label: "语文" },
  { value: "英语", label: "英语" },
  { value: "物理", label: "物理" },
  { value: "化学", label: "化学" },
  { value: "生物", label: "生物" },
  { value: "历史", label: "历史" },
  { value: "地理", label: "地理" },
  { value: "编程", label: "编程" },
  { value: "科学", label: "科学" },
];

const STATUS_MAP: Record<string, { label: string; color: string; bgColor: string }> = {
  generating: { label: "生成中", color: "oklch(0.65 0.15 85)", bgColor: "oklch(0.65 0.15 85 / 0.12)" },
  ready: { label: "就绪", color: "oklch(0.50 0.10 155)", bgColor: "oklch(0.50 0.10 155 / 0.12)" },
  failed: { label: "失败", color: "oklch(0.60 0.20 25)", bgColor: "oklch(0.60 0.20 25 / 0.12)" },
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} 分钟`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hrs} 小时 ${remainMins} 分钟`;
}

export default function ClassroomList() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [requirement, setRequirement] = useState("");
  const [subject, setSubject] = useState("");

  const { data: classrooms, isLoading, refetch } = trpc.classroom.list.useQuery(
    undefined,
    { enabled: isAuthenticated, refetchInterval: 5000 }
  );

  const createMutation = trpc.classroom.create.useMutation({
    onSuccess: (data) => {
      toast.success("课堂创建中，AI 正在生成课程内容...");
      setShowCreate(false);
      setRequirement("");
      setSubject("");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "创建失败");
    },
  });

  const deleteMutation = trpc.classroom.delete.useMutation({
    onSuccess: () => {
      toast.success("课堂已删除");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "删除失败");
    },
  });

  const handleCreate = () => {
    if (!requirement.trim()) {
      toast.error("请输入课堂主题或学习需求");
      return;
    }
    createMutation.mutate({
      requirement: requirement.trim(),
      subject: subject || undefined,
    });
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("确定要删除这个课堂吗？")) {
      deleteMutation.mutate({ classroomId: id });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-bear-brown" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container max-w-5xl py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "oklch(0.52 0.09 55 / 0.1)" }}>
              <GraduationCap className="w-6 h-6" style={{ color: "oklch(0.52 0.09 55)" }} />
            </div>
            <div>
              <h1 className="text-2xl font-black" style={{ color: "oklch(0.30 0.06 55)" }}>
                互动课堂
              </h1>
              <p className="text-sm text-muted-foreground">
                AI 多智能体交互式课堂，小熊老师带你学习
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="bear-btn flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            创建课堂
          </Button>
        </div>

        {/* Create Modal */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
              onClick={() => setShowCreate(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-card rounded-3xl shadow-2xl p-8 w-full max-w-lg"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-6">
                  <img src={BEAR_IMAGES.happy} alt="" className="w-12 h-12" />
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: "oklch(0.30 0.06 55)" }}>
                      创建互动课堂
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      告诉小熊你想学什么，AI 会为你生成完整的互动课程
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: "oklch(0.35 0.06 55)" }}>
                      学习主题 / 需求 *
                    </label>
                    <textarea
                      value={requirement}
                      onChange={e => setRequirement(e.target.value)}
                      placeholder="例如：帮我讲解牛顿三大定律，要有互动和测验&#10;或者：Python 入门教程，从变量到循环"
                      className="w-full h-32 px-4 py-3 rounded-xl border border-border bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-bear-brown/30"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: "oklch(0.35 0.06 55)" }}>
                      学科（可选）
                    </label>
                    <select
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-bear-brown/30"
                    >
                      {SUBJECT_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreate(false)}
                      className="flex-1"
                    >
                      取消
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={createMutation.isPending || !requirement.trim()}
                      className="flex-1 bear-btn"
                    >
                      {createMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          开始生成
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Classroom List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-bear-brown" />
          </div>
        ) : !classrooms?.length ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <img src={BEAR_IMAGES.thinking} alt="" className="w-32 h-32 mx-auto mb-4 opacity-60" />
            <h3 className="text-lg font-bold text-muted-foreground mb-2">还没有课堂</h3>
            <p className="text-sm text-muted-foreground mb-4">
              点击"创建课堂"，让小熊老师为你准备一堂精彩的互动课
            </p>
            <Button onClick={() => setShowCreate(true)} className="bear-btn">
              <Plus className="w-4 h-4 mr-2" />
              创建第一个课堂
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classrooms.map((room, i) => {
              const status = STATUS_MAP[room.status] || STATUS_MAP.generating;
              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bear-card p-5 cursor-pointer hover:shadow-lg transition-all group"
                  onClick={() => {
                    if (room.status === "ready") {
                      navigate(`/classroom/${room.id}`);
                    } else if (room.status === "generating") {
                      toast.info("课堂正在生成中，请稍候...");
                    } else {
                      toast.error("课堂生成失败，请重新创建");
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ color: status.color, background: status.bgColor }}
                        >
                          {room.status === "generating" && (
                            <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
                          )}
                          {status.label}
                        </span>
                        {room.subject && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {room.subject}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-base truncate" style={{ color: "oklch(0.30 0.06 55)" }}>
                        {room.title}
                      </h3>
                    </div>
                    <button
                      onClick={(e) => handleDelete(room.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {room.sceneCount} 个场景
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDuration(room.totalDuration)}
                    </span>
                    <span className="ml-auto text-xs">
                      {new Date(room.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>

                  {room.status === "ready" && (
                    <div className="flex items-center gap-1 mt-3 text-xs font-semibold"
                      style={{ color: "oklch(0.52 0.09 55)" }}>
                      进入课堂
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
