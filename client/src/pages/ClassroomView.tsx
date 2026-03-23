/**
 * 互动课堂主视图 — OpenMAIC 风格
 * 左侧：场景导航
 * 中间：幻灯片/测验/讨论渲染
 * 右侧：多智能体讨论面板
 */
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Play, Pause, MessageCircle,
  CheckCircle2, XCircle, Loader2, Send, BookOpen, Award,
  Sparkles, Volume2, VolumeX, ArrowLeft, PanelRightOpen,
  PanelRightClose, ListOrdered
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";
import { BEAR_IMAGES } from "@/lib/bearAssets";
import ChatMarkdown from "@/components/ChatMarkdown";

// ─── Types ───────────────────────────────────────────────────────────

interface SlideElement {
  id: string;
  type: "text" | "shape" | "image";
  left: number;
  top: number;
  width: number;
  height: number;
  content?: string;
  defaultColor?: string;
  fill?: string;
  borderRadius?: number;
  opacity?: number;
}

interface SlideContent {
  background: {
    type: "solid" | "gradient";
    color?: string;
    gradient?: {
      type: "linear" | "radial";
      colors: { pos: number; color: string }[];
      rotate: number;
    };
  };
  elements: SlideElement[];
}

interface TeachingAction {
  type: "speech" | "spotlight" | "discussion";
  content?: string;
  params?: {
    elementId?: string;
    topic?: string;
    prompt?: string;
  };
}

interface QuizQuestion {
  id: string;
  type: "single" | "multiple" | "short_answer";
  question: string;
  options?: { label: string; value: string }[];
  answer: string[];
  analysis: string;
  points: number;
}

interface Scene {
  id: number;
  sceneIndex: number;
  sceneType: "slide" | "quiz" | "discussion";
  title: string;
  description: string | null;
  keyPoints: string[] | null;
  estimatedDuration: number;
  slideContent: SlideContent | null;
  actions: TeachingAction[] | null;
  quizQuestions: QuizQuestion[] | null;
  discussionConfig: any;
  isGenerated: boolean;
}

// ─── Slide Renderer ──────────────────────────────────────────────────

