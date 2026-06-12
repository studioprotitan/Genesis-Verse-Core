/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore, KillFeedEntry } from '../store';
import { Target, Zap, Shield, HelpCircle } from 'lucide-react';

export function Killfeed() {
  const killFeed = useGameStore(state => state.killFeed);
  const gameState = useGameStore(state => state.gameState);
  const [activeKills, setActiveKills] = useState<KillFeedEntry[]>([]);

  useEffect(() => {
    // Only show kills from the last 6 seconds
    const updateActiveKills = () => {
      const now = Date.now();
      // Keep only the most recent 5 kills that occurred within 6 seconds
      const recent = killFeed
        .filter(k => now - k.timestamp < 6000)
        .slice(-5);
      setActiveKills(recent);
    };

    updateActiveKills();
    const interval = setInterval(updateActiveKills, 500);

    return () => clearInterval(interval);
  }, [killFeed]);

  // Render a small weapon icon based on type
  const renderWeaponIcon = (weapon: KillFeedEntry['weapon']) => {
    switch (weapon) {
      case 'plasma':
        return <Zap className="w-3.5 h-3.5 text-amber-400 drop-shadow-[0_0_4px_#fbbf24]" id="killfeed-icon-plasma" />;
      case 'collision':
        return <Shield className="w-3.5 h-3.5 text-red-400 drop-shadow-[0_0_4px_#f87171]" id="killfeed-icon-collision" />;
      case 'laser':
      default:
        return <Target className="w-3.5 h-3.5 text-cyan-400 drop-shadow-[0_0_4px_#22d3ee]" id="killfeed-icon-laser" />;
    }
  };

  return (
    <div 
      id="tactical-killfeed" 
      className="absolute top-44 left-2 md:top-52 md:left-4 flex flex-col gap-1.5 pointer-events-none select-none z-20 max-w-[280px]"
    >
      {/* Subdued tactical feed header */}
      {activeKills.length > 0 && (
        <div className="text-[9px] font-bold text-cyan-500/50 tracking-[0.2em] uppercase pl-1 border-l border-cyan-500/25">
          TACTICAL ENGAGEMENTS
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <AnimatePresence mode="popLayout">
          {activeKills.map((kill) => {
            const isKillerSelf = kill.killer === 'YOU';
            const isVictimSelf = kill.victim === 'YOU';

            return (
              <motion.div
                key={kill.id}
                initial={{ opacity: 0, x: -15, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.9, transition: { duration: 0.2 } }}
                layout
                className={`flex items-center gap-2 bg-slate-950/40 border border-slate-900/60 backdrop-blur-xs px-2.5 py-1 rounded text-xs font-medium max-w-full truncate shadow-[0_2px_8px_rgba(0,0,0,0.4)] ${
                  isKillerSelf 
                    ? 'border-l-2 border-l-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.1)]' 
                    : isVictimSelf 
                    ? 'border-l-2 border-l-red-500 bg-red-950/20' 
                    : 'border-l-2 border-l-slate-700'
                }`}
              >
                {/* Killer Label */}
                <span 
                  className="font-semibold tracking-wide truncate"
                  style={{ color: kill.killerColor }}
                >
                  {kill.killer}
                </span>

                {/* Kill weapon/instrument indicator with subtle glowing backdrop */}
                <div className="flex items-center justify-center bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800/80 mx-1">
                  {renderWeaponIcon(kill.weapon)}
                </div>

                {/* Victim Label */}
                <span 
                  className="font-semibold tracking-wide truncate text-red-400"
                  style={{ color: kill.victimColor }}
                >
                  {kill.victim}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
