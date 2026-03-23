/*
 * 熊 Agent — 熊熊广场
 * 社交系统：用户列表 + 双排行榜 + 名片 + 聊天 + 好友/粉丝
 */
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Star, Loader2, Heart, Users, MessageCircle,
  Search, UserPlus, Check, X, Bell, Edit3, Flame,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { BEAR_IMAGES, BEAR_TIERS } from "@/lib/bearAssets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserCard from "@/components/UserCard";
import ProfileEditor from "@/components/ProfileEditor";
import { ChatManager, type ChatTarget } from "@/components/ChatWindow";
import { toast } from "sonner";

const TIER_INDEX: Record<string, number> = {
  bronze: 0, silver: 1, gold: 2, platinum: 3, diamond: 4, starlight: 5, king: 6,
};
const BEAR_TYPE_IMAGES: Record<string, string> = {
  grizzly: BEAR_IMAGES.grizzly,
  panda: BEAR_IMAGES.panda,
  polar: BEAR_IMAGES.polar,
};
const MEDAL_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];

export default function Square() {
  const { user: currentUser, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("experience");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [cardPosition, setCardPosition] = useState<{ top: number; left: number } | null>(null);
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [openChats, setOpenChats] = useState<ChatTarget[]>([]);
  const [showFriendRequests, setShowFriendRequests] = useState(false);

  // Queries
  const allUsersQuery = trpc.social.getAllUsersWithBears.useQuery(undefined, { enabled: isAuthenticated });
  const expLeaderboard = trpc.social.experienceLeaderboard.useQuery(undefined, { enabled: isAuthenticated });
  const popLeaderboard = trpc.social.popularityLeaderboard.useQuery(undefined, { enabled: isAuthenticated });
  const pendingRequests = trpc.social.getPendingRequests.useQuery(undefined, { enabled: isAuthenticated });
  const myProfileQuery = trpc.social.getMyProfile.useQuery(undefined, { enabled: isAuthenticated });
  const friendsQuery = trpc.social.getFriends.useQuery(undefined, { enabled: isAuthenticated });
  const conversationsQuery = trpc.social.getConversations.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 5000 });
  const unreadQuery = trpc.social.getUnreadCount.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 5000 });
  const myBearQuery = trpc.bear.mine.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const utils = trpc.useUtils();

  const acceptMutation = trpc.social.acceptFriendRequest.useMutation({
    onSuccess: () => { utils.social.getPendingRequests.invalidate(); utils.social.getFriends.invalidate(); toast.success("已接受好友请求"); },
  });
  const rejectMutation = trpc.social.rejectFriendRequest.useMutation({
    onSuccess: () => { utils.social.getPendingRequests.invalidate(); toast.success("已拒绝好友请求"); },
  });

  // Filter users
  const allUsers = allUsersQuery.data || [];
  const filteredUsers = searchQuery
    ? allUsers.filter(u =>
        (u.ownerName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.bearName || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allUsers;

  // Chat management
  const openChat = useCallback((userId: number, userName: string, emoji?: string) => {
    setOpenChats(prev => {
      if (prev.find(c => c.id === userId)) return prev;
      if (prev.length >= 3) {
        toast.info("最多同时打开3个聊天窗口");
        return prev;
      }
      return [...prev, { id: userId, name: userName, emoji }];
    });
  }, []);

  const closeChat = useCallback((partnerId: number) => {
    setOpenChats(prev => prev.filter(c => c.id !== partnerId));
  }, []);

  // User card
  const handleUserClick = useCallback((userId: number, e: React.MouseEvent) => {
    if (userId === currentUser?.id) {
      setProfileEditorOpen(true);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setCardPosition({ top: rect.bottom + 8, left: Math.min(rect.left, window.innerWidth - 300) });
    setSelectedUserId(userId);
  }, [currentUser?.id]);

  const pendingCount = pendingRequests.data?.length || 0;
  const unreadCount = unreadQuery.data || 0;

  return (
    <div className="min-h-screen bg-background" onClick={() => setSelectedUserId(null)}>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-8">
        <div className="absolute inset-0 opacity-10">
          <img src={BEAR_IMAGES.squareBg} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="container relative z-10">
          <div className="flex items-center justify-between">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-2xl sm:text-3xl font-black" style={{ color: "oklch(0.30 0.06 55)" }}>
                熊熊广场
              </h1>
              <p className="text-muted-foreground text-sm mt-1">认识新朋友，一起学习成长</p>
            </motion.div>
            <div className="flex items-center gap-2">
              {/* Friend Requests */}
              <Button
                variant="outline"
                size="sm"
                className="relative rounded-xl h-9"
                onClick={() => setShowFriendRequests(!showFriendRequests)}
              >
                <Bell className="w-4 h-4" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </Button>
              {/* Messages */}
              <Button
                variant="outline"
                size="sm"
                className="relative rounded-xl h-9"
                onClick={() => {
                  // Open latest conversation
                  const latest = conversationsQuery.data?.[0];
                  if (latest) {
                    openChat(latest.partnerId, latest.partnerName);
                  } else {
                    toast.info("暂无聊天记录");
                  }
                }}
              >
                <MessageCircle className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
              {/* Edit Profile */}
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl h-9"
                onClick={() => setProfileEditorOpen(true)}
              >
                <Edit3 className="w-4 h-4 mr-1" /> 编辑资料
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Friend Requests Panel */}
      <AnimatePresence>
        {showFriendRequests && pendingCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="container py-3">
              <div className="bear-card p-4">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
                  <UserPlus className="w-4 h-4" /> 好友请求 ({pendingCount})
                </h3>
                <div className="space-y-2">
                  {pendingRequests.data?.map(req => (
                    <div key={req.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-accent/50 transition">
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm">🐻</div>
                      <div className="flex-1">
                        <p className="font-bold text-sm">{req.senderName || req.senderUsername || "未知用户"}</p>
                        <p className="text-[10px] text-muted-foreground">想和你成为好友</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          className="h-7 px-2 text-xs rounded-lg"
                          style={{ background: "oklch(0.50 0.10 155)" }}
                          disabled={acceptMutation.isPending}
                          onClick={() => acceptMutation.mutate({ requestId: req.id })}
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs rounded-lg"
                          disabled={rejectMutation.isPending}
                          onClick={() => rejectMutation.mutate({ requestId: req.id })}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: User List + Friends + Conversations */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索用户或小熊..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>

            {/* Friends & Recent Chats */}
            {(friendsQuery.data?.length || 0) > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bear-card p-4">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
                  <Users className="w-4 h-4" style={{ color: "oklch(0.78 0.08 230)" }} /> 我的好友 ({friendsQuery.data?.length || 0})
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {friendsQuery.data?.map(friend => (
                    <button
                      key={friend.friendshipId}
                      onClick={() => openChat(friend.friendId, friend.friendName)}
                      className="flex flex-col items-center gap-1 shrink-0 hover:opacity-80 transition"
                    >
                      <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-lg">🐻</div>
                      <span className="text-[10px] text-muted-foreground truncate w-12 text-center">{friend.friendName}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Recent Conversations */}
            {(conversationsQuery.data?.length || 0) > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bear-card p-4">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
                  <MessageCircle className="w-4 h-4" style={{ color: "oklch(0.52 0.09 55)" }} /> 最近聊天
                </h3>
                <div className="space-y-1">
                  {conversationsQuery.data?.slice(0, 5).map(conv => (
                    <button
                      key={conv.partnerId}
                      onClick={() => openChat(conv.partnerId, conv.partnerName)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent/50 transition text-left"
                    >
                      <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-base shrink-0">🐻</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm truncate">{conv.partnerName}</span>
                          <span className="text-[9px] text-muted-foreground shrink-0">
                            {new Date(conv.lastMessageAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.isLastMessageMine ? "我: " : ""}{conv.lastMessage}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                          {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* All Users Grid */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bear-card p-4">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
                <Users className="w-4 h-4" style={{ color: "oklch(0.50 0.10 155)" }} /> 广场用户 ({filteredUsers.length})
              </h3>

              {allUsersQuery.isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: "oklch(0.52 0.09 55)" }} />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-sm">{searchQuery ? "没有找到匹配的用户" : "还没有用户入驻广场"}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredUsers.map(u => {
                    const tierIdx = TIER_INDEX[u.tier] ?? 0;
                    const tier = BEAR_TIERS[tierIdx];
                    const bearImg = BEAR_TYPE_IMAGES[u.bearType] || BEAR_IMAGES.grizzly;
                    const isMe = u.userId === currentUser?.id;

                    return (
                      <motion.button
                        key={u.id}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={(e) => handleUserClick(u.userId, e)}
                        className="relative p-3 rounded-xl border text-center hover:shadow-md transition group"
                        style={{ borderColor: isMe ? "oklch(0.52 0.09 55 / 0.3)" : "oklch(0.52 0.09 55 / 0.08)" }}
                      >
                        {isMe && (
                          <span className="absolute top-1.5 right-1.5 text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "oklch(0.52 0.09 55 / 0.1)", color: "oklch(0.52 0.09 55)" }}>
                            我
                          </span>
                        )}
                        {/* Emoji avatar */}
                        <div className="w-12 h-12 mx-auto rounded-full bg-accent/50 flex items-center justify-center text-2xl mb-2">
                          {u.emoji || "🐻"}
                        </div>
                        {/* Bear image */}
                        <img src={bearImg} alt={u.bearName} className="w-8 h-8 mx-auto object-contain -mt-4 relative z-10" />
                        <p className="font-bold text-xs mt-1 truncate" style={{ color: "oklch(0.30 0.06 55)" }}>{u.bearName}</p>
                        <p className="text-[9px] text-muted-foreground truncate">{u.ownerName}</p>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold" style={{ background: tier.bgColor, color: tier.color }}>
                            {tier.rank}
                          </span>
                          <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                            <Heart className="w-2.5 h-2.5" /> {u.followerCount}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right: Leaderboards */}
          <div className="lg:col-span-1 space-y-6">
            {/* My Card */}
            {myBearQuery.data && myProfileQuery.data && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bear-card p-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-accent/50 flex items-center justify-center text-3xl">
                    {myProfileQuery.data.emoji || "🐻"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-base truncate" style={{ color: "oklch(0.30 0.06 55)" }}>
                      {currentUser?.name || currentUser?.username}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{myBearQuery.data.bearName}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                      <span>{myProfileQuery.data.followerCount} 粉丝</span>
                      <span>{myProfileQuery.data.followingCount} 关注</span>
                      <span>{myProfileQuery.data.friendCount} 好友</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Leaderboard Tabs */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bear-card p-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="experience" className="flex-1 text-xs font-bold">
                    <Trophy className="w-3.5 h-3.5 mr-1" /> 经验榜
                  </TabsTrigger>
                  <TabsTrigger value="popularity" className="flex-1 text-xs font-bold">
                    <Flame className="w-3.5 h-3.5 mr-1" /> 人气榜
                  </TabsTrigger>
                </TabsList>

                {/* Experience Leaderboard */}
                <TabsContent value="experience">
                  {expLeaderboard.isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-5 h-5 animate-spin" style={{ color: "oklch(0.52 0.09 55)" }} />
                    </div>
                  ) : (expLeaderboard.data?.length || 0) > 0 ? (
                    <div className="space-y-1.5">
                      {expLeaderboard.data?.map((item, i) => {
                        const tierIdx = TIER_INDEX[item.tier] ?? 0;
                        const tier = BEAR_TIERS[tierIdx];
                        const bearImg = BEAR_TYPE_IMAGES[item.bearType] || BEAR_IMAGES.grizzly;
                        const isTop3 = i < 3;

                        return (
                          <motion.div
                            key={`exp-${item.userId}`}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-accent/30 transition cursor-pointer"
                            onClick={(e) => handleUserClick(item.userId, e)}
                          >
                            <span className={`w-6 text-center font-black text-xs ${isTop3 ? "" : "text-muted-foreground"}`}
                              style={isTop3 ? { color: MEDAL_COLORS[i] } : {}}>
                              {i + 1}
                            </span>
                            <img src={bearImg} alt={item.bearName} className="w-8 h-8 rounded-lg object-contain bg-white p-0.5 shadow-sm" />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-xs truncate" style={{ color: "oklch(0.30 0.06 55)" }}>{item.bearName}</p>
                              <p className="text-[9px] text-muted-foreground truncate">{item.userName || item.username}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs font-mono font-bold" style={{ color: "oklch(0.52 0.09 55)" }}>{item.experience}</p>
                              <span className="px-1 py-0.5 rounded text-[8px] font-bold" style={{ background: tier.bgColor, color: tier.color }}>
                                {tier.rank}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-sm text-muted-foreground py-8">暂无排行数据</p>
                  )}
                </TabsContent>

                {/* Popularity Leaderboard */}
                <TabsContent value="popularity">
                  {popLeaderboard.isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-5 h-5 animate-spin" style={{ color: "oklch(0.52 0.09 55)" }} />
                    </div>
                  ) : (popLeaderboard.data?.length || 0) > 0 ? (
                    <div className="space-y-1.5">
                      {popLeaderboard.data?.map((item, i) => {
                        const isTop3 = i < 3;
                        return (
                          <motion.div
                            key={`pop-${item.userId}`}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-accent/30 transition cursor-pointer"
                            onClick={(e) => handleUserClick(item.userId, e)}
                          >
                            <span className={`w-6 text-center font-black text-xs ${isTop3 ? "" : "text-muted-foreground"}`}
                              style={isTop3 ? { color: MEDAL_COLORS[i] } : {}}>
                              {i + 1}
                            </span>
                            <div className="w-8 h-8 rounded-full bg-accent/50 flex items-center justify-center text-base">
                              {item.emoji || "🐻"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-xs truncate" style={{ color: "oklch(0.30 0.06 55)" }}>
                                {item.userName || item.username}
                              </p>
                            </div>
                            <div className="text-right shrink-0 flex items-center gap-1">
                              <Heart className="w-3 h-3" style={{ color: "oklch(0.65 0.20 15)" }} />
                              <span className="text-xs font-bold" style={{ color: "oklch(0.65 0.20 15)" }}>
                                {item.followerCount}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-sm text-muted-foreground py-8">暂无排行数据</p>
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>

            {/* Tips */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bear-card p-4">
              <h3 className="font-bold text-xs mb-2" style={{ color: "oklch(0.30 0.06 55)" }}>社交指南</h3>
              <div className="space-y-1.5 text-[11px] text-muted-foreground">
                <p>点击用户头像查看名片和加好友</p>
                <p>关注别人可以提升他的人气排名</p>
                <p>和好友一对一私信聊天</p>
                <p>编辑资料选择你喜欢的 emoji 头像</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Floating User Card */}
      <AnimatePresence>
        {selectedUserId && cardPosition && (
          <div
            className="fixed z-50"
            style={{ top: cardPosition.top, left: cardPosition.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <UserCard
              userId={selectedUserId}
              onClose={() => setSelectedUserId(null)}
              onStartChat={(userId, userName) => openChat(userId, userName)}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Chat Windows */}
      <ChatManager openChats={openChats} onCloseChat={closeChat} />

      {/* Profile Editor */}
      <ProfileEditor open={profileEditorOpen} onOpenChange={setProfileEditorOpen} />
    </div>
  );
}
