/**
 * AI 服务配置面板 — 管理员用于配置各类 AI 服务的 API Key
 * 分类：LLM 大模型、TTS 语音合成、图片生成、视频生成、语音识别、网络搜索
 */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Volume2, Image, Video, Mic, Search,
  Plus, Trash2, Check, X, Loader2, Zap, Star,
  Eye, EyeOff, Settings2, TestTube, ChevronDown,
  AlertCircle, CheckCircle2
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Category = "llm" | "tts" | "asr" | "image" | "video" | "web_search";

interface CategoryInfo {
  key: Category;
  label: string;
  icon: typeof Brain;
  color: string;
  bgColor: string;
  description: string;
}

const CATEGORIES: CategoryInfo[] = [
  { key: "llm", label: "大语言模型", icon: Brain, color: "oklch(0.55 0.15 250)", bgColor: "oklch(0.55 0.15 250 / 0.1)", description: "用于对话、课程生成、多智能体编排" },
  { key: "tts", label: "语音合成", icon: Volume2, color: "oklch(0.55 0.18 155)", bgColor: "oklch(0.55 0.18 155 / 0.1)", description: "文字转语音，用于课堂朗读" },
  { key: "image", label: "图片生成", icon: Image, color: "oklch(0.60 0.18 30)", bgColor: "oklch(0.60 0.18 30 / 0.1)", description: "AI 生成课件插图和教学图片" },
  { key: "video", label: "视频生成", icon: Video, color: "oklch(0.55 0.18 300)", bgColor: "oklch(0.55 0.18 300 / 0.1)", description: "AI 生成教学视频片段" },
  { key: "asr", label: "语音识别", icon: Mic, color: "oklch(0.55 0.15 60)", bgColor: "oklch(0.55 0.15 60 / 0.1)", description: "语音转文字，用于语音输入" },
  { key: "web_search", label: "网络搜索", icon: Search, color: "oklch(0.50 0.15 200)", bgColor: "oklch(0.50 0.15 200 / 0.1)", description: "联网搜索最新资料辅助教学" },
];

interface FormState {
  providerId: string;
  displayName: string;
  apiKey: string;
  baseUrl: string;
  models: string;
  isDefault: boolean;
}

const EMPTY_FORM: FormState = {
  providerId: "",
  displayName: "",
  apiKey: "",
  baseUrl: "",
  models: "",
  isDefault: false,
};

