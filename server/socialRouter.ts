import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const socialRouter = router({
  // ─── User Profile ──────────────────────────────────────────────────

  /** Get current user's profile */
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    const profile = await db.getOrCreateProfile(ctx.user.id);
    return profile;
  }),

  /** Update current user's profile (emoji, bio) */
  updateProfile: protectedProcedure
    .input(z.object({
      emoji: z.string().max(10).optional(),
      bio: z.string().max(200).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.updateProfile(ctx.user.id, input);
      return { success: true };
    }),

  /** Get another user's card info (profile + bear + stats) */
  getUserCard: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      const cardInfo = await db.getUserCardInfo(input.userId);
      if (!cardInfo) return null;

      // Also get relationship status with current user
      const isFollowingThem = await db.isFollowing(ctx.user.id, input.userId);
      const friendshipStatus = await db.getFriendshipStatus(ctx.user.id, input.userId);

      return {
        ...cardInfo,
        isFollowing: isFollowingThem,
        friendshipStatus: friendshipStatus
          ? {
              id: friendshipStatus.id,
              status: friendshipStatus.status,
              isSender: friendshipStatus.userId === ctx.user.id,
            }
          : null,
      };
    }),

  /** Search users by name or username */
  searchUsers: protectedProcedure
    .input(z.object({ query: z.string().min(1).max(50) }))
    .query(async ({ ctx, input }) => {
      return db.searchUsers(input.query, ctx.user.id);
    }),

  // ─── Followers ─────────────────────────────────────────────────────

  /** Follow a user */
  follow: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.userId) {
        throw new Error("不能关注自己");
      }
      await db.followUser(ctx.user.id, input.userId);
      return { success: true };
    }),

  /** Unfollow a user */
  unfollow: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.unfollowUser(ctx.user.id, input.userId);
      return { success: true };
    }),

  /** Check if following a user */
  isFollowing: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      return db.isFollowing(ctx.user.id, input.userId);
    }),

  /** Get current user's followers */
  getMyFollowers: protectedProcedure.query(async ({ ctx }) => {
    return db.getFollowers(ctx.user.id);
  }),

  /** Get current user's following list */
  getMyFollowing: protectedProcedure.query(async ({ ctx }) => {
    return db.getFollowing(ctx.user.id);
  }),

  /** Get a specific user's followers */
  getUserFollowers: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      return db.getFollowers(input.userId);
    }),

  // ─── Friendships ───────────────────────────────────────────────────

  /** Send a friend request */
  sendFriendRequest: protectedProcedure
    .input(z.object({ friendId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.friendId) {
        throw new Error("不能添加自己为好友");
      }
      const result = await db.sendFriendRequest(ctx.user.id, input.friendId);
      return result;
    }),

  /** Accept a friend request */
  acceptFriendRequest: protectedProcedure
    .input(z.object({ requestId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const success = await db.acceptFriendRequest(input.requestId, ctx.user.id);
      if (!success) throw new Error("无法接受该好友请求");
      return { success: true };
    }),

  /** Reject a friend request */
  rejectFriendRequest: protectedProcedure
    .input(z.object({ requestId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const success = await db.rejectFriendRequest(input.requestId, ctx.user.id);
      if (!success) throw new Error("无法拒绝该好友请求");
      return { success: true };
    }),

  /** Remove a friend */
  removeFriend: protectedProcedure
    .input(z.object({ friendId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const success = await db.removeFriend(ctx.user.id, input.friendId);
      if (!success) throw new Error("无法删除该好友");
      return { success: true };
    }),

  /** Get current user's friend list */
  getFriends: protectedProcedure.query(async ({ ctx }) => {
    return db.getFriendsList(ctx.user.id);
  }),

  /** Get pending friend requests for current user */
  getPendingRequests: protectedProcedure.query(async ({ ctx }) => {
    return db.getPendingFriendRequests(ctx.user.id);
  }),

  // ─── Direct Messages ──────────────────────────────────────────────

  /** Send a direct message */
  sendMessage: protectedProcedure
    .input(z.object({
      receiverId: z.number(),
      content: z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.receiverId) {
        throw new Error("不能给自己发消息");
      }
      const result = await db.sendDirectMessage(ctx.user.id, input.receiverId, input.content);
      return result;
    }),

  /** Get message history with a specific user */
  getMessages: protectedProcedure
    .input(z.object({
      partnerId: z.number(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const messages = await db.getDirectMessages(ctx.user.id, input.partnerId, input.limit, input.offset);
      // Mark messages from partner as read
      await db.markMessagesAsRead(ctx.user.id, input.partnerId);
      return messages;
    }),

  /** Get total unread message count */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    return db.getUnreadMessageCount(ctx.user.id);
  }),

  /** Get unread count per sender */
  getUnreadBySender: protectedProcedure.query(async ({ ctx }) => {
    return db.getUnreadCountBySender(ctx.user.id);
  }),

  /** Get conversation list (recent chats) */
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    return db.getConversationList(ctx.user.id);
  }),

  /** Mark messages from a specific user as read */
  markAsRead: protectedProcedure
    .input(z.object({ senderId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.markMessagesAsRead(ctx.user.id, input.senderId);
      return { success: true };
    }),

  // ─── Leaderboards ─────────────────────────────────────────────────

  /** Get experience leaderboard */
  experienceLeaderboard: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }).optional())
    .query(async ({ input }) => {
      return db.getExperienceLeaderboard(input?.limit || 20);
    }),

  /** Get popularity leaderboard (by follower count) */
  popularityLeaderboard: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }).optional())
    .query(async ({ input }) => {
      return db.getPopularityLeaderboard(input?.limit || 20);
    }),

  // ─── All Users List (for Gallery) ─────────────────────────────────

  /** Get all users with their bears and profiles for the gallery */
  getAllUsersWithBears: protectedProcedure.query(async ({ ctx }) => {
    const allBears = await db.getAllBears();
    // Batch fetch all profiles and users to avoid N+1 queries
    const userIds = Array.from(new Set(allBears.map(b => b.userId)));
    const [profiles, users] = await Promise.all([
      Promise.all(userIds.map(id => db.getProfileByUserId(id))),
      Promise.all(userIds.map(id => db.getUserById(id))),
    ]);
    const profileMap = new Map(userIds.map((id, i) => [id, profiles[i]]));
    const userMap = new Map(userIds.map((id, i) => [id, users[i]]));

    return allBears.map(bear => {
      const profile = profileMap.get(bear.userId);
      const user = userMap.get(bear.userId);
      return {
        ...bear,
        ownerName: user?.name || user?.username || "匿名",
        emoji: profile?.emoji || "🐻",
        bio: profile?.bio || "",
        followerCount: profile?.followerCount || 0,
        followingCount: profile?.followingCount || 0,
        friendCount: profile?.friendCount || 0,
      };
    });
  }),
});
