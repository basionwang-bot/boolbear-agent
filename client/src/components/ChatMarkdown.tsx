/**
 * ChatMarkdown — 对话气泡中的 Markdown 渲染组件
 * 
 * 功能：
 * - KaTeX 数学公式渲染（行内 $...$ 和块级 $$...$$）
 * - 代码块语法高亮
 * - 表格、列表等 GFM 支持
 * - 针对聊天气泡的紧凑排版
 */
import { useMemo } from "react";
import { Streamdown, defaultRehypePlugins, defaultRemarkPlugins } from "streamdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";

// Override remark plugins to enable single dollar sign math ($...$)
const chatRemarkPlugins = [
  [remarkGfm, {}],
  [remarkMath, { singleDollarTextMath: true }],
] as any;

// Keep the default rehype plugins (includes rehype-katex)
const chatRehypePlugins = Object.values(defaultRehypePlugins) as any;

interface ChatMarkdownProps {
  children: string;
  className?: string;
  isStreaming?: boolean;
}

export default function ChatMarkdown({ children, className, isStreaming }: ChatMarkdownProps) {
  const stableRemarkPlugins = useMemo(() => chatRemarkPlugins, []);
  const stableRehypePlugins = useMemo(() => chatRehypePlugins, []);

  return (
    <div className={`chat-markdown ${className || ""}`}>
      <Streamdown
        remarkPlugins={stableRemarkPlugins}
        rehypePlugins={stableRehypePlugins}
        isAnimating={isStreaming}
      >
        {children}
      </Streamdown>
    </div>
  );
}
