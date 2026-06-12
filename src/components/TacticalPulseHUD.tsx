/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '../store';

interface ActiveHUDPulse {
  id: string;
  color: string;
  type: 'drone' | 'rift' | 'general';
}

export function TacticalPulseHUD({ isGhostActive }: { isGhostActive?: boolean }) {
  const pings = useGameStore(state => state.pings || []);
  const storeGhostMode = useGameStore(state => state.isGhostMode);
  const [activePulses, setActivePulses] = useState<ActiveHUDPulse[]>([]);

  // Use the explicitly passed isGhostActive prop if available; otherwise sync with storeGhostMode
  const isGhostEffectActive = isGhostActive !== undefined ? isGhostActive : storeGhostMode;

  useEffect(() => {
    if (!pings || pings.length === 0) return;
    
    // Get the latest ping
    const latest = pings[pings.length - 1];
    if (!latest) return;
    
    const color = latest.senderColor || '#22d3ee';
    const type = latest.type || 'general';
    
    // Check if this is a newly created local or teammate ping to trigger HUD pulse
    const now = Date.now();
    if (now - latest.timestamp < 500) {
      const pulseId = latest.id + '-' + now;
      setActivePulses(prev => [...prev, { id: pulseId, color, type }]);
      
      // Remove pulse after animation finishes
      setTimeout(() => {
        setActivePulses(prev => prev.filter(p => p.id !== pulseId));
      }, 1000);
    }
  }, [pings]);

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-40 overflow-hidden flex items-center justify-center transition-opacity duration-500"
      style={{ opacity: isGhostEffectActive ? 0.35 : 1 }}
    >
      <AnimatePresence>
        {activePulses.map((pulse) => {
          // Tailor ripple design according to tactical type
          if (pulse.type === 'drone') {
            return (
              <React.Fragment key={pulse.id}>
                {/* Outward exploding HUD lock-on ring */}
                <motion.div
                  initial={{ scale: 0.1, opacity: 1, borderWidth: '4px' }}
                  animate={{ scale: 2.2, opacity: 0, borderWidth: '0.5px' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.85, ease: 'easeOut' }}
                  className="absolute w-[350px] h-[350px] rounded-full border-solid pointer-events-none"
                  style={{ borderColor: pulse.color, boxShadow: `0 0 30px ${pulse.color}22` }}
                />
                {/* Grid warning crosshair pulses */}
                <motion.div
                  initial={{ scale: 0.4, opacity: 0.8 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="absolute w-[200px] h-[200px] border border-dashed rounded-full pointer-events-none flex items-center justify-center"
                  style={{ borderColor: pulse.color }}
                >
                  <div className="w-10 h-[1px]" style={{ backgroundColor: pulse.color }} />
                  <div className="h-10 w-[1px] absolute" style={{ backgroundColor: pulse.color }} />
                </motion.div>
                {/* Tech edge scan line v-lines */}
                <motion.div
                  initial={{ scaleX: 0.5, opacity: 0.9 }}
                  animate={{ scaleX: 1.8, opacity: 0 }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  className="absolute w-[80%] h-[2px] pointer-events-none"
                  style={{ background: `linear-gradient(90deg, transparent, ${pulse.color}, transparent)` }}
                />
              </React.Fragment>
            );
          } else if (pulse.type === 'rift') {
            return (
              <React.Fragment key={pulse.id}>
                {/* Wavy vortex dimensional pulse */}
                <motion.div
                  initial={{ scale: 0.1, opacity: 1, rotate: 0 }}
                  animate={{ scale: 2.5, opacity: 0, rotate: 90 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.95, ease: 'easeInOut' }}
                  className="absolute w-[300px] h-[300px] rounded-full border border-double pointer-events-none"
                  style={{ borderColor: pulse.color, borderWidth: '3px', boxShadow: `0 0 40px ${pulse.color}33, inset 0 0 20px ${pulse.color}33` }}
                />
                <motion.div
                  initial={{ scale: 0.2, opacity: 0.9, rotate: 45 }}
                  animate={{ scale: 1.9, opacity: 0, rotate: -45 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="absolute w-[250px] h-[250px] border border-dashed pointer-events-none"
                  style={{ borderColor: pulse.color, borderRadius: '40%' }}
                />
              </React.Fragment>
            );
          } else {
            // General coordinate tactical marker pulse
            return (
              <motion.div
                key={pulse.id}
                initial={{ scale: 0.2, opacity: 1, borderWidth: '2px' }}
                animate={{ scale: 1.8, opacity: 0, borderWidth: '1px' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.75, ease: 'easeOut' }}
                className="absolute w-[250px] h-[250px] rounded-full border pointer-events-none"
                style={{ borderColor: pulse.color, boxShadow: `0 0 20px ${pulse.color}11` }}
              />
            );
          }
        })}
      </AnimatePresence>
    </div>
  );
}
