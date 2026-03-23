/*
 * 熊 Agent — 熊熊广场
 * 社交系统：用户列表 + 双排行榜 + 名片 + 聊天 + 好友/粉丝
 */
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Loader2, Heart, Users, MessageCircle,
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
  const [userCardOpen, setUserCardOpen] = useState(false);
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

  // User card - now uses Dialog, no positioning issues
  const handleUserClick = useCallback((userId: number) => {
    if (userId === currentUser?.id) {
      setProfileEditorOpen(true);
      return;
    }
    setSelectedUserId(userId);
    setUserCardOpen(true);
  }, [currentUser?.id]);

  const pendingCount = pendingRequests.data?.length || 0;
  const unreadCount = unreadQuery.data || 0;

  return (
    <div className="min-h-screen bg-background">
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
                  <Users className="w-4 h-4" style={{ color: "oklch(0.50 0.10 155)" }} /> 我的好友
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                  {friendsQuery.data?.map(friend => (
                    <button
                      key={friend.friendId}
                      onClick={() => openChat(friend.friendId, friend.friendName || friend.friendUsername || "好友")}
                      className="flex flex-col items-center gap-1 shrink-0 p-2 rounded-xl hover:bg-accent/50 transition min-w-[64px]"
                    >
                      <div className="w-10 h-10 rounded-full bg-accent/50 flex items-center justify-center text-xl">
                        🐻
                      </div>
                      <span className="text-[10px] font-medium truncate max-w-[56px]">{friend.friendName || friend.friendUsername}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Recent Conversations */}
            {(conversationsQuery.data?.length || 0) > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bear-card p-4">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
                  <MessageCircle className="w-4 h-4" style={{ color: "oklch(0.52 0.09 55)" }} /> 最近聊天
                </h3>
                <div className="space-y-1">
                  {conversationsQuery.data?.map(conv => (
                    <button
                      key={conv.partnerId}
                      onClick={() => openChat(conv.partnerId, conv.partnerName)}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-accent/50 transition w-full text-left"
                    >
                      <div className="w-9 h-9 rounded-full bg-accent/50 flex items-center justify-center text-lg shrink-0">
                        🐻
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs truncate">{conv.partnerName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {conv.lastMessage}
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
                        onClick={() => handleUserClick(u.userId)}
                        className="relative p-3 rounded-xl border text-center hover:shadow-md transition group"
                        style={{ borderColor: isMe ? "oklch(0.52 0.09 55 / 0.3)" : "oklch(0.52 0.09 55 / 0.08)" }}
                      >
                        {isMe && (
                          <span className="absolute top-1.5 right-1.5 text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "oklch(0.52 0.09 55 / 0.1)", color: "oklch(0.52 0.09 55)" }}>
                            我
                          </span>
                        )}
                        {/* Emoji avatar */}
                        <div className="w-12 h-12 mx-auto rounded-full bg-accent/50 flex items-center justify-center text-2xl mb-2 group-hover:ring-2 group-hover:ring-[oklch(0.52_0.09_55/0.3)] transition">
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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bear-card p-4 cursor-pointer hover:shadow-md transition"
                onClick={() => setProfileEditorOpen(true)}
              >
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
                        const isMe = item.userId === currentUser?.id;

                        return (
                          <motion.div
                            key={item.userId}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="flex items-center gap-2 p-2 rounded-xl hover:bg-accent/50 transition cursor-pointer"
                            style={isMe ? { background: "oklch(0.52 0.09 55 / 0.06)" } : {}}
                            onClick={() => handleUserClick(item.userId)}
                          >
                            {/* Rank */}
                            <div className="w-6 text-center shrink-0">
                              {i < 3 ? (
                                <span className="text-lg">
                                  {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                                </span>
                              ) : (
                                <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>
                              )}
                            </div>
                            {/* Bear */}
                            <img src={bearImg} alt="" className="w-8 h-8 object-contain shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-xs truncate" style={{ color: isMe ? "oklch(0.52 0.09 55)" : "oklch(0.30 0.06 55)" }}>
                                {item.bearName} {isMe && "(我)"}
                              </p>
                              <p className="text-[9px] text-muted-foreground truncate">{item.userName || item.username}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold" style={{ background: tier.bgColor, color: tier.color }}>
                                {tier.rank}
                              </span>
                              <p className="text-[9px] font-mono mt-0.5" style={{ color: "oklch(0.52 0.09 55)" }}>
                                {item.experience} EXP
                              </p>
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
                        const isMe = item.userId === currentUser?.id;
                        const displayName = item.userName || item.username || "匿名";

                        return (
                          <motion.div
                            key={item.userId}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="flex items-center gap-2 p-2 rounded-xl hover:bg-accent/50 transition cursor-pointer"
                            style={isMe ? { background: "oklch(0.52 0.09 55 / 0.06)" } : {}}
                            onClick={() => handleUserClick(item.userId)}
                          >
                            {/* Rank */}
                            <div className="w-6 text-center shrink-0">
                              {i < 3 ? (
                                <span className="text-lg">
                                  {i === 0 ? "🔥" : i === 1 ? "✨" : "⭐"}
                                </span>
                              ) : (
                                <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>
                              )}
                            </div>
                            {/* Emoji Avatar */}
                            <div className="w-8 h-8 rounded-full bg-accent/50 flex items-center justify-center text-lg shrink-0">
                              {item.emoji || "🐻"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-xs truncate" style={{ color: isMe ? "oklch(0.52 0.09 55)" : "oklch(0.30 0.06 55)" }}>
                                {displayName} {isMe && "(我)"}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[10px] font-bold flex items-center gap-0.5" style={{ color: "oklch(0.65 0.20 15)" }}>
                                <Heart className="w-3 h-3" />
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
                <p>点击用户头像查看名片，可以加好友和发私信</p>
                <p>关注别人可以提升他的人气排名</p>
                <p>和好友一对一私信聊天</p>
                <p>编辑资料选择你喜欢的 emoji 头像</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* User Card Dialog */}
      <UserCard
        userId={selectedUserId}
        open={userCardOpen}
        onOpenChange={setUserCardOpen}
        onStartChat={(userId, userName, emoji) => openChat(userId, userName, emoji)}
      />

      {/* Chat Windows */}
      <ChatManager openChats={openChats} onCloseChat={closeChat} />

      {/* Profile Editor */}
      <ProfileEditor open={profileEditorOpen} onOpenChange={setProfileEditorOpen} />
    </div>
  );
}
