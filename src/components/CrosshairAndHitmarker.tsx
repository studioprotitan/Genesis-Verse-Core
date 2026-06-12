/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '../store';

export function CrosshairAndHitmarker() {
  const playerState = useGameStore(state => state.playerState);
  const lastHitTime = useGameStore(state => state.lastHitTime);
  const gameState = useGameStore(state => state.gameState);
  const [showHitmarker, setShowHitmarker] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (lastHitTime > 0) {
      setShowHitmarker(true);
      setKey(prev => prev + 1); // Increment key to force a clean re-mount and animation trigger on rapid successive hits

      const timer = setTimeout(() => {
        setShowHitmarker(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [lastHitTime]);

  return (
    <div id="combat-crosshair" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center select-none z-20">
      <div className="relative w-12 h-12 flex items-center justify-center">
        
        {/* Core Tactical Crosshair Sight */}
        <div className="relative w-6 h-6 flex items-center justify-center">
          {/* Circular inner ring with slight gap spaces */}
          <div 
            className={`w-5 h-5 border rounded-full transition-all duration-200 ${
              playerState === 'disabled' 
                ? 'border-red-500/80 shadow-[0_0_8px_rgba(185,28,28,0.5)]' 
                : 'border-cyan-400/40 shadow-[0_0_8px_rgba(34,211,238,0.2)]'
            }`} 
          />
          {/* Centered high-precision aiming reticle dot */}
          <div 
            className={`absolute w-1 h-1 rounded-full transition-all duration-200 ${
              playerState === 'disabled' 
                ? 'bg-red-500 shadow-[0_0_6px_#ef4444]' 
                : 'bg-cyan-400 shadow-[0_0_6px_#22d3ee]'
            }`} 
          />
          
          {/* Crosshair Outer Tick Hairlines (North, South, East, West) */}
          <div className={`absolute top-0 w-[1.5px] h-1 transition-colors duration-200 ${playerState === 'disabled' ? 'bg-red-500' : 'bg-cyan-400/50'}`} />
          <div className={`absolute bottom-0 w-[1.5px] h-1 transition-colors duration-200 ${playerState === 'disabled' ? 'bg-red-500' : 'bg-cyan-400/50'}`} />
          <div className={`absolute left-0 w-1 h-[1.5px] transition-colors duration-200 ${playerState === 'disabled' ? 'bg-red-500' : 'bg-cyan-400/50'}`} />
          <div className={`absolute right-0 w-1 h-[1.5px] transition-colors duration-200 ${playerState === 'disabled' ? 'bg-red-500' : 'bg-cyan-400/50'}`} />
        </div>

        {/* Dynamic Satisfying Hitmarker Overlay */}
        <AnimatePresence mode="popLayout">
          {showHitmarker && (
            <motion.div
              key={key}
              initial={{ scale: 1.4, opacity: 1.0 }}
              animate={{ scale: 0.9, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14, ease: 'easeOut' }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <svg 
                viewBox="0 0 100 100" 
                className="w-10 h-10 text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.9)]"
              >
                {/* Diagonal Hit Indicator Lines (Top Left to Bottom Right X) */}
                <line x1="24" y1="24" x2="38" y2="38" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
                <line x1="76" y1="24" x2="62" y2="38" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
                <line x1="24" y1="76" x2="38" y2="62" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
                <line x1="76" y1="76" x2="62" y2="62" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
        
      </div>
      
      {/* Action CTA tooltip */}
      <div className="mt-4 text-cyan-400/30 text-[9px] tracking-[0.25em] font-black uppercase pointer-events-none select-none">
        TAP OR CLICK TO DISCHARGE
      </div>
    </div>
  );
}
