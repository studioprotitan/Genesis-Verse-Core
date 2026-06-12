import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Cpu, CheckCircle2, RefreshCw, Play, Radar } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface BriefingData {
  title: string;
  codename: string;
  description: string;
  objectives: string[];
  threatLevel: string;
}

interface MissionBriefingProps {
  onDeploy: () => void;
  onCancel: () => void;
}

export default function MissionBriefing({ onDeploy, onCancel }: MissionBriefingProps) {
  const [loading, setLoading] = useState(true);
  const [briefing, setBriefing] = useState<BriefingData | null>(null);

  const fetchBriefing = async () => {
    setLoading(true);
    try {
      soundManager.playSysAlert('click');
      const res = await fetch('/api/briefing');
      if (!res.ok) {
        throw new Error('Neural API failed to synchronize core telemetry.');
      }
      const data = await res.json();
      setBriefing(data);
    } catch (err) {
      console.error('Briefing fetch failed, activating grid fallback sequence:', err);
      // Cyber fallback
      setBriefing({
        title: "ROGUE CORE INSTABILITY SWEEP",
        codename: "OPERATION HELIOS RIFT",
        description: "Vector grid sector 0x7E has suffered a severe core breakdown. Rogue autonomous drone squads have hijacked node relays and must be neutralized to preserve cyberspace integrity.",
        objectives: [
          "Neutralize 5 active grid drone units",
          "Surpass 55% tactical weapon accuracy rating",
          "Evade proximal threat envelopes to avoid disruptions"
        ],
        threatLevel: "CRITICAL"
      });
    } finally {
      setLoading(false);
      soundManager.playSysAlert('start');
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, []);

  const getThreatColor = (level: string) => {
    const l = level.toUpperCase();
    if (l.includes('MAX') || l.includes('CRITICAL')) return 'text-rose-500 border-rose-500/30 bg-rose-500/10 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]';
    if (l.includes('SEVERE') || l.includes('HIGH')) return 'text-amber-500 border-amber-500/30 bg-amber-500/10 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]';
    return 'text-cyan-500 border-cyan-500/30 bg-cyan-500/10 drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]';
  };

  return (
    <div className="absolute inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 md:p-8 backdrop-blur-md overflow-y-auto">
      {/* Abstract Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] select-none pointer-events-none" style={{
        backgroundImage: 'radial-gradient(ellipse at center, #06b6d4 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl bg-black/85 border border-cyan-500/25 rounded-xl shadow-[0_0_50px_rgba(6,182,212,0.15)] relative overflow-hidden backdrop-blur-xl flex flex-col p-6 md:p-8"
      >
        {/* Neon top highlight */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-rose-500"></div>
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-cyan-500/[0.01] to-transparent animate-[pulse_4s_infinite]"></div>

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] font-black tracking-[0.2em] text-cyan-500 font-mono uppercase">
                INTELLIGENT BRIEFING HUB
              </div>
              <h2 className="text-lg md:text-xl font-black text-white font-sans tracking-tight uppercase">
                MISSION PROTOCOLS
              </h2>
            </div>
          </div>
          <button 
            type="button"
            onClick={onCancel}
            className="text-[9px] font-bold text-slate-500 hover:text-slate-300 px-2.5 py-1.5 border border-white/5 hover:border-white/10 rounded transition-all cursor-pointer font-mono uppercase"
          >
            DISCONNECT
          </button>
        </div>

        {/* Dynamic Loading vs Content */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center py-12"
            >
              <div className="relative mb-5">
                <Radar className="w-12 h-12 text-cyan-400 animate-spin opacity-80" />
                <div className="absolute inset-0 border border-cyan-500 rounded-full animate-ping scale-75 opacity-40"></div>
              </div>
              <span className="text-[10px] font-bold text-cyan-400 tracking-[0.3em] font-mono animate-pulse uppercase">
                SYNCHRONIZING CORE DIRECTIVES...
              </span>
              <p className="text-[11px] text-slate-500 font-mono mt-2 uppercase tracking-wider">
                Accessing dual-core vector network
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-grow flex flex-col gap-5 text-left"
            >
              {/* Mission Codename Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.02] border border-white/5 p-4 rounded-lg">
                <div>
                  <div className="text-[9px] font-bold text-slate-400 tracking-widest font-mono uppercase">
                    SYS-LINK STATUS ACTIVE // VECTOR-CODENAME
                  </div>
                  <h3 className="text-base font-black text-cyan-400 tracking-wide mt-0.5 font-mono">
                    {briefing?.codename}
                  </h3>
                </div>
                <div className={`self-start sm:self-auto px-3 py-1 rounded border text-[9px] font-black tracking-widest font-mono uppercase flex items-center gap-1.5 ${getThreatColor(briefing?.threatLevel || 'MODERATE')}`}>
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>THREAT: {briefing?.threatLevel}</span>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <dt className="text-[9.5px] font-black text-fuchsia-400 tracking-widest uppercase font-mono mb-1">
                  CORE OUTCOME DIRECTIVE
                </dt>
                <dd className="text-md font-bold text-white tracking-wide border-l-2 border-fuchsia-500 pl-3 uppercase">
                  {briefing?.title}
                </dd>
                <p className="text-[11.5px] text-slate-400 font-mono leading-relaxed mt-2.5">
                  {briefing?.description}
                </p>
              </div>

              {/* Objectives List */}
              <div className="space-y-2.5">
                <span className="text-[9.5px] font-black text-cyan-500 tracking-widest uppercase font-mono block mb-1">
                  TACTICAL EVALUATION PERFORMANCE CRITERIA
                </span>
                <div className="bg-cyan-500/[0.01] border border-cyan-500/10 rounded-lg p-3.5 space-y-3">
                  {briefing?.objectives.map((obj, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300 font-mono">
                      <div className="mt-0.5 text-cyan-400 flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400/80 drop-shadow-[0_0_4px_rgba(34,211,238,0.4)]" />
                      </div>
                      <span>{obj}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deployment Launch Bar */}
              <div className="flex flex-col sm:flex-row gap-3 border-t border-white/5 pt-5 mt-3">
                <button
                  type="button"
                  onClick={fetchBriefing}
                  className="px-4 py-3 bg-slate-900 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-all flex items-center justify-center gap-2 text-xs font-bold font-mono tracking-wider cursor-pointer uppercase active:scale-95 select-none"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>RE-ROUTE NET</span>
                </button>
                <button
                  type="button"
                  onClick={onDeploy}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 border-2 border-cyan-400/85 hover:border-cyan-300 hover:from-cyan-400 hover:to-fuchsia-400 hover:text-black text-cyan-400 transition-all duration-300 rounded flex items-center justify-center gap-2 text-sm font-black tracking-widest cursor-pointer uppercase shadow-[0_0_20px_rgba(6,182,212,0.15)] font-mono hover:scale-[1.01] active:scale-95 select-none"
                >
                  <Play className="w-4 h-4 fill-current animate-pulse" />
                  <span>INITIALIZE & DEPLOY</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
