/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Zap, Compass, Trophy, Flame, AlertCircle } from 'lucide-react';
import { useGameStore } from '../store';

interface LogNotification {
  id: string;
  text: string;
  type: 'shield_breached' | 'rift_stabilized' | 'high_combo' | 'swarm_alert' | 'rift_active' | 'system_status';
  timestamp: number;
}

export function CombatLog() {
  const [logs, setLogs] = useState<LogNotification[]>([]);
  const gameState = useGameStore(state => state.gameState);
  
  // Game stores to watch
  const playerHealth = useGameStore(state => state.playerHealth);
  const comboCount = useGameStore(state => state.comboCount);
  const riftActive = useGameStore(state => state.riftExtractionActive);
  const swarmActive = useGameStore(state => state.swarmActive);

  // Keep track of previous values to detect transitions
  const prevHealthRef = useRef(playerHealth);
  const prevComboRef = useRef(comboCount);
  const prevRiftRef = useRef(riftActive);
  const prevSwarmRef = useRef(swarmActive);

  const addLog = (text: string, type: LogNotification['type']) => {
    const newLog: LogNotification = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      type,
      timestamp: Date.now()
    };
    setLogs(prev => {
      // Keep only last 4 logs to keep screen uncluttered
      const nextLogs = [...prev, newLog];
      if (nextLogs.length > 4) {
        return nextLogs.slice(-4);
      }
      return nextLogs;
    });
  };

  useEffect(() => {
    if (gameState !== 'playing') {
      setLogs([]);
      return;
    }

    // 1. Detect "Shield Breached" / heavy integrity loss
    const prevHealth = prevHealthRef.current;
    if (playerHealth < prevHealth) {
      if (playerHealth === 0) {
        addLog('🚨 SHIELD BREACHED: EMERGENCY SYSTEM REBOOT!', 'shield_breached');
      } else if (playerHealth <= 50 && prevHealth > 50) {
        addLog(`⚠️ SHIELD INTEGRITY CRITICAL: ${playerHealth}% remaining!`, 'shield_breached');
      }
    }
    prevHealthRef.current = playerHealth;

    // 2. Detect "High Combo Achieved"
    const prevCombo = prevComboRef.current;
    if (comboCount > prevCombo) {
      if (comboCount === 3) {
        addLog('🔥 COMBO GROWING: Weapon multipliers primed!', 'high_combo');
      } else if (comboCount === 5) {
        addLog('🔥 HIGH COMBO ACHIEVED: Overdrive active (x1.5)!', 'high_combo');
      } else if (comboCount >= 10 && comboCount % 5 === 0) {
        addLog(`⚡ SUPREME COMBO ACHIEVED: ${comboCount} successive tags!`, 'high_combo');
      }
    }
    prevComboRef.current = comboCount;

    // 3. Detect Rift extraction changes (Active vs Stabilized)
    const prevRift = prevRiftRef.current;
    if (riftActive && !prevRift) {
      addLog('🌌 RIFT EXTRACTION DETECTED: Double-point overdrive!', 'rift_active');
    } else if (!riftActive && prevRift) {
      addLog('🌌 RIFT STABILIZED: Vector extraction secured!', 'rift_stabilized');
    }
    prevRiftRef.current = riftActive;

    // 4. Detect Swarm warnings
    const prevSwarm = prevSwarmRef.current;
    if (swarmActive && !prevSwarm) {
      addLog('🚨 AIRSPACE COMPROMISED: Swarm overdrive warning!', 'swarm_alert');
    } else if (!swarmActive && prevSwarm) {
      addLog('🛡️ SWARM PURGED: Multipliers returned to baseline.', 'system_status');
    }
    prevSwarmRef.current = swarmActive;

  }, [playerHealth, comboCount, riftActive, swarmActive, gameState]);

  // Clean-up logs that are older than 4.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setLogs(prev => prev.filter(log => now - log.timestamp < 4500));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  if (gameState !== 'playing' || logs.length === 0) return null;

  // Render styling parameters matching log category
  const getLogStyle = (type: LogNotification['type']) => {
    switch (type) {
      case 'shield_breached':
        return {
          border: 'border-rose-500/30 bg-rose-950/25',
          text: 'text-rose-100',
          badge: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
          icon: <ShieldAlert className="w-3 h-3 text-rose-400 animate-pulse" />
        };
      case 'rift_active':
        return {
          border: 'border-violet-500/30 bg-violet-950/25',
          text: 'text-violet-100',
          badge: 'bg-violet-500/20 text-violet-400 border-violet-500/40',
          icon: <Compass className="w-3 h-3 text-violet-400 animate-spin" style={{ animationDuration: '4s' }} />
        };
      case 'rift_stabilized':
        return {
          border: 'border-cyan-500/30 bg-cyan-950/25',
          text: 'text-cyan-100',
          badge: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
          icon: <Compass className="w-3 h-3 text-cyan-400" />
        };
      case 'high_combo':
        return {
          border: 'border-orange-500/30 bg-orange-950/25',
          text: 'text-orange-100',
          badge: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
          icon: <Flame className="w-3 h-3 text-orange-400 animate-bounce" />
        };
      case 'swarm_alert':
        return {
          border: 'border-fuchsia-500/30 bg-fuchsia-950/25',
          text: 'text-fuchsia-100',
          badge: 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/40',
          icon: <Zap className="w-3 h-3 text-fuchsia-400 animate-pulse" />
        };
      case 'system_status':
      default:
        return {
          border: 'border-emerald-500/30 bg-emerald-950/25',
          text: 'text-emerald-100',
          badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
          icon: <AlertCircle className="w-3 h-3 text-emerald-400" />
        };
    }
  };

  return (
    <div 
      id="combat-event-scroller" 
      className="flex flex-col gap-1.5 w-52 pointer-events-none select-none font-mono"
    >
      {/* Subdued combat action header */}
      <div className="text-[8px] font-black text-slate-500/60 uppercase tracking-[0.25em] pl-1 border-l border-slate-600/35">
        COMBAT FEED TELEMETRY
      </div>

      <div className="flex flex-col gap-1.5">
        <AnimatePresence mode="popLayout">
          {logs.map((log) => {
            const styles = getLogStyle(log.type);
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -10, scale: 0.9, transition: { duration: 0.15 } }}
                layout
                className={`flex items-start gap-2 border px-2.5 py-1.5 rounded backdrop-blur-xs text-[10px] leading-tight font-medium shadow-[0_2px_10px_rgba(0,0,0,0.5)] ${styles.border}`}
              >
                {/* Visual Category Badge Icon */}
                <div className={`p-0.5 rounded border mt-0.5 ${styles.badge}`}>
                  {styles.icon}
                </div>

                {/* Event text readout */}
                <span className={`flex-1 text-slate-200 tracking-wide font-semibold ${styles.text}`}>
                  {log.text}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default CombatLog;