export default function AiConfigPanel() {
  const [activeCategory, setActiveCategory] = useState<Category>("llm");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingId, setTestingId] = useState<number | null>(null);

  // Queries
  const configsQuery = trpc.aiConfig.list.useQuery();
  const presetsQuery = trpc.aiConfig.presets.useQuery();
  const utils = trpc.useUtils();

  // Mutations
  const createMutation = trpc.aiConfig.create.useMutation({
    onSuccess: () => {
      utils.aiConfig.list.invalidate();
      toast.success("配置已保存");
      resetForm();
    },
    onError: (err) => toast.error(`保存失败: ${err.message}`),
  });

  const updateMutation = trpc.aiConfig.update.useMutation({
    onSuccess: () => {
      utils.aiConfig.list.invalidate();
      toast.success("配置已更新");
      resetForm();
    },
    onError: (err) => toast.error(`更新失败: ${err.message}`),
  });

  const deleteMutation = trpc.aiConfig.delete.useMutation({
    onSuccess: () => {
      utils.aiConfig.list.invalidate();
      toast.success("配置已删除");
    },
    onError: (err) => toast.error(`删除失败: ${err.message}`),
  });

  const testMutation = trpc.aiConfig.testConnection.useMutation({
    onSuccess: (data) => {
      utils.aiConfig.list.invalidate();
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
      setTestingId(null);
    },
    onError: (err) => {
      toast.error(`测试失败: ${err.message}`);
      setTestingId(null);
    },
  });

  // Filter configs by active category
  const filteredConfigs = useMemo(() => {
    if (!configsQuery.data) return [];
    return configsQuery.data.filter(c => c.category === activeCategory);
  }, [configsQuery.data, activeCategory]);

  // Filter presets by active category
  const categoryPresets = useMemo(() => {
    if (!presetsQuery.data) return [];
    const categoryMap: Record<Category, string[]> = {
      llm: ["openai", "anthropic", "deepseek", "kimi", "doubao", "qwen", "zhipu"],
      tts: ["openai_tts", "minimax_tts"],
      image: ["openai_image", "zhipu_image"],
      video: ["zhipu_video"],
      asr: [],
      web_search: [],
    };
    const ids = categoryMap[activeCategory] || [];
    return presetsQuery.data.filter(p => ids.includes(p.providerId));
  }, [presetsQuery.data, activeCategory]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowApiKey(false);
  };

  const handlePresetSelect = (providerId: string) => {
    const preset = presetsQuery.data?.find(p => p.providerId === providerId);
    if (preset) {
      setForm({
        ...form,
        providerId: preset.providerId,
        displayName: preset.displayName,
        baseUrl: preset.baseUrl || "",
        models: preset.models?.join(", ") || "",
      });
    }
  };

  const handleSubmit = () => {
    if (!form.providerId || !form.displayName || !form.apiKey) {
      toast.error("请填写必填字段");
      return;
    }

    const models = form.models
      .split(",")
      .map(m => m.trim())
      .filter(Boolean);

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        displayName: form.displayName,
        apiKey: form.apiKey,
        baseUrl: form.baseUrl || null,
        models: models.length > 0 ? models : undefined,
        isDefault: form.isDefault,
      });
    } else {
      createMutation.mutate({
        category: activeCategory,
        providerId: form.providerId,
        displayName: form.displayName,
        apiKey: form.apiKey,
        baseUrl: form.baseUrl || undefined,
        models: models.length > 0 ? models : undefined,
        isDefault: form.isDefault,
      });
    }
  };

  const handleEdit = (config: any) => {
    setEditingId(config.id);
    setForm({
      providerId: config.providerId,
      displayName: config.displayName,
      apiKey: "",
      baseUrl: config.baseUrl || "",
      models: Array.isArray(config.models) ? config.models.join(", ") : "",
      isDefault: config.isDefault,
    });
    setShowForm(true);
  };

  const handleTest = (id: number) => {
    setTestingId(id);
    testMutation.mutate({ id });
  };

  const activeCategoryInfo = CATEGORIES.find(c => c.key === activeCategory)!;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="aiconfig">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.key;
          const count = configsQuery.data?.filter(c => c.category === cat.key).length || 0;
          return (
            <button
              key={cat.key}
              onClick={() => { setActiveCategory(cat.key); resetForm(); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? "text-white shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              style={isActive ? { background: cat.color } : {}}
            >
              <Icon className="w-4 h-4" />
              {cat.label}
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-white/20" : "bg-muted-foreground/10"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Category Description */}
      <div className="flex items-center gap-3 p-4 rounded-xl mb-6" style={{ background: activeCategoryInfo.bgColor }}>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/60">
          {(() => { const Icon = activeCategoryInfo.icon; return <Icon className="w-5 h-5" style={{ color: activeCategoryInfo.color }} />; })()}
        </div>
        <div>
          <h3 className="font-bold" style={{ color: activeCategoryInfo.color }}>{activeCategoryInfo.label}</h3>
          <p className="text-sm text-muted-foreground">{activeCategoryInfo.description}</p>
        </div>
        <div className="ml-auto">
          <Button
            onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); }}
            size="sm"
            className="text-white"
            style={{ background: activeCategoryInfo.color }}
          >
            <Plus className="w-4 h-4 mr-1" /> 添加配置
          </Button>
        </div>
      </div>

      {/* Config List */}
      <div className="space-y-3 mb-6">
        {configsQuery.isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> 加载中...
          </div>
        ) : filteredConfigs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Settings2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">暂无 {activeCategoryInfo.label} 配置</p>
            <p className="text-sm mt-1">点击"添加配置"开始设置</p>
          </div>
        ) : (
          filteredConfigs.map(config => (
            <motion.div
              key={config.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bear-card p-4"
            >
              <div className="flex items-center gap-3">
                {/* Status indicator */}
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  config.isActive ? "bg-green-500" : "bg-gray-300"
                }`} />

                {/* Provider info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{config.displayName}</span>
                    {config.isDefault && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium flex items-center gap-1">
                        <Star className="w-3 h-3" /> 默认
                      </span>
                    )}
                    {config.lastTestResult === true && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                    {config.lastTestResult === false && (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span>ID: {config.providerId}</span>
                    <span>Key: {config.apiKeyMasked}</span>
                    {config.baseUrl && <span className="truncate max-w-[200px]">URL: {config.baseUrl}</span>}
                  </div>
                  {Array.isArray(config.models) && config.models.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(config.models as string[]).map(m => (
                        <span key={m} className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest(config.id)}
                    disabled={testingId === config.id}
                    className="text-xs"
                  >
                    {testingId === config.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <TestTube className="w-3.5 h-3.5" />
                    )}
                    <span className="ml-1">测试</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(config)}
                    className="text-xs"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span className="ml-1">编辑</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm(`确定删除 ${config.displayName} 的配置吗？`)) {
                        deleteMutation.mutate({ id: config.id });
                      }
                    }}
                    className="text-xs text-red-500 hover:text-red-600 hover:border-red-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bear-card p-6 mb-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: activeCategoryInfo.color }}>
                {(() => { const Icon = activeCategoryInfo.icon; return <Icon className="w-5 h-5" />; })()}
                {editingId ? "编辑配置" : "添加新配置"}
              </h3>

              {/* Preset Quick Select (only for new configs) */}
              {!editingId && categoryPresets.length > 0 && (
                <div className="mb-4">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">快速选择提供商</label>
                  <div className="flex flex-wrap gap-2">
                    {categoryPresets.map(preset => (
                      <button
                        key={preset.providerId}
                        onClick={() => handlePresetSelect(preset.providerId)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                          form.providerId === preset.providerId
                            ? "border-current text-white"
                            : "border-border text-muted-foreground hover:border-current"
                        }`}
                        style={form.providerId === preset.providerId ? { background: activeCategoryInfo.color, borderColor: activeCategoryInfo.color } : {}}
                      >
                        {preset.displayName}
                      </button>
                    ))}
                    <button
                      onClick={() => setForm({ ...EMPTY_FORM })}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                        !categoryPresets.some(p => p.providerId === form.providerId)
                          ? "border-current text-white"
                          : "border-border text-muted-foreground hover:border-current"
                      }`}
                      style={!categoryPresets.some(p => p.providerId === form.providerId) ? { background: activeCategoryInfo.color, borderColor: activeCategoryInfo.color } : {}}
                    >
                      自定义
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Provider ID */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    提供商 ID <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={form.providerId}
                    onChange={e => setForm({ ...form, providerId: e.target.value })}
                    placeholder="例如: openai, deepseek"
                    disabled={!!editingId}
                  />
                </div>

                {/* Display Name */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    显示名称 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={form.displayName}
                    onChange={e => setForm({ ...form, displayName: e.target.value })}
                    placeholder="例如: OpenAI, DeepSeek"
                  />
                </div>

                {/* API Key */}
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    API Key <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showApiKey ? "text" : "password"}
                      value={form.apiKey}
                      onChange={e => setForm({ ...form, apiKey: e.target.value })}
                      placeholder={editingId ? "留空则不修改" : "sk-..."}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Base URL */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    Base URL <span className="text-xs text-muted-foreground">(可选)</span>
                  </label>
                  <Input
                    value={form.baseUrl}
                    onChange={e => setForm({ ...form, baseUrl: e.target.value })}
                    placeholder="https://api.openai.com/v1"
                  />
                </div>

                {/* Models */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    可用模型 <span className="text-xs text-muted-foreground">(逗号分隔)</span>
                  </label>
                  <Input
                    value={form.models}
                    onChange={e => setForm({ ...form, models: e.target.value })}
                    placeholder="gpt-4o, gpt-4o-mini"
                  />
                </div>
              </div>

              {/* Default Toggle */}
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => setForm({ ...form, isDefault: !form.isDefault })}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    form.isDefault ? "border-amber-500 bg-amber-500" : "border-border"
                  }`}
                >
                  {form.isDefault && <Check className="w-3 h-3 text-white" />}
                </button>
                <span className="text-sm text-muted-foreground">
                  设为 {activeCategoryInfo.label} 的默认提供商
                </span>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleSubmit}
                  disabled={isSaving || (!form.apiKey && !editingId)}
                  className="text-white"
                  style={{ background: activeCategoryInfo.color }}
                >
                  {isSaving ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-1" /> 保存中...</>
                  ) : (
                    <><Check className="w-4 h-4 mr-1" /> {editingId ? "更新" : "保存"}</>
                  )}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  <X className="w-4 h-4 mr-1" /> 取消
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tips */}
      <div className="p-4 rounded-xl bg-muted/50 text-sm text-muted-foreground">
        <p className="font-medium mb-2 flex items-center gap-1">
          <Zap className="w-4 h-4" /> 使用说明
        </p>
        <ul className="space-y-1 ml-5 list-disc">
          <li>API Key 使用 AES-256-GCM 加密存储，安全可靠</li>
          <li>每个分类可以配置多个提供商，标记一个为"默认"</li>
          <li>添加后可以点击"测试"按钮验证 API Key 是否有效</li>
          <li>如果不配置外部 API Key，系统将使用内置的 AI 服务</li>
          <li>大语言模型配置用于课堂生成和多智能体对话</li>
        </ul>
      </div>
    </motion.div>
  );
}
