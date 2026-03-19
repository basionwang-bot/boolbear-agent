// 裸熊 Agent 资源库 — 所有熊形象的 CDN URL 集中管理

export const BEAR_IMAGES = {
  // 三只主角
  grizzly: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/bear-grizzly-hero-BjQxaqRuPkBqnqFvNhFSP4.webp",
  panda: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/bear-panda-hero-W5VLJVMg4StKsLTZ6uxLxP.webp",
  iceBear: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/bear-icebear-hero-mHAtBR8xH3RiLVn7zUtDi3.webp",

  // 背景
  heroBg: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/bear-hero-bg-7MGvaTEKohUHy6z2HpgbTn.webp",
  chatBg: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/bear-chat-bg-PaWWihfmLXa74WMW6vnmB2.webp",

  // 段位熊
  bronzeTier: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/bear-bronze-tier-cmsQgd9SgjhpxgCPzk6RmQ.webp",
  goldTier: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/bear-gold-tier-cThgqbujuFuXe42gSgVyRY.webp",
  kingTier: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/bear-king-tier-QwZBcJAct7CxY9psY7BBSU.webp",

  // 情绪
  happy: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/bear-happy-emotion-NXRNjrYs9EjzFRErC5gwq8.webp",
  thinking: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/bear-thinking-emotion-g2KwCkZaFN9R2bpVmWLihj.webp",
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
  { name: "小熊崽", rank: "青铜", color: "#CD7F32", bgColor: "#FFF0DB", image: BEAR_IMAGES.bronzeTier, minExp: 0, description: "刚刚开始学习之旅的小可爱" },
  { name: "幼熊", rank: "白银", color: "#C0C0C0", bgColor: "#F5F5F5", image: BEAR_IMAGES.bronzeTier, minExp: 100, description: "已经掌握了基础知识" },
  { name: "成年熊", rank: "黄金", color: "#FFD700", bgColor: "#FFFBE6", image: BEAR_IMAGES.goldTier, minExp: 300, description: "知识储备越来越丰富" },
  { name: "聪明熊", rank: "铂金", color: "#4ECDC4", bgColor: "#E8FFF9", image: BEAR_IMAGES.goldTier, minExp: 600, description: "开始独立思考和解决问题" },
  { name: "学霸熊", rank: "钻石", color: "#5B9BD5", bgColor: "#EBF5FF", image: BEAR_IMAGES.kingTier, minExp: 1000, description: "学识渊博，乐于助人" },
  { name: "大师熊", rank: "星耀", color: "#9B59B6", bgColor: "#F5EEFF", image: BEAR_IMAGES.kingTier, minExp: 1500, description: "融会贯通，举一反三" },
  { name: "传奇熊", rank: "王者", color: "#E74C3C", bgColor: "#FFF0EE", image: BEAR_IMAGES.kingTier, minExp: 2000, description: "登峰造极，无所不知" },
];

export interface BearSkin {
  name: string;
  type: string;
  image: string;
  description: string;
  personality: string;
}

export const BEAR_SKINS: BearSkin[] = [
  { name: "大大", type: "grizzly", image: BEAR_IMAGES.grizzly, description: "热情活泼的棕熊，擅长社交和领导", personality: "热情型" },
  { name: "胖达", type: "panda", image: BEAR_IMAGES.panda, description: "害羞可爱的熊猫，热爱科技和网络", personality: "科技宅型" },
  { name: "白熊", type: "iceBear", image: BEAR_IMAGES.iceBear, description: "冷酷寡言的北极熊，实力超群", personality: "实力型" },
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
];
