/*
 * 熊 Agent — 熊熊广场
 * 展示其他同学的小熊和排行榜
 */
import { motion } from "framer-motion";
import { Trophy, TrendingUp, MessageCircle, Star, Crown } from "lucide-react";
import Navbar from "@/components/Navbar";
import { BEAR_IMAGES, BEAR_TIERS } from "@/lib/bearAssets";

const leaderboard = [
  { rank: 1, name: "小明", bear: "可可", tier: 5, exp: 8200, chats: 520, avatar: BEAR_IMAGES.kingTier },
  { rank: 2, name: "小红", bear: "圆圆", tier: 4, exp: 6800, chats: 410, avatar: BEAR_IMAGES.starlightTier },
  { rank: 3, name: "小华", bear: "冰冰", tier: 4, exp: 6500, chats: 380, avatar: BEAR_IMAGES.diamondTier },
  { rank: 4, name: "小李", bear: "可可", tier: 3, exp: 5200, chats: 290, avatar: BEAR_IMAGES.platinumTier },
  { rank: 5, name: "小张", bear: "圆圆", tier: 2, exp: 3800, chats: 220, avatar: BEAR_IMAGES.goldTier },
  { rank: 6, name: "小王", bear: "冰冰", tier: 2, exp: 3500, chats: 195, avatar: BEAR_IMAGES.silverTier },
];

const recentActivity = [
  { user: "小明", action: "的可可升级到了王者段位！", time: "5 分钟前", icon: Crown },
  { user: "小红", action: "完成了「连续学习 7 天」成就", time: "12 分钟前", icon: Trophy },
  { user: "小华", action: "和冰冰进行了 30 轮深度对话", time: "25 分钟前", icon: MessageCircle },
  { user: "小李", action: "的可可获得了「学霸」皮肤", time: "1 小时前", icon: Star },
];

const rankColors = ["#FFD700", "#C0C0C0", "#CD7F32"];

export default function Square() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-black" style={{ color: "oklch(0.30 0.06 55)" }}>熊熊广场</h1>
          <p className="text-muted-foreground mt-1">看看其他同学的小熊，一起学习一起进步</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leaderboard */}
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bear-card p-6">
              <h2 className="font-bold text-lg mb-6 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
                <Trophy className="w-5 h-5" style={{ color: "#FFD700" }} /> 学习排行榜
              </h2>

              {/* Top 3 Podium */}
              <div className="flex items-end justify-center gap-4 mb-8">
                {[1, 0, 2].map((idx) => {
                  const user = leaderboard[idx];
                  const isFirst = idx === 0;
                  return (
                    <motion.div
                      key={user.rank}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + idx * 0.1 }}
                      className="flex flex-col items-center"
                    >
                      <div className="relative">
                        {isFirst && (
                          <Crown className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-6" style={{ color: "#FFD700" }} />
                        )}
                        <motion.div
                          whileHover={{ scale: 1.08 }}
                          className={`${isFirst ? "w-24 h-24" : "w-20 h-20"} rounded-2xl overflow-hidden bg-white shadow-lg p-2`}
                          style={{ border: `3px solid ${rankColors[user.rank - 1]}40` }}
                        >
                          <img src={user.avatar} alt={user.bear} className="w-full h-full object-contain" />
                        </motion.div>
                      </div>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center -mt-3 relative z-10 text-white text-sm font-black shadow-md"
                        style={{ background: rankColors[user.rank - 1] }}
                      >
                        {user.rank}
                      </div>
                      <p className="font-bold text-sm mt-1" style={{ color: "oklch(0.30 0.06 55)" }}>{user.name}</p>
                      <p className="text-[10px] text-muted-foreground">{BEAR_TIERS[user.tier].rank}</p>
                      <p className="text-xs font-mono font-bold mt-0.5" style={{ color: rankColors[user.rank - 1] }}>{user.exp} EXP</p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Rest of leaderboard */}
              <div className="space-y-2">
                {leaderboard.slice(3).map((user, i) => (
                  <motion.div
                    key={user.rank}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.08 }}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-[oklch(0.52_0.09_55/0.04)] transition"
                  >
                    <span className="w-8 text-center font-black text-muted-foreground">{user.rank}</span>
                    <img src={user.avatar} alt={user.bear} className="w-10 h-10 rounded-xl object-contain bg-white p-1 shadow-sm" />
                    <div className="flex-1">
                      <p className="font-bold text-sm" style={{ color: "oklch(0.30 0.06 55)" }}>{user.name}</p>
                      <p className="text-[10px] text-muted-foreground">{user.bear} · {BEAR_TIERS[user.tier].rank}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-bold" style={{ color: "oklch(0.52 0.09 55)" }}>{user.exp}</p>
                      <p className="text-[10px] text-muted-foreground">{user.chats} 次对话</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Recent Activity */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bear-card p-6">
              <h2 className="font-bold text-lg mb-5 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
                <TrendingUp className="w-5 h-5" style={{ color: "oklch(0.50 0.10 155)" }} /> 最新动态
              </h2>
              <div className="space-y-4">
                {recentActivity.map((act, i) => {
                  const Icon = act.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex gap-3"
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "oklch(0.52 0.09 55 / 0.08)" }}>
                        <Icon className="w-4 h-4" style={{ color: "oklch(0.52 0.09 55)" }} />
                      </div>
                      <div>
                        <p className="text-sm">
                          <span className="font-bold" style={{ color: "oklch(0.30 0.06 55)" }}>{act.user}</span>
                          <span className="text-muted-foreground">{act.action}</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{act.time}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* My Ranking */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bear-card p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: "oklch(0.30 0.06 55)" }}>
                <Star className="w-5 h-5" style={{ color: "oklch(0.65 0.15 85)" }} /> 我的排名
              </h2>
              <div className="flex items-center gap-4">
                <motion.img
                  src={BEAR_IMAGES.grizzly}
                  alt="我的熊"
                  className="w-16 h-16 object-contain"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <div>
                  <p className="font-black text-2xl" style={{ color: "oklch(0.52 0.09 55)" }}>#7</p>
                  <p className="text-xs text-muted-foreground">黄金段位 · 4720 EXP</p>
                  <p className="text-[10px] text-muted-foreground mt-1">距离第 6 名还差 <span className="font-bold" style={{ color: "oklch(0.52 0.09 55)" }}>780</span> 经验</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
