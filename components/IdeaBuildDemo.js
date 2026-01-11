"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Wand2, Copy, Check, RefreshCw } from "lucide-react";
import { getSupabase } from '../lib/supabaseClient';
import { useAuth } from './auth/AuthProvider';

const defaultCard = {
  name: "",
  tagline: "",
  features: [],
  tech_stack: { frontend: "", backend: "", database: "", integrations: [] },
  monetization: "",
  roadmap: [],
  ui_inspiration: "",
};

function clampList(arr, max = 7) {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, max).map((x) => String(x ?? "").trim()).filter(Boolean);
}

function normalizeResult(raw) {
  const r = raw?.result ?? raw ?? {};
  return {
    ...defaultCard,
    ...r,
    features: clampList(r.features, 7),
    roadmap: clampList(r.roadmap, 6),
    tech_stack: {
      ...defaultCard.tech_stack,
      ...(r.tech_stack || {}),
      integrations: clampList(r.tech_stack?.integrations, 6),
    },
  };
}

export default function IdeaBuildDemo({
  isDark = false,
  onClose,
  onAnnotationModeChange, // keep signature consistent with your existing usage
  context = {}, // { platform, industry, tone, targetAudience }
}) {
  const { user } = useAuth();
  const [idea, setIdea] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | generating | ready | error
  const [jobId, setJobId] = useState(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [card, setCard] = useState(null);
  const [copied, setCopied] = useState(false);

  const canGenerate = useMemo(() => idea.trim().length >= 8 && !busy, [idea, busy]);

  const fieldText = isDark ? "text-white/90" : "text-black/90";
  const subtleText = isDark ? "text-white/60" : "text-black/50";
  const panelBg = isDark ? "bg-black/20" : "bg-white/10";

  async function pollUntilDone(id) {
    for (let i = 0; i < 40; i++) {
      const r = await fetch(`/api/studios/ideation/status/${id}`);
      const data = await r.json();

      if (data?.message) setMsg(data.message);

      if (data?.status === "completed") {
        const rr = await fetch(`/api/studios/ideation/result/${id}`);
        const resData = await rr.json();
        const normalized = normalizeResult(resData);
        setCard(normalized);
        setStatus("ready");
        setBusy(false);
        return;
      }

      if (data?.status === "failed") {
        setErr(data?.error || "Generation failed. Try again.");
        setStatus("error");
        setBusy(false);
        return;
      }

      await new Promise((res) => setTimeout(res, 900));
    }

    setErr("Timed out. Try again.");
    setStatus("error");
    setBusy(false);
  }

  async function generate() {
    setBusy(true);
    setErr("");
    setMsg("Starting…");
    setStatus("generating");
    setCard(null);

    try {
      // Get auth token if user is authenticated
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (user) {
        const supabase = getSupabase();
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
          }
        }
      }

      const r = await fetch("/api/studios/ideation/start", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ prompt: idea.trim(), ...context }),
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "Failed to start.");

      const id = data.ideaId;
      setJobId(id);
      setMsg("Generating concept…");
      await pollUntilDone(id);
    } catch (e) {
      setErr(e.message || "Something went wrong.");
      setStatus("error");
      setBusy(false);
    }
  }

  function update(path, value) {
    setCard((prev) => {
      const next = structuredClone(prev || defaultCard);
      let ref = next;
      for (let i = 0; i < path.length - 1; i++) {
        const k = path[i];
        ref[k] = ref[k] ?? {};
        ref = ref[k];
      }
      ref[path[path.length - 1]] = value;
      return next;
    });
  }

  async function copyJson() {
    if (!card) return;
    await navigator.clipboard.writeText(JSON.stringify(card, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  function reset() {
    setStatus("idle");
    setBusy(false);
    setMsg("");
    setErr("");
    setJobId(null);
    setCard(null);
    setIdea("");
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-5">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${panelBg} about-devello-glass`}
          style={{ borderRadius: 9999 }}
        >
          <Zap className="w-4 h-4" />
          <span className={`text-xs tracking-widest uppercase ${subtleText}`}>
            Powered by Devello's Creative Intelligence
          </span>
        </motion.div>

        <div className={`mt-3 text-2xl sm:text-3xl font-semibold ${fieldText}`}>
          Type an idea. See what it becomes.
        </div>
      </div>

      {/* Input Panel */}
      <div className={`about-devello-glass ${panelBg} rounded-3xl p-4 sm:p-6`}>
        <div className="flex flex-col gap-3">
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder='e.g. "A scheduling app that texts clients automatically and tracks deposits."'
            className={`w-full min-h-[96px] rounded-2xl px-4 py-3 outline-none border border-white/20 bg-white/10 ${
              isDark ? "text-white placeholder:text-white/40" : "text-black placeholder:text-black/40"
            }`}
          />

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={generate}
                disabled={true}
                className="about-devello-glass rounded-full px-4 py-2 text-sm font-medium inline-flex items-center gap-2 opacity-50 cursor-not-allowed"
                style={{
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderColor: "rgba(255,255,255,0.15)",
                }}
              >
                <Wand2 className="w-4 h-4" />
                Coming Soon
              </button>

              <button
                onClick={onClose}
                className={`about-devello-glass rounded-full px-4 py-2 text-sm ${subtleText} hover:opacity-90`}
                style={{
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderColor: "rgba(255,255,255,0.20)",
                }}
              >
                Close
              </button>
            </div>

            <div className="flex items-center gap-2">
              <AnimatePresence>
                {status !== "idle" && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className={`text-xs ${subtleText} flex items-center gap-2`}
                  >
                    <span className="inline-block w-2 h-2 rounded-full bg-white/60 animate-slow-pulse-glow" />
                    <span>{msg || status}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {!!err && (
            <div className="mt-2 text-sm text-red-200 bg-red-500/10 border border-red-200/20 rounded-2xl px-4 py-3">
              {err}
            </div>
          )}
        </div>
      </div>

      {/* Result Card */}
      <AnimatePresence>
        {card && status === "ready" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-5 grid grid-cols-1 lg:grid-cols-[1.4fr_0.6fr] gap-4"
          >
            {/* Main idea card */}
            <div className={`about-devello-glass ${panelBg} rounded-3xl p-4 sm:p-6`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <input
                    value={card.name}
                    onChange={(e) => update(["name"], e.target.value)}
                    placeholder="Product name"
                    className={`w-full bg-transparent outline-none text-2xl sm:text-3xl font-semibold ${
                      isDark ? "text-white" : "text-black"
                    }`}
                  />
                  <input
                    value={card.tagline}
                    onChange={(e) => update(["tagline"], e.target.value)}
                    placeholder="Tagline"
                    className={`w-full mt-2 bg-transparent outline-none text-sm sm:text-base ${
                      isDark ? "text-white/70" : "text-black/60"
                    }`}
                  />
                </div>

                <button
                  onClick={copyJson}
                  className={`about-devello-glass rounded-full w-10 h-10 flex items-center justify-center ${
                    isDark ? "text-white/80" : "text-black/70"
                  }`}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.10)",
                    borderColor: "rgba(255,255,255,0.20)",
                  }}
                  title="Copy JSON"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Features */}
                <div>
                  <div className={`text-xs tracking-widest uppercase ${subtleText}`}>Core features</div>
                  <div className="mt-2 space-y-2">
                    {card.features.map((f, i) => (
                      <input
                        key={i}
                        value={f}
                        onChange={(e) => {
                          const next = [...card.features];
                          next[i] = e.target.value;
                          update(["features"], next);
                        }}
                        className={`w-full rounded-2xl px-3 py-2 border border-white/15 bg-white/10 outline-none text-sm ${
                          isDark ? "text-white" : "text-black"
                        }`}
                      />
                    ))}
                    <button
                      onClick={() => update(["features"], [...card.features, "New feature"])}
                      className={`text-xs ${subtleText} hover:opacity-90`}
                    >
                      + Add feature
                    </button>
                  </div>
                </div>

                {/* Tech stack */}
                <div>
                  <div className={`text-xs tracking-widest uppercase ${subtleText}`}>Tech stack</div>
                  <div className="mt-2 space-y-2">
                    {["frontend", "backend", "database"].map((k) => (
                      <div key={k} className="space-y-1">
                        <div className={`text-[11px] uppercase tracking-wider ${subtleText}`}>{k}</div>
                        <input
                          value={card.tech_stack?.[k] || ""}
                          onChange={(e) => update(["tech_stack", k], e.target.value)}
                          className={`w-full rounded-2xl px-3 py-2 border border-white/15 bg-white/10 outline-none text-sm ${
                            isDark ? "text-white" : "text-black"
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Monetization */}
                <div className="md:col-span-2">
                  <div className={`text-xs tracking-widest uppercase ${subtleText}`}>Monetization</div>
                  <textarea
                    value={card.monetization}
                    onChange={(e) => update(["monetization"], e.target.value)}
                    className={`w-full mt-2 rounded-2xl px-3 py-2 border border-white/15 bg-white/10 outline-none text-sm ${
                      isDark ? "text-white" : "text-black"
                    }`}
                    rows={2}
                  />
                </div>

                {/* Roadmap */}
                <div className="md:col-span-2">
                  <div className={`text-xs tracking-widest uppercase ${subtleText}`}>Roadmap</div>
                  <div className="mt-2 space-y-2">
                    {card.roadmap.map((r, i) => (
                      <input
                        key={i}
                        value={r}
                        onChange={(e) => {
                          const next = [...card.roadmap];
                          next[i] = e.target.value;
                          update(["roadmap"], next);
                        }}
                        className={`w-full rounded-2xl px-3 py-2 border border-white/15 bg-white/10 outline-none text-sm ${
                          isDark ? "text-white" : "text-black"
                        }`}
                      />
                    ))}
                    <button
                      onClick={() => update(["roadmap"], [...card.roadmap, "Next milestone"])}
                      className={`text-xs ${subtleText} hover:opacity-90`}
                    >
                      + Add milestone
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  onClick={reset}
                  className={`about-devello-glass rounded-full px-4 py-2 text-sm ${subtleText} hover:opacity-90`}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.08)",
                    borderColor: "rgba(255,255,255,0.20)",
                  }}
                >
                  Try another idea
                </button>

                <button
                  onClick={async () => {
                    // Save to conversation
                    setBusy(true);
                    setErr("");
                    try {
                      const supabase = getSupabase();
                      if (!supabase) {
                        throw new Error("Please sign in to save your build request");
                      }
                      
                      const { data: { session } } = await supabase.auth.getSession();
                      
                      if (!session?.access_token) {
                        throw new Error("Please sign in to save your build request");
                      }

                      const r = await fetch("/api/studios/ideation/confirm", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "Authorization": `Bearer ${session.access_token}`
                        },
                        body: JSON.stringify({ ideaId: jobId, result: card }),
                      });
                      const data = await r.json().catch(() => ({}));
                      if (!r.ok) throw new Error(data?.error || "Failed to save.");
                      onClose?.();
                    } catch (e) {
                      setErr(e.message || "Failed to save.");
                    } finally {
                      setBusy(false);
                    }
                  }}
                  className={`about-devello-glass rounded-full px-5 py-2.5 text-sm font-medium ${
                    isDark ? "text-white" : "text-black"
                  }`}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.14)",
                    borderColor: "rgba(255,255,255,0.28)",
                  }}
                >
                  Save build request
                </button>
              </div>
            </div>

            {/* Side panel */}
            <div className={`about-devello-glass ${panelBg} rounded-3xl p-4 sm:p-6`}>
              <div className={`text-xs tracking-widest uppercase ${subtleText}`}>Next</div>
              <div className={`mt-2 text-sm leading-6 ${fieldText}`}>
                This is where you can show your "superintelligent" value:
                <ul className={`mt-3 space-y-2 ${subtleText}`}>
                  <li>• Generate 3 variations</li>
                  <li>• Suggest page/screen structure</li>
                  <li>• Suggest UI components from your library</li>
                  <li>• Turn roadmap into tasks</li>
                </ul>
              </div>

              <div className="mt-4 border-t border-white/10 pt-4">
                <div className={`text-xs tracking-widest uppercase ${subtleText}`}>Prompt tips</div>
                <div className={`mt-2 text-xs ${subtleText} leading-5`}>
                  Add audience + outcome:
                  <div className="mt-2">
                    <span className="opacity-90">"For NYC contractors,</span> quote jobs from photos
                    <span className="opacity-90"> and collect deposits."</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
