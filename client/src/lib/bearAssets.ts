// 熊 Agent 原创资源库 — 所有熊形象的 CDN URL 集中管理
// 设计风格：圆润Q版探险家熊，戴探险帽+绿色书包，原创设计避免侵权

export const BEAR_IMAGES = {
  // 三只主角（原创设计）
  grizzly: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/bear-original-grizzly-9Yt6bVkLdqjVSXgfwxqXWj.webp",
  panda: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/bear-original-panda-LuLGjnBVkCxoMNPkWzAjjP.webp",
  polar: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/bear-original-polar-6Dj2tPVLMWXSxCHKLLWqvn.webp",
  group: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/bear-original-group-DjwJqmMvqaYQDZkfpFfJEJ.webp",

  // 背景（全新场景）
  heroBg: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/hero-forest-v2-D45SverPmc8LDNpMAHpfed.webp",
  chatBg: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/chat-bg-v2-TwCrkX2hCF2soeMi8wAbe9.webp",
  dashboardBg: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/dashboard-bg-4VPHFNvJDwz5YbLgkiurbk.webp",
  squareBg: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/square-bg-igSbG5rJFpERFbfngnLszf.webp",
  adoptBg: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/adopt-bg-nyrGAht64cGbQQNTN4Rbgh.webp",

  // 7个段位熊（完整进化序列）
  bronzeTier: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/tier-bronze-bear-iWGjfgUbncJ7HvgsBY4mo5.webp",
  silverTier: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/tier-silver-bear-Cifhayd9QNvAfqktguGfB8.webp",
  goldTier: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/tier-gold-bear-5MvNemTSRQGKtrsKUDBj5Q.webp",
  platinumTier: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/tier-platinum-bear-CG5QW98w7JpEYzuowsPB5C.webp",
  diamondTier: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/tier-diamond-bear-AnbPftDDmSDVoAWcvL2JWi.webp",
  starlightTier: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/tier-starlight-bear-6SFu87UNXbYX36gudA3wKb.webp",
  kingTier: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/tier-king-bear-REDiAtAdLZnAwg45EGiCyJ.webp",

  // 情绪状态（5种）
  happy: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/emotion-happy-bear-RXUNmrZ5Sr5NdcM6SxSoAf.webp",
  thinking: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/emotion-thinking-bear-RsDCCgkLmY3nJ5SbT6AUEX.webp",
  tired: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/emotion-tired-bear-XoSH8n59AXanujWGskm9JD.webp",
  levelUp: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/emotion-levelup-bear-VupDrY2ykN9htKgdUw7mEd.webp",
  studying: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/emotion-studying-bear-g2FvfM8gFf6XCwzhq8hgMX.webp",
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
