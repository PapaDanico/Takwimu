"use client";

import { useState } from "react";
import Link from "next/link";
import { Scale, ChevronLeft, AlertTriangle, Clock, CheckCircle, Minus, ArrowUpRight } from "lucide-react";
import { t } from "@/lib/sheng";
import { CLAIMS, SOURCES } from "@/lib/data";

function TruthGapFull({ claim, index }) {
  const statusConfig = {
    disputed: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20", label: "DISPUTED" },
    stalled: { icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", label: "STALLED" },
    progress: { icon: ArrowUpRight, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20", label: "IN PROGRESS" },
    notstarted: { icon: Minus, color: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/20", label: "NOT STARTED" },
  };

  const config = statusConfig[claim.status] || statusConfig.disputed;
  const Icon = config.icon;

  return (
    <div className={`glass rounded-xl p-6 border-l-4 ${config.border.replace('border-', 'border-l-')} animate-fade-in-up stagger-${(index % 6) + 1}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${config.bg}`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div>
            <span className={`text-xs font-bold tracking-wider ${config.color}`}>{config.label}</span>
            <p className="text-xs text-slate-500 mt-0.5">Confidence: {claim.confidence}/5</p>
          </div>
        </div>
        <span className="text-[10px] text-slate-600">{claim.claim_date}</span>
      </div>

      <div className="mb-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Claim</p>
        <p className="text-base text-slate-200 leading-relaxed italic">"{claim.claim_text}"</p>
        <p className="text-xs text-slate-500 mt-2">— {claim.claimant}</p>
      </div>

      <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800 mb-4">
        <p className="text-xs text-emerald-400 uppercase tracking-wider mb-2">Verified Reality</p>
        <p className="text-sm text-slate-300 leading-relaxed">{claim.reality}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
          <p className="text-[10px] text-slate-500 uppercase mb-1">Sheng</p>
          <p className="text-sm text-amber-400/80 italic">{claim.sheng}</p>
        </div>
        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
          <p className="text-[10px] text-slate-500 uppercase mb-1">English</p>
          <p className="text-sm text-slate-400 italic">{claim.en}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {claim.sources.map((s, i) => (
          <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700/50">
            {SOURCES[s]?.name || s}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function UkweliPage() {
  const [lang, setLang] = useState("sheng");

  return (
    <div className="min-h-screen grid-pattern">
      <header className="sticky top-0 z-50 glass-strong border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/" className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-400" />
              </Link>
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                <Scale className="w-4 h-4 text-amber-400" />
              </div>
              <h1 className="text-sm font-bold text-slate-100">{t("ukweli", lang)}</h1>
            </div>
            <div className="flex items-center gap-1 bg-slate-800/50 rounded-full p-1 border border-slate-700/50">
              <button onClick={() => setLang("sheng")} className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${lang === "sheng" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "text-slate-500"}`}>Sheng</button>
              <button onClick={() => setLang("en")} className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${lang === "en" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "text-slate-500"}`}>English</button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-100 mb-2">
            {lang === "sheng" ? "Ukweli Gap — Serikali vs Ground" : "Truth Gap — Official Claims vs Reality"}
          </h2>
          <p className="text-sm text-slate-400">
            {lang === "sheng" 
              ? "Kila claim ina-verify na official sources. Sio opinion."
              : "Every claim cross-referenced against official sources. Not opinion."
            }
          </p>
        </div>

        <div className="space-y-4">
          {CLAIMS.map((claim, i) => (
            <TruthGapFull key={claim.id} claim={claim} index={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
