/*
 * 熊 Agent — 学习课程页面
 * 分页学习 + 小熊出题闯关模式
 * 每页少量知识 → 小熊出题检测 → 全部答对进入下一页 → 通关解锁下一章
 */
import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, BookOpen, Clock, ChevronLeft, ChevronRight,
  Loader2, Check, Play, Lock, Sparkles, Award, X, CircleCheck,
  CircleX, HelpCircle, ArrowRight, Trophy, Star, Zap
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ChatMarkdown from "@/components/ChatMarkdown";
import { BEAR_IMAGES } from "@/lib/bearAssets";

const SUBJECT_COLORS: Record<string, string> = {
  "数学": "#E74C3C", "语文": "#3498DB", "英语": "#2ECC71",
  "物理": "#9B59B6", "化学": "#F39C12", "生物": "#1ABC9C",
  "历史": "#E67E22", "地理": "#16A085", "政治": "#8E44AD",
  "编程": "#2C3E50", "科学": "#27AE60", "音乐": "#E91E63",
};

// Bear messages for different quiz states
const BEAR_QUIZ_MESSAGES = {
  intro: [
    "看完这页内容了吗？让我来考考你~",
    "小熊来出题啦！看看你学会了没~",
    "准备好了吗？来做几道小题吧！",
  ],
  correct: [
    "太棒了！答对啦！🎉",
    "真厉害！你学得很好！",
    "完全正确！继续加油！",
    "没错！你真是个学习天才！",
  ],
  wrong: [
    "哎呀，再想想看~",
    "不太对哦，再试一次吧！",
    "别灰心，仔细看看内容再试试~",
    "差一点点，再想想？",
  ],
  allCorrect: [
    "全部答对！你太厉害了！🌟",
    "完美通关！可以进入下一页啦！",
    "满分！小熊为你骄傲！🏆",
  ],
  chapterComplete: [
    "恭喜通关本章！你真是太棒了！🎊",
    "本章全部完成！准备好迎接新的挑战了吗？",
  ],
};

function getRandomMessage(messages: string[]) {
  return messages[Math.floor(Math.random() * messages.length)];
}

// ==================== QUIZ COMPONENT ====================

interface QuizQuestion {
  id: number;
  questionIndex: number;
  questionType: string;
  question: string;
  options: string[];
  correctAnswer: string | null;
  explanation: string | null;
}

interface StudentAnswer {
  questionId: number;
  answer: string;
  isCorrect: boolean;
  attemptNumber: number;
}

