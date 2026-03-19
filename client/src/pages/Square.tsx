/*
 * 熊 Agent — 熊熊广场
 * 排行榜 + 社区展示，接入真实数据
 */
import { motion } from "framer-motion";
import { Trophy, Star, Loader2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { BEAR_IMAGES, BEAR_TIERS } from "@/lib/bearAssets";

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
  const { isAuthenticated } = useAuth();
  const leaderboardQuery = trpc.bear.leaderboard.useQuery({ limit: 20 });
  const myBearQuery = trpc.bear.mine.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-12">
        <div className="absolute inset-0 opacity-10">
          <img src={BEAR_IMAGES.squareBg} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="container relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl sm:text-4xl font-black" style={{ color: "oklch(0.30 0.06 55)" }}>
              熊熊广场
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">看看谁的小熊最厉害</p>
          </motion.div>
        </div>
      </section>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leaderboard */}
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bear-card p-6">
              <h2 className="font-bold text-lg mb-6 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
                <Trophy className="w-5 h-5" style={{ color: "#FFD700" }} /> 经验值排行榜
              </h2>

              {leaderboardQuery.isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: "oklch(0.52 0.09 55)" }} />
                </div>
              ) : leaderboardQuery.data && leaderboardQuery.data.length > 0 ? (
                <>
                  {/* Top 3 Podium */}
                  <div className="flex items-end justify-center gap-4 sm:gap-8 mb-8">
                    {[1, 0, 2].map((rank) => {
                      const bear = leaderboardQuery.data?.[rank];
                      if (!bear) return <div key={rank} className="w-24" />;
                      const tierIdx = TIER_INDEX[bear.tier] ?? 0;
                      const tier = BEAR_TIERS[tierIdx];
                      const isFirst = rank === 0;
                      const bearImg = BEAR_TYPE_IMAGES[bear.bearType] || BEAR_IMAGES.grizzly;

                      return (
                        <motion.div
                          key={bear.id}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + rank * 0.15 }}
                          className={`text-center ${isFirst ? "order-2" : rank === 1 ? "order-1" : "order-3"}`}
                        >
                          <div className="relative">
                            <motion.div
                              whileHover={{ scale: 1.08 }}
                              className={`mx-auto rounded-2xl overflow-hidden bg-white shadow-lg p-2 ${isFirst ? "w-24 h-24" : "w-20 h-20"}`}
                              style={{ border: `3px solid ${MEDAL_COLORS[rank]}40` }}
                            >
                              <img src={bearImg} alt={bear.bearName} className="w-full h-full object-contain" />
                            </motion.div>
                            <div
                              className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shadow-md z-10"
                              style={{ background: MEDAL_COLORS[rank] }}
                            >
                              {rank + 1}
                            </div>
                          </div>
                          <p className="font-bold text-sm mt-4" style={{ color: "oklch(0.30 0.06 55)" }}>{bear.bearName}</p>
                          <p className="text-[10px] text-muted-foreground">{bear.ownerName}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: tier.bgColor, color: tier.color }}>
                            {tier.rank}
                          </span>
                          <p className="text-xs font-mono font-bold mt-0.5" style={{ color: MEDAL_COLORS[rank] }}>{bear.experience} EXP</p>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Rest of leaderboard */}
                  {leaderboardQuery.data.length > 3 && (
                    <div className="space-y-2">
                      {leaderboardQuery.data.slice(3).map((bear, i) => {
                        const tierIdx = TIER_INDEX[bear.tier] ?? 0;
                        const tier = BEAR_TIERS[tierIdx];
                        const bearImg = BEAR_TYPE_IMAGES[bear.bearType] || BEAR_IMAGES.grizzly;

                        return (
                          <motion.div
                            key={bear.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + i * 0.05 }}
                            className="flex items-center gap-4 p-3 rounded-xl hover:bg-[oklch(0.52_0.09_55/0.04)] transition"
                          >
                            <span className="w-8 text-center font-black text-muted-foreground">{i + 4}</span>
                            <img src={bearImg} alt={bear.bearName} className="w-10 h-10 rounded-xl object-contain bg-white p-1 shadow-sm" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm" style={{ color: "oklch(0.30 0.06 55)" }}>{bear.bearName}</span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: tier.bgColor, color: tier.color }}>
                                  {tier.rank}
                                </span>
                              </div>
                              <p className="text-[10px] text-muted-foreground">{bear.ownerName} · Lv.{bear.level}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-mono font-bold" style={{ color: "oklch(0.52 0.09 55)" }}>{bear.experience}</p>
                              <p className="text-[10px] text-muted-foreground">{bear.totalChats} 次对话</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-20">
                  <motion.img
                    src={BEAR_IMAGES.group}
                    alt="暂无数据"
                    className="w-32 h-32 mx-auto mb-4 opacity-40"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <p className="text-muted-foreground">还没有小熊入驻广场</p>
                  <p className="text-xs text-muted-foreground mt-1">快去领养一只吧！</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar: My Ranking */}
          <div className="lg:col-span-1 space-y-6">
            {myBearQuery.data && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bear-card p-6">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
                  <Star className="w-5 h-5" style={{ color: "oklch(0.65 0.15 85)" }} /> 我的小熊
                </h2>
                <div className="flex items-center gap-4">
                  <motion.img
                    src={BEAR_TYPE_IMAGES[myBearQuery.data.bearType] || BEAR_IMAGES.grizzly}
                    alt="我的熊"
                    className="w-16 h-16 object-contain"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <div>
                    <p className="font-black text-lg" style={{ color: "oklch(0.30 0.06 55)" }}>{myBearQuery.data.bearName}</p>
                    <p className="text-xs text-muted-foreground">
                      {BEAR_TIERS[TIER_INDEX[myBearQuery.data.tier] ?? 0].rank}段位 · {myBearQuery.data.experience} EXP
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Lv.{myBearQuery.data.level} · {myBearQuery.data.totalChats} 次对话
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Info Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bear-card p-6">
              <h3 className="font-bold text-sm mb-3" style={{ color: "oklch(0.30 0.06 55)" }}>如何提升排名？</h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>和小熊对话可以获得经验值</p>
                <p>经验值越高，排名越靠前</p>
                <p>达到一定经验值后小熊会升级段位</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
