/*
 * 熊 Agent — 对话页
 * 温暖的熊窝书房背景，接入真实流式 AI 对话
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Plus, Brain, Zap, Shield, Loader2, MessageCircle, Trash2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import { BEAR_IMAGES, BEAR_TIERS } from "@/lib/bearAssets";
import ChatMarkdown from "@/components/ChatMarkdown";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const TIER_INDEX: Record<string, number> = {
  bronze: 0, silver: 1, gold: 2, platinum: 3, diamond: 4, starlight: 5, king: 6,
};

const BEAR_TYPE_IMAGES: Record<string, string> = {
  grizzly: BEAR_IMAGES.grizzly,
  panda: BEAR_IMAGES.panda,
  polar: BEAR_IMAGES.polar,
};

export default function Chat() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch bear data
  const bearQuery = trpc.bear.mine.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });

  // Fetch conversations
  const convQuery = trpc.conversation.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Fetch messages for active conversation
  const msgQuery = trpc.conversation.messages.useQuery(
    { conversationId: activeConversationId! },
    { enabled: !!activeConversationId }
  );

  // Create conversation mutation
  const createConvMutation = trpc.conversation.create.useMutation({
    onSuccess: (data) => {
      if (data) {
        setActiveConversationId(data.id);
        setMessages([]);
        convQuery.refetch();
      }
    },
  });

  // Delete conversation mutation
  const deleteConvMutation = trpc.conversation.delete.useMutation({
    onSuccess: () => {
      toast.success("对话已删除");
      convQuery.refetch();
      // If deleted the active conversation, reset
      if (activeConversationId === deletingConvId) {
        setActiveConversationId(null);
        setMessages([]);
      }
      setDeletingConvId(null);
    },
    onError: (err) => {
      toast.error("删除失败：" + err.message);
      setDeletingConvId(null);
    },
  });
  const [deletingConvId, setDeletingConvId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Redirect if no bear
  useEffect(() => {
    if (!authLoading && isAuthenticated && bearQuery.isFetched && !bearQuery.data) {
      toast.info("请先领养一只小熊");
      navigate("/adopt");
    }
  }, [authLoading, isAuthenticated, bearQuery.isFetched, bearQuery.data, navigate]);

  // Auto-select first conversation or create new one
  useEffect(() => {
    if (convQuery.data && convQuery.data.length > 0 && !activeConversationId) {
      setActiveConversationId(convQuery.data[0].id);
    }
  }, [convQuery.data, activeConversationId]);

  // Load messages when conversation changes
  useEffect(() => {
    if (msgQuery.data) {
      setMessages(
        msgQuery.data.map((m) => ({
          id: m.id.toString(),
          role: m.role as "user" | "assistant",
          content: m.content,
          timestamp: new Date(m.createdAt),
        }))
      );
    }
  }, [msgQuery.data]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streamContent, isStreaming]);

  const handleNewConversation = () => {
    createConvMutation.mutate({ title: "新对话" });
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() || isStreaming || !activeConversationId) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message to UI immediately
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setStreamContent("");

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          conversationId: activeConversationId,
          message: userMessage,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "请求失败");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("无法读取响应");

      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          const data = trimmed.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "chunk") {
              fullContent += parsed.content;
              setStreamContent(fullContent);
            } else if (parsed.type === "done") {
              // XP awarded, refresh bear data
              if (parsed.xp) {
                bearQuery.refetch();
                if (parsed.xp.tierChanged) {
                  toast.success(`恭喜！你的小熊升级到了${parsed.xp.newTier}段位！`);
                }
              }
            } else if (parsed.type === "error") {
              throw new Error(parsed.message);
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }

      // Add assistant message
      if (fullContent) {
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: fullContent,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (error: any) {
      toast.error(error.message || "对话出错了");
    } finally {
      setIsStreaming(false);
      setStreamContent("");
    }
  }, [input, isStreaming, activeConversationId, bearQuery]);

  const bear = bearQuery.data;
  const currentTier = bear ? BEAR_TIERS[TIER_INDEX[bear.tier] ?? 0] : BEAR_TIERS[0];
  const bearImage = bear ? BEAR_TYPE_IMAGES[bear.bearType] || BEAR_IMAGES.grizzly : BEAR_IMAGES.grizzly;
  const nextTierExp = BEAR_TIERS[(TIER_INDEX[bear?.tier ?? "bronze"] ?? 0) + 1]?.minExp ?? currentTier.minExp + 500;
  const expProgress = bear ? ((bear.experience - currentTier.minExp) / (nextTierExp - currentTier.minExp)) * 100 : 0;

  if (authLoading || bearQuery.isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "oklch(0.52 0.09 55)" }} />
      </div>
    );
  }

  if (!bear) return null;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <Navbar />

      <div className="flex-1 flex relative">
        {/* Left Sidebar: Bear Status */}
        <motion.aside
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex w-80 flex-col border-r border-[oklch(0.52_0.09_55/0.1)] p-6 space-y-5 overflow-y-auto bg-white"
        >
          {/* Bear Avatar */}
          <div className="text-center space-y-3">
            <motion.img
              src={bearImage}
              alt={bear.bearName}
              className="w-32 h-32 mx-auto object-contain"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <div>
              <h3 className="font-extrabold text-xl" style={{ color: "oklch(0.30 0.06 55)" }}>{bear.bearName}</h3>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: currentTier.bgColor, color: currentTier.color, border: `1px solid ${currentTier.color}40` }}
                >
                  {currentTier.rank}
                </span>
                <span className="text-xs text-muted-foreground">Lv.{bear.level}</span>
              </div>
            </div>
          </div>

          {/* EXP Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">经验值</span>
              <span className="font-mono font-semibold" style={{ color: "oklch(0.52 0.09 55)" }}>{bear.experience}</span>
            </div>
            <div className="relative h-3 rounded-full overflow-hidden bg-[oklch(0.52_0.09_55/0.1)]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, expProgress)}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${currentTier.color}, oklch(0.65 0.12 65))` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-3">
            <StatRow icon={Brain} label="智慧" value={bear.wisdom} max={100} color="oklch(0.52 0.09 55)" />
            <StatRow icon={Zap} label="技术" value={bear.tech} max={100} color="oklch(0.50 0.10 155)" />
            <StatRow icon={Shield} label="社交" value={bear.social} max={100} color="oklch(0.75 0.12 65)" />
          </div>

          {/* Conversations List */}
          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">对话列表</h4>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleNewConversation}
                disabled={createConvMutation.isPending}
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "oklch(0.52 0.09 55 / 0.1)" }}
              >
                <Plus className="w-3.5 h-3.5" style={{ color: "oklch(0.52 0.09 55)" }} />
              </motion.button>
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {convQuery.data?.map((conv) => (
                <div
                  key={conv.id}
                  className={`group flex items-center gap-1 px-3 py-2 rounded-lg text-xs transition-all cursor-pointer ${
                    activeConversationId === conv.id
                      ? "font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  style={activeConversationId === conv.id ? { background: "oklch(0.52 0.09 55 / 0.08)", color: "oklch(0.42 0.09 55)" } : {}}
                  onClick={() => setActiveConversationId(conv.id)}
                >
                  <MessageCircle className="w-3 h-3 shrink-0" />
                  <span className="truncate flex-1">{conv.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingConvId(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
                    title="删除对话"
                  >
                    <Trash2 className="w-3 h-3 text-red-400 hover:text-red-600" />
                  </button>
                </div>
              ))}
              {(!convQuery.data || convQuery.data.length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-2">暂无对话</p>
              )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AnimatePresence>
              {deletingConvId !== null && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                  onClick={() => setDeletingConvId(null)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-card rounded-2xl p-6 shadow-xl max-w-sm mx-4 border"
                  >
                    <h3 className="text-lg font-bold text-foreground mb-2">确认删除对话</h3>
                    <p className="text-sm text-muted-foreground mb-5">
                      删除后该对话的所有消息将无法恢复，确定要删除吗？
                    </p>
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => setDeletingConvId(null)}
                        className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => {
                          if (deletingConvId) {
                            deleteConvMutation.mutate({ conversationId: deletingConvId });
                          }
                        }}
                        disabled={deleteConvMutation.isPending}
                        className="px-4 py-2 rounded-lg text-sm bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                        {deleteConvMutation.isPending ? "删除中..." : "确认删除"}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Emotion Status */}
          <div className="mt-auto pt-4 border-t border-[oklch(0.52_0.09_55/0.1)]">
            <div className="flex items-center gap-3">
              <motion.img
                src={isStreaming ? BEAR_IMAGES.thinking : BEAR_IMAGES.studying}
                alt="状态"
                className="w-12 h-12"
                animate={isStreaming ? { rotate: [0, -3, 3, 0] } : { scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div>
                <p className="text-xs font-semibold" style={{ color: "oklch(0.30 0.06 55)" }}>
                  {isStreaming ? "思考中..." : "心情很好！"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {isStreaming ? "正在组织语言" : "随时准备帮你学习"}
                </p>
              </div>
            </div>
          </div>
        </motion.aside>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative">
          {/* Chat Background */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: `url(${BEAR_IMAGES.chatBg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />

          {/* Chat Header (mobile) */}
          <div className="lg:hidden px-4 py-3 border-b border-[oklch(0.52_0.09_55/0.1)] flex items-center gap-3 bg-white/90 backdrop-blur-sm relative z-10">
            <img src={bearImage} alt={bear.bearName} className="w-10 h-10 rounded-full" />
            <div className="flex-1">
              <h2 className="font-bold text-sm" style={{ color: "oklch(0.30 0.06 55)" }}>{bear.bearName} · 你的学习伙伴</h2>
              <p className="text-xs text-muted-foreground">{currentTier.rank}段位 · 经验值 {bear.experience}</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleNewConversation}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "oklch(0.52 0.09 55 / 0.1)" }}
            >
              <Plus className="w-4 h-4" style={{ color: "oklch(0.52 0.09 55)" }} />
            </motion.button>
          </div>

          {/* Empty state */}
          {messages.length === 0 && !isStreaming && (
            <div className="flex-1 flex items-center justify-center relative z-10">
              <div className="text-center">
                <motion.img
                  src={bearImage}
                  alt={bear.bearName}
                  className="w-24 h-24 mx-auto mb-4 opacity-60"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <p className="text-muted-foreground text-sm">
                  嗨！我是{bear.bearName}，今天想学点什么呢？
                </p>
              </div>
            </div>
          )}

          {/* Messages */}
          {(messages.length > 0 || isStreaming) && (
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 relative z-10">
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    {msg.role === "assistant" && (
                      <img src={bearImage} alt={bear.bearName} className="w-9 h-9 rounded-full shrink-0 mt-1" />
                    )}
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        msg.role === "user"
                          ? "text-white rounded-br-md"
                          : "bg-white text-foreground rounded-bl-md border border-[oklch(0.52_0.09_55/0.1)]"
                      }`}
                      style={msg.role === "user" ? { background: "oklch(0.52 0.09 55)" } : {}}
                    >
                      {msg.role === "assistant" ? (
                        <ChatMarkdown>{msg.content}</ChatMarkdown>
                      ) : (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-9 h-9 rounded-full shrink-0 mt-1 flex items-center justify-center text-sm font-bold text-white" style={{ background: "oklch(0.50 0.10 155)" }}>
                        {user?.name?.charAt(0) || "我"}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Streaming message */}
              {isStreaming && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                  <img src={bearImage} alt={bear.bearName} className="w-9 h-9 rounded-full shrink-0" />
                  <div className="max-w-[70%] bg-white px-4 py-3 rounded-2xl rounded-bl-md border border-[oklch(0.52_0.09_55/0.1)] shadow-sm text-sm">
                    {streamContent ? (
                      <ChatMarkdown isStreaming>{streamContent}</ChatMarkdown>
                    ) : (
                      <div className="flex gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 rounded-full"
                            style={{ background: "oklch(0.52 0.09 55)" }}
                            animate={{ y: [0, -6, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 border-t border-[oklch(0.52_0.09_55/0.1)] bg-white/90 backdrop-blur-sm relative z-10">
            {user?.isChatDisabled ? (
              <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-orange-50 border border-orange-200 max-w-3xl mx-auto">
                <Shield className="w-5 h-5 text-orange-500 shrink-0" />
                <span className="text-sm text-orange-700">你的 AI 聊天功能已被管理员停用，请联系老师了解详情</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 max-w-3xl mx-auto">
                <div className="flex-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder={`问${bear.bearName}任何问题...`}
                    className="w-full px-4 py-3 rounded-2xl bg-[oklch(0.97_0.01_85)] border border-[oklch(0.52_0.09_55/0.15)] focus:border-[oklch(0.52_0.09_55/0.5)] focus:outline-none text-sm transition-all"
                    disabled={isStreaming}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSend}
                  disabled={!input.trim() || isStreaming}
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white disabled:opacity-40 transition shadow-md"
                  style={{ background: "oklch(0.52 0.09 55)" }}
                >
                  {isStreaming ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ icon: Icon, label, value, max, color }: { icon: any; label: string; value: number; max: number; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="w-3.5 h-3.5" style={{ color }} />
          {label}
        </span>
        <span className="font-mono font-semibold" style={{ color }}>{value}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden bg-[oklch(0.52_0.09_55/0.08)]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, (value / max) * 100)}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}
