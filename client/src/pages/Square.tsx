/**
 * Square — 龙虾广场
 * 设计风格：深海生物发光 (Bioluminescence)
 * 展示所有学生的龙虾，排行榜和社交互动
 */
import { motion } from "framer-motion";
import { Trophy, Crown, TrendingUp, Flame, Search } from "lucide-react";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import ParticleBackground from "@/components/ParticleBackground";
import GlowCard from "@/components/GlowCard";

const LOBSTER_HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/lobster-hero-5E7aSMe59zcws2kjVc7LDP.webp";
const LOBSTER_BRONZE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/lobster-bronze-d2Tm6niFfZRw72gpwiGRaj.webp";
const LOBSTER_DIAMOND = "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/lobster-diamond-RmNu4AtC2Yu6X8ghz7Qt6L.webp";

const tierColors: Record<string, string> = {
  "青铜": "oklch(0.6 0.08 60)",
  "白银": "oklch(0.7 0.02 260)",
  "黄金": "oklch(0.85 0.15 85)",
  "铂金": "oklch(0.75 0.08 195)",
  "钻石": "oklch(0.82 0.15 195)",
  "星耀": "oklch(0.7 0.18 40)",
  "王者": "oklch(0.85 0.15 85)",
};

const lobsterImages: Record<string, string> = {
  "青铜": LOBSTER_BRONZE,
  "白银": LOBSTER_BRONZE,
  "黄金": LOBSTER_HERO,
  "铂金": LOBSTER_HERO,
  "钻石": LOBSTER_DIAMOND,
  "星耀": LOBSTER_DIAMOND,
  "王者": LOBSTER_DIAMOND,
};

const leaderboard = [
  { rank: 1, name: "学霸小明", lobsterName: "深海霸主", tier: "王者", level: 28, exp: 12800, streak: 45, avatar: "🦊" },
  { rank: 2, name: "数学达人", lobsterName: "闪电虾", tier: "星耀", level: 24, exp: 10200, streak: 38, avatar: "🐱" },
  { rank: 3, name: "物理少年", lobsterName: "量子虾", tier: "钻石", level: 20, exp: 8500, streak: 30, avatar: "🐶" },
  { rank: 4, name: "英语小王子", lobsterName: "翻译虾", tier: "钻石", level: 18, exp: 7200, streak: 25, avatar: "🐻" },
  { rank: 5, name: "化学实验家", lobsterName: "元素虾", tier: "铂金", level: 15, exp: 5800, streak: 20, avatar: "🐼" },
  { rank: 6, name: "历史探索者", lobsterName: "时光虾", tier: "黄金", level: 12, exp: 4200, streak: 15, avatar: "🐯" },
  { rank: 7, name: "生物爱好者", lobsterName: "基因虾", tier: "黄金", level: 10, exp: 3500, streak: 12, avatar: "🐰" },
  { rank: 8, name: "编程新手", lobsterName: "代码虾", tier: "白银", level: 7, exp: 2100, streak: 8, avatar: "🦄" },
  { rank: 9, name: "地理迷", lobsterName: "航海虾", tier: "白银", level: 5, exp: 1500, streak: 5, avatar: "🐨" },
  { rank: 10, name: "新同学", lobsterName: "小虾米", tier: "青铜", level: 2, exp: 400, streak: 2, avatar: "🐧" },
];

type Tab = "ranking" | "gallery";

export default function Square() {
  const [activeTab, setActiveTab] = useState<Tab>("ranking");

  return (
    <div className="min-h-screen relative">
      <ParticleBackground count={20} />
      <Navbar />

      <div className="pt-24 pb-12">
        <div className="container space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <h1 className="font-display text-3xl font-bold text-foreground">龙虾广场</h1>
            <p className="text-muted-foreground">看看其他同学的龙虾，互相学习共同进步</p>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-2">
            {[
              { id: "ranking" as Tab, label: "排行榜", icon: Trophy },
              { id: "gallery" as Tab, label: "龙虾展览", icon: Crown },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? "text-cyan-glow glow-cyan"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                style={{
                  background: activeTab === tab.id ? "oklch(0.82 0.15 195 / 0.1)" : "transparent",
                  border: `1px solid ${activeTab === tab.id ? "oklch(0.82 0.15 195 / 0.3)" : "oklch(0.25 0.03 260)"}`,
                }}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            ))}
          </div>

          {activeTab === "ranking" ? <RankingView /> : <GalleryView />}
        </div>
      </div>
    </div>
  );
}

