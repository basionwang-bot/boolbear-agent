import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PRESET_EMOJIS = [
  "🐻", "🐼", "🐻‍❄️", "🧸", "🦊", "🐰", "🐱", "🐶",
  "🦁", "🐯", "🐨", "🐸", "🐧", "🦄", "🐝", "🦋",
  "🌟", "⭐", "🌈", "🔥", "💎", "🎯", "🎮", "📚",
  "🎨", "🎵", "🏆", "👑", "💪", "🚀", "💡", "🌸",
  "🍀", "🌻", "🌙", "☀️", "❤️", "💜", "💙", "💚",
];

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

export default function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [customEmoji, setCustomEmoji] = useState("");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-16 h-16 text-3xl rounded-2xl border-2 border-dashed hover:border-solid transition-all"
          style={{ borderColor: "oklch(0.52 0.09 55 / 0.3)" }}
        >
          {value || "🐻"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <p className="text-xs font-semibold text-muted-foreground mb-2">选择头像表情</p>
        <div className="grid grid-cols-8 gap-1 mb-3">
          {PRESET_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => { onChange(emoji); setOpen(false); }}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg hover:bg-accent transition ${
                value === emoji ? "bg-accent ring-2 ring-primary" : ""
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="输入自定义 emoji"
            value={customEmoji}
            onChange={(e) => setCustomEmoji(e.target.value)}
            className="text-center text-lg h-8"
            maxLength={4}
          />
          <Button
            size="sm"
            className="h-8 px-3 text-xs"
            style={{ background: "oklch(0.52 0.09 55)" }}
            disabled={!customEmoji.trim()}
            onClick={() => {
              if (customEmoji.trim()) {
                onChange(customEmoji.trim());
                setCustomEmoji("");
                setOpen(false);
              }
            }}
          >
            确定
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
