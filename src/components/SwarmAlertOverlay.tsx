import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '../store';
import { Skull, AlertTriangle, ShieldAlert, Zap } from 'lucide-react';

export function SwarmAlertOverlay({ isGhostActive = false }: { isGhostActive?: boolean }) {
  const swarmActive = useGameStore(state => state.swarmActive);
  const swarmTimeRemaining = useGameStore(state => state.swarmTimeRemaining);
  const scoreMultiplier = useGameStore(state => state.scoreMultiplier);
  const currentWave = useGameStore(state => state.currentWave);

  const [showSplash, setShowSplash] = useState(false);

  // Trigger high-volume central splash when swarm goes active
  useEffect(() => {
    if (swarmActive) {
      setShowSplash(true);
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 3500); // Flash central splash for 3.5 seconds
      return () => clearTimeout(timer);
    } else {
      setShowSplash(false);
    }
  }, [swarmActive]);

  return (
    <AnimatePresence>
      {swarmActive && (
        <div 
          id="swarm-alert-root" 
          className="absolute inset-0 z-40 pointer-events-none select-none overflow-hidden transition-opacity duration-500"
          style={{ opacity: isGhostActive ? 0.35 : 1 }}
        >
          {/* Persistent screen-wide pulsing red hazard vignette feedback */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0.4, 0.85, 0.4],
              boxShadow: [
                'inset 0 0 50px rgba(239, 68, 68, 0.35)',
                'inset 0 0 100px rgba(239, 68, 68, 0.65)',
                'inset 0 0 50px rgba(239, 68, 68, 0.35)'
              ]
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute inset-0 border border-red-500/20"
          />

          {/* Persistent Cyber Alert Scanline static effect in the background */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/5 to-transparent bg-[length:100%_4px] opacity-40 pointer-events-none" />

          {/* Persistent Sci-Fi Top Alert Ticker Ribbon */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-0 left-0 right-0 h-10 md:h-11 bg-red-950/90 border-b border-red-500/40 font-mono text-[9px] md:text-xs text-red-400 flex items-center justify-between px-4 md:px-8 shadow-[0_4px_25px_rgba(239,68,68,0.15)] backdrop-blur-md"
          >
            {/* Left indicator status */}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="font-extrabold tracking-[0.15em] flex items-center gap-1.5 red-glow-text">
                <Skull className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                TACTICAL SWARM DETECTED
              </span>
            </div>

            {/* Center caution ticker */}
            <div className="hidden lg:flex items-center gap-6 text-red-500/70 text-[9px] font-bold tracking-[0.2em]">
              <span>CAUTION: HIGH-BIOMETRIC DISRUPTIVE EMISSIONS</span>
              <span className="text-yellow-400/80 animate-pulse">MULTIPLIER OVERDRIVE ACTIVE</span>
              <span>GRID PROTOCOL ALPHA VECTORS DETECTED</span>
            </div>

            {/* Right timer countdown */}
            <div className="flex items-center gap-2 font-mono font-bold bg-red-950 border border-red-500/30 px-2 py-0.5 rounded shadow-[inset_0_0_8px_rgba(239,68,68,0.25)]">
              <span className="text-yellow-400 font-extrabold text-[8px] md:text-[10px] tracking-widest">{scoreMultiplier}X PTS Active</span>
              <div className="w-px h-3 bg-red-500/30" />
              <span className="text-red-400 tabular-nums animate-pulse font-mono text-[9px] md:text-xs">
                {Math.max(0, swarmTimeRemaining).toFixed(1)}s
              </span>
            </div>
          </motion.div>

          {/* Extreme Caution Dual Warning Rails (Left & Right margins) */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute left-0 bottom-16 top-16 w-1 border-r border-dashed border-red-500/40 hidden md:block"
          />
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute right-0 bottom-16 top-16 w-1 border-l border-dashed border-red-500/40 hidden md:block"
          />

          {/* High-Octane Full Screen Center Alert "Splash" Panel when first spawned */}
          <AnimatePresence>
            {showSplash && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="absolute inset-0 flex items-center justify-center bg-black/85 backdrop-blur-sm z-50 text-center flex-col gap-6"
              >
                {/* Visual sci-fi warning circle and pulsing crosshair background */}
                <div className="relative">
                  {/* Outer spinning ring */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                    className="w-24 h-24 rounded-full border border-dashed border-red-500/35 flex items-center justify-center"
                  />
                  
                  {/* Inner ring */}
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
                    className="absolute inset-2 rounded-full border border-red-500/50 flex items-center justify-center"
                  />

                  {/* Warning Sign */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <AlertTriangle className="w-10 h-10 text-red-500 animate-bounce drop-shadow-[0_0_12px_rgba(239,68,68,1)]" />
                  </div>
                </div>

                <div className="flex flex-col gap-2 max-w-xl mx-auto px-6">
                  {/* Status header */}
                  <div className="flex justify-center items-center gap-3">
                    <span className="w-8 h-[2px] bg-gradient-to-r from-transparent to-red-500" />
                    <span className="text-yellow-400 font-extrabold text-xs tracking-[0.25em] font-mono uppercase bg-red-950/60 px-2 py-0.5 rounded border border-red-500/30">
                      THREAT WAVE COMPROMISE
                    </span>
                    <span className="w-8 h-[2px] bg-gradient-to-l from-transparent to-red-500" />
                  </div>

                  {/* Main Title Banner with Caution Background */}
                  <div className="relative overflow-hidden py-4 border-y border-red-500/30">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-red-500/20 to-red-500/10" />
                    <h1 className="text-red-500 text-4xl sm:text-5xl md:text-6xl font-black font-sans tracking-[0.3em] uppercase drop-shadow-[0_0_25px_rgba(239,68,68,1)] animate-pulse relative z-10 select-none">
                      SWARM INBOUND
                    </h1>
                  </div>

                  {/* Operational directive instructions */}
                  <div className="flex flex-col gap-1 text-[10px] md:text-xs text-slate-300 font-mono tracking-wider">
                    <div className="text-amber-300 font-extrabold uppercase animate-pulse flex items-center justify-center gap-1.5 mt-2">
                      <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                      SCORE MULTIPLIER BOOSTED TO 4.0X — PURGE ACTIVE GRID
                    </div>
                    <div className="text-red-400/80 uppercase font-mono mt-1 text-[9px]">
                      HIGH-SPEED CHASSIS DETECTED | CRITICAL MATRIX LOAD | LEVEL: {currentWave} CLEARANCE
                    </div>
                  </div>
                </div>

                {/* Subtitle Telemetry line */}
                <span className="text-[9px] text-zinc-500 uppercase tracking-[0.3em] font-mono max-w-xs select-none">
                  SYSTEM OVERDRIVE // AUTO-AUTORANGE ENGAGED
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