function RankingView() {
  return (
    <div className="space-y-6">
      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
        {[1, 0, 2].map((idx) => {
          const player = leaderboard[idx];
          const isFirst = player.rank === 1;
          return (
            <motion.div
              key={player.rank}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.15 }}
              className={`${isFirst ? "order-2 -mt-4" : idx === 0 ? "order-1 mt-4" : "order-3 mt-4"}`}
            >
              <GlowCard glowColor={isFirst ? "gold" : "cyan"} className="text-center py-6">
                <div className="relative inline-block mb-3">
                  {isFirst && (
                    <Crown className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-6 text-amber-gold z-20" />
                  )}
                  <img
                    src={lobsterImages[player.tier]}
                    alt={player.lobsterName}
                    className={`w-20 h-20 object-contain ${isFirst ? "animate-breathe" : ""}`}
                  />
                </div>
                <div
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full font-mono font-bold text-sm mb-2"
                  style={{
                    background: isFirst ? "oklch(0.85 0.15 85 / 0.2)" : "oklch(0.82 0.15 195 / 0.1)",
                    color: isFirst ? "oklch(0.85 0.15 85)" : "oklch(0.82 0.15 195)",
                    border: `1px solid ${isFirst ? "oklch(0.85 0.15 85 / 0.3)" : "oklch(0.82 0.15 195 / 0.2)"}`,
                  }}
                >
                  {player.rank}
                </div>
                <h3 className="font-display text-sm font-semibold text-foreground">{player.name}</h3>
                <div className="text-xs text-muted-foreground mt-0.5">{player.lobsterName}</div>
                <div
                  className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                  style={{
                    background: `${tierColors[player.tier]}15`,
                    color: tierColors[player.tier],
                    border: `1px solid ${tierColors[player.tier]}30`,
                  }}
                >
                  {player.tier} · Lv.{player.level}
                </div>
              </GlowCard>
            </motion.div>
          );
        })}
      </div>

      {/* Full Leaderboard */}
      <GlowCard glowColor="cyan" delay={0.3}>
        <div className="space-y-1">
          {leaderboard.slice(3).map((player, i) => (
            <motion.div
              key={player.rank}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              className="flex items-center gap-4 py-3 px-4 rounded-lg hover:bg-secondary/30 transition-colors"
            >
              <span className="w-8 text-center font-mono text-sm text-muted-foreground">{player.rank}</span>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-base"
                style={{ background: "oklch(0.2 0.03 260)", border: "1px solid oklch(0.25 0.03 260)" }}
              >
                {player.avatar}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">{player.name}</div>
                <div className="text-xs text-muted-foreground">{player.lobsterName}</div>
              </div>
              <div
                className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                style={{
                  background: `${tierColors[player.tier]}15`,
                  color: tierColors[player.tier],
                  border: `1px solid ${tierColors[player.tier]}30`,
                }}
              >
                {player.tier}
              </div>
              <div className="text-right">
                <div className="font-mono text-sm text-cyan-glow">Lv.{player.level}</div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Flame className="w-3 h-3 text-coral-orange" />
                  {player.streak}天
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </GlowCard>
    </div>
  );
}

function GalleryView() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {leaderboard.map((player, i) => (
        <motion.div
          key={player.rank}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
        >
          <GlowCard
            glowColor={player.tier === "王者" ? "gold" : player.tier === "钻石" || player.tier === "星耀" ? "orange" : "cyan"}
            className="text-center py-5 group"
          >
            <div className="relative inline-block mb-3">
              <div
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `radial-gradient(circle, ${tierColors[player.tier]}30 0%, transparent 70%)`,
                  transform: "scale(1.5)",
                }}
              />
              <img
                src={lobsterImages[player.tier]}
                alt={player.lobsterName}
                className="w-24 h-24 object-contain relative z-10 transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <h3 className="font-display text-sm font-semibold text-foreground">{player.lobsterName}</h3>
            <div className="text-xs text-muted-foreground mt-0.5">{player.name}</div>
            <div
              className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold"
              style={{
                background: `${tierColors[player.tier]}15`,
                color: tierColors[player.tier],
                border: `1px solid ${tierColors[player.tier]}30`,
              }}
            >
              {player.tier} · Lv.{player.level}
            </div>
          </GlowCard>
        </motion.div>
      ))}
    </div>
  );
}
