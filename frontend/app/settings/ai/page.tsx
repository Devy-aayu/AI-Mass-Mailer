"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { deleteAIConfig, getAIConfig, saveAIConfig, AIConfig } from "../../../lib/api";

export default function AISettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const onboarding = searchParams.get("onboarding") === "1";
  const [provider, setProvider] = useState<"openrouter" | "openai_compatible">("openrouter");
  const [model, setModel] = useState("google/gemma-4-26b-a4b-it:free");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { getAIConfig().then(({ config }) => { setConfig(config); if (config) { setProvider(config.provider); setModel(config.model); setBaseUrl(config.base_url || ""); } }).catch(e => setError(e instanceof Error ? e.message : "Could not load AI configuration.")); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setMessage(""); setSaving(true);
    try {
      const result = await saveAIConfig({ provider, model, api_key: apiKey, base_url: baseUrl });
      setConfig(result.config);
      setApiKey("");
      if (onboarding) {
        router.replace("/");
        return;
      }
      setMessage("AI configuration saved. Your API key is stored encrypted and is never returned to the browser.");
    }
    catch (e) { setError(e instanceof Error ? e.message : "Could not save AI configuration."); }
    finally { setSaving(false); }
  }

  async function remove() {
    setError(""); setMessage("");
    try { await deleteAIConfig(); setConfig(null); setApiKey(""); setMessage("AI configuration removed."); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not remove AI configuration."); }
  }

  return <main style={{ maxWidth: 820, margin: "0 auto", padding: "40px 24px 80px" }}>
    <h1 style={{ marginBottom: 8 }}>AI Settings</h1>
    <p style={{ color: "#777", marginBottom: 16 }}>AI is optional. Normal campaign composition and sending work without it. Add your own provider credentials only when you want AI generation.</p>
    {onboarding && <div style={{ marginBottom: 20, padding: 16, borderRadius: 12, border: "1px solid #e5e5e5", background: "#fff" }}>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Step 2 of 2 · Optional AI setup</div>
      <div style={{ fontSize: 13, color: "#777", lineHeight: 1.6, marginBottom: 12 }}>
        Add your own API key and model to unlock AI email generation. You can skip this and still write and send campaigns manually.
      </div>
      <button type="button" className="btn btn-secondary" onClick={() => router.replace("/")}>Skip AI & Go Home</button>
    </div>}
    {config && <div style={{ marginBottom: 18, padding: 14, borderRadius: 10, background: "#f2fbf4", border: "1px solid #cfe8d4", fontSize: 13 }}>Configured: <b>{config.provider}</b> · <b>{config.model}</b></div>}
    {error && <div className="auth-error">{error}</div>}
    {message && <div style={{ marginBottom: 18, padding: 12, borderRadius: 9, background: "#f2fbf4", color: "#226b2d", fontSize: 13 }}>{message}</div>}
    <form className="card" onSubmit={submit}><div className="card-body">
      <div className="field"><label className="field-label">Provider</label><select className="input" value={provider} onChange={e => setProvider(e.target.value as typeof provider)}><option value="openrouter">OpenRouter</option><option value="openai_compatible">OpenAI-compatible endpoint</option></select></div>
      <div className="field"><label className="field-label">Model</label><input className="input" value={model} onChange={e => setModel(e.target.value)} placeholder="google/gemma-..." required /></div>
      {provider === "openai_compatible" && <div className="field"><label className="field-label">Base URL</label><input className="input" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="https://provider.example.com/v1" required /></div>}
      <div className="field"><label className="field-label">API key</label><input className="input" type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder={config ? "Enter a new key to replace the stored key" : "Paste your provider API key"} required /></div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><button className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save AI configuration"}</button>{config && <button type="button" className="btn btn-secondary" onClick={remove}>Remove AI configuration</button>}</div>
    </div></form>
  </main>;
}
