/*
 * 熊 Agent — 首页
 * 森林治愈系设计，温暖的欢迎页面
 */
import { motion } from "framer-motion";
import { Link } from "wouter";
import { MessageCircle, TrendingUp, Users, Heart, Sparkles, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import { BEAR_IMAGES } from "@/lib/bearAssets";

const features = [
  {
    icon: MessageCircle,
    title: "智能对话",
    desc: "和你的小熊一起学习，它会用最适合你的方式讲解知识",
    color: "oklch(0.52 0.09 55)",
    bgColor: "oklch(0.52 0.09 55 / 0.08)",
  },
  {
    icon: TrendingUp,
    title: "养成成长",
    desc: "每次学习都能让小熊获得经验值，从小熊崽进化为传奇熊",
    color: "oklch(0.50 0.10 155)",
    bgColor: "oklch(0.50 0.10 155 / 0.08)",
  },
  {
    icon: Users,
    title: "熊熊广场",
    desc: "看看其他同学的小熊，互相学习，一起进步",
    color: "oklch(0.78 0.08 230)",
    bgColor: "oklch(0.78 0.08 230 / 0.12)",
  },
  {
    icon: Heart,
    title: "个性定制",
    desc: "选择你喜欢的熊熊性格——热情的可可、可爱的圆圆、酷酷的冰冰",
    color: "oklch(0.65 0.20 15)",
    bgColor: "oklch(0.65 0.20 15 / 0.08)",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={BEAR_IMAGES.heroBg}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/10 to-background" />
        </div>

        <div className="container relative z-10 pt-20 pb-32">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left Text */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="flex-1 text-center lg:text-left"
            >
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6"
                style={{ background: "oklch(0.52 0.09 55 / 0.12)", color: "oklch(0.42 0.09 55)" }}
              >
                <Sparkles className="w-4 h-4" />
                AI 驱动的学习伙伴
              </motion.div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6" style={{ color: "oklch(0.30 0.06 55)" }}>
                领养一只
                <br />
                <span style={{ color: "oklch(0.52 0.09 55)" }}>学习小熊</span>
                <br />
                一起成长
              </h1>

              <p className="text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
                在这里，你的 AI 学习伙伴不再是冰冷的对话框。它是一只有性格、会成长的小熊，陪你一起探索知识的森林。
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/adopt">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bear-btn flex items-center gap-2 text-base px-8 py-3.5"
                  >
                    <Heart className="w-5 h-5" />
                    领养小熊
                  </motion.button>
                </Link>
                <Link href="/chat">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bear-btn-forest flex items-center gap-2 text-base px-8 py-3.5"
                  >
                    <MessageCircle className="w-5 h-5" />
                    开始聊天
                  </motion.button>
                </Link>
              </div>
            </motion.div>

            {/* Right Bears */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex-1 flex items-end justify-center"
            >
              <div className="flex flex-col items-center gap-4">
                <motion.img
                  src={BEAR_IMAGES.group}
                  alt="三只小熊"
                  className="w-64 sm:w-80 lg:w-96 drop-shadow-2xl"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                <div className="flex items-center gap-6 mt-2">
                  <motion.img
                    src={BEAR_IMAGES.grizzly}
                    alt="可可"
                    className="w-16 h-16 rounded-full ring-2 ring-[oklch(0.52_0.09_55/0.3)] shadow-lg"
                    whileHover={{ scale: 1.15, rotate: 5 }}
                  />
                  <motion.img
                    src={BEAR_IMAGES.panda}
                    alt="圆圆"
                    className="w-16 h-16 rounded-full ring-2 ring-[oklch(0.50_0.10_155/0.3)] shadow-lg"
                    whileHover={{ scale: 1.15, rotate: -5 }}
                  />
                  <motion.img
                    src={BEAR_IMAGES.polar}
                    alt="冰冰"
                    className="w-16 h-16 rounded-full ring-2 ring-[oklch(0.78_0.08_230/0.3)] shadow-lg"
                    whileHover={{ scale: 1.15, rotate: 5 }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ color: "oklch(0.30 0.06 55)" }}>
              为什么选择熊 Agent？
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              我们把 AI 学习变成了一场温暖的冒险
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bear-card p-6 flex gap-4"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: feat.bgColor }}
                  >
                    <Icon className="w-6 h-6" style={{ color: feat.color }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1" style={{ color: "oklch(0.30 0.06 55)" }}>
                      {feat.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tier Preview */}
      <section className="py-20" style={{ background: "oklch(0.52 0.09 55 / 0.04)" }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ color: "oklch(0.30 0.06 55)" }}>
              小熊的成长之路
            </h2>
            <p className="text-muted-foreground text-lg">
              从小熊崽到传奇熊，每一步都有你的陪伴
            </p>
          </motion.div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12">
            {[
              { img: BEAR_IMAGES.bronzeTier, label: "小熊崽", sub: "青铜", color: "#CD7F32" },
              { img: BEAR_IMAGES.silverTier, label: "学徒熊", sub: "白银", color: "#8B9DAF" },
              { img: BEAR_IMAGES.goldTier, label: "学者熊", sub: "黄金", color: "#D4A017" },
              { img: BEAR_IMAGES.diamondTier, label: "魔法熊", sub: "钻石", color: "#5B9BD5" },
              { img: BEAR_IMAGES.kingTier, label: "王者熊", sub: "王者", color: "#E74C3C" },
            ].map((tier, i) => (
              <motion.div
                key={tier.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="flex flex-col items-center"
              >
                <motion.div
                  whileHover={{ scale: 1.08, rotate: [0, -3, 3, 0] }}
                  className="w-40 h-40 sm:w-48 sm:h-48 rounded-3xl overflow-hidden bg-white shadow-lg mb-4 p-3"
                  style={{ border: `3px solid ${tier.color}20` }}
                >
                  <img src={tier.img} alt={tier.label} className="w-full h-full object-contain" />
                </motion.div>
                <span className="font-bold text-lg" style={{ color: tier.color }}>{tier.label}</span>
                <span className="text-sm text-muted-foreground">{tier.sub}段位</span>
              </motion.div>
            ))}

            {/* Arrows between tiers */}
          </div>

          <div className="text-center mt-10">
            <Link href="/gallery">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white"
                style={{ background: "oklch(0.52 0.09 55)" }}
              >
                查看全部图鉴
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden p-10 sm:p-16 text-center"
            style={{ background: "oklch(0.52 0.09 55)" }}
          >
            <div className="absolute top-4 left-8 opacity-20">
              <img src={BEAR_IMAGES.happy} alt="" className="w-24" />
            </div>
            <div className="absolute bottom-4 right-8 opacity-20">
              <img src={BEAR_IMAGES.studying} alt="" className="w-24" />
            </div>
            <div className="absolute top-6 right-12 opacity-15">
              <img src={BEAR_IMAGES.thinking} alt="" className="w-20" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 relative z-10">
              准备好开始你的学习冒险了吗？
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto relative z-10">
              领养一只属于你的 AI 小熊，让学习变得温暖又有趣
            </p>
            <Link href="/adopt">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative z-10 inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white font-bold text-lg"
                style={{ color: "oklch(0.52 0.09 55)" }}
              >
                <Heart className="w-5 h-5" />
                立即领养
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-[oklch(0.52_0.09_55/0.1)]">
        <div className="container text-center text-sm text-muted-foreground">
          <p>熊 Agent — 让 AI 学习变得温暖有趣</p>
          <p className="mt-1 text-xs">Powered by Bear Agent Team</p>
        </div>
      </footer>
    </div>
  );
}
