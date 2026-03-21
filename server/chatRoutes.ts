import { Router, Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import * as db from "./db";
import { streamChat, buildSystemPrompt, awardExperience } from "./chat";

const chatRouter = Router();

/** Helper to authenticate request from cookies */
async function authenticateRequest(req: Request) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  const cookies = parseCookieHeader(cookieHeader);
  const sessionCookie = cookies[COOKIE_NAME];
  if (!sessionCookie) return null;

  const session = await sdk.verifySession(sessionCookie);
  if (!session) return null;

  return db.getUserByOpenId(session.openId);
}

/**
 * POST /api/chat/stream
 * Body: { conversationId: number, message: string }
 * Response: SSE stream
 */
chatRouter.post("/api/chat/stream", async (req: Request, res: Response) => {
  try {
    // Authenticate
    const user = await authenticateRequest(req);
    if (!user) {
      res.status(401).json({ error: "未登录" });
      return;
    }

    // Check if user's chat access is disabled by admin
    if (user.isChatDisabled) {
      res.status(403).json({ error: "你的 AI 聊天功能已被管理员停用，请联系老师了解详情" });
      return;
    }

    const { conversationId, message } = req.body;
    if (!conversationId || !message) {
      res.status(400).json({ error: "缺少参数" });
      return;
    }

    // Get user's bear
    const bear = await db.getBearByUserId(user.id);
    if (!bear) {
      res.status(400).json({ error: "请先领养一只小熊" });
      return;
    }

    // Verify conversation ownership
    const conversation = await db.getConversationById(conversationId);
    if (!conversation || conversation.userId !== user.id) {
      res.status(404).json({ error: "对话不存在" });
      return;
    }

    // Save user message
    await db.createMessage({
      conversationId,
      role: "user",
      content: message,
    });

    // Update conversation timing for learning time tracking
    await db.updateConversationTiming(conversationId);

    // Get conversation history (last 20 messages for context)
    const history = await db.getMessagesByConversationId(conversationId);
    const recentMessages = history.slice(-20).map(m => ({
      role: m.role as string,
      content: m.content,
    }));

    // Build system prompt based on bear personality
    const systemPrompt = buildSystemPrompt(bear);

    // Set up SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    // Stream the response
    await streamChat(
      systemPrompt,
      recentMessages,
      // onChunk
      (chunk: string) => {
        res.write(`data: ${JSON.stringify({ type: "chunk", content: chunk })}\n\n`);
      },
      // onDone
      async (fullContent: string) => {
        // Save assistant message
        await db.createMessage({
          conversationId,
          role: "assistant",
          content: fullContent,
        });

        // Update conversation timing after assistant response
        await db.updateConversationTiming(conversationId);

        // Award experience
        const xpResult = await awardExperience(bear.id, message);

        // Send completion event with XP info
        res.write(`data: ${JSON.stringify({
          type: "done",
          xp: xpResult,
        })}\n\n`);

        res.write("data: [DONE]\n\n");
        res.end();
      },
      // onError
      (error: Error) => {
        console.error("[Chat] Stream error:", error);
        res.write(`data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`);
        res.end();
      }
    );
  } catch (error) {
    console.error("[Chat] Route error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "服务器错误" });
    } else {
      res.end();
    }
  }
});

export { chatRouter };
