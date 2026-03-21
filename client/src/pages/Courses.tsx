/*
 * 熊 Agent — 学习课程页面
 * 学生浏览已发布课程，查看章节内容，记录学习进度
 */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, BookOpen, Clock, ChevronLeft, ChevronRight,
  Loader2, Check, Play, Lock, Sparkles, Award
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

const SUBJECT_COLORS: Record<string, string> = {
  "数学": "#E74C3C", "语文": "#3498DB", "英语": "#2ECC71",
  "物理": "#9B59B6", "化学": "#F39C12", "生物": "#1ABC9C",
  "历史": "#E67E22", "地理": "#16A085", "政治": "#8E44AD",
  "编程": "#2C3E50", "科学": "#27AE60", "音乐": "#E91E63",
};

export default function Courses() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [filterSubject, setFilterSubject] = useState<string>("all");

  // Queries
  const coursesQuery = trpc.course.listPublished.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const courseDetailQuery = trpc.course.detail.useQuery(
    { courseId: selectedCourseId! },
    { enabled: isAuthenticated && !!selectedCourseId }
  );

  const progressQuery = trpc.course.myProgress.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Mutations
  const updateProgressMutation = trpc.course.updateProgress.useMutation({
    onSuccess: () => {
      progressQuery.refetch();
      courseDetailQuery.refetch();
      toast.success("学习进度已更新");
    },
    onError: (err) => toast.error(err.message || "更新失败"),
  });

  // Computed
  const filteredCourses = useMemo(() => {
    if (!coursesQuery.data) return [];
    if (filterSubject === "all") return coursesQuery.data;
    return coursesQuery.data.filter((c: any) => c.subject === filterSubject);
  }, [coursesQuery.data, filterSubject]);

  const subjects = useMemo(() => {
    if (!coursesQuery.data) return [];
    const set = new Set(coursesQuery.data.map((c: any) => c.subject));
    return Array.from(set);
  }, [coursesQuery.data]);

  const currentProgress = useMemo(() => {
    if (!progressQuery.data || !selectedCourseId) return null;
    return progressQuery.data.find((p: any) => p.courseId === selectedCourseId) || null;
  }, [progressQuery.data, selectedCourseId]);

  // Use the progress from the detail query (which includes progress via getOrCreateProgress)
  const lastCompletedChapter = useMemo(() => {
    // Prefer the detail query's progress since it auto-creates
    if (courseDetailQuery.data?.progress) return courseDetailQuery.data.progress.lastCompletedChapter || 0;
    if (currentProgress) return currentProgress.lastCompletedChapter || 0;
    return 0;
  }, [courseDetailQuery.data, currentProgress]);

  const completedChapters = useMemo(() => {
    if (!courseDetailQuery.data?.chapters) return new Set<number>();
    const set = new Set<number>();
    courseDetailQuery.data.chapters.forEach((ch: any) => {
      if (ch.chapterIndex <= lastCompletedChapter) set.add(ch.id);
    });
    return set;
  }, [courseDetailQuery.data, lastCompletedChapter]);

  const courseProgress = useMemo(() => {
    if (!courseDetailQuery.data) return 0;
    const total = courseDetailQuery.data.chapters.length;
    if (total === 0) return 0;
    return Math.round((lastCompletedChapter / total) * 100);
  }, [courseDetailQuery.data, lastCompletedChapter]);

  const activeChapter = useMemo(() => {
    if (!courseDetailQuery.data?.chapters) return null;
    return courseDetailQuery.data.chapters[activeChapterIndex] || null;
  }, [courseDetailQuery.data, activeChapterIndex]);

  const handleCompleteChapter = (chapterIndex: number) => {
    if (!selectedCourseId) return;
    // Mark up to this chapter as completed
    const newLast = Math.max(lastCompletedChapter, chapterIndex);
    updateProgressMutation.mutate({ courseId: selectedCourseId, lastCompletedChapter: newLast });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "oklch(0.52 0.09 55)" }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-16 text-center">
          <GraduationCap className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground text-lg">请先登录后查看学习课程</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8 max-w-6xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "oklch(0.55 0.15 250 / 0.1)" }}>
              <GraduationCap className="w-5 h-5" style={{ color: "oklch(0.55 0.15 250)" }} />
            </div>
            <div>
              <h1 className="text-2xl font-black" style={{ color: "oklch(0.30 0.06 55)" }}>学习课程</h1>
              <p className="text-sm text-muted-foreground">和小熊一起探索知识的森林</p>
            </div>
          </div>
        </motion.div>

        {/* Course Detail View */}
        {selectedCourseId && courseDetailQuery.data ? (
          <div>
            <button
              onClick={() => { setSelectedCourseId(null); setActiveChapterIndex(0); }}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition"
            >
              <ChevronLeft className="w-4 h-4" /> 返回课程列表
            </button>

            {/* Course Header */}
            <div className="bear-card p-6 mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-bold" style={{ color: "oklch(0.30 0.06 55)" }}>{courseDetailQuery.data.title}</h2>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: (SUBJECT_COLORS[courseDetailQuery.data.subject] || "#95A5A6") + "20", color: SUBJECT_COLORS[courseDetailQuery.data.subject] || "#95A5A6" }}>
                      {courseDetailQuery.data.subject}
                    </span>
                  </div>
                  {courseDetailQuery.data.description && (
                    <p className="text-sm text-muted-foreground mb-3">{courseDetailQuery.data.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {courseDetailQuery.data.chapterCount} 章节</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 约 {courseDetailQuery.data.totalMinutes} 分钟</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black" style={{ color: courseProgress === 100 ? "#2ECC71" : "oklch(0.55 0.15 250)" }}>
                    {courseProgress}%
                  </div>
                  <div className="text-xs text-muted-foreground">学习进度</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${courseProgress}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full rounded-full"
                  style={{ background: courseProgress === 100 ? "#2ECC71" : "oklch(0.55 0.15 250)" }}
                />
              </div>
              {courseProgress === 100 && (
                <div className="mt-3 flex items-center gap-2 text-sm font-bold text-green-600">
                  <Award className="w-4 h-4" /> 恭喜！你已完成本课程全部学习
                </div>
              )}
            </div>

            {/* Chapter Navigation + Content */}
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
              {/* Chapter Sidebar */}
              <div className="bear-card p-4">
                <h3 className="text-sm font-bold mb-3" style={{ color: "oklch(0.30 0.06 55)" }}>课程目录</h3>
                <div className="space-y-1">
                  {courseDetailQuery.data.chapters.map((ch: any, i: number) => {
                    const isCompleted = completedChapters.has(ch.id);
                    const isActive = i === activeChapterIndex;
                    return (
                      <button
                        key={ch.id}
                        onClick={() => setActiveChapterIndex(i)}
                        className={`w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all ${
                          isActive
                            ? "text-white shadow-md"
                            : isCompleted
                              ? "bg-green-50 text-green-700 hover:bg-green-100"
                              : "hover:bg-muted text-foreground/70"
                        }`}
                        style={isActive ? { background: "oklch(0.55 0.15 250)" } : {}}
                      >
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          isActive ? "bg-white/20 text-white" :
                          isCompleted ? "bg-green-200 text-green-700" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {isCompleted ? <Check className="w-3 h-3" /> : ch.chapterIndex}
                        </div>
                        <span className="truncate">{ch.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chapter Content */}
              <div className="bear-card p-6">
                <AnimatePresence mode="wait">
                  {activeChapter ? (
                    <motion.div key={activeChapter.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold" style={{ color: "oklch(0.30 0.06 55)" }}>
                            第 {activeChapter.chapterIndex} 章：{activeChapter.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {activeChapter.estimatedMinutes} 分钟</span>
                            {(() => { const kp = activeChapter.keyPoints as string[] | null; return kp && kp.length > 0 ? <span>重点：{kp.join("、")}</span> : null; })()}
                          </div>
                        </div>
                        {completedChapters.has(activeChapter.id) ? (
                          <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                            <Check className="w-3 h-3" /> 已完成
                          </span>
                        ) : (
                          <Button
                            onClick={() => handleCompleteChapter(activeChapter.chapterIndex)}
                            disabled={updateProgressMutation.isPending}
                            className="text-white font-bold text-sm"
                            style={{ background: "#2ECC71" }}
                          >
                            {updateProgressMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                            标记完成
                          </Button>
                        )}
                      </div>

                      {/* Learning Objectives */}
                      {(() => { const objs = activeChapter.objectives as string[] | null; return objs && objs.length > 0 ? (
                        <div className="mb-6 p-4 rounded-xl" style={{ background: "oklch(0.55 0.15 250 / 0.05)" }}>
                          <h4 className="text-sm font-bold mb-2 flex items-center gap-1" style={{ color: "oklch(0.55 0.15 250)" }}>
                            <Sparkles className="w-4 h-4" /> 学习目标
                          </h4>
                          <ul className="space-y-1">
                            {objs.map((obj: string, i: number) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5" style={{ background: "oklch(0.55 0.15 250 / 0.1)", color: "oklch(0.55 0.15 250)" }}>
                                  {i + 1}
                                </span>
                                {obj}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null; })()}

                      {/* Chapter Content */}
                      {activeChapter.content ? (
                        <div className="prose prose-sm max-w-none">
                          <Streamdown>{activeChapter.content}</Streamdown>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Lock className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                          <p className="text-muted-foreground">本章节内容正在生成中，请稍后再来</p>
                        </div>
                      )}

                      {/* Navigation Buttons */}
                      <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
                        <Button
                          onClick={() => setActiveChapterIndex(Math.max(0, activeChapterIndex - 1))}
                          disabled={activeChapterIndex === 0}
                          variant="outline"
                          className="text-sm"
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" /> 上一章
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          {activeChapterIndex + 1} / {courseDetailQuery.data.chapters.length}
                        </span>
                        <Button
                          onClick={() => setActiveChapterIndex(Math.min(courseDetailQuery.data.chapters.length - 1, activeChapterIndex + 1))}
                          disabled={activeChapterIndex === courseDetailQuery.data.chapters.length - 1}
                          variant="outline"
                          className="text-sm"
                        >
                          下一章 <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="text-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: "oklch(0.55 0.15 250)" }} />
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Subject Filter */}
            {subjects.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => setFilterSubject("all")}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                    filterSubject === "all" ? "text-white shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                  style={filterSubject === "all" ? { background: "oklch(0.55 0.15 250)" } : {}}
                >
                  全部
                </button>
                {subjects.map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterSubject(s)}
                    className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                      filterSubject === s ? "text-white shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                    style={filterSubject === s ? { background: SUBJECT_COLORS[s] || "#95A5A6" } : {}}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Course Grid */}
            {coursesQuery.isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: "oklch(0.55 0.15 250)" }} />
              </div>
            ) : filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course: any) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -4 }}
                    className="bear-card p-5 cursor-pointer group"
                    onClick={() => { setSelectedCourseId(course.id); setActiveChapterIndex(0); }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: (SUBJECT_COLORS[course.subject] || "#95A5A6") + "15" }}>
                        <BookOpen className="w-5 h-5" style={{ color: SUBJECT_COLORS[course.subject] || "#95A5A6" }} />
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: (SUBJECT_COLORS[course.subject] || "#95A5A6") + "20", color: SUBJECT_COLORS[course.subject] || "#95A5A6" }}>
                        {course.subject}
                      </span>
                      {course.gradeLevel && (
                        <span className="text-xs text-muted-foreground">{course.gradeLevel}</span>
                      )}
                    </div>
                    <h3 className="font-bold text-base mb-1 group-hover:text-[oklch(0.55_0.15_250)] transition" style={{ color: "oklch(0.30 0.06 55)" }}>
                      {course.title}
                    </h3>
                    {course.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{course.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {course.chapterCount} 章节</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.totalMinutes} 分钟</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Play className="w-4 h-4" style={{ color: "oklch(0.55 0.15 250)" }} />
                      <span className="text-xs font-bold" style={{ color: "oklch(0.55 0.15 250)" }}>开始学习</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bear-card p-16 text-center">
                <GraduationCap className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground text-lg">还没有可用的课程</p>
                <p className="text-xs text-muted-foreground mt-2">老师正在准备课程内容，请稍后再来</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
