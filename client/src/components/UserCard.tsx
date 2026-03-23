import { useState } from "react";
import { motion } from "framer-motion";
import {
  UserPlus, Heart, MessageCircle, Users, Eye, Loader2, X,
  HeartOff, UserCheck, Clock, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { BEAR_IMAGES, BEAR_TIERS } from "@/lib/bearAssets";
import { toast } from "sonner";

const TIER_INDEX: Record<string, number> = {
  bronze: 0, silver: 1, gold: 2, platinum: 3, diamond: 4, starlight: 5, king: 6,
};

const BEAR_TYPE_IMAGES: Record<string, string> = {
  grizzly: BEAR_IMAGES.grizzly,
  panda: BEAR_IMAGES.panda,
  polar: BEAR_IMAGES.polar,
};

interface UserCardProps {
  userId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartChat?: (userId: number, userName: string, emoji?: string) => void;
}

export default function UserCard({ userId, open, onOpenChange, onStartChat }: UserCardProps) {
  const { user: currentUser } = useAuth();
  const isMyself = currentUser?.id === userId;

  const cardQuery = trpc.social.getUserCard.useQuery(
    { userId: userId! },
    { enabled: !!userId && open }
  );
  const utils = trpc.useUtils();

  const followMutation = trpc.social.follow.useMutation({
    onSuccess: () => {
      utils.social.getUserCard.invalidate({ userId: userId! });
      utils.social.getAllUsersWithBears.invalidate();
      utils.social.popularityLeaderboard.invalidate();
      toast.success("关注成功");
    },
    onError: (e) => toast.error(e.message),
  });
  const unfollowMutation = trpc.social.unfollow.useMutation({
    onSuccess: () => {
      utils.social.getUserCard.invalidate({ userId: userId! });
      utils.social.getAllUsersWithBears.invalidate();
      utils.social.popularityLeaderboard.invalidate();
      toast.success("已取消关注");
    },
    onError: (e) => toast.error(e.message),
  });
  const friendRequestMutation = trpc.social.sendFriendRequest.useMutation({
    onSuccess: () => {
      utils.social.getUserCard.invalidate({ userId: userId! });
      toast.success("好友请求已发送");
    },
    onError: (e) => toast.error(e.message),
  });

  const data = cardQuery.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden rounded-2xl border-0 gap-0">
        {cardQuery.isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "oklch(0.52 0.09 55)" }} />
          </div>
        ) : !data ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm">用户不存在</p>
          </div>
        ) : (
          <UserCardContent
            data={data}
            isMyself={!!isMyself}
            userId={userId!}
            followMutation={followMutation}
            unfollowMutation={unfollowMutation}
            friendRequestMutation={friendRequestMutation}
            onStartChat={(name, emoji) => {
              if (onStartChat && userId) {
                onStartChat(userId, name, emoji);
                onOpenChange(false);
              }
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function UserCardContent({
  data,
  isMyself,
  userId,
  followMutation,
  unfollowMutation,
  friendRequestMutation,
  onStartChat,
}: {
  data: any;
  isMyself: boolean;
  userId: number;
  followMutation: any;
  unfollowMutation: any;
  friendRequestMutation: any;
  onStartChat: (name: string, emoji?: string) => void;
}) {
  const { user: cardUser, profile, bear, isFollowing, friendshipStatus } = data;
  const bearImg = bear ? BEAR_TYPE_IMAGES[bear.bearType] || BEAR_IMAGES.grizzly : null;
  const tierIdx = bear ? TIER_INDEX[bear.tier] ?? 0 : 0;
  const tier = BEAR_TIERS[tierIdx];
  const displayName = cardUser.name || cardUser.username || "未知用户";
  const emoji = profile?.emoji || "🐻";

  return (
    <div className="relative">
      {/* Banner / Header */}
      <div
        className="relative h-28 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, oklch(0.52 0.09 55 / 0.3), oklch(0.50 0.10 155 / 0.2), oklch(0.78 0.08 230 / 0.15))",
        }}
      >
        {/* Decorative bear silhouette */}
        {bearImg && (
          <img
            src={bearImg}
            alt=""
            className="absolute right-4 -bottom-2 w-24 h-24 object-contain opacity-20"
          />
        )}
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                background: "oklch(0.95 0.02 85 / 0.5)",
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
              }}
              animate={{ y: [0, -8, 0], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>

      {/* Avatar - overlapping banner */}
      <div className="flex justify-center -mt-12 relative z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="w-24 h-24 rounded-full bg-card shadow-xl flex items-center justify-center text-5xl border-4 border-card"
        >
          {emoji}
        </motion.div>
      </div>

      {/* User Info */}
      <div className="px-6 pt-3 pb-2 text-center">
        <motion.h3
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="font-black text-xl"
          style={{ color: "oklch(0.30 0.06 55)" }}
        >
          {displayName}
        </motion.h3>
        {profile?.bio && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-muted-foreground mt-1 line-clamp-2"
          >
            {profile.bio}
          </motion.p>
        )}
      </div>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex justify-center gap-8 px-6 py-3"
      >
        <div className="text-center cursor-default">
          <p className="font-black text-lg" style={{ color: "oklch(0.52 0.09 55)" }}>
            {profile?.followerCount || 0}
          </p>
          <p className="text-[11px] text-muted-foreground font-medium">粉丝</p>
        </div>
        <div className="text-center cursor-default">
          <p className="font-black text-lg" style={{ color: "oklch(0.50 0.10 155)" }}>
            {profile?.followingCount || 0}
          </p>
          <p className="text-[11px] text-muted-foreground font-medium">关注</p>
        </div>
        <div className="text-center cursor-default">
          <p className="font-black text-lg" style={{ color: "oklch(0.78 0.08 230)" }}>
            {profile?.friendCount || 0}
          </p>
          <p className="text-[11px] text-muted-foreground font-medium">好友</p>
        </div>
      </motion.div>

      {/* Bear Card */}
      {bear && bearImg && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mx-6 mb-4 p-3 rounded-2xl flex items-center gap-3"
          style={{ background: "oklch(0.52 0.09 55 / 0.06)" }}
        >
          <motion.img
            src={bearImg}
            alt={bear.bearName}
            className="w-14 h-14 object-contain"
            whileHover={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.4 }}
          />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate" style={{ color: "oklch(0.30 0.06 55)" }}>
              {bear.bearName}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: tier.bgColor, color: tier.color }}
              >
                {tier.rank}
              </span>
              <span className="text-[11px] text-muted-foreground">Lv.{bear.level}</span>
            </div>
            <div className="mt-1">
              <div className="h-1.5 rounded-full bg-accent/50 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: tier.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(((bear.experience % 100) / 100) * 100, 100)}%` }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                />
              </div>
              <p className="text-[9px] text-muted-foreground mt-0.5 text-right">
                {bear.experience} EXP
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Action Buttons - Douyin style */}
      {!isMyself && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="px-6 pb-6 space-y-2"
        >
          {/* Primary row: Follow + Friend */}
          <div className="flex gap-2">
            {/* Follow / Unfollow */}
            <Button
              size="sm"
              variant={isFollowing ? "outline" : "default"}
              className="flex-1 h-10 text-sm font-bold rounded-xl transition-all"
              style={!isFollowing ? { background: "oklch(0.52 0.09 55)" } : {}}
              disabled={followMutation.isPending || unfollowMutation.isPending}
              onClick={() => {
                if (isFollowing) {
                  unfollowMutation.mutate({ userId });
                } else {
                  followMutation.mutate({ userId });
                }
              }}
            >
              {followMutation.isPending || unfollowMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isFollowing ? (
                <><Eye className="w-4 h-4 mr-1.5" /> 已关注</>
              ) : (
                <><Heart className="w-4 h-4 mr-1.5" /> 关注</>
              )}
            </Button>

            {/* Friend Request / Status */}
            {!friendshipStatus ? (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-10 text-sm font-bold rounded-xl"
                disabled={friendRequestMutation.isPending}
                onClick={() => friendRequestMutation.mutate({ friendId: userId })}
              >
                {friendRequestMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <><UserPlus className="w-4 h-4 mr-1.5" /> 加好友</>
                )}
              </Button>
            ) : friendshipStatus.status === "pending" ? (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-10 text-sm font-bold rounded-xl opacity-60"
                disabled
              >
                <Clock className="w-4 h-4 mr-1.5" /> 等待验证
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-10 text-sm font-bold rounded-xl"
                style={{ borderColor: "oklch(0.50 0.10 155 / 0.3)", color: "oklch(0.50 0.10 155)" }}
                disabled
              >
                <UserCheck className="w-4 h-4 mr-1.5" /> 已是好友
              </Button>
            )}
          </div>

          {/* Secondary row: Send Message (always available) */}
          <Button
            size="sm"
            variant="outline"
            className="w-full h-10 text-sm font-bold rounded-xl"
            style={{ borderColor: "oklch(0.52 0.09 55 / 0.3)", color: "oklch(0.52 0.09 55)" }}
            onClick={() => onStartChat(displayName, emoji)}
          >
            <Send className="w-4 h-4 mr-1.5" /> 发私信
          </Button>
        </motion.div>
      )}

      {/* If myself, show a subtle indicator */}
      {isMyself && (
        <div className="px-6 pb-6 text-center">
          <p className="text-xs text-muted-foreground">这是你自己的名片</p>
        </div>
      )}
    </div>
  );
}
