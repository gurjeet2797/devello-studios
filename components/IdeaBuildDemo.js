"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Wand2, Copy, Check } from "lucide-react";
import { getSupabase } from '../lib/supabaseClient';
import { useAuth } from './auth/AuthProvider';

function normalizeResult(raw) {
  const r = raw?.result ?? raw ?? {};
  return {
    name: r.name || '',
    tagline: r.tagline || '',
    description: r.description || r.tagline || '',
    showcase: raw?.showcase || null,
    images: raw?.images || r._images || [],
  };
}

export default function IdeaBuildDemo({
  isDark = false,
  onClose,
  onStatusChange,
  context = {},
}) {
  const { user } = useAuth();
  const [idea, setIdea] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("idle");
  const [jobId, setJobId] = useState(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [card, setCard] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [progress, setProgress] = useState(0);

  const canGenerate = useMemo(() => idea.trim().length >= 8 && !busy, [idea, busy]);
  const txt = isDark ? "text-white" : "text-gray-900";
  const txtMuted = isDark ? "text-white/60" : "text-gray-500";

  async function pollUntilDone(id) {
    while (true) {
      try {
        const r = await fetch(`/api/studios/ideation/status/${id}`);
        const data = await r.json();
        if (data?.progress !== undefined) {
          setProgress(data.progress);
          setMsg(data.message || 'Working on it...');
        } else if (data?.message) {
          setMsg(data.message);
        }

        if (data?.status === "completed") {
          const rr = await fetch(`/api/studios/ideation/result/${id}`);
          const resData = await rr.json();
          setCard(normalizeResult(resData));
          setStatus("ready");
          setBusy(false);
          onStatusChange?.("ready");
          return;
        }
        if (data?.status === "failed") {
          setErr(data?.message || "Generation failed.");
          setStatus("error");
          setBusy(false);
          onStatusChange?.("error");
          return;
        }
        await new Promise((res) => setTimeout(res, 1500));
      } catch (e) {
        await new Promise((res) => setTimeout(res, 2000));
      }
    }
  }

  async function generate() {
    setBusy(true);
    setErr("");
    setMsg("Whispering to the machines...");
    setProgress(0);
    setStatus("generating");
    setCard(null);
    onStatusChange?.("generating");

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (user) {
        const supabase = getSupabase();
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      }

      const r = await fetch("/api/studios/ideation/start", {
        method: "POST",
        headers,
        body: JSON.stringify({ prompt: idea.trim(), ...context }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "Failed to start.");

      setJobId(data.ideaId);
      await pollUntilDone(data.ideaId);
    } catch (e) {
      setErr(e.message || "Something went wrong.");
      setStatus("error");
      setBusy(false);
      onStatusChange?.("error");
    }
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
    setProgress(0);
  }

  const showcaseImage = card?.showcase?.image_url;
  const hasShowcase = showcaseImage && card?.showcase?.success;

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Badge */}
      <div className="text-center mb-5">
        <span className={`inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase ${txtMuted}`}>
          <Zap className="w-3 h-3" /> Devello Creative Engine
        </span>
      </div>

      {/* Input */}
      {status !== "ready" && (
        <div className="about-devello-glass rounded-2xl p-5 border">
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder='Describe something you wish your device could do'
            className={`w-full min-h-[70px] bg-transparent outline-none resize-none text-base ${txt} placeholder:${txtMuted} scrollbar-hide`}
          />
          <div className={`flex items-center justify-between mt-4 pt-4 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
            <button
              onClick={generate}
              disabled={!canGenerate}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                canGenerate 
                  ? `${isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'} hover:opacity-90` 
                  : 'opacity-30 cursor-not-allowed bg-gray-500/20'
              }`}
            >
              <Wand2 className="w-4 h-4" />
              {busy ? msg : 'Generate'}
            </button>
            <button onClick={onClose} className={`text-sm ${txtMuted} hover:opacity-70`}>Cancel</button>
          </div>
          
          {/* Progress Bar */}
          {busy && progress > 0 && (
            <div className="mt-4">
              <div className={`h-1 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className={`h-full ${isDark ? 'bg-white' : 'bg-gray-900'} rounded-full`}
                />
              </div>
            </div>
          )}
          
          {err && <div className="mt-3 text-sm text-red-400">{err}</div>}
        </div>
      )}

      {/* Result */}
      <AnimatePresence>
        {card && status === "ready" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-5"
          >
            {/* Header Card */}
            <div className="about-devello-glass rounded-2xl p-6 border text-center">
              <div className="flex justify-end mb-2">
                <button onClick={copyJson} className={`p-1.5 rounded-full ${txtMuted} hover:opacity-70`}>
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              
              <h2 className={`text-3xl font-semibold tracking-tight ${txt}`}>{card.name}</h2>
              <p className={`mt-3 text-base leading-relaxed ${txtMuted} max-w-lg mx-auto`}>
                {card.description || card.tagline}
              </p>
            </div>

            {/* Showcase Mockup */}
            {hasShowcase && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="about-devello-glass rounded-2xl p-5 border"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[10px] tracking-[0.15em] uppercase ${txtMuted}`}>
                    Product Showcase
                  </span>
                  <span className={`text-[10px] ${txtMuted} italic`}>
                    This is just a preview — your final app will be even better.
                  </span>
                </div>
                <div className="rounded-xl overflow-hidden bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 shadow-2xl">
                  <img 
                    src={showcaseImage} 
                    alt={`${card.name} showcase`}
                    className="w-full h-auto object-contain"
                  />
                </div>
              </motion.div>
            )}

            {/* Contact Form Modal */}
            <AnimatePresence>
              {showContactForm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4"
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                  onClick={() => !busy && setShowContactForm(false)}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="about-devello-glass rounded-2xl p-6 border w-full max-w-md"
                  >
                    <h3 className={`text-xl font-semibold mb-4 ${txt}`}>Submit Build Request</h3>
                    <p className={`text-sm mb-6 ${txtMuted}`}>
                      Please provide your contact information to proceed with building this app.
                    </p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${txt}`}>
                          Email <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="your@email.com"
                          className={`w-full px-4 py-2.5 rounded-xl bg-transparent border ${isDark ? 'border-white/20' : 'border-black/20'} ${txt} placeholder:${txtMuted} outline-none focus:border-blue-500`}
                          disabled={busy}
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${txt}`}>
                          Phone Number <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="tel"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="(555) 123-4567"
                          className={`w-full px-4 py-2.5 rounded-xl bg-transparent border ${isDark ? 'border-white/20' : 'border-black/20'} ${txt} placeholder:${txtMuted} outline-none focus:border-blue-500`}
                          disabled={busy}
                        />
                      </div>
                    </div>

                    {err && <div className="mt-4 text-sm text-red-400">{err}</div>}

                    <div className="flex items-center justify-end gap-3 mt-6">
                      <button
                        onClick={() => setShowContactForm(false)}
                        disabled={busy}
                        className={`px-4 py-2 rounded-full text-sm ${txtMuted} hover:opacity-70 transition-opacity ${busy ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          if (!contactEmail.trim() || !contactPhone.trim()) {
                            setErr("Please fill in all required fields");
                            return;
                          }
                          
                          setBusy(true);
                          setErr("");
                          try {
                            const supabase = getSupabase();
                            const headers = { 'Content-Type': 'application/json' };
                            
                            if (supabase) {
                              const { data: { session } } = await supabase.auth.getSession();
                              if (session?.access_token) {
                                headers['Authorization'] = `Bearer ${session.access_token}`;
                              }
                            }

                            // Don't send the large base64 image - it's already in the database
                            const resultToSend = {
                              ...card,
                              showcase: card.showcase ? { 
                                success: card.showcase.success,
                                // Exclude image_url to avoid 413 error
                              } : null
                            };

                            const r = await fetch("/api/studios/ideation/confirm", {
                              method: "POST",
                              headers,
                              body: JSON.stringify({ 
                                ideaId: jobId, 
                                result: resultToSend,
                                email: contactEmail.trim(),
                                phone: contactPhone.trim()
                              }),
                            });
                            
                            const data = await r.json();
                            if (!r.ok) throw new Error(data?.error || "Failed to submit request");
                            
                            onClose?.();
                          } catch (e) {
                            setErr(e.message || "Failed to submit. Please try again.");
                          } finally {
                            setBusy(false);
                          }
                        }}
                        disabled={busy || !contactEmail.trim() || !contactPhone.trim()}
                        className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                          (busy || !contactEmail.trim() || !contactPhone.trim())
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:scale-[1.02] active:scale-[0.98]'
                        } ${isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                      >
                        {busy ? 'Submitting...' : 'Submit Request'}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={reset}
                className={`text-sm ${txtMuted} hover:opacity-70 transition-opacity`}
              >
                ← Try another idea
              </button>
              <button
                onClick={() => setShowContactForm(true)}
                className={`px-6 py-2.5 rounded-full text-sm font-medium shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] ${
                  isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'
                }`}
              >
                Let's Build This →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
