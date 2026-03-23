/**
 * API Usage Monitor Panel
 * Displays API key usage statistics, cost estimates, and trends for admin.
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Zap,
  Clock,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  Activity,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type TimeRange = "today" | "7d" | "30d" | "all";

const CATEGORY_LABELS: Record<string, string> = {
  llm: "大语言模型",
  tts: "语音合成",
  image: "图片生成",
  video: "视频生成",
  asr: "语音识别",
  web_search: "网络搜索",
};

const CATEGORY_COLORS: Record<string, string> = {
  llm: "oklch(0.52 0.09 55)",
  tts: "oklch(0.55 0.12 280)",
  image: "oklch(0.60 0.15 150)",
  video: "oklch(0.55 0.14 30)",
  asr: "oklch(0.58 0.10 200)",
  web_search: "oklch(0.50 0.12 100)",
};

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function formatCost(cost: number): string {
  if (cost < 0.01) return "< ¥0.01";
  return `¥${cost.toFixed(2)}`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function ApiUsagePanel() {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

  // Convert timeRange to date range for the API
  const dateRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    if (timeRange === "today") start.setHours(0, 0, 0, 0);
    else if (timeRange === "7d") start.setDate(start.getDate() - 7);
    else if (timeRange === "30d") start.setDate(start.getDate() - 30);
    else return {}; // "all" — no date filter
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }, [timeRange]);

  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } =
    trpc.usage.stats.useQuery(dateRange);

  const { data: byProvider, isLoading: providerLoading, refetch: refetchProvider } =
    trpc.usage.byProvider.useQuery(dateRange);

  const { data: dailyTrend, isLoading: trendLoading, refetch: refetchTrend } =
    trpc.usage.byDay.useQuery(dateRange);

  const { data: recentLogs, isLoading: logsLoading, refetch: refetchLogs } =
    trpc.usage.recentLogs.useQuery({ limit: 20 });

  const refetchAll = () => {
    refetchSummary();
    refetchProvider();
    refetchTrend();
    refetchLogs();
  };

  // Calculate max value for bar chart
  const maxDailyCount = useMemo(() => {
    if (!dailyTrend) return 1;
    return Math.max(1, ...dailyTrend.map((d: any) => d.calls));
  }, [dailyTrend]);

  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: "today", label: "今天" },
    { value: "7d", label: "近7天" },
    { value: "30d", label: "近30天" },
    { value: "all", label: "全部" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "oklch(0.52 0.09 55 / 0.1)" }}
          >
            <BarChart3 className="w-5 h-5" style={{ color: "oklch(0.52 0.09 55)" }} />
          </div>
          <div>
            <h3 className="font-bold text-lg" style={{ color: "oklch(0.30 0.06 55)" }}>
              API 用量监控
            </h3>
            <p className="text-sm text-muted-foreground">查看各 AI 服务的调用统计和费用估算</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="flex rounded-lg overflow-hidden border border-[oklch(0.52_0.09_55/0.2)]">
            {timeRangeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTimeRange(opt.value)}
                className="px-3 py-1.5 text-sm font-medium transition-colors"
                style={{
                  background: timeRange === opt.value ? "oklch(0.52 0.09 55)" : "transparent",
                  color: timeRange === opt.value ? "white" : "oklch(0.52 0.09 55)",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={refetchAll} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            刷新
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={Zap}
          label="总调用次数"
          value={summaryLoading ? "..." : formatNumber(summary?.totalCalls || 0)}
          subValue={summary ? `成功率 ${summary.totalCalls > 0 ? Math.round((summary.successCalls / summary.totalCalls) * 100) : 100}%` : undefined}
          color="oklch(0.52 0.09 55)"
        />
        <SummaryCard
          icon={DollarSign}
          label="估算费用"
          value={summaryLoading ? "..." : formatCost(summary?.totalCostCny || 0)}
          subValue="基于 Token 用量估算"
          color="oklch(0.50 0.10 155)"
        />
        <SummaryCard
          icon={TrendingUp}
          label="总 Token 用量"
          value={summaryLoading ? "..." : formatNumber(summary?.totalTokens || 0)}
          subValue={summary ? `输入 ${formatNumber(summary.totalInputTokens)} / 输出 ${formatNumber(summary.totalOutputTokens)}` : undefined}
          color="oklch(0.55 0.12 280)"
        />
        <SummaryCard
          icon={Clock}
          label="平均响应时间"
          value={summaryLoading ? "..." : formatDuration(summary?.avgDurationMs || 0)}
          subValue={summary?.totalCalls ? `共 ${summary.totalCalls} 次调用` : undefined}
          color="oklch(0.60 0.15 30)"
        />
      </div>

      {/* Daily Trend Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bear-card p-5"
      >
        <h4 className="font-bold mb-4 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
          <Activity className="w-4 h-4" style={{ color: "oklch(0.52 0.09 55)" }} />
          调用趋势
        </h4>
        {trendLoading ? (
          <div className="h-40 flex items-center justify-center text-muted-foreground">
            加载中...
          </div>
        ) : dailyTrend && dailyTrend.length > 0 ? (
          <div className="space-y-2">
            {/* Simple bar chart */}
            <div className="flex items-end gap-1 h-32">
              {dailyTrend.map((day: any, i: number) => {
                const height = Math.max(4, (day.totalCalls / maxDailyCount) * 100);
                const successHeight = day.totalCalls > 0
                  ? (day.successCalls / day.totalCalls) * height
                  : height;
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-0.5 group relative"
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg p-2 whitespace-nowrap">
                      <div className="font-semibold">{day.date}</div>
                      <div>调用: {day.calls} 次</div>
                      <div>Token: {formatNumber(day.tokens)}</div>
                      <div>费用: {formatCost(day.costCny)}</div>
                    </div>
                    {/* Bar */}
                    <div className="w-full flex flex-col justify-end" style={{ height: "100%" }}>
                      <div
                        className="w-full rounded-t-sm transition-all"
                        style={{
                          height: `${Math.max(4, (day.calls / maxDailyCount) * 100)}%`,
                          background: `linear-gradient(to top, oklch(0.52 0.09 55), oklch(0.52 0.09 55 / 0.6))`,
                          minHeight: "2px",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {/* X-axis labels */}
            <div className="flex gap-1">
              {dailyTrend.map((day: any, i: number) => (
                <div key={i} className="flex-1 text-center text-[10px] text-muted-foreground truncate">
                  {dailyTrend.length <= 7 ? day.date?.slice(5) : (i % Math.ceil(dailyTrend.length / 7) === 0 ? day.date?.slice(5) : "")}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-40 flex flex-col items-center justify-center text-muted-foreground gap-2">
            <BarChart3 className="w-8 h-8 opacity-30" />
            <span className="text-sm">暂无调用数据</span>
          </div>
        )}
      </motion.div>

      {/* By Provider Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bear-card p-5"
      >
        <h4 className="font-bold mb-4 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
          <BarChart3 className="w-4 h-4" style={{ color: "oklch(0.52 0.09 55)" }} />
          按服务商统计
        </h4>
        {providerLoading ? (
          <div className="h-20 flex items-center justify-center text-muted-foreground">
            加载中...
          </div>
        ) : byProvider && byProvider.length > 0 ? (
          <div className="space-y-2">
            {byProvider.map((provider: any) => {
              const isExpanded = expandedProvider === provider.providerName;
              const categoryColor = CATEGORY_COLORS[provider.category] || "oklch(0.52 0.09 55)";
              const totalCalls = summary?.totalCalls || 1;
              const percentage = Math.round((provider.calls / totalCalls) * 100);

              return (
                <div key={`${provider.providerName}-${provider.category}`} className="border border-border/50 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedProvider(isExpanded ? null : `${provider.providerName}-${provider.category}`)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-accent/30 transition-colors text-left"
                  >
                    {/* Category badge */}
                    <span
                      className="px-2 py-0.5 rounded-md text-xs font-medium text-white shrink-0"
                      style={{ background: categoryColor }}
                    >
                      {CATEGORY_LABELS[provider.category] || provider.category}
                    </span>
                    {/* Provider name */}
                    <span className="font-medium flex-1 truncate" style={{ color: "oklch(0.30 0.06 55)" }}>
                      {provider.providerName}
                    </span>
                    {/* Stats */}
                    <span className="text-sm text-muted-foreground shrink-0">
                      {formatNumber(provider.calls)} 次
                    </span>
                    <span className="text-sm font-medium shrink-0" style={{ color: "oklch(0.50 0.10 155)" }}>
                      {formatCost(provider.costCny)}
                    </span>
                    {/* Progress bar */}
                    <div className="w-16 h-1.5 rounded-full bg-muted shrink-0 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${percentage}%`, background: categoryColor }}
                      />
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                          <div className="bg-muted/30 rounded-lg p-2.5">
                            <div className="text-muted-foreground text-xs mb-1">总 Token</div>
                            <div className="font-semibold">{formatNumber(provider.tokens)}</div>
                          </div>
                          <div className="bg-muted/30 rounded-lg p-2.5">
                            <div className="text-muted-foreground text-xs mb-1">总费用</div>
                            <div className="font-semibold">{formatCost(provider.costCny)}</div>
                          </div>
                          <div className="bg-muted/30 rounded-lg p-2.5">
                            <div className="text-muted-foreground text-xs mb-1">调用次数</div>
                            <div className="font-semibold">{provider.calls}</div>
                          </div>
                          <div className="bg-muted/30 rounded-lg p-2.5">
                            <div className="text-muted-foreground text-xs mb-1">分类</div>
                            <div className="font-semibold">{CATEGORY_LABELS[provider.category] || provider.category}</div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-20 flex flex-col items-center justify-center text-muted-foreground gap-2">
            <BarChart3 className="w-8 h-8 opacity-30" />
            <span className="text-sm">暂无调用记录</span>
          </div>
        )}
      </motion.div>

      {/* Recent Logs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bear-card p-5"
      >
        <h4 className="font-bold mb-4 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
          <Clock className="w-4 h-4" style={{ color: "oklch(0.52 0.09 55)" }} />
          最近调用记录
        </h4>
        {logsLoading ? (
          <div className="h-20 flex items-center justify-center text-muted-foreground">
            加载中...
          </div>
        ) : recentLogs && recentLogs.logs && recentLogs.logs.length > 0 ? (
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {recentLogs.logs.map((log: any) => (
              <div
                key={log.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent/20 transition-colors text-sm"
              >
                {log.success ? (
                  <CheckCircle className="w-4 h-4 shrink-0" style={{ color: "oklch(0.50 0.10 155)" }} />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0 text-destructive" />
                )}
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white shrink-0"
                  style={{ background: CATEGORY_COLORS[log.category] || "oklch(0.52 0.09 55)" }}
                >
                  {CATEGORY_LABELS[log.category] || log.category}
                </span>
                <span className="font-medium truncate" style={{ color: "oklch(0.30 0.06 55)" }}>
                  {log.providerName}
                </span>
                {log.model && (
                  <span className="text-muted-foreground text-xs truncate hidden sm:inline">
                    {log.model}
                  </span>
                )}
                <span className="text-muted-foreground text-xs shrink-0 ml-auto">
                  {log.caller}
                </span>
                {log.totalTokens > 0 && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatNumber(log.totalTokens)} tok
                  </span>
                )}
                {log.durationMs > 0 && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDuration(log.durationMs)}
                  </span>
                )}
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(log.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-20 flex flex-col items-center justify-center text-muted-foreground gap-2">
            <Clock className="w-8 h-8 opacity-30" />
            <span className="text-sm">暂无调用记录</span>
          </div>
        )}
      </motion.div>

      {/* Info tip */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/30 text-sm text-muted-foreground">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
        <div>
          <p>费用估算基于各服务商的公开定价和 Token 用量计算，仅供参考。</p>
          <p className="mt-1">小熊对话的 Token 用量为估算值（基于字符数），其他调用的 Token 数据来自 API 返回。</p>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: React.ComponentType<any>;
  label: string;
  value: string;
  subValue?: string;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bear-card p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${color}15` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-black" style={{ color: "oklch(0.30 0.06 55)" }}>
        {value}
      </div>
      {subValue && (
        <div className="text-xs text-muted-foreground mt-1">{subValue}</div>
      )}
    </motion.div>
  );
}
