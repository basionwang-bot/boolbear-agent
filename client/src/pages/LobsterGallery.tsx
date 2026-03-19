import { motion } from 'framer-motion';
import { LOBSTER_TIERS, LOBSTER_SKINS, LOBSTER_EMOTIONS } from '@/lib/lobsterAssets';
import GlowCard from '@/components/GlowCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * 龙虾展示库页面
 * 展示所有可用的龙虾段位、皮肤和情绪状态
 * 设计理念：深海生物发光主题 - 每个龙虾都闪闪发光
 */

export default function LobsterGallery() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      {/* 页面标题 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-4">
          🦞 龙虾展示库
        </h1>
        <p className="text-lg text-slate-300">
          探索所有可用的龙虾段位、皮肤和情绪状态
        </p>
      </motion.div>

      <Tabs defaultValue="tiers" className="w-full max-w-6xl mx-auto">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800 border border-cyan-500/30 rounded-lg p-1 mb-8">
          <TabsTrigger value="tiers" className="data-[state=active]:bg-cyan-500/20">
            段位
          </TabsTrigger>
          <TabsTrigger value="skins" className="data-[state=active]:bg-cyan-500/20">
            皮肤
          </TabsTrigger>
          <TabsTrigger value="emotions" className="data-[state=active]:bg-cyan-500/20">
            情绪
          </TabsTrigger>
        </TabsList>

        {/* 段位展示 */}
        <TabsContent value="tiers">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {Object.entries(LOBSTER_TIERS).map(([key, tier]) => (
              <motion.div key={key} variants={itemVariants}>
                <GlowCard
                  glowColor="cyan"
                  className="h-full flex flex-col items-center justify-center p-6 hover:scale-105 transition-transform"
                >
                  <img
                    src={tier.image}
                    alt={tier.name}
                    className="w-32 h-32 object-contain mb-4"
                  />
                  <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                  <p className="text-sm text-slate-300 text-center mb-3">
                    {tier.description}
                  </p>
                  <div className="text-xs text-cyan-400">
                    经验值: {tier.minExp} - {tier.maxExp === Infinity ? '∞' : tier.maxExp}
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>

        {/* 皮肤展示 */}
        <TabsContent value="skins">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {Object.entries(LOBSTER_SKINS).map(([key, skin]) => (
              <motion.div key={key} variants={itemVariants}>
                <GlowCard
                  glowColor="gold"
                  className="h-full flex flex-col items-center justify-center p-6 hover:scale-105 transition-transform"
                >
                  <img
                    src={skin.image}
                    alt={skin.name}
                    className="w-32 h-32 object-contain mb-4"
                  />
                  <h3 className="text-xl font-bold text-white mb-2">{skin.name}</h3>
                  <p className="text-sm text-slate-300 text-center mb-3">
                    {skin.description}
                  </p>
                  <div className="text-xs px-3 py-1 rounded-full bg-purple-500/30 text-purple-300">
                    {skin.rarity === 'rare' ? '稀有' : '史诗'}
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>

        {/* 情绪展示 */}
        <TabsContent value="emotions">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {Object.entries(LOBSTER_EMOTIONS).map(([key, emotion]) => (
              <motion.div key={key} variants={itemVariants}>
                <GlowCard
                  glowColor="mint"
                  className="h-full flex flex-col items-center justify-center p-6 hover:scale-105 transition-transform"
                >
                  <img
                    src={emotion.image}
                    alt={emotion.name}
                    className="w-32 h-32 object-contain mb-4"
                  />
                  <h3 className="text-xl font-bold text-white mb-2">{emotion.name}</h3>
                  <p className="text-sm text-slate-300 text-center">
                    {emotion.description}
                  </p>
                </GlowCard>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* 底部提示 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-center mt-16 text-slate-400"
      >
        <p>✨ 通过不断学习和对话，您的龙虾将不断进化和成长 ✨</p>
      </motion.div>
    </div>
  );
}
