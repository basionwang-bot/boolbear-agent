/**
 * Home — 着陆页
 * 设计风格：深海生物发光 (Bioluminescence)
 * 全屏沉浸式深海场景，龙虾从深海中浮现
 */
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Sparkles, Brain, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import ParticleBackground from "@/components/ParticleBackground";
import GlowCard from "@/components/GlowCard";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/hero-deep-sea-dhQoUGh65JWWLRafgivGmC.webp";
const LOBSTER_HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/lobster-hero-5E7aSMe59zcws2kjVc7LDP.webp";
const LOBSTER_BRONZE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/lobster-bronze-d2Tm6niFfZRw72gpwiGRaj.webp";
const LOBSTER_DIAMOND = "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/lobster-diamond-RmNu4AtC2Yu6X8ghz7Qt6L.webp";

const features = [
  {
    icon: Brain,
    title: "AI 智能对话",
    desc: "基于 Kimi 大模型，你的龙虾能理解你的学习需求，用最适合你的方式讲解知识。",
    glow: "cyan" as const,
  },
  {
    icon: Sparkles,
    title: "养成进化",
    desc: "每一次对话都让龙虾获得经验。从青铜到王者，见证你的学习伙伴不断进化。",
    glow: "orange" as const,
  },
  {
    icon: Trophy,
    title: "段位挑战",
    desc: "类似王者荣耀的段位系统，青铜、白银、黄金……一路冲上王者，展示你的学习实力。",
    glow: "gold" as const,
  },
  {
    icon: Users,
    title: "龙虾广场",
    desc: "在广场上看到其他同学的龙虾，比较等级和成就，互相激励共同进步。",
    glow: "mint" as const,
  },
];

const tiers = [
  { name: "青铜", level: "Lv.1", img: LOBSTER_BRONZE, desc: "初出茅庐的小龙虾" },
  { name: "钻石", level: "Lv.17", img: LOBSTER_HERO, desc: "经验丰富的学习导师" },
  { name: "王者", level: "Lv.25", img: LOBSTER_DIAMOND, desc: "传说中的知识守护者" },
];

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground count={40} />
      <Navbar />

      {/* Hero Section */}
      <section
        className="relative min-h-screen flex items-center pt-16"
        style={{
          backgroundImage: `url(${HERO_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background" />

        <div className="container relative z-10 flex flex-col lg:flex-row items-center gap-12 py-20">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex-1 space-y-8"
          >
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border border-cyan-glow/30"
                style={{ background: "oklch(0.82 0.15 195 / 0.1)" }}
              >
                <Sparkles className="w-4 h-4 text-cyan-glow" />
                <span className="text-cyan-glow">AI 教育养成平台</span>
              </motion.div>

              <h1 className="font-display text-5xl lg:text-7xl font-bold leading-tight">
                <span className="text-foreground">养一只</span>
                <br />
                <span className="text-cyan-glow text-glow-cyan">学习龙虾</span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                用 AI 对话学习，你的小龙虾会随着你的每一次提问而成长。
                从青铜到王者，让学习变成一场深海冒险。
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link href="/adopt">
                <Button
                  size="lg"
                  className="bg-coral-orange hover:bg-coral-orange/90 text-white font-display font-semibold px-8 glow-orange transition-all duration-300 hover:glow-orange-strong"
                >
                  领养龙虾
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/chat">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-cyan-glow/40 text-cyan-glow hover:bg-cyan-glow/10 font-display font-semibold px-8"
                >
                  开始对话
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-4">
              {[
                { value: "1,280+", label: "活跃学生" },
                { value: "52,000+", label: "对话次数" },
                { value: "7", label: "段位等级" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="text-center"
                >
                  <div className="font-mono text-2xl font-bold text-cyan-glow">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Lobster */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="flex-1 flex justify-center"
          >
            <div className="relative">
              {/* Glow ring behind lobster */}
              <div
                className="absolute inset-0 rounded-full animate-pulse-glow"
                style={{
                  background: "radial-gradient(circle, oklch(0.82 0.15 195 / 0.2) 0%, transparent 70%)",
                  transform: "scale(1.3)",
                }}
              />
              <img
                src={LOBSTER_HERO}
                alt="龙虾 Agent"
                className="w-72 h-72 lg:w-96 lg:h-96 object-contain animate-breathe relative z-10 drop-shadow-2xl"
              />
            </div>
          </motion.div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path
              d="M0 120L60 110C120 100 240 80 360 75C480 70 600 80 720 85C840 90 960 90 1080 82C1200 75 1320 60 1380 52L1440 45V120H0Z"
              fill="oklch(0.12 0.025 260)"
            />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-4"
          >
            <h2 className="font-display text-4xl font-bold text-foreground">
              为什么选择<span className="text-cyan-glow text-glow-cyan">龙虾 Agent</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              不只是一个 AI 对话工具，更是一个让学习充满乐趣的养成世界
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {features.map((f, i) => (
              <GlowCard key={f.title} glowColor={f.glow} delay={i * 0.1}>
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "oklch(0.82 0.15 195 / 0.1)" }}
                  >
                    <f.icon className="w-6 h-6 text-cyan-glow" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-display text-lg font-semibold text-foreground">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      {/* Evolution Section */}
      <section className="relative py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-4"
          >
            <h2 className="font-display text-4xl font-bold text-foreground">
              <span className="text-coral-orange text-glow-orange">进化</span>之路
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              你的龙虾会随着学习不断进化，从可爱的小虾米成长为传说中的知识守护者
            </p>
          </motion.div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            {tiers.map((tier, i) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="text-center space-y-4"
              >
                <div className="relative group">
                  <div
                    className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: "radial-gradient(circle, oklch(0.82 0.15 195 / 0.2) 0%, transparent 70%)",
                      transform: "scale(1.4)",
                    }}
                  />
                  <img
                    src={tier.img}
                    alt={tier.name}
                    className={`w-36 h-36 md:w-44 md:h-44 object-contain relative z-10 transition-transform duration-500 group-hover:scale-110 ${i === 2 ? "drop-shadow-[0_0_20px_oklch(0.85_0.15_85/0.4)]" : ""}`}
                  />
                </div>
                <div>
                  <div className="font-mono text-sm text-cyan-glow">{tier.level}</div>
                  <h3 className="font-display text-xl font-bold text-foreground">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{tier.desc}</p>
                </div>
                {i < tiers.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-10">
                    <ArrowRight className="w-6 h-6 text-cyan-glow/40" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24">
        <div className="container">
          <GlowCard glowColor="orange" className="max-w-3xl mx-auto text-center py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <span className="text-5xl">🦞</span>
              <h2 className="font-display text-3xl font-bold text-foreground">
                准备好开始你的深海冒险了吗？
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                领养一只属于你的学习龙虾，让 AI 成为你最好的学习伙伴
              </p>
              <Link href="/adopt">
                <Button
                  size="lg"
                  className="bg-coral-orange hover:bg-coral-orange/90 text-white font-display font-semibold px-10 glow-orange transition-all duration-300 hover:glow-orange-strong mt-4"
                >
                  立即领养
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </GlowCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🦞</span>
            <span className="font-display text-sm text-muted-foreground">龙虾 Agent 2.0</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Powered by Kimi AI — 让学习变成一场深海冒险
          </p>
        </div>
      </footer>
    </div>
  );
}
