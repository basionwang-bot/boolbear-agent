import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, MessageCircle, ChevronDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface ChatPartner {
  id: number;
  name: string;
  emoji?: string;
}

interface ChatWindowProps {
  partner: ChatPartner;
  onClose: () => void;
  position: { right: number; bottom: number };
}

function SingleChatWindow({ partner, onClose, position }: ChatWindowProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [minimized, setMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const messagesQuery = trpc.social.getMessages.useQuery(
    { partnerId: partner.id, limit: 50 },
    { refetchInterval: 3000 }
  );
  const utils = trpc.useUtils();

  const sendMutation = trpc.social.sendMessage.useMutation({
    onSuccess: () => {
      setMessage("");
      utils.social.getMessages.invalidate({ partnerId: partner.id });
      utils.social.getConversations.invalidate();
      utils.social.getUnreadCount.invalidate();
    },
  });

  // Mark as read when opening
  const markAsReadMutation = trpc.social.markAsRead.useMutation();
  useEffect(() => {
    markAsReadMutation.mutate({ senderId: partner.id });
  }, [partner.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (!minimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messagesQuery.data, minimized]);

  const handleSend = useCallback(() => {
    if (!message.trim()) return;
    sendMutation.mutate({ receiverId: partner.id, content: message.trim() });
  }, [message, partner.id]);

  const messages = [...(messagesQuery.data || [])].reverse();

  if (minimized) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed z-[100] cursor-pointer"
        style={{ right: position.right, bottom: position.bottom }}
        onClick={() => setMinimized(false)}
      >
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full shadow-lg border"
          style={{ background: "oklch(0.52 0.09 55)", borderColor: "oklch(0.52 0.09 55)" }}
        >
          <span className="text-lg">{partner.emoji || "🐻"}</span>
          <span className="text-white text-sm font-bold truncate max-w-24">{partner.name}</span>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-white/60 hover:text-white ml-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed z-[100] w-80 h-[420px] bg-card rounded-2xl shadow-2xl border flex flex-col overflow-hidden"
      style={{ right: position.right, bottom: position.bottom, borderColor: "oklch(0.52 0.09 55 / 0.2)" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 shrink-0"
        style={{ background: "oklch(0.52 0.09 55)" }}
      >
        <span className="text-lg">{partner.emoji || "🐻"}</span>
        <span className="text-white font-bold text-sm flex-1 truncate">{partner.name}</span>
        <button onClick={() => setMinimized(true)} className="text-white/60 hover:text-white">
          <Minus className="w-4 h-4" />
        </button>
        <button onClick={onClose} className="text-white/60 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ background: "oklch(0.97 0.01 85)" }}>
        {messagesQuery.isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageCircle className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-xs">开始聊天吧</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                    isMine
                      ? "text-white rounded-br-md"
                      : "bg-white text-foreground rounded-bl-md shadow-sm"
                  }`}
                  style={isMine ? { background: "oklch(0.52 0.09 55)" } : {}}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className={`text-[9px] mt-0.5 ${isMine ? "text-white/60" : "text-muted-foreground"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-2 border-t flex gap-2 shrink-0 bg-card">
        <input
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="输入消息..."
          className="flex-1 px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2"
          style={{ borderColor: "oklch(0.52 0.09 55 / 0.2)" }}
        />
        <Button
          size="sm"
          className="rounded-xl h-9 w-9 p-0"
          style={{ background: "oklch(0.52 0.09 55)" }}
          disabled={!message.trim() || sendMutation.isPending}
          onClick={handleSend}
        >
          {sendMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Chat Manager (supports multiple windows) ───────────────────────

export interface ChatTarget {
  id: number;
  name: string;
  emoji?: string;
}

interface ChatManagerProps {
  openChats: ChatTarget[];
  onCloseChat: (partnerId: number) => void;
}

export function ChatManager({ openChats, onCloseChat }: ChatManagerProps) {
  return (
    <AnimatePresence>
      {openChats.map((chat, index) => (
        <SingleChatWindow
          key={chat.id}
          partner={chat}
          onClose={() => onCloseChat(chat.id)}
          position={{ right: 24 + index * 340, bottom: 24 }}
        />
      ))}
    </AnimatePresence>
  );
}

// ─── Chat Trigger Button (for navbar) ────────────────────────────────

interface ChatTriggerProps {
  onClick: () => void;
}

export function ChatTrigger({ onClick }: ChatTriggerProps) {
  const unreadQuery = trpc.social.getUnreadCount.useQuery(undefined, { refetchInterval: 5000 });
  const count = unreadQuery.data || 0;

  return (
    <button onClick={onClick} className="relative p-2 rounded-lg hover:bg-accent transition">
      <MessageCircle className="w-5 h-5" style={{ color: "oklch(0.52 0.09 55)" }} />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
