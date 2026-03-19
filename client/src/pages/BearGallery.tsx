/*
 * 裸熊 Agent — 熊熊展示库
 * 展示所有可用的熊段位、三只主角和情绪状态
 */
import { motion } from "framer-motion";
import { Sparkles, Crown, Heart } from "lucide-react";
import Navbar from "@/components/Navbar";
import { BEAR_TIERS, BEAR_SKINS, BEAR_EMOTIONS, BEAR_IMAGES } from "@/lib/bearAssets";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export default function BearGallery() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="text-3xl font-black" style={{ color: "oklch(0.30 0.06 55)" }}>熊熊展示库</h1>
          <p className="text-muted-foreground mt-2">探索所有可用的熊段位、角色和情绪状态</p>
        </motion.div>

        <Tabs defaultValue="tiers" className="w-full max-w-5xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="tiers" className="flex items-center gap-1.5">
              <Crown className="w-4 h-4" /> 段位
            </TabsTrigger>
            <TabsTrigger value="bears" className="flex items-center gap-1.5">
              <Heart className="w-4 h-4" /> 角色
            </TabsTrigger>
            <TabsTrigger value="emotions" className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> 情绪
            </TabsTrigger>
          </TabsList>

          {/* Tiers */}
          <TabsContent value="tiers">
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {BEAR_TIERS.map((tier, i) => (
                <motion.div key={tier.rank} variants={itemVariants}>
                  <motion.div
                    whileHover={{ scale: 1.04, y: -4 }}
                    className="bear-card p-6 text-center h-full flex flex-col items-center"
                  >
                    <motion.img
                      src={tier.image}
                      alt={tier.name}
                      className="w-28 h-28 object-contain mb-4"
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 2.5 + i * 0.3, repeat: Infinity }}
                    />
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: tier.bgColor, color: tier.color }}>
                        {tier.rank}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg" style={{ color: "oklch(0.30 0.06 55)" }}>{tier.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 flex-1">{tier.description}</p>
                    <div className="mt-3 text-[10px] font-mono text-muted-foreground">
                      {tier.minExp} EXP 起
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>

          {/* Bears */}
          <TabsContent value="bears">
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {BEAR_SKINS.map((bear, i) => (
                <motion.div key={bear.type} variants={itemVariants}>
                  <motion.div
                    whileHover={{ scale: 1.04, y: -4 }}
                    className="bear-card p-8 text-center"
                  >
                    <motion.img
                      src={bear.image}
                      alt={bear.name}
                      className="w-36 h-36 mx-auto object-contain mb-5"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 2.5 + i * 0.4, repeat: Infinity }}
                    />
                    <h3 className="font-black text-xl" style={{ color: "oklch(0.30 0.06 55)" }}>{bear.name}</h3>
                    <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold" style={{ background: "oklch(0.52 0.09 55 / 0.08)", color: "oklch(0.42 0.09 55)" }}>
                      {bear.personality}
                    </span>
                    <p className="text-sm text-muted-foreground mt-3">{bear.description}</p>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>

          {/* Emotions */}
          <TabsContent value="emotions">
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {BEAR_EMOTIONS.map((emotion, i) => (
                <motion.div key={emotion.name} variants={itemVariants}>
                  <motion.div
                    whileHover={{ scale: 1.04, y: -4 }}
                    className="bear-card p-6 flex items-center gap-5"
                  >
                    <motion.img
                      src={emotion.image}
                      alt={emotion.name}
                      className="w-24 h-24 object-contain shrink-0"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2 + i * 0.5, repeat: Infinity }}
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{emotion.emoji}</span>
                        <h3 className="font-bold text-lg" style={{ color: "oklch(0.30 0.06 55)" }}>{emotion.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{emotion.trigger}</p>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Footer hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-sm text-muted-foreground mt-12"
        >
          通过不断学习和对话，你的小熊将不断进化和成长
        </motion.p>
      </div>
    </div>
  );
}
