/**
 * 龙虾资源库配置
 * 包含所有龙虾段位、皮肤、情绪状态的 CDN 链接
 */

export const LOBSTER_TIERS = {
  bronze: {
    name: '青铜',
    color: '#CD7F32',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/lobster-bronze-tier-dQybgfPxCHZSfbfoiCw7vN.png',
    description: '初出茅庐的小龙虾，充满好奇心',
    minExp: 0,
    maxExp: 100,
  },
  silver: {
    name: '白银',
    color: '#C0C0C0',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/lobster-silver-tier-dQybgfPxCHZSfbfoiCw7vN.png',
    description: '经过初步训练，逐渐成长',
    minExp: 100,
    maxExp: 250,
  },
  gold: {
    name: '黄金',
    color: '#FFD700',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/lobster-gold-tier-dQybgfPxCHZSfbfoiCw7vN.png',
    description: '知识渊博，实力不俗',
    minExp: 250,
    maxExp: 450,
  },
  platinum: {
    name: '铂金',
    color: '#E5E4E2',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/lobster-platinum-tier-dQybgfPxCHZSfbfoiCw7vN.png',
    description: '精通多个领域，成为学者',
    minExp: 450,
    maxExp: 700,
  },
  diamond: {
    name: '钻石',
    color: '#B9F2FF',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/lobster-diamond-tier-dQybgfPxCHZSfbfoiCw7vN.png',
    description: '闪耀夺目，智慧非凡',
    minExp: 700,
    maxExp: 1000,
  },
  starlight: {
    name: '星耀',
    color: '#9370DB',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/lobster-starlight-tier-izzy3E7QD2tD8ZyxMReCYJ.webp',
    description: '星光璀璨，超越凡俗',
    minExp: 1000,
    maxExp: 1500,
  },
  king: {
    name: '王者',
    color: '#FFD700',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/lobster-king-tier-9VrVBZKaFhQqwcG3nDFeVa.webp',
    description: '至高无上，统治深海',
    minExp: 1500,
    maxExp: Infinity,
  },
} as const;

export const LOBSTER_SKINS = {
  scholar: {
    name: '学霸皮肤',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/lobster-scholar-skin-g5b8xUFD3pGtzPgZoWCs3i.webp',
    description: '戴着眼镜，手握书籍，知识的化身',
    rarity: 'rare',
  },
  athlete: {
    name: '运动皮肤',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/lobster-athlete-skin-L8oumPeMXpaqTJfjtXQXTL.webp',
    description: '肌肉发达，充满活力，运动健将',
    rarity: 'rare',
  },
  wizard: {
    name: '魔法皮肤',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/lobster-wizard-skin-bvDWKEhFtkVWzj3M27HkML.webp',
    description: '穿着法袍，手握法杖，魔法大师',
    rarity: 'epic',
  },
} as const;

export const LOBSTER_EMOTIONS = {
  happy: {
    name: '开心',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/lobster-happy-emotion-MojuhAPEhpKfAHh2xCe5kr.webp',
    description: '龙虾开心地笑着',
  },
  thinking: {
    name: '思考',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/lobster-thinking-emotion-SzApS9PvJCJ8JyeXGbxzGy.webp',
    description: '龙虾正在思考问题',
  },
  tired: {
    name: '疲劳',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/lobster-tired-emotion-iR8344ChF92MtD6eYB5iqd.webp',
    description: '龙虾看起来很疲惫',
  },
  levelup: {
    name: '升级',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663363113146/4byKXnSfmNJ8D24Qt3bNEe/lobster-levelup-emotion-R67hoPfDgNaRbb.webp',
    description: '龙虾升级了！闪闪发光',
  },
} as const;

export type TierKey = keyof typeof LOBSTER_TIERS;
export type SkinKey = keyof typeof LOBSTER_SKINS;
export type EmotionKey = keyof typeof LOBSTER_EMOTIONS;
