"use client";

import { useEffect, useState } from "react";
import { Check, KeyRound, Save, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";

interface VideoConfigResponse {
  douyinApiKeyConfigured: boolean;
  douyinApiKeyMasked: string;
}

const EMPTY_CONFIG: VideoConfigResponse = {
  douyinApiKeyConfigured: false,
  douyinApiKeyMasked: "",
};

export default function DouyinApiConfigSection() {
  const [config, setConfig] = useState(EMPTY_CONFIG);
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const loadConfig = async () => {
    try {
      const res = await apiFetch("/settings/video-config");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "加载配置失败");
      setConfig({ ...EMPTY_CONFIG, ...data });
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载配置失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadConfig();
  }, []);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError("请输入新的 API Key；如需移除现有 Key，请点击“清除 Key”");
      return;
    }
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await apiFetch("/settings/video-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ douyinApiKey: apiKey.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "保存失败");
      setConfig({ ...EMPTY_CONFIG, ...data });
      setApiKey("");
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!config.douyinApiKeyConfigured || saving) return;
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await apiFetch("/settings/video-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearDouyinApiKey: true }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "清除失败");
      setConfig({ ...EMPTY_CONFIG, ...data });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "清除失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-adm-border bg-adm-card p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2 border-b border-adm-border pb-3">
        <KeyRound className="h-4 w-4 text-adm-text-tertiary" />
        <h3 className="text-sm font-semibold text-adm-text">抖音解析配置</h3>
      </div>

      <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs leading-5 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
        默认解析接口无需 Key。这里的 Key 仅用于抖音备用解析接口，保存在后端数据库中，不会返回给前端。
      </div>

      {loading ? (
        <div className="h-10 animate-pulse rounded-lg bg-adm-input" />
      ) : (
        <>
          <label className="mb-1.5 block text-xs font-medium text-adm-text-secondary">
            抖音备用接口 API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full rounded-xl border border-adm-border bg-adm-input px-3 py-2.5 text-sm text-adm-text transition-colors focus:border-adm-text-secondary focus:bg-adm-input-focus focus:outline-none"
            placeholder={
              config.douyinApiKeyConfigured
                ? `已配置：${config.douyinApiKeyMasked}，输入新 Key 可替换`
                : "粘贴备用接口 Key"
            }
            autoComplete="new-password"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-adm-primary px-3 py-1.5 text-xs font-medium text-adm-primary-text transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
              {saved ? "已保存" : saving ? "保存中..." : "保存 Key"}
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={!config.douyinApiKeyConfigured || saving}
              className="flex items-center gap-1.5 rounded-lg border border-adm-border bg-adm-card px-3 py-1.5 text-xs text-adm-text-secondary transition-colors hover:bg-adm-card-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              清除 Key
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-adm-danger">{error}</p>}
        </>
      )}
    </div>
  );
}