function QuizSection({
  questions,
  studentAnswers,
  pagePassed,
  courseId,
  chapterId,
  pageId,
  onAnswerSubmitted,
  bearImage,
}: {
  questions: QuizQuestion[];
  studentAnswers: StudentAnswer[];
  pagePassed: boolean;
  courseId: number;
  chapterId: number;
  pageId: number;
  onAnswerSubmitted: () => void;
  bearImage: string;
}) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [bearMessage, setBearMessage] = useState(getRandomMessage(BEAR_QUIZ_MESSAGES.intro));
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});

  const submitMutation = trpc.course.submitAnswer.useMutation({
    onSuccess: (result) => {
      if (result.isCorrect) {
        setBearMessage(getRandomMessage(BEAR_QUIZ_MESSAGES.correct));
        if (result.pagePassed) {
          setTimeout(() => {
            setBearMessage(getRandomMessage(BEAR_QUIZ_MESSAGES.allCorrect));
          }, 1000);
        }
        if (result.chapterPassed) {
          setTimeout(() => {
            setBearMessage(getRandomMessage(BEAR_QUIZ_MESSAGES.chapterComplete));
          }, 2000);
        }
      } else {
        setBearMessage(getRandomMessage(BEAR_QUIZ_MESSAGES.wrong));
      }
      onAnswerSubmitted();
    },
    onError: (err) => toast.error(err.message || "提交失败"),
  });

  const handleSelectAnswer = (questionId: number, answer: string) => {
    // Don't allow changing if already answered correctly
    const alreadyCorrect = studentAnswers.some(a => a.questionId === questionId && a.isCorrect);
    if (alreadyCorrect) return;

    setSelectedAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmitAnswer = (questionId: number) => {
    const answer = selectedAnswers[questionId];
    if (!answer) {
      toast.error("请先选择一个答案");
      return;
    }
    submitMutation.mutate({
      courseId,
      chapterId,
      pageId,
      questionId,
      answer,
    });
  };

  const isQuestionCorrect = (questionId: number) => {
    return studentAnswers.some(a => a.questionId === questionId && a.isCorrect);
  };

  const getLatestAnswer = (questionId: number) => {
    const answers = studentAnswers.filter(a => a.questionId === questionId);
    return answers.length > 0 ? answers[answers.length - 1] : null;
  };

  if (questions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8"
    >
      {/* Bear Quiz Header */}
      <div className="flex items-start gap-3 mb-6 p-4 rounded-2xl" style={{ background: "oklch(0.52 0.09 55 / 0.06)" }}>
        <motion.img
          src={bearImage}
          alt="小熊出题"
          className="w-14 h-14 rounded-full ring-2 ring-[oklch(0.52_0.09_55/0.2)] shadow-md shrink-0"
          animate={pagePassed ? { rotate: [0, -5, 5, 0] } : { y: [0, -3, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <div className="flex-1">
          <div className="text-xs font-bold mb-1" style={{ color: "oklch(0.52 0.09 55)" }}>
            {pagePassed ? "🎉 小熊说：" : "🐻 小熊出题："}
          </div>
          <motion.p
            key={bearMessage}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-sm font-medium"
            style={{ color: "oklch(0.30 0.06 55)" }}
          >
            {bearMessage}
          </motion.p>
        </div>
        {pagePassed && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-700 shrink-0"
          >
            <Trophy className="w-3 h-3" /> 全部通过
          </motion.div>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((q, qIdx) => {
          const correct = isQuestionCorrect(q.id);
          const latestAnswer = getLatestAnswer(q.id);
          const selected = selectedAnswers[q.id];
          const isJudge = q.questionType === "judge";
          const options = isJudge ? ["对", "错"] : (q.options || []);

          return (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: qIdx * 0.1 }}
              className={`p-5 rounded-2xl border-2 transition-all ${
                correct
                  ? "border-green-200 bg-green-50/50"
                  : latestAnswer && !latestAnswer.isCorrect
                    ? "border-red-200 bg-red-50/30"
                    : "border-border bg-card"
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                  correct ? "bg-green-200 text-green-700" : "bg-muted text-muted-foreground"
                }`}>
                  {correct ? <Check className="w-4 h-4" /> : qIdx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isJudge ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {isJudge ? "判断题" : "选择题"}
                    </span>
                    {correct && <span className="text-xs text-green-600 font-bold">✓ 已答对</span>}
                  </div>
                  <p className="text-sm font-medium" style={{ color: "oklch(0.30 0.06 55)" }}>
                    {q.question}
                  </p>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2 ml-10">
                {options.map((opt, optIdx) => {
                  const optionLabel = isJudge ? opt : String.fromCharCode(65 + optIdx);
                  const isSelected = selected === opt;
                  const isCorrectOption = correct && q.correctAnswer === opt;
                  const isWrongSelected = latestAnswer && !latestAnswer.isCorrect && latestAnswer.answer === opt;

                  return (
                    <motion.button
                      key={optIdx}
                      whileHover={!correct ? { scale: 1.01 } : {}}
                      whileTap={!correct ? { scale: 0.99 } : {}}
                      onClick={() => handleSelectAnswer(q.id, opt)}
                      disabled={correct}
                      className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                        isCorrectOption
                          ? "bg-green-100 border-2 border-green-300 text-green-800 font-bold"
                          : isWrongSelected
                            ? "bg-red-100 border-2 border-red-300 text-red-700"
                            : isSelected
                              ? "border-2 text-white font-bold shadow-md"
                              : "border-2 border-transparent bg-muted/50 hover:bg-muted text-foreground/80"
                      }`}
                      style={isSelected && !correct && !isWrongSelected ? { background: "oklch(0.55 0.15 250)", borderColor: "oklch(0.55 0.15 250)" } : {}}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isCorrectOption ? "bg-green-200 text-green-700" :
                        isWrongSelected ? "bg-red-200 text-red-700" :
                        isSelected ? "bg-white/20 text-white" :
                        "bg-background text-muted-foreground"
                      }`}>
                        {isCorrectOption ? <CircleCheck className="w-4 h-4" /> :
                         isWrongSelected ? <CircleX className="w-4 h-4" /> :
                         optionLabel}
                      </span>
                      <span>{isJudge ? opt : opt}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Submit / Status */}
              <div className="ml-10 mt-3 flex items-center gap-3">
                {!correct && (
                  <Button
                    onClick={() => handleSubmitAnswer(q.id)}
                    disabled={!selected || submitMutation.isPending}
                    size="sm"
                    className="text-white font-bold text-xs"
                    style={{ background: "oklch(0.52 0.09 55)" }}
                  >
                    {submitMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Zap className="w-3 h-3 mr-1" />}
                    提交答案
                  </Button>
                )}
                {latestAnswer && !latestAnswer.isCorrect && (
                  <span className="text-xs text-red-500">
                    已尝试 {latestAnswer.attemptNumber} 次，再想想~
                  </span>
                )}
              </div>

              {/* Explanation (shown after correct) */}
              {correct && q.explanation && (
                <div className="ml-10 mt-3">
                  <button
                    onClick={() => setShowExplanation(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                    className="flex items-center gap-1 text-xs font-bold transition"
                    style={{ color: "oklch(0.55 0.15 250)" }}
                  >
                    <HelpCircle className="w-3 h-3" />
                    {showExplanation[q.id] ? "收起解析" : "查看解析"}
                  </button>
                  <AnimatePresence>
                    {showExplanation[q.id] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 p-3 rounded-xl text-xs text-muted-foreground leading-relaxed"
                        style={{ background: "oklch(0.55 0.15 250 / 0.05)" }}
                      >
                        {q.explanation}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ==================== CHAPTER LEARNING VIEW ====================

function ChapterLearningView({
  courseId,
  chapterId,
  chapterTitle,
  chapterIndex,
  totalChapters,
  bearImage,
  onBack,
  onChapterComplete,
}: {
  courseId: number;
  chapterId: number;
  chapterTitle: string;
  chapterIndex: number;
  totalChapters: number;
  bearImage: string;
  onBack: () => void;
  onChapterComplete: () => void;
}) {
  const [currentPageIdx, setCurrentPageIdx] = useState(0);

  const pagesQuery = trpc.course.chapterPages.useQuery(
    { courseId, chapterId },
    {
      enabled: true,
      staleTime: 30_000, // Keep data fresh for 30s (auto-generation can take time)
      retry: 2,
      retryDelay: 3000,
    }
  );

  const pages = pagesQuery.data?.pages || [];
  const progress = pagesQuery.data?.progress;
  const currentPage = pages[currentPageIdx];

  const canGoNext = useMemo(() => {
    if (!currentPage) return false;
    // If page has no questions, can always proceed
    if (currentPage.questions.length === 0) return true;
    // Must pass all questions
    return currentPage.passed;
  }, [currentPage]);

  const allPagesPassed = useMemo(() => {
    return pages.length > 0 && pages.every(p => p.passed || p.questions.length === 0);
  }, [pages]);

  const handleNextPage = () => {
    if (currentPageIdx < pages.length - 1) {
      setCurrentPageIdx(currentPageIdx + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevPage = () => {
    if (currentPageIdx > 0) {
      setCurrentPageIdx(currentPageIdx - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (pagesQuery.isLoading || pagesQuery.isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <motion.img
          src={bearImage}
          alt="小熊正在准备"
          className="w-20 h-20 rounded-full mb-4 shadow-lg"
          animate={{ rotate: [0, -5, 5, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <Loader2 className="w-6 h-6 animate-spin mb-3" style={{ color: "oklch(0.52 0.09 55)" }} />
        <p className="text-sm font-bold" style={{ color: "oklch(0.52 0.09 55)" }}>小熊正在为你准备学习内容...</p>
        <p className="text-xs text-muted-foreground mt-1">首次进入需要生成分页内容和题目，请稍等片刻</p>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="text-center py-16">
        <Lock className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
        <p className="text-muted-foreground">本章节内容正在生成中，请稍后再来</p>
        <Button onClick={onBack} variant="outline" className="mt-4">
          <ChevronLeft className="w-4 h-4 mr-1" /> 返回
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Chapter Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
        >
          <ChevronLeft className="w-4 h-4" /> 返回章节列表
        </button>
        <div className="text-xs text-muted-foreground">
          第 {chapterIndex} 章 / 共 {totalChapters} 章
        </div>
      </div>

      {/* Chapter Title Bar */}
      <div className="bear-card p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "oklch(0.52 0.09 55 / 0.1)" }}>
              <BookOpen className="w-5 h-5" style={{ color: "oklch(0.52 0.09 55)" }} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: "oklch(0.30 0.06 55)" }}>
                第 {chapterIndex} 章：{chapterTitle}
              </h2>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span>第 {currentPageIdx + 1} / {pages.length} 页</span>
                {progress && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3" style={{ color: "#D4A017" }} />
                    已通过 {progress.passedPages} / {progress.totalPages} 页
                  </span>
                )}
              </div>
            </div>
          </div>
          {allPagesPassed && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-700"
            >
              <Award className="w-4 h-4" /> 本章通关
            </motion.div>
          )}
        </div>

        {/* Page Progress Dots */}
        <div className="flex items-center gap-1.5 mt-4 flex-wrap">
          {pages.map((p, idx) => {
            const isPassed = p.passed || p.questions.length === 0;
            const isCurrent = idx === currentPageIdx;
            return (
              <button
                key={p.id}
                onClick={() => {
                  // Can navigate to any passed page or the current frontier
                  if (isPassed || idx <= currentPageIdx) {
                    setCurrentPageIdx(idx);
                  }
                }}
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${
                  isCurrent
                    ? "text-white shadow-md scale-110"
                    : isPassed
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : idx <= currentPageIdx
                        ? "bg-muted text-muted-foreground hover:bg-muted/80"
                        : "bg-muted/50 text-muted-foreground/40"
                }`}
                style={isCurrent ? { background: "oklch(0.52 0.09 55)" } : {}}
                title={`第 ${idx + 1} 页：${p.title}`}
              >
                {isPassed ? <Check className="w-3 h-3" /> : idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Page Content */}
      <AnimatePresence mode="wait">
        {currentPage && (
          <motion.div
            key={currentPage.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bear-card p-6 mb-6">
              {/* Page Title */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: "oklch(0.55 0.15 250)" }}>
                  {currentPageIdx + 1}
                </div>
                <h3 className="text-base font-bold" style={{ color: "oklch(0.30 0.06 55)" }}>
                  {currentPage.title}
                </h3>
              </div>

              {/* Knowledge Content */}
              <div className="prose prose-sm max-w-none mb-2">
                <ChatMarkdown>{currentPage.content}</ChatMarkdown>
              </div>

              {/* Quiz Section */}
              {currentPage.questions.length > 0 && (
                <QuizSection
                  questions={currentPage.questions}
                  studentAnswers={currentPage.studentAnswers}
                  pagePassed={currentPage.passed}
                  courseId={courseId}
                  chapterId={chapterId}
                  pageId={currentPage.id}
                  onAnswerSubmitted={() => pagesQuery.refetch()}
                  bearImage={bearImage}
                />
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                onClick={handlePrevPage}
                disabled={currentPageIdx === 0}
                variant="outline"
                className="text-sm"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> 上一页
              </Button>

              <span className="text-xs text-muted-foreground">
                {currentPageIdx + 1} / {pages.length}
              </span>

              {currentPageIdx < pages.length - 1 ? (
                <Button
                  onClick={handleNextPage}
                  disabled={!canGoNext}
                  className={`text-sm font-bold ${canGoNext ? "text-white" : ""}`}
                  style={canGoNext ? { background: "oklch(0.52 0.09 55)" } : {}}
                  variant={canGoNext ? "default" : "outline"}
                >
                  {!canGoNext && currentPage.questions.length > 0 ? (
                    <>
                      <Lock className="w-4 h-4 mr-1" /> 答对全部题目后解锁
                    </>
                  ) : (
                    <>
                      下一页 <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              ) : allPagesPassed ? (
                <Button
                  onClick={onChapterComplete}
                  className="text-white font-bold text-sm"
                  style={{ background: "#2ECC71" }}
                >
                  <Trophy className="w-4 h-4 mr-1" /> 完成本章
                </Button>
              ) : (
                <Button disabled variant="outline" className="text-sm">
                  <Lock className="w-4 h-4 mr-1" /> 完成所有题目
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==================== MAIN COURSES PAGE ====================

type ViewState = "list" | "course" | "learning";

export default function Courses() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [view, setView] = useState<ViewState>("list");
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [learningChapter, setLearningChapter] = useState<{ id: number; title: string; index: number } | null>(null);
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

  const lastCompletedChapter = useMemo(() => {
    if (courseDetailQuery.data?.progress) return courseDetailQuery.data.progress.lastCompletedChapter || 0;
    return 0;
  }, [courseDetailQuery.data]);

  const courseProgress = useMemo(() => {
    if (!courseDetailQuery.data) return 0;
    const total = courseDetailQuery.data.chapters.length;
    if (total === 0) return 0;
    return Math.round((lastCompletedChapter / total) * 100);
  }, [courseDetailQuery.data, lastCompletedChapter]);

  // Get bear image based on user's bear type
  const bearImage = useMemo(() => {
    return BEAR_IMAGES.happy;
  }, []);

  const handleSelectCourse = (courseId: number) => {
    setSelectedCourseId(courseId);
    setView("course");
  };

  const handleStartChapter = (chapter: { id: number; title: string; chapterIndex: number }) => {
    setLearningChapter({ id: chapter.id, title: chapter.title, index: chapter.chapterIndex });
    setView("learning");
  };

  const handleChapterComplete = () => {
    toast.success("🎉 恭喜通关本章！");
    courseDetailQuery.refetch();
    progressQuery.refetch();
    setView("course");
    setLearningChapter(null);
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

        {/* Learning View */}
        {view === "learning" && learningChapter && selectedCourseId && (
          <ChapterLearningView
            courseId={selectedCourseId}
            chapterId={learningChapter.id}
            chapterTitle={learningChapter.title}
            chapterIndex={learningChapter.index}
            totalChapters={courseDetailQuery.data?.chapters.length || 0}
            bearImage={bearImage}
            onBack={() => { setView("course"); setLearningChapter(null); }}
            onChapterComplete={handleChapterComplete}
          />
        )}

        {/* Course Detail View */}
        {view === "course" && selectedCourseId && courseDetailQuery.data && (
          <div>
            <button
              onClick={() => { setView("list"); setSelectedCourseId(null); }}
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

            {/* Chapter List */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold mb-2" style={{ color: "oklch(0.30 0.06 55)" }}>课程章节</h3>
              {courseDetailQuery.data.chapters.map((ch: any, i: number) => {
                const isCompleted = ch.chapterIndex <= lastCompletedChapter;
                const isLocked = ch.chapterIndex > lastCompletedChapter + 1;
                const isCurrent = ch.chapterIndex === lastCompletedChapter + 1;

                return (
                  <motion.div
                    key={ch.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`bear-card p-5 transition-all ${
                      isLocked ? "opacity-60" : "hover:shadow-md cursor-pointer"
                    }`}
                    onClick={() => {
                      if (!isLocked && ch.isGenerated) {
                        handleStartChapter(ch);
                      } else if (isLocked) {
                        toast.error("请先完成前面的章节");
                      } else {
                        toast.error("本章节内容正在生成中");
                      }
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shrink-0 ${
                        isCompleted
                          ? "bg-green-100 text-green-700"
                          : isCurrent
                            ? "text-white shadow-md"
                            : "bg-muted text-muted-foreground"
                      }`}
                        style={isCurrent ? { background: "oklch(0.52 0.09 55)" } : {}}
                      >
                        {isCompleted ? <Check className="w-6 h-6" /> :
                         isLocked ? <Lock className="w-5 h-5" /> :
                         ch.chapterIndex}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm" style={{ color: "oklch(0.30 0.06 55)" }}>
                          第 {ch.chapterIndex} 章：{ch.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {ch.estimatedMinutes} 分钟</span>
                          {(() => { const kp = ch.keyPoints as string[] | null; return kp && kp.length > 0 ? <span className="truncate">重点：{kp.join("、")}</span> : null; })()}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {isCompleted ? (
                          <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                            <Check className="w-3 h-3" /> 已通关
                          </span>
                        ) : isCurrent ? (
                          <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-white" style={{ background: "oklch(0.52 0.09 55)" }}>
                            <Play className="w-3 h-3" /> 开始学习
                          </span>
                        ) : (
                          <Lock className="w-4 h-4 text-muted-foreground/40" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Course List View */}
        {view === "list" && (
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
                    onClick={() => handleSelectCourse(course.id)}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: (SUBJECT_COLORS[course.subject] || "#95A5A6") + "15" }}>
                        <BookOpen className="w-5 h-5" style={{ color: SUBJECT_COLORS[course.subject] || "#95A5A6" }} />
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: (SUBJECT_COLORS[course.subject] || "#95A5A6") + "20", color: SUBJECT_COLORS[course.subject] || "#95A5A6" }}>
                        {course.subject}
                      </span>
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
