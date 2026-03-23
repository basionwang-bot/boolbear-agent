/**
 * API Usage Monitoring Router — admin-only endpoints for viewing usage stats
 */
import { z } from "zod";
import { adminProcedure } from "./_core/trpc";
import { router } from "./_core/trpc";
import {
  getUsageStats,
  getUsageByProvider,
  getUsageByDay,
  getUsageByCaller,
  getRecentLogs,
  getLogCount,
} from "./usageTracker";

export const usageRouter = router({
  /** Get overall usage statistics */
  stats: adminProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const startDate = input?.startDate ? new Date(input.startDate) : undefined;
      const endDate = input?.endDate ? new Date(input.endDate) : undefined;
      return getUsageStats(startDate, endDate);
    }),

  /** Get usage grouped by provider */
  byProvider: adminProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const startDate = input?.startDate ? new Date(input.startDate) : undefined;
      const endDate = input?.endDate ? new Date(input.endDate) : undefined;
      return getUsageByProvider(startDate, endDate);
    }),

  /** Get daily usage for trend chart */
  byDay: adminProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const startDate = input?.startDate ? new Date(input.startDate) : undefined;
      const endDate = input?.endDate ? new Date(input.endDate) : undefined;
      return getUsageByDay(startDate, endDate);
    }),

  /** Get usage grouped by caller */
  byCaller: adminProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const startDate = input?.startDate ? new Date(input.startDate) : undefined;
      const endDate = input?.endDate ? new Date(input.endDate) : undefined;
      return getUsageByCaller(startDate, endDate);
    }),

  /** Get recent logs (paginated) */
  recentLogs: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ input }) => {
      const limit = input?.limit || 50;
      const offset = input?.offset || 0;
      const [logs, total] = await Promise.all([
        getRecentLogs(limit, offset),
        getLogCount(),
      ]);
      return { logs, total };
    }),
});
