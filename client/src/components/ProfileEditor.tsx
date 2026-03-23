import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import EmojiPicker from "./EmojiPicker";
import { toast } from "sonner";

interface ProfileEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProfileEditor({ open, onOpenChange }: ProfileEditorProps) {
  const { user } = useAuth();
  const profileQuery = trpc.social.getMyProfile.useQuery(undefined, { enabled: open });
  const utils = trpc.useUtils();

  const [emoji, setEmoji] = useState("🐻");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (profileQuery.data) {
      setEmoji(profileQuery.data.emoji || "🐻");
      setBio(profileQuery.data.bio || "");
    }
  }, [profileQuery.data]);

  const updateMutation = trpc.social.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("资料更新成功");
      utils.social.getMyProfile.invalidate();
      utils.social.getUserCard.invalidate();
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-black text-lg" style={{ color: "oklch(0.30 0.06 55)" }}>
            编辑个人资料
          </DialogTitle>
        </DialogHeader>

        {profileQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "oklch(0.52 0.09 55)" }} />
          </div>
        ) : (
          <div className="space-y-6 py-2">
            {/* Emoji Avatar */}
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm font-semibold text-muted-foreground">头像表情</p>
              <EmojiPicker value={emoji} onChange={setEmoji} />
              <p className="text-[10px] text-muted-foreground">点击选择或输入自定义 emoji</p>
            </div>

            {/* User Name (read-only) */}
            <div>
              <label className="text-sm font-semibold text-muted-foreground mb-1.5 block">用户名</label>
              <Input
                value={user?.name || user?.username || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-[10px] text-muted-foreground mt-1">用户名暂不支持修改</p>
            </div>

            {/* Bio */}
            <div>
              <label className="text-sm font-semibold text-muted-foreground mb-1.5 block">
                个人简介 <span className="text-[10px] font-normal">({bio.length}/200)</span>
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 200))}
                placeholder="介绍一下自己吧..."
                className="w-full h-24 px-3 py-2 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2"
                style={{ borderColor: "oklch(0.52 0.09 55 / 0.2)", focusRingColor: "oklch(0.52 0.09 55 / 0.3)" } as React.CSSProperties}
              />
            </div>

            {/* Save Button */}
            <Button
              className="w-full font-bold rounded-xl"
              style={{ background: "oklch(0.52 0.09 55)" }}
              disabled={updateMutation.isPending}
              onClick={() => updateMutation.mutate({ emoji, bio })}
            >
              {updateMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 保存中...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> 保存资料</>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