function SlideRenderer({
  slideContent,
  actions,
  spotlightId,
}: {
  slideContent: SlideContent;
  actions: TeachingAction[] | null;
  spotlightId: string | null;
}) {
  const canvasWidth = 1000;
  const canvasHeight = 562;

  const bgStyle = useMemo(() => {
    if (slideContent.background.type === "gradient" && slideContent.background.gradient) {
      const g = slideContent.background.gradient;
      const stops = g.colors.map(c => `${c.color} ${c.pos * 100}%`).join(", ");
      return {
        background: g.type === "linear"
          ? `linear-gradient(${g.rotate}deg, ${stops})`
          : `radial-gradient(circle, ${stops})`,
      };
    }
    return { background: slideContent.background.color || "#f0f4f8" };
  }, [slideContent.background]);

  return (
    <div className="relative w-full" style={{ paddingBottom: `${(canvasHeight / canvasWidth) * 100}%` }}>
      <div
        className="absolute inset-0 rounded-2xl overflow-hidden shadow-lg"
        style={bgStyle}
      >
        {slideContent.elements.map(el => {
          const isSpotlight = spotlightId === el.id;
          const scale = 1; // We'll scale based on container width

          return (
            <motion.div
              key={el.id}
              className="absolute"
              style={{
                left: `${(el.left / canvasWidth) * 100}%`,
                top: `${(el.top / canvasHeight) * 100}%`,
                width: `${(el.width / canvasWidth) * 100}%`,
                height: `${(el.height / canvasHeight) * 100}%`,
                opacity: el.opacity ?? 1,
              }}
              animate={{
                boxShadow: isSpotlight ? "0 0 0 3px oklch(0.52 0.09 55 / 0.5), 0 0 20px oklch(0.52 0.09 55 / 0.2)" : "none",
                scale: isSpotlight ? 1.02 : 1,
              }}
              transition={{ duration: 0.3 }}
            >
              {el.type === "text" && (
                <div
                  className="w-full h-full overflow-hidden"
                  style={{ color: el.defaultColor || "#333" }}
                  dangerouslySetInnerHTML={{ __html: el.content || "" }}
                />
              )}
              {el.type === "shape" && (
                <div
                  className="w-full h-full"
                  style={{
                    background: el.fill || "#e0e0e0",
                    borderRadius: el.borderRadius ? `${el.borderRadius}px` : undefined,
                  }}
                />
              )}
              {el.type === "image" && el.content && (
                <img
                  src={el.content}
                  alt=""
                  className="w-full h-full object-contain"
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Quiz Renderer ───────────────────────────────────────────────────

function QuizRenderer({
  questions,
  onSubmit,
  submitted,
  results,
}: {
  questions: QuizQuestion[];
  onSubmit: (answers: Array<{ questionId: string; answer: string[] }>) => void;
  submitted: boolean;
  results: any;
}) {
  const [answers, setAnswers] = useState<Record<string, string[]>>({});

  const toggleAnswer = (qId: string, value: string, type: string) => {
    setAnswers(prev => {
      const current = prev[qId] || [];
      if (type === "single") {
        return { ...prev, [qId]: [value] };
      } else {
        // multiple
        return {
          ...prev,
          [qId]: current.includes(value)
            ? current.filter(v => v !== value)
            : [...current, value],
        };
      }
    });
  };

  const handleSubmit = () => {
    const answerList = questions.map(q => ({
      questionId: q.id,
      answer: answers[q.id] || [],
    }));
    onSubmit(answerList);
  };

  return (
    <div className="space-y-6 p-6">
      {questions.map((q, qi) => {
        const result = results?.results?.find((r: any) => r.questionId === q.id);
        const isCorrect = result?.isCorrect;

        return (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: qi * 0.1 }}
            className="bear-card p-5"
          >
            <div className="flex items-start gap-3 mb-4">
              <span
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ background: "oklch(0.52 0.09 55)" }}
              >
                {qi + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {q.type === "single" ? "单选" : q.type === "multiple" ? "多选" : "简答"}
                  </span>
                  <span className="text-xs text-muted-foreground">{q.points} 分</span>
                </div>
                <p className="font-semibold" style={{ color: "oklch(0.30 0.06 55)" }}>
                  {q.question}
                </p>
              </div>
              {submitted && (
                <span className="shrink-0">
                  {isCorrect ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                </span>
              )}
            </div>

            {q.options && (
              <div className="space-y-2 ml-10">
                {q.options.map(opt => {
                  const selected = (answers[q.id] || []).includes(opt.value);
                  const isCorrectOption = submitted && result?.correctAnswer?.includes(opt.value);
                  const isWrongSelected = submitted && selected && !isCorrectOption;

                  return (
                    <button
                      key={opt.value}
                      onClick={() => !submitted && toggleAnswer(q.id, opt.value, q.type)}
                      disabled={submitted}
                      className={`w-full text-left px-4 py-2.5 rounded-xl border-2 transition-all text-sm ${
                        submitted
                          ? isCorrectOption
                            ? "border-green-400 bg-green-50"
                            : isWrongSelected
                            ? "border-red-400 bg-red-50"
                            : "border-border bg-background"
                          : selected
                          ? "border-bear-brown bg-bear-brown/5"
                          : "border-border bg-background hover:border-bear-brown/30"
                      }`}
                    >
                      <span className="font-semibold mr-2">{opt.value}.</span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}

            {submitted && result?.analysis && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-3 ml-10 p-3 rounded-xl text-sm"
                style={{ background: "oklch(0.52 0.09 55 / 0.06)" }}
              >
                <span className="font-semibold" style={{ color: "oklch(0.52 0.09 55)" }}>解析：</span>
                {String(result.analysis || "")}
              </motion.div>
            )}
          </motion.div>
        );
      })}

      {!submitted && (
        <div className="flex justify-center pt-2">
          <Button onClick={handleSubmit} className="bear-btn px-8">
            <Award className="w-4 h-4 mr-2" />
            提交答案
          </Button>
        </div>
      )}

      {submitted && results?.summary && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bear-card p-6 text-center"
        >
          <div className="text-4xl font-black mb-2" style={{ color: "oklch(0.52 0.09 55)" }}>
            {results.summary.earnedPoints} / {results.summary.totalPoints}
          </div>
          <p className="text-sm text-muted-foreground">
            答对 {results.summary.correctCount}/{results.summary.totalCount} 题
            {results.summary.passed ? " ✅ 通过" : " ❌ 未通过"}
          </p>
        </motion.div>
      )}
    </div>
  );
}

// ─── Discussion Panel ────────────────────────────────────────────────

function DiscussionPanel({
  classroomId,
  sceneId,
  teacherConfig,
  studentAgents,
}: {
  classroomId: number;
  sceneId?: number;
  teacherConfig: any;
  studentAgents: any[];
}) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages, refetch } = trpc.classroom.discussionMessages.useQuery(
    { classroomId, sceneId },
    { refetchInterval: 3000 }
  );

  const discussMutation = trpc.classroom.discuss.useMutation({
    onSuccess: () => {
      setMessage("");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;
    discussMutation.mutate({
      classroomId,
      sceneId,
      message: message.trim(),
    });
  };

  const getAvatar = (role: string, senderId: string) => {
    if (role === "teacher") return teacherConfig?.avatar || "🐻";
    if (role === "student") {
      const agent = studentAgents?.find((a: any) => a.id === senderId);
      return agent?.avatar || "🧑‍🎓";
    }
    return "👤";
  };

  const getRoleColor = (role: string) => {
    if (role === "teacher") return "oklch(0.52 0.09 55)";
    if (role === "student") return "oklch(0.50 0.10 155)";
    return "oklch(0.78 0.08 230)";
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
          <MessageCircle className="w-4 h-4" />
          课堂讨论
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {!messages?.length && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <p>发送消息开始讨论</p>
            <p className="text-xs mt-1">小熊老师和AI同学会参与讨论</p>
          </div>
        )}
        {messages?.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-2 ${msg.senderRole === "user" ? "flex-row-reverse" : ""}`}
          >
            <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg"
              style={{ background: `${getRoleColor(msg.senderRole)}15` }}>
              {getAvatar(msg.senderRole, msg.senderId)}
            </div>
            <div className={`max-w-[80%] ${msg.senderRole === "user" ? "text-right" : ""}`}>
              <span className="text-xs font-semibold" style={{ color: getRoleColor(msg.senderRole) }}>
                {msg.senderName}
              </span>
              <div
                className="mt-0.5 px-3 py-2 rounded-2xl text-sm"
                style={{
                  background: msg.senderRole === "user"
                    ? "oklch(0.52 0.09 55)"
                    : "oklch(0.95 0.01 85)",
                  color: msg.senderRole === "user" ? "white" : "oklch(0.30 0.06 55)",
                }}
              >
                <ChatMarkdown>{msg.content}</ChatMarkdown>
              </div>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <input
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="参与讨论..."
            className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-bear-brown/30"
          />
          <Button
            onClick={handleSend}
            disabled={discussMutation.isPending || !message.trim()}
            size="sm"
            className="bear-btn"
          >
            {discussMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Teaching Actions Player ─────────────────────────────────────────

function ActionsPlayer({
  actions,
  onSpotlight,
  teacherConfig,
}: {
  actions: TeachingAction[];
  onSpotlight: (elementId: string | null) => void;
  teacherConfig: any;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const speechActions = useMemo(
    () => actions.filter(a => a.type === "speech"),
    [actions]
  );

  const currentSpeech = speechActions[currentIndex];

  useEffect(() => {
    // Process spotlight actions
    const currentAction = actions[currentIndex];
    if (currentAction?.type === "spotlight" && currentAction.params?.elementId) {
      onSpotlight(currentAction.params.elementId);
    }
    return () => onSpotlight(null);
  }, [currentIndex]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= speechActions.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 5000); // 5 seconds per speech
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speechActions.length]);

  if (!speechActions.length) return null;

  return (
    <div className="mt-4 p-4 rounded-2xl" style={{ background: "oklch(0.52 0.09 55 / 0.06)" }}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl"
          style={{ background: "oklch(0.52 0.09 55 / 0.15)" }}>
          {teacherConfig?.avatar || "🐻"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold" style={{ color: "oklch(0.52 0.09 55)" }}>
              {teacherConfig?.name || "小熊老师"}
            </span>
            <span className="text-xs text-muted-foreground">
              {currentIndex + 1}/{speechActions.length}
            </span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-sm leading-relaxed"
              style={{ color: "oklch(0.30 0.06 55)" }}
            >
              {currentSpeech?.content || "..."}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="h-7 px-2"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsPlaying(!isPlaying)}
          className="h-7 px-3"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentIndex(Math.min(speechActions.length - 1, currentIndex + 1))}
          disabled={currentIndex >= speechActions.length - 1}
          className="h-7 px-2"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
        <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / speechActions.length) * 100}%`,
              background: "oklch(0.52 0.09 55)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main ClassroomView ──────────────────────────────────────────────

export default function ClassroomView() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const classroomId = parseInt(params.id || "0");

  const [currentSceneIndex, setCurrentSceneIndex] = useState(1);
  const [spotlightId, setSpotlightId] = useState<string | null>(null);
  const [showDiscussion, setShowDiscussion] = useState(false);
  const [showSceneList, setShowSceneList] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState<Record<number, boolean>>({});
  const [quizResults, setQuizResults] = useState<Record<number, any>>({});

  const { data: classroom, isLoading, error } = trpc.classroom.detail.useQuery(
    { classroomId },
    { enabled: !!classroomId && isAuthenticated }
  );

  const progressMutation = trpc.classroom.updateProgress.useMutation();
  const submitQuizMutation = trpc.classroom.submitQuiz.useMutation();
  const startDiscussionMutation = trpc.classroom.startDiscussion.useMutation();

  const scenes = (classroom?.scenes || []) as Scene[];
  const currentScene = scenes.find(s => s.sceneIndex === currentSceneIndex);
  const teacherConfig = classroom?.teacherConfig as any;
  const studentAgents = (classroom?.studentAgents as any[]) || [];

  // Update progress when scene changes
  useEffect(() => {
    if (classroomId && currentSceneIndex > 0) {
      progressMutation.mutate({
        classroomId,
        currentSceneIndex,
      });
    }
  }, [currentSceneIndex, classroomId]);

  // Auto-start discussion when entering a discussion scene
  useEffect(() => {
    if (currentScene?.sceneType === "discussion") {
      setShowDiscussion(true);
    }
  }, [currentScene?.id]);

  const handleQuizSubmit = (answers: Array<{ questionId: string; answer: string[] }>) => {
    if (!currentScene) return;
    submitQuizMutation.mutate(
      {
        classroomId,
        sceneId: currentScene.id,
        answers,
      },
      {
        onSuccess: (data) => {
          setQuizSubmitted(prev => ({ ...prev, [currentScene.id]: true }));
          setQuizResults(prev => ({ ...prev, [currentScene.id]: data }));
          if (data.summary.passed) {
            toast.success("测验通过！🎉");
          } else {
            toast.error("还需要加油哦，再试一次吧！");
          }
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const goToScene = (index: number) => {
    if (index >= 1 && index <= scenes.length) {
      setCurrentSceneIndex(index);
      setSpotlightId(null);
      setShowSceneList(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: "oklch(0.52 0.09 55)" }} />
          <p className="text-muted-foreground">加载课堂中...</p>
        </div>
      </div>
    );
  }

  if (error || !classroom) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <img src={BEAR_IMAGES.tired} alt="" className="w-24 h-24 mx-auto mb-4 opacity-60" />
          <p className="text-muted-foreground mb-4">课堂加载失败</p>
          <Button onClick={() => navigate("/classroom")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回列表
          </Button>
        </div>
      </div>
    );
  }

  if (classroom.status === "generating") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <motion.img
            src={BEAR_IMAGES.studying}
            alt=""
            className="w-32 h-32 mx-auto mb-4"
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <h2 className="text-xl font-bold mb-2" style={{ color: "oklch(0.30 0.06 55)" }}>
            小熊老师正在备课中...
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            AI 正在为你生成互动课程，包含幻灯片、测验和讨论环节。
            <br />这通常需要 30-60 秒。
          </p>
          <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: "oklch(0.52 0.09 55)" }} />
          <Button onClick={() => navigate("/classroom")} variant="outline" className="mt-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回列表
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <div className="shrink-0 h-14 border-b border-border flex items-center px-4 gap-3"
        style={{ background: "oklch(0.52 0.09 55 / 0.03)" }}>
        <Button variant="ghost" size="sm" onClick={() => navigate("/classroom")} className="h-8">
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold truncate" style={{ color: "oklch(0.30 0.06 55)" }}>
            {classroom.title}
          </h1>
          <p className="text-xs text-muted-foreground">
            {currentSceneIndex}/{scenes.length} · {currentScene?.title}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSceneList(!showSceneList)}
          className="h-8"
        >
          <ListOrdered className="w-4 h-4 mr-1" />
          目录
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDiscussion(!showDiscussion)}
          className="h-8"
        >
          {showDiscussion ? (
            <PanelRightClose className="w-4 h-4 mr-1" />
          ) : (
            <PanelRightOpen className="w-4 h-4 mr-1" />
          )}
          讨论
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Scene List Sidebar */}
        <AnimatePresence>
          {showSceneList && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="shrink-0 border-r border-border overflow-y-auto bg-card"
            >
              <div className="p-3 space-y-1">
                {scenes.map(scene => {
                  const isCurrent = scene.sceneIndex === currentSceneIndex;
                  const typeIcon = scene.sceneType === "slide" ? "📊"
                    : scene.sceneType === "quiz" ? "📝"
                    : "💬";
                  return (
                    <button
                      key={scene.id}
                      onClick={() => goToScene(scene.sceneIndex)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                        isCurrent
                          ? "font-bold"
                          : "hover:bg-muted"
                      }`}
                      style={isCurrent ? {
                        background: "oklch(0.52 0.09 55 / 0.1)",
                        color: "oklch(0.52 0.09 55)",
                      } : {}}
                    >
                      <span className="mr-2">{typeIcon}</span>
                      <span className="truncate">{scene.title}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6">
            {currentScene?.sceneType === "slide" && currentScene.slideContent && (
              <>
                <SlideRenderer
                  slideContent={currentScene.slideContent as unknown as SlideContent}
                  actions={currentScene.actions as unknown as TeachingAction[] | null}
                  spotlightId={spotlightId}
                />
                {currentScene.actions && (
                  <ActionsPlayer
                    actions={currentScene.actions as unknown as TeachingAction[]}
                    onSpotlight={setSpotlightId}
                    teacherConfig={teacherConfig}
                  />
                )}
              </>
            )}

            {currentScene?.sceneType === "quiz" && currentScene.quizQuestions && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background: "oklch(0.52 0.09 55 / 0.1)" }}>
                    <Award className="w-5 h-5" style={{ color: "oklch(0.52 0.09 55)" }} />
                  </div>
                  <div>
                    <h2 className="font-bold" style={{ color: "oklch(0.30 0.06 55)" }}>
                      {currentScene.title}
                    </h2>
                    <p className="text-xs text-muted-foreground">{currentScene.description}</p>
                  </div>
                </div>
                <QuizRenderer
                  questions={currentScene.quizQuestions as QuizQuestion[]}
                  onSubmit={handleQuizSubmit}
                  submitted={quizSubmitted[currentScene.id] || false}
                  results={quizResults[currentScene.id]}
                />
              </div>
            )}

            {currentScene?.sceneType === "discussion" && (
              <div className="text-center py-12">
                <img src={BEAR_IMAGES.happy} alt="" className="w-24 h-24 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2" style={{ color: "oklch(0.30 0.06 55)" }}>
                  {currentScene.title}
                </h2>
                <p className="text-muted-foreground mb-4">{currentScene.description}</p>
                <Button
                  onClick={() => {
                    setShowDiscussion(true);
                    startDiscussionMutation.mutate({
                      classroomId,
                      sceneId: currentScene.id,
                    });
                  }}
                  className="bear-btn"
                  disabled={startDiscussionMutation.isPending}
                >
                  {startDiscussionMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  开始讨论
                </Button>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => goToScene(currentSceneIndex - 1)}
                disabled={currentSceneIndex <= 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                上一页
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentSceneIndex} / {scenes.length}
              </span>
              <Button
                onClick={() => goToScene(currentSceneIndex + 1)}
                disabled={currentSceneIndex >= scenes.length}
                className="bear-btn"
              >
                下一页
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Discussion Panel */}
        <AnimatePresence>
          {showDiscussion && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="shrink-0 border-l border-border bg-card"
            >
              <DiscussionPanel
                classroomId={classroomId}
                sceneId={currentScene?.id}
                teacherConfig={teacherConfig}
                studentAgents={studentAgents}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
