import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, UserMinus, Heart, MessageCircle, Users, Eye, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  userId: number;
  onClose: () => void;
  onStartChat?: (userId: number, userName: string) => void;
}

export default function UserCard({ userId, onClose, onStartChat }: UserCardProps) {
  const { user: currentUser } = useAuth();
  const isMyself = currentUser?.id === userId;

  const cardQuery = trpc.social.getUserCard.useQuery({ userId });
  const utils = trpc.useUtils();

  const followMutation = trpc.social.follow.useMutation({
    onSuccess: () => { utils.social.getUserCard.invalidate({ userId }); toast.success("关注成功"); },
    onError: (e) => toast.error(e.message),
  });
  const unfollowMutation = trpc.social.unfollow.useMutation({
    onSuccess: () => { utils.social.getUserCard.invalidate({ userId }); toast.success("已取消关注"); },
    onError: (e) => toast.error(e.message),
  });
  const friendRequestMutation = trpc.social.sendFriendRequest.useMutation({
    onSuccess: () => { utils.social.getUserCard.invalidate({ userId }); toast.success("好友请求已发送"); },
    onError: (e) => toast.error(e.message),
  });

  const data = cardQuery.data;
  if (cardQuery.isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="absolute z-50 bg-card rounded-2xl shadow-2xl border p-6 w-72"
        style={{ borderColor: "oklch(0.52 0.09 55 / 0.15)" }}
      >
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "oklch(0.52 0.09 55)" }} />
        </div>
      </motion.div>
    );
  }

  if (!data) return null;

  const { user: cardUser, profile, bear, isFollowing, friendshipStatus } = data;
  const bearImg = bear ? BEAR_TYPE_IMAGES[bear.bearType] || BEAR_IMAGES.grizzly : null;
  const tierIdx = bear ? TIER_INDEX[bear.tier] ?? 0 : 0;
  const tier = BEAR_TIERS[tierIdx];
  const displayName = cardUser.name || cardUser.username || "未知用户";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      className="absolute z-50 bg-card rounded-2xl shadow-2xl border overflow-hidden w-72"
      style={{ borderColor: "oklch(0.52 0.09 55 / 0.15)" }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header with gradient */}
      <div
        className="relative h-20 flex items-end justify-center pb-0"
        style={{ background: "linear-gradient(135deg, oklch(0.52 0.09 55 / 0.2), oklch(0.50 0.10 155 / 0.15))" }}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/60 flex items-center justify-center hover:bg-white/80 transition"
        >
          <X className="w-3 h-3" />
        </button>
        {/* Emoji avatar */}
        <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center text-3xl translate-y-8 border-4 border-card">
          {profile?.emoji || "🐻"}
        </div>
      </div>

      {/* Body */}
      <div className="pt-10 px-5 pb-5">
        {/* Name */}
        <div className="text-center mb-3">
          <h3 className="font-black text-lg" style={{ color: "oklch(0.30 0.06 55)" }}>{displayName}</h3>
          {profile?.bio && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{profile.bio}</p>
          )}
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-6 mb-4">
          <div className="text-center">
            <p className="font-bold text-sm" style={{ color: "oklch(0.52 0.09 55)" }}>{profile?.followerCount || 0}</p>
            <p className="text-[10px] text-muted-foreground">粉丝</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-sm" style={{ color: "oklch(0.50 0.10 155)" }}>{profile?.followingCount || 0}</p>
            <p className="text-[10px] text-muted-foreground">关注</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-sm" style={{ color: "oklch(0.78 0.08 230)" }}>{profile?.friendCount || 0}</p>
            <p className="text-[10px] text-muted-foreground">好友</p>
          </div>
        </div>

        {/* Bear info */}
        {bear && bearImg && (
          <div className="flex items-center gap-3 p-2.5 rounded-xl mb-4" style={{ background: "oklch(0.52 0.09 55 / 0.05)" }}>
            <img src={bearImg} alt={bear.bearName} className="w-10 h-10 object-contain" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-xs truncate" style={{ color: "oklch(0.30 0.06 55)" }}>{bear.bearName}</p>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: tier.bgColor, color: tier.color }}>
                  {tier.rank}
                </span>
                <span className="text-[10px] text-muted-foreground">Lv.{bear.level}</span>
                <span className="text-[10px] font-mono" style={{ color: "oklch(0.52 0.09 55)" }}>{bear.experience} EXP</span>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!isMyself && (
          <div className="flex gap-2">
            {/* Follow/Unfollow */}
            <Button
              size="sm"
              variant={isFollowing ? "outline" : "default"}
              className="flex-1 h-8 text-xs font-bold rounded-xl"
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
              {isFollowing ? (
                <><Eye className="w-3 h-3 mr-1" /> 已关注</>
              ) : (
                <><Heart className="w-3 h-3 mr-1" /> 关注</>
              )}
            </Button>

            {/* Friend request */}
            {!friendshipStatus ? (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 text-xs font-bold rounded-xl"
                disabled={friendRequestMutation.isPending}
                onClick={() => friendRequestMutation.mutate({ friendId: userId })}
              >
                <UserPlus className="w-3 h-3 mr-1" /> 加好友
              </Button>
            ) : friendshipStatus.status === "pending" ? (
              <Button size="sm" variant="outline" className="flex-1 h-8 text-xs font-bold rounded-xl" disabled>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" /> 待审核
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 text-xs font-bold rounded-xl"
                style={{ borderColor: "oklch(0.50 0.10 155 / 0.3)", color: "oklch(0.50 0.10 155)" }}
                onClick={() => {
                  if (onStartChat) {
                    onStartChat(userId, displayName);
                    onClose();
                  }
                }}
              >
                <MessageCircle className="w-3 h-3 mr-1" /> 私信
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
