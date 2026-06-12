import { motion, AnimatePresence } from 'motion/react';
import { useEffect } from 'react';
import { useGameStore } from '../store';
import { Zap, Sparkles, Orbit } from 'lucide-react';
import { soundManager } from '../utils/audio';

export function RiftExtractionOverlay({ isGhostActive = false }: { isGhostActive?: boolean }) {
  const riftExtractionActive = useGameStore(state => state.riftExtractionActive);
  const riftExtractionTimeRemaining = useGameStore(state => state.riftExtractionTimeRemaining);

  useEffect(() => {
    if (riftExtractionActive) {
      soundManager.playPowerup();
    }
  }, [riftExtractionActive]);

  return (
    <AnimatePresence>
      {riftExtractionActive && (
        <div 
          id="rift-extraction-root" 
          className="absolute inset-0 z-40 pointer-events-none select-none overflow-hidden flex flex-col items-center justify-center transition-opacity duration-500"
          style={{ opacity: isGhostActive ? 0.35 : 1 }}
        >
          {/* Pulsing sci-fi violet/fuchsia screen boundary vignette */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0.35, 0.75, 0.35],
              boxShadow: [
                'inset 0 0 40px rgba(139, 92, 246, 0.3)',
                'inset 0 0 80px rgba(236, 72, 153, 0.55)',
                'inset 0 0 40px rgba(139, 92, 246, 0.3)'
              ]
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.6, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute inset-0 border border-violet-500/15"
          />

          {/* Glitch warp matrix scanlines overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/5 to-transparent bg-[length:100%_6px] opacity-30 pointer-events-none" />

          {/* Pulsing Central Rift HUD plate */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="bg-black/90 border-2 border-violet-500/40 px-6 py-4 rounded-xl flex flex-col items-center gap-2 max-w-sm text-center shadow-[0_0_35px_rgba(139,92,246,0.35)] backdrop-blur-md relative"
          >
            {/* Ambient background particles design */}
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-600 opacity-20 blur animate-pulse" />

            {/* Glowing spinning tech reticle */}
            <div className="relative w-12 h-12 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-dashed border-violet-400/45"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                className="absolute inset-1.5 rounded-full border border-fuchsia-500/50"
              />
              <Orbit className="w-5 h-5 text-fuchsia-400 animate-pulse relative z-10" />
            </div>

            {/* Alert Header Texts */}
            <div className="flex flex-col gap-0.5 mt-1">
              <span className="text-[10px] text-fuchsia-400 font-extrabold tracking-[0.25em] font-mono uppercase flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                RIFT OVERDRIVE ENGAGED
              </span>
              <h2 className="text-white text-xl font-black font-sans tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-300 to-indigo-400">
                EXTRACTION WINDOW
              </h2>
            </div>

            {/* Extraction points dynamic indicator */}
            <div className="flex items-center gap-2 bg-violet-950/70 border border-violet-500/35 rounded-md px-3 py-1 mt-1 font-mono">
              <span className="text-yellow-300 font-black text-xs tracking-wider flex items-center gap-1 animate-pulse">
                <Zap className="w-4.5 h-4.5 text-yellow-400 fill-yellow-400" />
                DOUBLE SCORE (2.0X)
              </span>
              <div className="w-px h-3.5 bg-violet-500/40" />
              <span className="text-fuchsia-300 font-bold tracking-tight text-xs tabular-nums">
                {Math.max(0, riftExtractionTimeRemaining).toFixed(1)}s
              </span>
            </div>

            {/* Directive instruction */}
            <span className="text-[8.5px] text-zinc-400 uppercase tracking-widest font-mono mt-1 font-bold animate-[pulse_1.5s_infinite]">
              ⚠️ HIT ANY SENTINEL TARGET NOW
            </span>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
