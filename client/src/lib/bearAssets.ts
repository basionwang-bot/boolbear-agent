/*
 * 熊 Agent 资源库 — 所有图片、段位、情绪、皮肤配置
 * 设计风格：圆润Q版探险家熊，戴探险帽+绿色书包，原创设计避免侵权
 */

export const BEAR_IMAGES = {
  // 三只主角（原创设计）
  grizzly: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/bear-original-grizzly_e1f9952c.png",
  panda: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/bear-original-panda_49fa199d.png",
  polar: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/bear-original-polar_c10041d3.png",
  group: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/bear-original-group_c3b5a5d7.png",

  // 背景（全新场景）
  heroBg: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/hero-forest-v2_2c75b0be.png",
  chatBg: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/chat-bg-v2_d8964945.png",
  dashboardBg: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/dashboard-bg_41e245ee.png",
  squareBg: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/square-bg_2336c5fa.png",
  adoptBg: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/adopt-bg_b5a1e544.png",

  // 7个段位熊（完整进化序列）
  bronzeTier: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/tier-bronze-bear_b4ee87e6.png",
  silverTier: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/tier-silver-bear_8d421daa.png",
  goldTier: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/tier-gold-bear_10149f28.png",
  platinumTier: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/tier-platinum-bear_f94e4747.png",
  diamondTier: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/tier-diamond-bear_25eb9f23.png",
  starlightTier: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/tier-starlight-bear_b5c70c45.png",
  kingTier: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/tier-king-bear_94a2b121.png",

  // 情绪状态（5种）
  happy: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/emotion-happy-bear_71ffc50f.png",
  thinking: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/emotion-thinking-bear_912fe46c.png",
  tired: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/emotion-tired-bear_abeb8d80.png",
  levelUp: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/emotion-levelup-bear_cba43b18.png",
  studying: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/emotion-studying-bear_58ab8f78.png",
};

export interface BearTier {
  name: string;
  rank: string;
  color: string;
  bgColor: string;
  image: string;
  minExp: number;
  description: string;
}

export const BEAR_TIERS: BearTier[] = [
  { name: "小熊崽", rank: "青铜", color: "#CD7F32", bgColor: "#FFF0DB", image: BEAR_IMAGES.bronzeTier, minExp: 0, description: "刚刚开始学习之旅的小可爱，戴着奶嘴的萌新" },
  { name: "学徒熊", rank: "白银", color: "#8B9DAF", bgColor: "#F0F4F8", image: BEAR_IMAGES.silverTier, minExp: 100, description: "穿上蓝色小马甲，拿起笔记本认真学习" },
  { name: "学者熊", rank: "黄金", color: "#D4A017", bgColor: "#FFFBE6", image: BEAR_IMAGES.goldTier, minExp: 300, description: "戴上学士帽，披上金色披风，知识发光" },
  { name: "研究熊", rank: "铂金", color: "#4ECDC4", bgColor: "#E8FFF9", image: BEAR_IMAGES.platinumTier, minExp: 600, description: "穿上实验服，戴上眼镜，像科学家一样探索" },
  { name: "魔法熊", rank: "钻石", color: "#5B9BD5", bgColor: "#EBF5FF", image: BEAR_IMAGES.diamondTier, minExp: 1000, description: "披上钻石法袍，手持魔杖，知识就是魔法" },
  { name: "星辰熊", rank: "星耀", color: "#9B59B6", bgColor: "#F5EEFF", image: BEAR_IMAGES.starlightTier, minExp: 1500, description: "身披星辰紫袍，手持星图，融会贯通" },
  { name: "王者熊", rank: "王者", color: "#E74C3C", bgColor: "#FFF0EE", image: BEAR_IMAGES.kingTier, minExp: 2000, description: "身穿龙袍，头戴皇冠，知识的最终王者" },
];

export interface BearSkin {
  name: string;
  type: string;
  image: string;
  description: string;
  personality: string;
}

export const BEAR_SKINS: BearSkin[] = [
  { name: "可可", type: "grizzly", image: BEAR_IMAGES.grizzly, description: "热情活泼的棕熊探险家，背着绿色书包去冒险", personality: "热情型" },
  { name: "圆圆", type: "panda", image: BEAR_IMAGES.panda, description: "爱看书的熊猫学霸，戴着红色围巾超可爱", personality: "学霸型" },
  { name: "冰冰", type: "polar", image: BEAR_IMAGES.polar, description: "酷酷的北极熊，戴着蓝色飞行员眼镜", personality: "冷酷型" },
];

export interface BearEmotion {
  name: string;
  emoji: string;
  image: string;
  trigger: string;
}

export const BEAR_EMOTIONS: BearEmotion[] = [
  { name: "开心", emoji: "😊", image: BEAR_IMAGES.happy, trigger: "完成学习任务或答对题目" },
  { name: "思考", emoji: "🤔", image: BEAR_IMAGES.thinking, trigger: "遇到难题或正在分析问题" },
  { name: "疲劳", emoji: "😴", image: BEAR_IMAGES.tired, trigger: "学习时间过长需要休息" },
  { name: "升级", emoji: "🎉", image: BEAR_IMAGES.levelUp, trigger: "经验值达到升级门槛" },
  { name: "专注", emoji: "📖", image: BEAR_IMAGES.studying, trigger: "正在认真阅读和学习中" },
];
