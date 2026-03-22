/*
 * 熊 Agent — 首页
 * 森林治愈系设计，温暖的欢迎页面
 * 优化：文字可读性、图片布局、色彩搭配
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { MessageCircle, TrendingUp, Users, Heart, Sparkles, ArrowRight, LogIn, GraduationCap, FileSearch } from "lucide-react";
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
    icon: GraduationCap,
    title: "AI 课程",
    desc: "基于学习资料智能生成个性化课程，分页闯关式学习",
    color: "oklch(0.55 0.15 265)",
    bgColor: "oklch(0.55 0.15 265 / 0.08)",
  },
  {
    icon: FileSearch,
    title: "试卷诊断",
    desc: "拍照上传试卷，AI 分析薄弱点并生成个性化学习路径",
    color: "oklch(0.60 0.18 30)",
    bgColor: "oklch(0.60 0.18 30 / 0.08)",
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
  let { user, loading, error, isAuthenticated, logout } = useAuth();
  const bearQuery = trpc.bear.mine.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });
  const hasBear = !!bearQuery.data;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section — 重新设计 */}
      <section className="relative overflow-hidden">
        {/* Background Image with stronger overlay */}
        <div className="absolute inset-0">
          <img
            src={BEAR_IMAGES.heroBg}
            alt=""
            className="w-full h-full object-cover"
          />
          {/* 多层渐变遮罩提升文字可读性 */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-background" />
        </div>

        <div className="container relative z-10 pt-16 pb-24 lg:pt-20 lg:pb-32">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            {/* Left Text — 增强可读性 */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex-1 text-center lg:text-left max-w-xl"
            >
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 backdrop-blur-sm"
                style={{
                  background: "oklch(1 0 0 / 0.75)",
                  color: "oklch(0.45 0.09 55)",
                  border: "1px solid oklch(0.52 0.09 55 / 0.2)",
                }}
              >
                <Sparkles className="w-4 h-4" />
                AI 驱动的学习伙伴
              </motion.div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black leading-[1.15] mb-5">
                <span style={{ color: "oklch(0.28 0.05 55)" }}>领养一只</span>
                <br />
                <span
                  className="relative inline-block"
                  style={{ color: "oklch(0.48 0.12 55)" }}
                >
                  学习小熊
                  {/* 装饰下划线 */}
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="absolute -bottom-1 left-0 right-0 h-2 rounded-full origin-left"
                    style={{ background: "oklch(0.52 0.09 55 / 0.15)" }}
                  />
                </span>
                <br />
                <span style={{ color: "oklch(0.28 0.05 55)" }}>一起成长</span>
              </h1>

              <p
                className="text-base sm:text-lg max-w-md mb-8 leading-relaxed"
                style={{ color: "oklch(0.38 0.04 55)" }}
              >
                在这里，你的 AI 学习伙伴不再是冰冷的对话框。它是一只有性格、会成长的小熊，陪你一起探索知识的森林。
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                {!isAuthenticated ? (
                  <Link href="/auth">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bear-btn flex items-center gap-2 text-base px-7 py-3"
                    >
                      <LogIn className="w-5 h-5" />
                      注册 / 登录
                    </motion.button>
                  </Link>
                ) : hasBear ? (
                  <>
                    <Link href="/chat">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bear-btn flex items-center gap-2 text-base px-7 py-3"
                      >
                        <MessageCircle className="w-5 h-5" />
                        和{bearQuery.data?.bearName}聊天
                      </motion.button>
                    </Link>
                    <Link href="/dashboard">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bear-btn-forest flex items-center gap-2 text-base px-7 py-3"
                      >
                        <TrendingUp className="w-5 h-5" />
                        成长看板
                      </motion.button>
                    </Link>
                  </>
                ) : (
                  <Link href="/adopt">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bear-btn flex items-center gap-2 text-base px-7 py-3"
                    >
                      <Heart className="w-5 h-5" />
                      领养小熊
                    </motion.button>
                  </Link>
                )}
              </div>
            </motion.div>

            {/* Right — 三只熊自然融入 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex-1 flex items-center justify-center lg:justify-end"
            >
              <div className="relative">
                {/* 主图：三只熊，去掉矩形框，自然融入 */}
                <motion.div
                  className="relative rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(120,80,40,0.25)] ring-1 ring-white/30"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <img
                    src={BEAR_IMAGES.group}
                    alt="三只小熊"
                    className="w-72 sm:w-80 lg:w-[400px] block"
                  />
                </motion.div>
                {/* 三个小头像环绕在主图下方 */}
                <div className="flex items-center justify-center gap-4 mt-4">
                  {[
                    { img: BEAR_IMAGES.grizzly, name: "可可", ring: "oklch(0.52 0.09 55 / 0.25)" },
                    { img: BEAR_IMAGES.panda, name: "圆圆", ring: "oklch(0.50 0.10 155 / 0.25)" },
                    { img: BEAR_IMAGES.polar, name: "冰冰", ring: "oklch(0.78 0.08 230 / 0.25)" },
                  ].map((bear, i) => (
                    <motion.div
                      key={bear.name}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + i * 0.15 }}
                      className="flex flex-col items-center gap-1"
                    >
                      <motion.img
                        src={bear.img}
                        alt={bear.name}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-md bg-white/80"
                        style={{ border: `2.5px solid ${bear.ring}` }}
                        whileHover={{ scale: 1.15, rotate: i % 2 === 0 ? 5 : -5 }}
                      />
                      <span className="text-[11px] font-semibold" style={{ color: "oklch(0.45 0.06 55)" }}>
                        {bear.name}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section — 改为 3 列 */}
      <section className="py-16 lg:py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-3" style={{ color: "oklch(0.28 0.05 55)" }}>
              为什么选择熊 Agent？
            </h2>
            <p className="text-muted-foreground text-base lg:text-lg max-w-2xl mx-auto">
              我们把 AI 学习变成了一场温暖的冒险
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="bear-card p-5 flex gap-3.5"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: feat.bgColor }}
                  >
                    <Icon className="w-5 h-5" style={{ color: feat.color }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base mb-0.5" style={{ color: "oklch(0.28 0.05 55)" }}>
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
      <section className="py-16 lg:py-20" style={{ background: "oklch(0.52 0.09 55 / 0.03)" }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-3" style={{ color: "oklch(0.28 0.05 55)" }}>
              小熊的成长之路
            </h2>
            <p className="text-muted-foreground text-base lg:text-lg">
              从小熊崽到传奇熊，每一步都有你的陪伴
            </p>
          </motion.div>

          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 lg:gap-10">
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
                transition={{ delay: i * 0.12 }}
                className="flex flex-col items-center"
              >
                <motion.div
                  whileHover={{ scale: 1.08, rotate: [0, -3, 3, 0] }}
                  className="w-32 h-32 sm:w-36 sm:h-36 lg:w-40 lg:h-40 rounded-2xl overflow-hidden bg-white shadow-md mb-3 p-2.5"
                  style={{ border: `2.5px solid ${tier.color}25` }}
                >
                  <img src={tier.img} alt={tier.label} className="w-full h-full object-contain" />
                </motion.div>
                <span className="font-bold text-sm sm:text-base" style={{ color: tier.color }}>{tier.label}</span>
                <span className="text-xs text-muted-foreground">{tier.sub}段位</span>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/gallery">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm text-white"
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
      <section className="py-16 lg:py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-2xl overflow-hidden p-8 sm:p-14 text-center"
            style={{ background: "linear-gradient(135deg, oklch(0.52 0.09 55), oklch(0.45 0.10 45))" }}
          >
            <div className="absolute top-4 left-6 opacity-15">
              <img src={BEAR_IMAGES.happy} alt="" className="w-20" />
            </div>
            <div className="absolute bottom-4 right-6 opacity-15">
              <img src={BEAR_IMAGES.studying} alt="" className="w-20" />
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-3 relative z-10">
              准备好开始你的学习冒险了吗？
            </h2>
            <p className="text-white/80 text-base lg:text-lg mb-7 max-w-xl mx-auto relative z-10">
              领养一只属于你的 AI 小熊，让学习变得温暖又有趣
            </p>
            <Link href="/adopt">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative z-10 inline-flex items-center gap-2 px-7 py-3 rounded-full bg-white font-bold text-base"
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
      <footer className="py-6 border-t border-[oklch(0.52_0.09_55/0.08)]">
        <div className="container text-center text-sm text-muted-foreground">
          <p>熊 Agent — 让 AI 学习变得温暖有趣</p>
          <p className="mt-1 text-xs">Powered by Bear Agent Team</p>
        </div>
      </footer>
    </div>
  );
}
