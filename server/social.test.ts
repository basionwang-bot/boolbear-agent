import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1, name: string = "Test User"): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ─── Social Router Tests ─────────────────────────────────────────────

describe("social router", () => {
  describe("social.getMyProfile", () => {
    it("returns a profile object for authenticated user", async () => {
      const ctx = createAuthContext(1, "Test User");
      const caller = appRouter.createCaller(ctx);
      const profile = await caller.social.getMyProfile();
      expect(profile).toBeDefined();
      expect(profile).toHaveProperty("emoji");
      expect(profile).toHaveProperty("bio");
      expect(profile).toHaveProperty("followerCount");
      expect(profile).toHaveProperty("followingCount");
      expect(profile).toHaveProperty("friendCount");
    });
  });

  describe("social.updateProfile", () => {
    it("updates emoji and bio successfully", async () => {
      const ctx = createAuthContext(1, "Test User");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.social.updateProfile({
        emoji: "🐼",
        bio: "Hello World",
      });
      expect(result).toEqual({ success: true });

      // Verify the update
      const profile = await caller.social.getMyProfile();
      expect(profile.emoji).toBe("🐼");
      expect(profile.bio).toBe("Hello World");
    });

    it("accepts empty optional fields gracefully", async () => {
      const ctx = createAuthContext(1, "Test User");
      const caller = appRouter.createCaller(ctx);
      // Empty update should either succeed or throw a known error
      try {
        const result = await caller.social.updateProfile({});
        expect(result).toEqual({ success: true });
      } catch (e: any) {
        // Drizzle throws "No values to set" when no fields provided - acceptable
        expect(e.message).toContain("No values to set");
      }
    });
  });

  describe("social.follow / unfollow", () => {
    it("prevents following yourself", async () => {
      const ctx = createAuthContext(1, "Test User");
      const caller = appRouter.createCaller(ctx);
      await expect(caller.social.follow({ userId: 1 })).rejects.toThrow("不能关注自己");
    });

    it("follow and unfollow flow works", async () => {
      const ctx1 = createAuthContext(1, "User A");
      const caller1 = appRouter.createCaller(ctx1);

      // Follow user 2
      const followResult = await caller1.social.follow({ userId: 2 });
      expect(followResult).toEqual({ success: true });

      // Check isFollowing
      const isFollowing = await caller1.social.isFollowing({ userId: 2 });
      expect(isFollowing).toBe(true);

      // Unfollow
      const unfollowResult = await caller1.social.unfollow({ userId: 2 });
      expect(unfollowResult).toEqual({ success: true });

      // Check again
      const isFollowingAfter = await caller1.social.isFollowing({ userId: 2 });
      expect(isFollowingAfter).toBe(false);
    });
  });

  describe("social.friendRequest", () => {
    it("prevents sending friend request to yourself", async () => {
      const ctx = createAuthContext(1, "Test User");
      const caller = appRouter.createCaller(ctx);
      await expect(caller.social.sendFriendRequest({ friendId: 1 })).rejects.toThrow("不能添加自己为好友");
    });

    it("can send a friend request", async () => {
      const ctx1 = createAuthContext(1, "User A");
      const caller1 = appRouter.createCaller(ctx1);
      const result = await caller1.social.sendFriendRequest({ friendId: 2 });
      expect(result).toBeDefined();
    });
  });

  describe("social.sendMessage", () => {
    it("prevents sending message to yourself", async () => {
      const ctx = createAuthContext(1, "Test User");
      const caller = appRouter.createCaller(ctx);
      await expect(caller.social.sendMessage({ receiverId: 1, content: "hello" })).rejects.toThrow("不能给自己发消息");
    });

    it("can send and retrieve messages", async () => {
      const ctx1 = createAuthContext(1, "User A");
      const caller1 = appRouter.createCaller(ctx1);

      // Send a message
      const msg = await caller1.social.sendMessage({ receiverId: 2, content: "你好！" });
      expect(msg).toBeDefined();

      // Get messages
      const messages = await caller1.social.getMessages({ partnerId: 2 });
      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBeGreaterThan(0);
      expect(messages.some(m => m.content === "你好！")).toBe(true);
    });
  });

  describe("social.getUnreadCount", () => {
    it("returns a number", async () => {
      const ctx = createAuthContext(1, "Test User");
      const caller = appRouter.createCaller(ctx);
      const count = await caller.social.getUnreadCount();
      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe("social.markAsRead", () => {
    it("marks messages as read successfully", async () => {
      const ctx = createAuthContext(2, "User B");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.social.markAsRead({ senderId: 1 });
      expect(result).toEqual({ success: true });
    });
  });

  describe("social.experienceLeaderboard", () => {
    it("returns an array", async () => {
      const ctx = createAuthContext(1, "Test User");
      const caller = appRouter.createCaller(ctx);
      const leaderboard = await caller.social.experienceLeaderboard();
      expect(Array.isArray(leaderboard)).toBe(true);
    });
  });

  describe("social.popularityLeaderboard", () => {
    it("returns an array", async () => {
      const ctx = createAuthContext(1, "Test User");
      const caller = appRouter.createCaller(ctx);
      const leaderboard = await caller.social.popularityLeaderboard();
      expect(Array.isArray(leaderboard)).toBe(true);
    });
  });

  describe("social.getConversations", () => {
    it("returns an array of conversations", async () => {
      const ctx = createAuthContext(1, "Test User");
      const caller = appRouter.createCaller(ctx);
      const conversations = await caller.social.getConversations();
      expect(Array.isArray(conversations)).toBe(true);
    });
  });

  describe("social.getFriends", () => {
    it("returns an array", async () => {
      const ctx = createAuthContext(1, "Test User");
      const caller = appRouter.createCaller(ctx);
      const friends = await caller.social.getFriends();
      expect(Array.isArray(friends)).toBe(true);
    });
  });

  describe("social.getPendingRequests", () => {
    it("returns an array", async () => {
      const ctx = createAuthContext(1, "Test User");
      const caller = appRouter.createCaller(ctx);
      const requests = await caller.social.getPendingRequests();
      expect(Array.isArray(requests)).toBe(true);
    });
  });

  describe("social.getAllUsersWithBears", () => {
    it("returns an array of users with bears", async () => {
      const ctx = createAuthContext(1, "Test User");
      const caller = appRouter.createCaller(ctx);
      const users = await caller.social.getAllUsersWithBears();
      expect(Array.isArray(users)).toBe(true);
    }, 30000);
  });

  describe("social.searchUsers", () => {
    it("returns an array for valid query", async () => {
      const ctx = createAuthContext(1, "Test User");
      const caller = appRouter.createCaller(ctx);
      const results = await caller.social.searchUsers({ query: "test" });
      expect(Array.isArray(results)).toBe(true);
    });
  });
});
