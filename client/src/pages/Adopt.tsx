/*
 * 裸熊 Agent — 领养小熊
 * 选择你的小熊伙伴：大大、胖达、白熊
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ChevronRight, Check } from "lucide-react";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import { BEAR_IMAGES, BEAR_SKINS } from "@/lib/bearAssets";
import { toast } from "sonner";

const personalities = [
  { id: "teacher", label: "老师型", desc: "严谨认真，循序渐进" },
  { id: "friend", label: "朋友型", desc: "轻松幽默，平等交流" },
  { id: "coach", label: "教练型", desc: "激励鼓舞，挑战极限" },
];

const subjects = ["数学", "物理", "化学", "英语", "编程", "历史", "生物", "地理"];

export default function Adopt() {
  const [step, setStep] = useState(0);
  const [selectedBear, setSelectedBear] = useState<string | null>(null);
  const [selectedPersonality, setSelectedPersonality] = useState<string | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [bearName, setBearName] = useState("");
  const [, navigate] = useLocation();

  const toggleSubject = (s: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : prev.length < 3 ? [...prev, s] : prev
    );
  };

  const canNext =
    (step === 0 && selectedBear) ||
    (step === 1 && selectedPersonality) ||
    (step === 2 && selectedSubjects.length > 0) ||
    (step === 3 && bearName.trim());

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else {
      toast.success("领养成功！你的小熊已经迫不及待想和你学习了！");
      navigate("/chat");
    }
  };

  const stepLabels = ["选择小熊", "设定性格", "擅长领域", "取个名字"];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8 max-w-3xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="text-3xl font-black" style={{ color: "oklch(0.30 0.06 55)" }}>领养你的学习小熊</h1>
          <p className="text-muted-foreground mt-2">选择一只小熊，它将成为你的专属 AI 学习伙伴</p>
        </motion.div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {stepLabels.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  background: i <= step ? "oklch(0.52 0.09 55)" : "oklch(0.52 0.09 55 / 0.1)",
                  color: i <= step ? "white" : "oklch(0.60 0.02 55)",
                }}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs hidden sm:inline ${i <= step ? "font-bold" : "text-muted-foreground"}`} style={i <= step ? { color: "oklch(0.42 0.09 55)" } : {}}>
                {s}
              </span>
              {i < stepLabels.length - 1 && (
                <div className="w-8 h-0.5 mx-1" style={{ background: i < step ? "oklch(0.52 0.09 55)" : "oklch(0.52 0.09 55 / 0.15)" }} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h2 className="text-xl font-bold text-center mb-6" style={{ color: "oklch(0.30 0.06 55)" }}>选择你的小熊伙伴</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {BEAR_SKINS.map((bear) => (
                  <motion.div
                    key={bear.type}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedBear(bear.type)}
                    className={`bear-card p-6 text-center cursor-pointer transition-all ${
                      selectedBear === bear.type ? "ring-2 shadow-lg" : ""
                    }`}
                    style={selectedBear === bear.type ? { borderColor: "oklch(0.52 0.09 55)", boxShadow: "0 0 20px oklch(0.52 0.09 55 / 0.15)" } : {}}
                  >
                    <motion.img
                      src={bear.image}
                      alt={bear.name}
                      className="w-28 h-28 mx-auto mb-4 object-contain"
                      animate={selectedBear === bear.type ? { y: [0, -8, 0] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <h3 className="font-bold text-lg" style={{ color: "oklch(0.30 0.06 55)" }}>{bear.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{bear.description}</p>
                    <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "oklch(0.52 0.09 55 / 0.08)", color: "oklch(0.42 0.09 55)" }}>
                      {bear.personality}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h2 className="text-xl font-bold text-center mb-6" style={{ color: "oklch(0.30 0.06 55)" }}>设定教学风格</h2>
              <div className="space-y-3 max-w-md mx-auto">
                {personalities.map((p) => (
                  <motion.div
                    key={p.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPersonality(p.id)}
                    className={`bear-card p-5 cursor-pointer flex items-center gap-4 transition-all ${
                      selectedPersonality === p.id ? "ring-2" : ""
                    }`}
                    style={selectedPersonality === p.id ? { borderColor: "oklch(0.52 0.09 55)", boxShadow: "0 0 20px oklch(0.52 0.09 55 / 0.15)" } : {}}
                  >
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: "oklch(0.52 0.09 55)" }}>
                      {selectedPersonality === p.id && <div className="w-2.5 h-2.5 rounded-full" style={{ background: "oklch(0.52 0.09 55)" }} />}
                    </div>
                    <div>
                      <h3 className="font-bold" style={{ color: "oklch(0.30 0.06 55)" }}>{p.label}</h3>
                      <p className="text-sm text-muted-foreground">{p.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h2 className="text-xl font-bold text-center mb-2" style={{ color: "oklch(0.30 0.06 55)" }}>选择擅长领域</h2>
              <p className="text-center text-sm text-muted-foreground mb-6">最多选择 3 个学科</p>
              <div className="flex flex-wrap gap-3 justify-center max-w-lg mx-auto">
                {subjects.map((s) => {
                  const selected = selectedSubjects.includes(s);
                  return (
                    <motion.button
                      key={s}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleSubject(s)}
                      className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${selected ? "text-white shadow-md" : "text-foreground/70"}`}
                      style={{ background: selected ? "oklch(0.52 0.09 55)" : "oklch(0.52 0.09 55 / 0.08)" }}
                    >
                      {s}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h2 className="text-xl font-bold text-center mb-6" style={{ color: "oklch(0.30 0.06 55)" }}>给你的小熊取个名字</h2>
              <div className="max-w-sm mx-auto text-center">
                <motion.img
                  src={selectedBear === "panda" ? BEAR_IMAGES.panda : selectedBear === "iceBear" ? BEAR_IMAGES.iceBear : BEAR_IMAGES.grizzly}
                  alt="你的小熊"
                  className="w-32 h-32 mx-auto mb-6 object-contain"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <input
                  type="text"
                  value={bearName}
                  onChange={(e) => setBearName(e.target.value)}
                  placeholder="输入小熊的名字..."
                  className="w-full px-5 py-3 rounded-2xl text-center text-lg font-bold border-2 focus:outline-none transition-all"
                  style={{
                    borderColor: bearName ? "oklch(0.52 0.09 55)" : "oklch(0.52 0.09 55 / 0.2)",
                    background: "oklch(0.52 0.09 55 / 0.04)",
                  }}
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground mt-2">{bearName.length}/10 个字符</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-10 max-w-md mx-auto">
          {step > 0 ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStep(step - 1)}
              className="px-5 py-2.5 rounded-full text-sm font-bold text-muted-foreground hover:text-foreground transition"
            >
              上一步
            </motion.button>
          ) : (
            <div />
          )}
          <motion.button
            whileHover={{ scale: canNext ? 1.05 : 1 }}
            whileTap={{ scale: canNext ? 0.95 : 1 }}
            onClick={handleNext}
            disabled={!canNext}
            className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white transition-all ${canNext ? "shadow-lg" : "opacity-40"}`}
            style={{ background: "oklch(0.52 0.09 55)" }}
          >
            {step === 3 ? (
              <><Heart className="w-4 h-4" /> 完成领养</>
            ) : (
              <>下一步 <ChevronRight className="w-4 h-4" /></>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
