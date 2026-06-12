/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore, DamageIndicator } from '../store';

function SingleHitIndicator({ indicator }: { indicator: DamageIndicator }) {
  const removeDamageIndicator = useGameStore(state => state.removeDamageIndicator);

  useEffect(() => {
    const timer = setTimeout(() => {
      removeDamageIndicator(indicator.id);
    }, 1500); // Lifecycle of 1.5 seconds
    return () => clearTimeout(timer);
  }, [indicator.id, removeDamageIndicator]);

  // If isSwarm is active, fuchsia/neon-pink colors, else standard tactical rose/red colors
  const colorClass = indicator.isSwarm 
    ? 'from-fuchsia-600 via-pink-500 to-transparent' 
    : 'from-rose-600 via-red-500 to-transparent';

  const shadowClass = indicator.isSwarm
    ? 'drop-shadow-[0_0_20px_rgba(217,70,239,0.85)]'
    : 'drop-shadow-[0_0_15px_rgba(239,68,68,0.75)]';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="absolute inset-0 origin-center pointer-events-none"
      style={{ transform: `rotate(${indicator.angle}deg)` }}
    >
      {/* Edge Threat Indicator: centered at the top of rotated wrapper */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-sm sm:max-w-md md:max-w-lg h-32 flex flex-col items-center pointer-events-none">
        
        {/* Wedge glow shape */}
        <div 
          className={`w-[85%] h-8 bg-gradient-to-b ${colorClass} rounded-b-[100px] opacity-90 blur-sm ${shadowClass}`}
        />
        
        {/* HUD Sub-line accent */}
        <div className={`w-[60%] h-[1.5px] mt-1 bg-white opacity-35 rounded-full ${indicator.isSwarm ? 'animate-pulse' : ''}`} />

        {/* Warning Readout Telemetry (Swarm exclusive) */}
        {indicator.isSwarm && (
          <div className="text-[7px] sm:text-[8px] font-mono font-black text-pink-400 mt-2 tracking-[0.25em] bg-black/45 px-1.5 py-0.5 rounded border border-pink-500/20 shadow-[0_0_10px_rgba(217,70,239,0.35)] animate-pulse uppercase select-none">
            ⚡ SWARM IMPACT IMMINENT
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function DirectionalHitIndicators({ isGhostActive }: { isGhostActive?: boolean }) {
  const damageIndicators = useGameStore(state => state.damageIndicators || []);
  const storeGhostMode = useGameStore(state => state.isGhostMode);

  const showVignetteFlash = damageIndicators.length > 0;
  const isSwarmFlashActive = damageIndicators.some(i => i.isSwarm);

  // Use the explicitly passed isGhostActive prop if available; otherwise sync with storeGhostMode
  const isGhostEffectActive = isGhostActive !== undefined ? isGhostActive : storeGhostMode;

  return (
    <>
      {/* Edge Flash Vignette Overlay */}
      <AnimatePresence>
        {showVignetteFlash && (
          <motion.div
            key="vignette-flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: isGhostEffectActive ? 0.14 : 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className={`fixed inset-0 pointer-events-none z-40 transition-all duration-300 border-4 sm:border-6 md:border-8 ${
              isSwarmFlashActive
                ? 'border-fuchsia-500/25 shadow-[inset_0_0_60px_rgba(217,70,239,0.5)]'
                : 'border-red-500/25 shadow-[inset_0_0_50px_rgba(239,68,68,0.45)]'
            }`}
          />
        )}
      </AnimatePresence>

      {/* Screen Edge Wedge Radiating Layout */}
      <div 
        className="fixed inset-0 pointer-events-none z-50 overflow-hidden transition-opacity duration-500"
        style={{ opacity: isGhostEffectActive ? 0.35 : 1 }}
      >
        <AnimatePresence>
          {damageIndicators.map((indicator) => (
            <SingleHitIndicator key={indicator.id} indicator={indicator} />
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
