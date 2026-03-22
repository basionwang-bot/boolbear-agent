/**
 * 试卷诊断 — 拍照上传试卷 + AI 分析 + 学习路径规划
 * 三个视图：列表、上传、分析结果详情
 */
import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRoute, useLocation } from "wouter";
import {
  Camera, Upload, FileSearch, ArrowLeft, Loader2, Trash2,
  CheckCircle2, XCircle, AlertTriangle, Star, TrendingUp,
  BookOpen, Brain, Target, Clock, ChevronRight, ChevronDown,
  ChevronUp, RotateCcw, Sparkles, Award, Zap, Eye,
  CircleCheck, Circle, MapPin, Flag, Share2, Copy, Check
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { BEAR_IMAGES } from "@/lib/bearAssets";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────

interface ImageFile {
  file: File;
  preview: string;
  base64: string;
}

// ─── Constants ───────────────────────────────────────────────────────

const SUBJECTS = [
  "语文", "数学", "英语", "物理", "化学", "生物",
  "历史", "地理", "政治", "科学", "道德与法治"
];

const SEVERITY_CONFIG = {
  high: { color: "oklch(0.60 0.20 25)", bg: "oklch(0.60 0.20 25 / 0.08)", label: "严重" },
  medium: { color: "oklch(0.70 0.15 70)", bg: "oklch(0.70 0.15 70 / 0.08)", label: "中等" },
  low: { color: "oklch(0.55 0.12 155)", bg: "oklch(0.55 0.12 155 / 0.08)", label: "轻微" },
};

const TASK_TYPE_CONFIG = {
  study: { icon: BookOpen, label: "学习", color: "oklch(0.55 0.15 250)" },
  practice: { icon: Target, label: "练习", color: "oklch(0.55 0.15 155)" },
  review: { icon: RotateCcw, label: "复习", color: "oklch(0.65 0.15 70)" },
  test: { icon: Zap, label: "测试", color: "oklch(0.60 0.20 25)" },
};

const PRIORITY_CONFIG = {
  high: { color: "oklch(0.60 0.20 25)", label: "高优先" },
  medium: { color: "oklch(0.70 0.15 70)", label: "中优先" },
  low: { color: "oklch(0.55 0.12 155)", label: "低优先" },
};

// ─── Main Component ──────────────────────────────────────────────────

export default function ExamAnalysis() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [matchDetail, paramsDetail] = useRoute("/exam/:id");
  const detailId = matchDetail ? Number(paramsDetail?.id) : null;

  const [view, setView] = useState<"list" | "upload">(detailId ? "list" : "list");

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "oklch(0.52 0.09 55)" }} />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <img src={BEAR_IMAGES.thinking} alt="" className="w-32 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-2" style={{ color: "oklch(0.30 0.06 55)" }}>
            请先登录
          </h2>
          <p className="text-muted-foreground">登录后即可使用试卷诊断功能</p>
        </div>
      </div>
    );
  }

  if (detailId) {
    return <AnalysisDetail id={detailId} onBack={() => setLocation("/exam")} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <AnimatePresence mode="wait">
        {view === "list" ? (
          <AnalysisList key="list" onUpload={() => setView("upload")} onViewDetail={(id) => setLocation(`/exam/${id}`)} />
        ) : (
          <UploadView key="upload" onBack={() => setView("list")} onCreated={(id) => setLocation(`/exam/${id}`)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Analysis List ───────────────────────────────────────────────────

function AnalysisList({ onUpload, onViewDetail }: { onUpload: () => void; onViewDetail: (id: number) => void }) {
  const { data: analyses, isLoading } = trpc.exam.list.useQuery();
  const deleteMutation = trpc.exam.delete.useMutation();
  const utils = trpc.useUtils();

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("确定要删除这份分析记录吗？")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      utils.exam.list.invalidate();
      toast.success("已删除");
    } catch {
      toast.error("删除失败");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container py-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3" style={{ color: "oklch(0.30 0.06 55)" }}>
            <FileSearch className="w-8 h-8" style={{ color: "oklch(0.52 0.09 55)" }} />
            试卷诊断
          </h1>
          <p className="text-muted-foreground mt-1">拍照上传试卷，AI 帮你分析薄弱点，规划学习路径</p>
        </div>
        <Button
          onClick={onUpload}
          className="bear-btn flex items-center gap-2"
        >
          <Camera className="w-4 h-4" />
          上传试卷
        </Button>
      </div>

      {/* Empty State */}
      {!isLoading && (!analyses || analyses.length === 0) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <img src={BEAR_IMAGES.studying} alt="" className="w-40 mx-auto mb-6 drop-shadow-lg" />
          <h3 className="text-xl font-bold mb-2" style={{ color: "oklch(0.30 0.06 55)" }}>
            还没有诊断记录
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            上传一份考试试卷，小熊会帮你分析薄弱环节，并制定专属学习计划
          </p>
          <Button onClick={onUpload} className="bear-btn">
            <Camera className="w-4 h-4 mr-2" />
            开始第一次诊断
          </Button>
        </motion.div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "oklch(0.52 0.09 55)" }} />
        </div>
      )}

      {/* Analysis Cards */}
      {analyses && analyses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {analyses.map((a: any, i: number) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onViewDetail(a.id)}
              className="bear-card p-5 cursor-pointer hover:shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white"
                    style={{ background: "oklch(0.52 0.09 55)" }}
                  >
                    {a.subject}
                  </span>
                  {a.status === "analyzing" && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1"
                      style={{ background: "oklch(0.70 0.15 70 / 0.1)", color: "oklch(0.60 0.15 70)" }}>
                      <Loader2 className="w-3 h-3 animate-spin" /> 分析中
                    </span>
                  )}
                  {a.status === "completed" && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1"
                      style={{ background: "oklch(0.55 0.12 155 / 0.1)", color: "oklch(0.45 0.12 155)" }}>
                      <CheckCircle2 className="w-3 h-3" /> 已完成
                    </span>
                  )}
                  {a.status === "failed" && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1"
                      style={{ background: "oklch(0.60 0.20 25 / 0.1)", color: "oklch(0.55 0.20 25)" }}>
                      <XCircle className="w-3 h-3" /> 失败
                    </span>
                  )}
                </div>
                <button
                  onClick={(e) => handleDelete(a.id, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>

              <h3 className="font-bold text-lg mb-1" style={{ color: "oklch(0.30 0.06 55)" }}>
                {a.examTitle || `${a.subject}考试`}
              </h3>

              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black" style={{ color: "oklch(0.52 0.09 55)" }}>
                    {a.score}
                  </span>
                  <span className="text-sm text-muted-foreground">/ {a.totalScore}</span>
                </div>
                {a.overallGrade && (
                  <span
                    className="px-2 py-0.5 rounded-lg text-sm font-bold"
                    style={{ background: "oklch(0.80 0.15 85 / 0.15)", color: "oklch(0.55 0.15 85)" }}
                  >
                    {a.overallGrade}
                  </span>
                )}
              </div>

              {a.overallComment && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {a.overallComment}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{new Date(a.createdAt).toLocaleDateString("zh-CN")}</span>
                <span className="flex items-center gap-1 group-hover:text-[oklch(0.52_0.09_55)] transition-colors">
                  查看详情 <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Upload View ─────────────────────────────────────────────────────

function UploadView({ onBack, onCreated }: { onBack: () => void; onCreated: (id: number) => void }) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [subject, setSubject] = useState("");
  const [examTitle, setExamTitle] = useState("");
  const [score, setScore] = useState("");
  const [totalScore, setTotalScore] = useState("100");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const createMutation = trpc.exam.create.useMutation();

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files) return;
    const newImages: ImageFile[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} 不是图片文件`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} 超过 10MB 限制`);
        continue;
      }
      const base64 = await fileToBase64(file);
      const preview = URL.createObjectURL(file);
      newImages.push({ file, preview, base64 });
    }
    setImages(prev => [...prev, ...newImages].slice(0, 10));
  }, []);

  const removeImage = (index: number) => {
    setImages(prev => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].preview);
      copy.splice(index, 1);
      return copy;
    });
  };

  const handleSubmit = async () => {
    if (images.length === 0) { toast.error("请上传至少一张试卷图片"); return; }
    if (!subject) { toast.error("请选择学科"); return; }
    if (!score) { toast.error("请输入考试成绩"); return; }

    setSubmitting(true);
    try {
      const result = await createMutation.mutateAsync({
        subject,
        examTitle: examTitle || undefined,
        score: Number(score),
        totalScore: Number(totalScore) || 100,
        imageDataList: images.map(img => ({
          base64: img.base64,
          mimeType: img.file.type,
          fileName: img.file.name,
        })),
      });
      toast.success("试卷已上传，AI 正在分析中...");
      onCreated(result.id);
    } catch (err: any) {
      toast.error(err?.message || "上传失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="container py-8 max-w-2xl"
    >
      {/* Header */}
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> 返回列表
      </button>

      <div className="text-center mb-8">
        <motion.img
          src={BEAR_IMAGES.studying}
          alt=""
          className="w-24 mx-auto mb-4 drop-shadow-lg"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <h2 className="text-2xl font-black" style={{ color: "oklch(0.30 0.06 55)" }}>
          上传试卷，开始诊断
        </h2>
        <p className="text-muted-foreground mt-1">拍照或选择试卷图片，小熊帮你分析</p>
      </div>

      {/* Image Upload Area */}
      <div className="bear-card p-6 mb-6">
        <label className="font-bold text-sm mb-3 block" style={{ color: "oklch(0.30 0.06 55)" }}>
          试卷图片 <span className="text-red-400">*</span>
          <span className="font-normal text-muted-foreground ml-2">（最多10张，支持拍照）</span>
        </label>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
          {images.map((img, i) => (
            <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-[oklch(0.52_0.09_55/0.15)] group">
              <img src={img.preview} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <XCircle className="w-4 h-4" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-xs text-center py-0.5">
                第{i + 1}页
              </div>
            </div>
          ))}

          {images.length < 10 && (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="aspect-[3/4] rounded-xl border-2 border-dashed border-[oklch(0.52_0.09_55/0.3)] flex flex-col items-center justify-center gap-1.5 hover:border-[oklch(0.52_0.09_55/0.6)] hover:bg-[oklch(0.52_0.09_55/0.03)] transition-all cursor-pointer"
              >
                <Camera className="w-6 h-6" style={{ color: "oklch(0.52 0.09 55)" }} />
                <span className="text-xs font-medium" style={{ color: "oklch(0.52 0.09 55)" }}>拍照</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="py-2 rounded-xl border-2 border-dashed border-[oklch(0.50_0.10_155/0.3)] flex items-center justify-center gap-1.5 hover:border-[oklch(0.50_0.10_155/0.6)] hover:bg-[oklch(0.50_0.10_155/0.03)] transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4" style={{ color: "oklch(0.50 0.10 155)" }} />
                <span className="text-xs font-medium" style={{ color: "oklch(0.50 0.10 155)" }}>选择图片</span>
              </button>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </div>

      {/* Subject & Score */}
      <div className="bear-card p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-sm mb-2 block" style={{ color: "oklch(0.30 0.06 55)" }}>
              学科 <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map(s => (
                <button
                  key={s}
                  onClick={() => setSubject(s)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    subject === s
                      ? "text-white shadow-md"
                      : "bg-[oklch(0.52_0.09_55/0.06)] hover:bg-[oklch(0.52_0.09_55/0.12)]"
                  }`}
                  style={subject === s ? { background: "oklch(0.52 0.09 55)", color: "white" } : { color: "oklch(0.40 0.06 55)" }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-bold text-sm mb-2 block" style={{ color: "oklch(0.30 0.06 55)" }}>
              考试名称 <span className="text-muted-foreground font-normal">（选填）</span>
            </label>
            <Input
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              placeholder="如：期中考试、第三单元测验"
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="font-bold text-sm mb-2 block" style={{ color: "oklch(0.30 0.06 55)" }}>
              考试成绩 <span className="text-red-400">*</span>
            </label>
            <Input
              type="number"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="得分"
              min={0}
              className="rounded-xl text-lg font-bold"
            />
          </div>
          <div>
            <label className="font-bold text-sm mb-2 block" style={{ color: "oklch(0.30 0.06 55)" }}>
              满分
            </label>
            <Input
              type="number"
              value={totalScore}
              onChange={(e) => setTotalScore(e.target.value)}
              placeholder="满分"
              min={1}
              className="rounded-xl text-lg"
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={submitting || images.length === 0 || !subject || !score}
        className="w-full bear-btn py-6 text-lg"
      >
        {submitting ? (
          <><Loader2 className="w-5 h-5 animate-spin mr-2" /> 正在上传和分析...</>
        ) : (
          <><Sparkles className="w-5 h-5 mr-2" /> 开始 AI 诊断</>
        )}
      </Button>
    </motion.div>
  );
}

// ─── Share Button ───────────────────────────────────────────────────────────────

function ShareButton({ analysisId, subject, examTitle, score, totalScore }: {
  analysisId: number;
  subject: string;
  examTitle?: string | null;
  score: number;
  totalScore: number;
}) {
  const [showPanel, setShowPanel] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const generateLink = trpc.exam.generateShareLink.useMutation();

  const handleShare = async () => {
    try {
      const { shareToken } = await generateLink.mutateAsync({ id: analysisId });
      const url = `${window.location.origin}/exam/share/${shareToken}`;
      setShareUrl(url);
      setShowPanel(true);
    } catch (err) {
      toast.error("生成分享链接失败");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("链接已复制，可以发送给家长了");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      toast.success("链接已复制");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareText = `📝 ${examTitle || `${subject}考试`}诊断报告\n🌟 成绩：${score}/${totalScore}\n🐻 小熊 AI 已生成个性化学习路径\n👉 点击查看详细报告`;

  const handleWechatShare = () => {
    // On mobile, try to use Web Share API (works in WeChat browser)
    if (navigator.share) {
      navigator.share({
        title: `${examTitle || `${subject}考试`}诊断报告`,
        text: shareText.replace(/\\n/g, "\n"),
        url: shareUrl,
      }).catch(() => {
        // User cancelled or share failed, fall back to copy
        handleCopy();
      });
    } else {
      handleCopy();
    }
  };

  return (
    <div className="relative">
      <Button
        onClick={handleShare}
        disabled={generateLink.isPending}
        variant="outline"
        className="flex items-center gap-2 border-[oklch(0.52_0.09_55/0.3)] text-[oklch(0.42_0.09_55)] hover:bg-[oklch(0.52_0.09_55/0.08)]"
      >
        {generateLink.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
        分享给家长
      </Button>

      <AnimatePresence>
        {showPanel && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setShowPanel(false)} />
            {/* Share Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 bear-card p-5 shadow-xl"
            >
              <h3 className="font-bold text-base mb-3 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
                <Share2 className="w-4 h-4" style={{ color: "oklch(0.52 0.09 55)" }} />
                分享诊断报告
              </h3>

              {/* Share link */}
              <div className="flex items-center gap-2 mb-4">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 text-xs px-3 py-2 rounded-lg bg-muted border border-border truncate"
                />
                <Button
                  size="sm"
                  onClick={handleCopy}
                  className="shrink-0"
                  style={{ background: copied ? "oklch(0.55 0.15 155)" : "oklch(0.52 0.09 55)" }}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>

              {/* Share options */}
              <div className="space-y-2">
                <button
                  onClick={handleWechatShare}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "oklch(0.55 0.15 155 / 0.12)" }}>
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="oklch(0.45 0.15 155)">
                      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-7.062-6.122zm-2.036 2.84c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: "oklch(0.30 0.06 55)" }}>微信分享</div>
                    <div className="text-xs text-muted-foreground">复制链接后发送给家长，或直接分享到微信</div>
                  </div>
                </button>

                <button
                  onClick={handleCopy}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "oklch(0.52 0.09 55 / 0.12)" }}>
                    <Copy className="w-5 h-5" style={{ color: "oklch(0.42 0.09 55)" }} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: "oklch(0.30 0.06 55)" }}>复制链接</div>
                    <div className="text-xs text-muted-foreground">复制报告链接到剪贴板</div>
                  </div>
                </button>
              </div>

              {/* Tip */}
              <div className="mt-3 px-3 py-2 rounded-lg text-xs text-muted-foreground" style={{ background: "oklch(0.52 0.09 55 / 0.05)" }}>
                💡 家长无需登录即可查看报告，链接永久有效
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Analysis Detail ─────────────────────────────────────────────────────────────

function AnalysisDetail({ id, onBack }: { id: number; onBack: () => void }) {
  const { data, isLoading, refetch } = trpc.exam.detail.useQuery(
    { id },
    { refetchInterval: (query) => query.state.data?.status === "analyzing" ? 3000 : false }
  );
  const toggleMutation = trpc.exam.toggleNode.useMutation();
  const utils = trpc.useUtils();
  const [expandedPhase, setExpandedPhase] = useState<number | null>(1);
  const [expandedWrong, setExpandedWrong] = useState<number | null>(null);

  const handleToggleNode = async (nodeId: number) => {
    try {
      await toggleMutation.mutateAsync({ nodeId });
      utils.exam.detail.invalidate({ id });
    } catch {
      toast.error("操作失败");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "oklch(0.52 0.09 55)" }} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">分析记录不存在</p>
          <Button onClick={onBack} variant="outline" className="mt-4">返回</Button>
        </div>
      </div>
    );
  }

  // Analyzing state
  if (data.status === "analyzing") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center max-w-lg">
          <motion.img
            src={BEAR_IMAGES.thinking}
            alt=""
            className="w-32 mx-auto mb-6 drop-shadow-lg"
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <h2 className="text-2xl font-black mb-3" style={{ color: "oklch(0.30 0.06 55)" }}>
            小熊正在认真分析你的试卷...
          </h2>
          <p className="text-muted-foreground mb-6">
            AI 正在识别试卷内容、分析错题原因、制定学习计划，大约需要 1-2 分钟
          </p>
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "oklch(0.52 0.09 55)" }} />
            <span className="text-sm font-medium" style={{ color: "oklch(0.52 0.09 55)" }}>分析进行中...</span>
          </div>
        </div>
      </div>
    );
  }

  // Failed state
  if (data.status === "failed") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center max-w-lg">
          <img src={BEAR_IMAGES.tired} alt="" className="w-32 mx-auto mb-6" />
          <h2 className="text-2xl font-black mb-3" style={{ color: "oklch(0.55 0.20 25)" }}>
            分析失败了
          </h2>
          <p className="text-muted-foreground mb-2">{data.errorMessage || "请重新上传试卷试试"}</p>
          <Button onClick={onBack} variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> 返回
          </Button>
        </div>
      </div>
    );
  }

  // Completed — render full analysis
  const dimensionScores = (data.dimensionScores as any[]) || [];
  const weakPoints = (data.weakPoints as any[]) || [];
  const strongPoints = (data.strongPoints as any[]) || [];
  const wrongAnswers = (data.wrongAnswers as any[]) || [];
  const learningPath = (data.learningPath as any) || { phases: [] };
  const phases = learningPath.phases || learningPath || [];
  const pathNodes = data.pathNodes || [];
  const scorePercent = Math.round((data.score / data.totalScore) * 100);

  // Group path nodes by phase
  const nodesByPhase = pathNodes.reduce((acc: Record<number, any[]>, node: any) => {
    if (!acc[node.phaseIndex]) acc[node.phaseIndex] = [];
    acc[node.phaseIndex].push(node);
    return acc;
  }, {});

  // Calculate progress
  const totalNodes = pathNodes.length;
  const completedNodes = pathNodes.filter((n: any) => n.isCompleted).length;
  const progressPercent = totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0;

  // Radar chart data
  const radarData = dimensionScores.map((d: any) => ({
    dimension: d.name,
    score: d.score,
    fullMark: d.fullScore || 100,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 max-w-5xl">
        {/* Back button + Share button */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> 返回列表
          </button>
          {data.status === "completed" && <ShareButton analysisId={id} subject={data.subject} examTitle={data.examTitle} score={data.score} totalScore={data.totalScore} />}
        </div>

        {/* ═══ Score Overview Card ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bear-card p-6 sm:p-8 mb-6 relative overflow-hidden"
        >
          {/* Decorative bear */}
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <img src={BEAR_IMAGES.happy} alt="" className="w-32" />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
            {/* Score Circle */}
            <div className="relative w-28 h-28 shrink-0">
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
                <span className="text-2xl font-black" style={{ color: "oklch(0.30 0.06 55)" }}>{data.score}</span>
                <span className="text-xs text-muted-foreground">/ {data.totalScore}</span>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-black" style={{ color: "oklch(0.30 0.06 55)" }}>
                  {data.examTitle || `${data.subject}考试`}
                </h2>
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white"
                  style={{ background: "oklch(0.52 0.09 55)" }}
                >
                  {data.subject}
                </span>
                {data.overallGrade && (
                  <span
                    className="px-2.5 py-0.5 rounded-lg text-sm font-bold"
                    style={{ background: "oklch(0.80 0.15 85 / 0.2)", color: "oklch(0.50 0.15 85)" }}
                  >
                    {data.overallGrade}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">{data.overallComment}</p>
            </div>
          </div>
        </motion.div>

        {/* ═══ Two Column Layout ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Radar Chart */}
          {radarData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bear-card p-6"
            >
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
                <Brain className="w-5 h-5" style={{ color: "oklch(0.55 0.15 250)" }} />
                能力雷达图
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="oklch(0.85 0.02 55)" />
                  <PolarAngleAxis
                    dataKey="dimension"
                    tick={{ fontSize: 12, fill: "oklch(0.45 0.04 55)" }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: "oklch(0.60 0.03 55)" }}
                  />
                  <Radar
                    name="得分"
                    dataKey="score"
                    stroke="oklch(0.52 0.09 55)"
                    fill="oklch(0.52 0.09 55)"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>

              {/* Dimension details */}
              <div className="space-y-2 mt-2">
                {dimensionScores.map((d: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-20 shrink-0 text-right">{d.name}</span>
                    <div className="flex-1 h-2 rounded-full bg-[oklch(0.92_0.02_55)]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(d.score / (d.fullScore || 100)) * 100}%`,
                          background: d.score >= 80 ? "oklch(0.55 0.15 155)" : d.score >= 60 ? "oklch(0.70 0.15 70)" : "oklch(0.60 0.20 25)",
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold w-10" style={{ color: "oklch(0.40 0.06 55)" }}>
                      {d.score}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Strengths & Weaknesses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bear-card p-6"
          >
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
              <Target className="w-5 h-5" style={{ color: "oklch(0.60 0.20 25)" }} />
              优势与薄弱点
            </h3>

            {/* Strong Points */}
            {strongPoints.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-bold mb-2 flex items-center gap-1.5" style={{ color: "oklch(0.45 0.12 155)" }}>
                  <Star className="w-4 h-4" /> 优势
                </h4>
                <div className="space-y-2">
                  {strongPoints.map((sp: any, i: number) => (
                    <div key={i} className="p-3 rounded-xl" style={{ background: "oklch(0.55 0.12 155 / 0.06)" }}>
                      <span className="font-medium text-sm" style={{ color: "oklch(0.35 0.08 155)" }}>{sp.name}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{sp.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weak Points */}
            {weakPoints.length > 0 && (
              <div>
                <h4 className="text-sm font-bold mb-2 flex items-center gap-1.5" style={{ color: "oklch(0.55 0.20 25)" }}>
                  <AlertTriangle className="w-4 h-4" /> 薄弱点
                </h4>
                <div className="space-y-2">
                  {weakPoints.map((wp: any, i: number) => {
                    const sev = SEVERITY_CONFIG[wp.severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.medium;
                    return (
                      <div key={i} className="p-3 rounded-xl" style={{ background: sev.bg }}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-sm" style={{ color: sev.color }}>{wp.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white" style={{ background: sev.color }}>
                            {sev.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{wp.description}</p>
                        {wp.relatedQuestions?.length > 0 && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            相关题目：{wp.relatedQuestions.join("、")}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* ═══ Wrong Answers Analysis ═══ */}
        {wrongAnswers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bear-card p-6 mb-6"
          >
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
              <XCircle className="w-5 h-5" style={{ color: "oklch(0.60 0.20 25)" }} />
              错题诊断
              <span className="text-sm font-normal text-muted-foreground">（共 {wrongAnswers.length} 题）</span>
            </h3>

            <div className="space-y-3">
              {wrongAnswers.map((wa: any, i: number) => (
                <div key={i} className="border border-[oklch(0.90_0.02_55)] rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedWrong(expandedWrong === i ? null : i)}
                    className="w-full p-4 flex items-center gap-3 hover:bg-[oklch(0.97_0.01_55)] transition-colors text-left"
                  >
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ background: "oklch(0.60 0.20 25)" }}
                    >
                      {wa.questionNumber}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" style={{ color: "oklch(0.30 0.06 55)" }}>
                        {wa.questionSummary}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          错误类型：<span className="font-medium" style={{ color: "oklch(0.60 0.20 25)" }}>{wa.errorType}</span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          知识点：{wa.knowledgePoint}
                        </span>
                      </div>
                    </div>
                    {expandedWrong === i ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>

                  <AnimatePresence>
                    {expandedWrong === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl" style={{ background: "oklch(0.60 0.20 25 / 0.06)" }}>
                              <span className="text-[10px] font-bold uppercase" style={{ color: "oklch(0.60 0.20 25)" }}>学生答案</span>
                              <p className="text-sm mt-1 font-medium" style={{ color: "oklch(0.40 0.06 55)" }}>{wa.studentAnswer}</p>
                            </div>
                            <div className="p-3 rounded-xl" style={{ background: "oklch(0.55 0.15 155 / 0.06)" }}>
                              <span className="text-[10px] font-bold uppercase" style={{ color: "oklch(0.45 0.12 155)" }}>正确答案</span>
                              <p className="text-sm mt-1 font-medium" style={{ color: "oklch(0.40 0.06 55)" }}>{wa.correctAnswer}</p>
                            </div>
                          </div>
                          <div className="p-3 rounded-xl bg-[oklch(0.55_0.15_250/0.04)]">
                            <span className="text-[10px] font-bold uppercase" style={{ color: "oklch(0.55 0.15 250)" }}>解析</span>
                            <p className="text-sm mt-1 text-muted-foreground leading-relaxed">{wa.explanation}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══ Learning Path Roadmap ═══ */}
        {phases.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bear-card p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
                <MapPin className="w-5 h-5" style={{ color: "oklch(0.52 0.09 55)" }} />
                个性化学习路径
              </h3>
              {totalNodes > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 rounded-full bg-[oklch(0.92_0.02_55)]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%`, background: "oklch(0.52 0.09 55)" }}
                    />
                  </div>
                  <span className="text-xs font-bold" style={{ color: "oklch(0.52 0.09 55)" }}>
                    {completedNodes}/{totalNodes}
                  </span>
                </div>
              )}
            </div>

            {/* Phase Timeline */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-[oklch(0.90_0.02_55)]" />

              <div className="space-y-4">
                {phases.map((phase: any, pi: number) => {
                  const phaseNodes = nodesByPhase[phase.phaseIndex] || [];
                  const phaseCompleted = phaseNodes.length > 0 && phaseNodes.every((n: any) => n.isCompleted);
                  const phaseProgress = phaseNodes.length > 0
                    ? Math.round((phaseNodes.filter((n: any) => n.isCompleted).length / phaseNodes.length) * 100)
                    : 0;
                  const isExpanded = expandedPhase === phase.phaseIndex;

                  const phaseColors = [
                    "oklch(0.52 0.09 55)",   // brown
                    "oklch(0.50 0.10 155)",   // green
                    "oklch(0.55 0.15 250)",   // blue
                    "oklch(0.65 0.15 310)",   // purple
                    "oklch(0.60 0.20 25)",    // red
                  ];
                  const phaseColor = phaseColors[pi % phaseColors.length];

                  return (
                    <div key={pi} className="relative">
                      {/* Phase Header */}
                      <button
                        onClick={() => setExpandedPhase(isExpanded ? null : phase.phaseIndex)}
                        className="w-full flex items-start gap-4 text-left group"
                      >
                        {/* Circle marker */}
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 relative z-10 transition-all"
                          style={{
                            background: phaseCompleted ? phaseColor : "white",
                            border: `3px solid ${phaseColor}`,
                          }}
                        >
                          {phaseCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          ) : (
                            <span className="text-sm font-bold" style={{ color: phaseColor }}>
                              {phase.phaseIndex}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 pb-2">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold" style={{ color: "oklch(0.30 0.06 55)" }}>
                              {phase.title}
                            </h4>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${phaseColor}15`, color: phaseColor }}>
                              {phase.duration}
                            </span>
                            {phaseNodes.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {phaseProgress}%
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{phase.description}</p>

                          {/* Mini progress bar */}
                          {phaseNodes.length > 0 && (
                            <div className="w-full h-1.5 rounded-full bg-[oklch(0.92_0.02_55)] mt-2">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${phaseProgress}%`, background: phaseColor }}
                              />
                            </div>
                          )}
                        </div>

                        <div className="pt-2">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </button>

                      {/* Phase Tasks */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="ml-14 space-y-2 pb-4">
                              {(phaseNodes.length > 0 ? phaseNodes : phase.tasks || []).map((task: any, ti: number) => {
                                const isNode = !!task.id; // DB node vs raw task
                                const taskTypeKey = (task.taskType || "study") as keyof typeof TASK_TYPE_CONFIG;
                                const taskConfig = TASK_TYPE_CONFIG[taskTypeKey] || TASK_TYPE_CONFIG.study;
                                const priorityKey = (task.priority || "medium") as keyof typeof PRIORITY_CONFIG;
                                const priorityConfig = PRIORITY_CONFIG[priorityKey] || PRIORITY_CONFIG.medium;
                                const TaskIcon = taskConfig.icon;

                                return (
                                  <motion.div
                                    key={ti}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: ti * 0.05 }}
                                    className={`p-3 rounded-xl border transition-all ${
                                      task.isCompleted
                                        ? "border-[oklch(0.55_0.12_155/0.3)] bg-[oklch(0.55_0.12_155/0.03)]"
                                        : "border-[oklch(0.90_0.02_55)] hover:border-[oklch(0.52_0.09_55/0.3)] hover:bg-[oklch(0.52_0.09_55/0.02)]"
                                    }`}
                                  >
                                    <div className="flex items-start gap-3">
                                      {/* Checkbox */}
                                      {isNode ? (
                                        <button
                                          onClick={() => handleToggleNode(task.id)}
                                          className="mt-0.5 shrink-0"
                                          disabled={toggleMutation.isPending}
                                        >
                                          {task.isCompleted ? (
                                            <CircleCheck className="w-5 h-5" style={{ color: "oklch(0.55 0.12 155)" }} />
                                          ) : (
                                            <Circle className="w-5 h-5 text-muted-foreground hover:text-[oklch(0.52_0.09_55)]" />
                                          )}
                                        </button>
                                      ) : (
                                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${taskConfig.color}15` }}>
                                          <TaskIcon className="w-3 h-3" style={{ color: taskConfig.color }} />
                                        </div>
                                      )}

                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className={`font-medium text-sm ${task.isCompleted ? "line-through text-muted-foreground" : ""}`} style={task.isCompleted ? {} : { color: "oklch(0.30 0.06 55)" }}>
                                            {task.title}
                                          </span>
                                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: `${taskConfig.color}12`, color: taskConfig.color }}>
                                            {taskConfig.label}
                                          </span>
                                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: `${priorityConfig.color}12`, color: priorityConfig.color }}>
                                            {priorityConfig.label}
                                          </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                          {task.description}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                                          <span className="flex items-center gap-0.5">
                                            <Clock className="w-3 h-3" /> {task.estimatedMinutes}分钟
                                          </span>
                                          <span className="flex items-center gap-0.5">
                                            <BookOpen className="w-3 h-3" /> {task.knowledgePoint}
                                          </span>
                                        </div>
                                        {task.resources && (
                                          <p className="text-[10px] text-muted-foreground mt-1 italic">
                                            建议：{task.resources}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {/* Finish flag */}
                <div className="relative flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 relative z-10"
                    style={{ background: progressPercent === 100 ? "oklch(0.52 0.09 55)" : "oklch(0.92 0.02 55)", border: "3px solid oklch(0.52 0.09 55)" }}
                  >
                    <Flag className="w-5 h-5" style={{ color: progressPercent === 100 ? "white" : "oklch(0.52 0.09 55)" }} />
                  </div>
                  <div>
                    <h4 className="font-bold" style={{ color: "oklch(0.30 0.06 55)" }}>
                      {progressPercent === 100 ? "恭喜完成所有学习任务！" : "完成所有任务，成为学霸！"}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {progressPercent === 100 ? "你已经完成了所有的学习计划，继续保持！" : `还有 ${totalNodes - completedNodes} 个任务等待完成`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ Exam Paper Images ═══ */}
        {data.imageUrls && (data.imageUrls as string[]).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bear-card p-6"
          >
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
              <Eye className="w-5 h-5" style={{ color: "oklch(0.52 0.09 55)" }} />
              试卷原图
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {(data.imageUrls as string[]).map((url: string, i: number) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-[3/4] rounded-xl overflow-hidden border-2 border-[oklch(0.90_0.02_55)] hover:border-[oklch(0.52_0.09_55/0.4)] transition-all"
                >
                  <img src={url} alt={`试卷第${i + 1}页`} className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
