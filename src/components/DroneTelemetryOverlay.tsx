/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '../store';
import { 
  Compass, 
  Gauge, 
  Target, 
  Radio, 
  AlertTriangle, 
  X, 
  Cpu, 
  Wifi, 
  Layers, 
  Terminal, 
  Activity, 
  CheckCircle2, 
  ShieldAlert,
  Sliders,
  Sparkles,
  Skull,
  Shield,
  Eye,
  Crosshair,
  Search
} from 'lucide-react';
import { soundManager } from '../utils/audio';

// Helper to determine drone class classification and style indicators
function getDroneClassInfo(label: string, badge: string, isDecoy?: boolean) {
  const lbl = (label || '').toLowerCase();
  const bdg = (badge || '').toLowerCase();

  if (isDecoy || lbl.includes('decoy') || lbl.includes('ghost')) {
    return {
      className: 'Ghost / Bait',
      Icon: Layers,
      colorClass: 'text-sky-400 border-sky-500/20 bg-sky-500/10 shadow-[0_0_8px_rgba(56,189,248,0.15)]',
      tag: 'DECOY SYSTEM'
    };
  }

  if (lbl.includes('predator') || lbl.includes('boss') || bdg.includes('seeker') || lbl.includes('heavy')) {
    return {
      className: 'Hunter / Boss',
      Icon: Skull,
      colorClass: 'text-rose-400 border-rose-500/20 bg-rose-500/10 shadow-[0_0_8px_rgba(244,63,94,0.15)]',
      tag: 'ELITE HUNTER'
    };
  }

  if (lbl.includes('shield') || bdg.includes('defense') || lbl.includes('defense')) {
    return {
      className: 'Defense / Guardian',
      Icon: Shield,
      colorClass: 'text-blue-400 border-blue-500/20 bg-blue-500/10 shadow-[0_0_8px_rgba(59,130,246,0.15)]',
      tag: 'GUARDIAN CLASS'
    };
  }

  // Default to Scout
  return {
    className: 'Scout / Recon',
    Icon: Eye,
    colorClass: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10 shadow-[0_0_8px_rgba(16,185,129,0.15)]',
    tag: 'SCOUT UNIT'
  };
}

// Generate stable, realistic dynamic stats (battery, weapon status, armor integrity) deterministically based on drone id and classification
function getDeterministicDroneStats(id: string, label: string, badge: string) {
  let val1 = 0;
  let val2 = 0;
  let val3 = 0;
  const str = id || '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    val1 += code;
    val2 += code * (i + 1);
    val3 ^= code;
  }

  const batteryVal = 62 + (val1 % 34); // 62% to 95%
  const armorVal = 58 + (val2 % 39); // 58% to 96%
  const weaponCharge = 45 + (val3 % 51); // 45% to 95%

  const lbl = (label || '').toLowerCase();
  const bdg = (badge || '').toLowerCase();

  let weaponName = 'Pulse Blaster v2';
  let weaponStatus = 'READY';

  if (lbl.includes('decoy') || lbl.includes('ghost')) {
    weaponName = 'Holographic Projection Cell';
    weaponStatus = 'ACTIVE';
  } else if (lbl.includes('predator') || lbl.includes('boss') || bdg.includes('seeker') || lbl.includes('heavy')) {
    weaponName = 'Mega Plasma Cannon';
    weaponStatus = weaponCharge > 80 ? 'CHARGED' : 'CHARGING';
  } else if (lbl.includes('shield') || bdg.includes('defense') || lbl.includes('defense')) {
    weaponName = 'Vortex Shield Radiator';
    weaponStatus = 'DEFENDING';
  } else {
    // Scout
    weaponName = 'Sub-orbital Ion Tracker';
    weaponStatus = 'SCANNING';
  }

  return {
    batteryVal,
    armorVal,
    weaponCharge,
    weaponName,
    weaponStatus
  };
}

// Deterministic estimated threat level and styles based on runtime state
function getDroneThreatLevel(mode: string, distance: number, isDecoy?: boolean) {
  if (isDecoy) {
    return { 
      label: 'MINIMAL', 
      colorText: 'text-zinc-500', 
      colorBg: 'bg-zinc-500/10', 
      colorBorder: 'border-zinc-500/25' 
    };
  }
  if (distance < 5.0) {
    return { 
      label: 'IMMEDIATE', 
      colorText: 'text-red-500', 
      colorBg: 'bg-red-550/20', 
      colorBorder: 'border-red-500/50' 
    };
  }
  if (mode === 'aggressive') {
    return { 
      label: 'CRITICAL', 
      colorText: 'text-red-400 border-red-500/40 bg-red-500/10 shadow-[0_0_8px_rgba(239,68,68,0.1)]', 
      colorBg: 'bg-red-950/20', 
      colorBorder: 'border-red-500/40' 
    };
  }
  if (mode === 'defensive') {
    return { 
      label: 'MODERATE', 
      colorText: 'text-amber-400', 
      colorBg: 'bg-amber-950/20', 
      colorBorder: 'border-amber-550/30' 
    };
  }
  return { 
    label: 'LOW', 
    colorText: 'text-emerald-400', 
    colorBg: 'bg-emerald-950/20', 
    colorBorder: 'border-emerald-555/25' 
  };
}

function getThreatValue(mode: string, distance: number, isDecoy?: boolean) {
  if (isDecoy) return 1;
  if (distance < 5.0) return 5;
  if (mode === 'aggressive') return 4;
  if (mode === 'defensive') return 3;
  return 2;
}

interface TelemetryData {
  id: string;
  label: string;
  position: [number, number, number];
  velocity: [number, number, number];
  speed: number;
  heading: number;
  state: string;
  mode: string;
  badge: string;
  color: string;
  isDecoy?: boolean;
}

interface ActiveDroneData extends TelemetryData {
  distance: number;
  relativePos: [number, number, number];
}

interface DroneTelemetryOverlayProps {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  distanceFilter?: 'all' | '20' | '50';
  onDistanceFilterChange?: (filter: 'all' | '20' | '50') => void;
}

export function DroneTelemetryOverlay({ 
  isExpanded = false, 
  onToggleExpand,
  distanceFilter = 'all',
  onDistanceFilterChange
}: DroneTelemetryOverlayProps) {
  const playerPosition = useGameStore(state => state.playerPosition);
  const gameState = useGameStore(state => state.gameState);
  const pingNearestDrone = useGameStore(state => state.pingNearestDrone);
  const pingDrone = useGameStore(state => state.pingDrone);
  const pingedDroneId = useGameStore(state => state.pingedDroneId);
  const lastPingTime = useGameStore(state => state.lastPingTime);
  const targetedDroneId = useGameStore(state => state.targetedDroneId);
  const setTargetedDroneId = useGameStore(state => state.setTargetedDroneId);
  
  const [closestDrone, setClosestDrone] = useState<TelemetryData | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [relativePos, setRelativePos] = useState<[number, number, number] | null>(null);
  const [allDrones, setAllDrones] = useState<ActiveDroneData[]>([]);
  
  const sweepAngleRef = useRef(0);
  const [sweepAngle, setSweepAngle] = useState(0);
  const [isPingActive, setIsPingActive] = useState(false);
  const lastSoundTimeRef = useRef<number>(0);

  // Interactive controls within the Expanded views
  const [isDampeningNoise, setIsDampeningNoise] = useState(false);
  const [noiseStatusText, setNoiseStatusText] = useState('SPECTRUM STEADY');
  const [spectrogramMode, setSpectrogramMode] = useState<'alpha' | 'beta'>('alpha');
  const [selectedDroneId, setSelectedDroneId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'PROXIMITY' | 'THREAT' | 'BATTERY'>('PROXIMITY');

  // Memoized filtered and sorted list based on ID, behavior class matrix, and sort preference
  const filteredDrones = useMemo(() => {
    let list = allDrones;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(drv => {
        const matchId = drv.id.toLowerCase().includes(term);
        const matchLabel = drv.label.toLowerCase().includes(term);
        const matchBdg = drv.badge.toLowerCase().includes(term);
        return matchId || matchLabel || matchBdg;
      });
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'PROXIMITY') {
        return a.distance - b.distance;
      }
      if (sortBy === 'THREAT') {
        const aThreat = getThreatValue(a.mode, a.distance, a.isDecoy);
        const bThreat = getThreatValue(b.mode, b.distance, b.isDecoy);
        if (bThreat !== aThreat) {
          return bThreat - aThreat; // Highest threat level first
        }
        return a.distance - b.distance; // secondary sort by proximity
      }
      if (sortBy === 'BATTERY') {
        const aBattery = getDeterministicDroneStats(a.id, a.label, a.badge).batteryVal;
        const bBattery = getDeterministicDroneStats(b.id, b.label, b.badge).batteryVal;
        if (aBattery !== bBattery) {
          return aBattery - bBattery; // Lowest battery first (critical battery targets)
        }
        return a.distance - b.distance; // secondary sort by proximity
      }
      return 0;
    });
  }, [allDrones, searchTerm, sortBy]);

  // Triggering visual/audio loading state on button taps
  const [isCalibratingFreq, setIsCalibratingFreq] = useState(false);
  const [linkDecibels, setLinkDecibels] = useState(-58);

  useEffect(() => {
    if (pingedDroneId) {
      const timeElapsed = Date.now() - lastPingTime;
      if (timeElapsed < 3000) {
        setIsPingActive(true);
        const timer = setTimeout(() => {
          setIsPingActive(false);
        }, 3000 - timeElapsed);
        return () => clearTimeout(timer);
      }
    }
    setIsPingActive(false);
  }, [pingedDroneId, lastPingTime]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    let animFrame: number;
    
    const updateTelemetry = () => {
      // Rotate scanner sweep angle
      sweepAngleRef.current = (sweepAngleRef.current + 3) % 360;
      setSweepAngle(sweepAngleRef.current);

      const g = window as any;
      const drones = g.droneTelemetry;
      
      if (!drones || Object.keys(drones).length === 0) {
        setClosestDrone(null);
        setDistance(null);
        setRelativePos(null);
        setAllDrones([]);
        animFrame = requestAnimationFrame(updateTelemetry);
        return;
      }

      let minDistance = Infinity;
      let closestRef: TelemetryData | null = null;
      let relOffset: [number, number, number] = [0, 0, 0];
      
      const activeList: ActiveDroneData[] = [];

      Object.keys(drones).forEach(id => {
        const d = drones[id] as TelemetryData;
        if (d.state === 'disabled') return;

        const dx = d.position[0] - playerPosition[0];
        const dy = d.position[1] - playerPosition[1];
        const dz = d.position[2] - playerPosition[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // Filter by distance if specified
        if (distanceFilter === '20' && dist > 20) return;
        if (distanceFilter === '50' && dist > 50) return;

        const fullData: ActiveDroneData = {
          ...d,
          distance: dist,
          relativePos: [dx, dy, dz]
        };
        activeList.push(fullData);

        if (dist < minDistance) {
          minDistance = dist;
          closestRef = d;
          relOffset = [dx, dy, dz];
        }
      });

      // Sort drones by proximity ascending
      activeList.sort((a, b) => a.distance - b.distance);
      setAllDrones(activeList);

      if (closestRef) {
        setClosestDrone({ ...closestRef });
        setDistance(minDistance);
        setRelativePos(relOffset);

        // Audio Proximity Warning (throttled to once per 1.2 seconds)
        if (minDistance < 5.0) {
          const nowTimestamp = Date.now();
          if (nowTimestamp - lastSoundTimeRef.current > 1200) {
            lastSoundTimeRef.current = nowTimestamp;
            soundManager.playSysAlert('ping');
          }
        }
      } else {
        setClosestDrone(null);
        setDistance(null);
        setRelativePos(null);
      }

      animFrame = requestAnimationFrame(updateTelemetry);
    };

    animFrame = requestAnimationFrame(updateTelemetry);
    return () => cancelAnimationFrame(animFrame);
  }, [playerPosition, gameState, distanceFilter]);

  if (gameState !== 'playing') return null;

  // Derive Compass Letter from Heading degrees (0..360) where 0 is North
  const getCompassDirection = (deg: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const idx = Math.round(((deg % 360) / 45)) % 8;
    return directions[idx];
  };

  const threatLevel = closestDrone ? (
    closestDrone.mode === 'aggressive' ? { label: 'CRITICAL', color: 'text-red-500 border-red-500/30 bg-red-500/10' } :
    closestDrone.mode === 'defensive' ? { label: 'GUARDING', color: 'text-blue-400 border-blue-500/30 bg-blue-500/5' } :
    { label: 'SCOUTING', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' }
  ) : null;

  // Handle high-tech sensory calibration interactions
  const triggerDampening = () => {
    soundManager.playSysAlert('click');
    setIsDampeningNoise(true);
    setNoiseStatusText('FILTERING WAVE HARMONICS...');
    setTimeout(() => {
      setIsDampeningNoise(false);
      setNoiseStatusText('DAMPENED: SIGNAL CLEAR');
      soundManager.playSysAlert('start');
      setTimeout(() => setNoiseStatusText('SPECTRUM STEADY'), 3000);
    }, 1500);
  };

  const triggerCalibration = () => {
    soundManager.playSysAlert('click');
    setIsCalibratingFreq(true);
    setTimeout(() => {
      setIsCalibratingFreq(false);
      setLinkDecibels(prev => Math.min(-30, prev + Math.floor(Math.random() * 8) + 4));
      soundManager.playSysAlert('start');
    }, 1200);
  };

  // Generate dynamic wavepath coordinates based on current scanner sweep angle
  const getWavePath = () => {
    const wavePoints = [];
    const pointsCount = 45;
    const factor = spectrogramMode === 'alpha' ? 0.45 : 0.75;
    const amplitude = spectrogramMode === 'alpha' ? 14 : 22;
    for (let i = 0; i < pointsCount; i++) {
      const x = i * 8.5;
      const variation = Math.sin((i + sweepAngle / 6) * factor) * amplitude * (Math.random() * 0.15 + 0.9);
      const y = 35 + variation + (isDampeningNoise ? Math.sin(i * 1.5) * 2 : 0);
      wavePoints.push(`${x},${y}`);
    }
    return `M ${wavePoints.join(' L ')}`;
  };

  // Selected Drone Details (if any specified, else default to closest)
  const focusedNode = filteredDrones.find(d => d.id === selectedDroneId) || filteredDrones[0] || (closestDrone ? { ...closestDrone, distance: distance || 0, relativePos: relativePos || [0,0,0] } : null);

  // EXPANDED MULTI-DRONE DEEP ANALYSIS SCREEN
  if (isExpanded) {
    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col p-4 md:p-6 bg-slate-950/98 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] overflow-hidden justify-between pointer-events-auto select-none"
        >
          {/* Neon Glow top-line accent */}
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-rose-600 shadow-[0_0_15px_rgba(34,211,238,0.8)]" />

          {/* Header Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-white/10 pb-4 font-mono select-none">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-950/40 border border-cyan-500/45 rounded-lg text-cyan-400">
                <Cpu className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-fuchsia-500 font-extrabold tracking-widest uppercase">COGNITIVE SENSOR TELEMETRY SYSTEM</span>
                  <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-extrabold text-[8px] px-1.5 py-0.5 rounded-sm flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live Data Link
                  </span>
                </div>
                <h1 className="text-white text-base md:text-lg font-black tracking-wider uppercase">
                  PILOT HOLOGRAPHIC DIAGNOSTIC SCREEN
                </h1>
              </div>
            </div>

            {/* Sub-actions / Close button */}
            <div className="flex flex-wrap items-center gap-3.5 w-full md:w-auto justify-end">
              {/* Distance Filter Selector in Expanded Header */}
              <div className="flex items-center gap-1 bg-zinc-950/60 border border-white/10 px-2 py-1 rounded-lg text-xs font-bold text-zinc-400 font-mono">
                <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-extrabold mr-1">SCAN BOUNDARY:</span>
                <button
                  type="button"
                  onClick={() => {
                    onDistanceFilterChange?.('all');
                    soundManager.playSysAlert('click');
                  }}
                  className={`px-2 py-1 rounded text-[10px] select-none transition-all cursor-pointer font-bold ${distanceFilter === 'all' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/35 shadow-[0_0_8px_rgba(6,182,212,0.2)]' : 'hover:text-zinc-350 border border-transparent'}`}
                >
                  ALL SECTORS
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDistanceFilterChange?.('50');
                    soundManager.playSysAlert('click');
                  }}
                  className={`px-2 py-1 rounded text-[10px] select-none transition-all cursor-pointer font-bold ${distanceFilter === '50' ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/35' : 'hover:text-zinc-350 border border-transparent'}`}
                >
                  &lt; 50M
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDistanceFilterChange?.('20');
                    soundManager.playSysAlert('click');
                  }}
                  className={`px-2 py-1 rounded text-[10px] select-none transition-all cursor-pointer font-bold ${distanceFilter === '20' ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40 animate-pulse' : 'hover:text-zinc-350 border border-transparent'}`}
                >
                  &lt; 20M
                </button>
              </div>

              <span className="text-[9.5px] text-zinc-500 font-bold hidden md:inline uppercase tracking-widest">
                LINK LATENCY: <span className="text-cyan-400">14ms</span>
              </span>
              <button
                onClick={onToggleExpand}
                className="px-3.5 py-2 bg-rose-950/30 hover:bg-rose-900/60 border border-rose-500/30 hover:border-rose-400 rounded-lg text-rose-300 hover:text-white transition-all text-xs font-bold font-mono tracking-widest uppercase flex items-center gap-2 cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.15)] select-none"
              >
                <X className="w-4 h-4" /> COLLAPSE HUD
              </button>
            </div>
          </div>

          {/* Dual Panel Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full flex-1 my-5 overflow-hidden">
            
            {/* LEFT COMPILER: ACTIVE FLEET REGISTRY */}
            <div className="lg:col-span-7 flex flex-col h-full bg-slate-900/30 border border-white/5 rounded-xl overflow-hidden p-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-white/5 pb-2.5 mb-3 gap-3">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                  <Layers className="w-4 h-4" />
                  <span>
                    SPECTRUM REGISTRY {searchTerm ? `(${filteredDrones.length}/${allDrones.length})` : `(${allDrones.length} ACTIVE)`}
                  </span>
                </div>
                
                {/* Tactical Search Field */}
                <div className="flex items-center gap-2 font-mono">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyan-400/50" />
                    <input
                      type="text"
                      placeholder="SEARCH BY ID / CLASS..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-44 pl-7 pr-6 py-1 bg-black/60 hover:bg-slate-900/60 focus:bg-slate-900 border border-cyan-500/20 hover:border-cyan-400/40 focus:border-cyan-400 text-[10px] text-white font-bold rounded uppercase placeholder-cyan-500/30 tracking-wider focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          soundManager.playSysAlert('click');
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-rose-450 hover:text-rose-300 font-bold text-[9px] cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[8px] text-zinc-500 uppercase font-black tracking-wider">SORT:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value as any);
                        soundManager.playSysAlert('click');
                      }}
                      className="bg-black/60 hover:bg-slate-900/60 border border-cyan-500/20 hover:border-cyan-400/40 text-[9.5px] text-cyan-400 font-extrabold uppercase py-0.5 px-2 rounded cursor-pointer font-mono tracking-widest focus:outline-none focus:border-cyan-400 transition-all select-none"
                    >
                      <option value="PROXIMITY" className="bg-slate-950 text-cyan-400">PROXIMITY</option>
                      <option value="THREAT" className="bg-slate-950 text-cyan-400">THREAT RANK</option>
                      <option value="BATTERY" className="bg-slate-950 text-cyan-400">POWER CELLS</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Drone Registry Items */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 scrollbar-thin scrollbar-thumb-white/10">
                {filteredDrones.length === 0 ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-10 text-center font-mono">
                    <Activity className="w-8 h-8 text-cyan-500/20 animate-spin mb-3" style={{ animationDuration: '4s' }} />
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">
                      {allDrones.length === 0 ? 'NO DRONE TELEMETRY DATA RECOGNIZED' : 'NO SENSOR RECORDS FOUND'}
                    </p>
                    <p className="text-[9.5px] text-zinc-600 mt-1 max-w-sm font-sans">
                      {allDrones.length === 0 
                        ? 'Awaiting response from active orbital satellites. Please make sure enemies have deployed on the battleground.'
                        : `Your query "${searchTerm}" did not match any active drone IDs or classes in real-time memory.`
                      }
                    </p>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {filteredDrones.map(drv => {
                      const isSelected = focusedNode?.id === drv.id;
                      const isPinned = pingedDroneId === drv.id;
                      const stats = getDeterministicDroneStats(drv.id, drv.label, drv.badge);
                      const threatInfo = getDroneThreatLevel(drv.mode, drv.distance, drv.isDecoy);
                      return (
                        <motion.div
                          key={drv.id}
                          initial={{ opacity: 0, x: -20, scale: 0.96 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: 20, scale: 0.96 }}
                          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                          layout
                          onClick={() => {
                            setSelectedDroneId(drv.id);
                            soundManager.playSysAlert('click');
                          }}
                          className={`group p-3 rounded-lg border text-left flex flex-col gap-3 cursor-pointer transition-all duration-200 relative overflow-hidden ${
                            drv.isDecoy
                              ? isSelected
                                ? 'bg-sky-950/20 border-dashed border-sky-500/40 opacity-70 shadow-[0_0_10px_rgba(56,189,248,0.15)]'
                                : 'bg-black/20 border-dashed border-white/10 opacity-55 hover:border-sky-500/30'
                              : isSelected
                                ? 'bg-slate-900/80 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:border-cyan-500/30'
                                : 'bg-black/40 border-white/5 hover:border-white/15 hover:border-cyan-500/30'
                          }`}
                        >
                          {/* Selected overlay accent indicator */}
                          {isSelected && (
                            <div className={`absolute left-0 top-0 bottom-0 w-1 shadow-[0_0_8px_rgba(6,182,212,0.8)] ${drv.isDecoy ? 'bg-sky-400' : 'bg-cyan-400'}`} />
                          )}
  
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 w-full">
                            <div className="flex gap-4 items-center">
                              <div 
                                className={`w-2.5 h-10 rounded shrink-0 ${drv.isDecoy ? 'opacity-40 border-r border-dashed' : ''}`} 
                                style={{ backgroundColor: drv.color }} 
                              />
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-black uppercase text-white tracking-wide">
                                    {drv.label.toUpperCase()}
                                  </span>
                                  <span className="text-[8px] font-black tracking-widest px-1 py-0.2 bg-white/5 text-zinc-400 border border-white/5 rounded-sm uppercase">
                                    {drv.id}
                                  </span>
                                  {(() => {
                                    const classInfo = getDroneClassInfo(drv.label, drv.badge, drv.isDecoy);
                                    return (
                                      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[8px] font-black tracking-[0.1em] uppercase select-none ${classInfo.colorClass}`}>
                                        <classInfo.Icon className="w-2.5 h-2.5" />
                                        <span>{classInfo.tag}</span>
                                      </div>
                                    );
                                  })()}
                                </div>
                                
                                {/* Proximity Stats Row */}
                                <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 mt-1 font-mono text-[9px] text-zinc-400">
                                  <span>MATRIX: <span className="text-fuchsia-400 font-bold">{drv.badge}</span></span>
                                  <span>•</span>
                                  <span>RANGE: <span className="text-cyan-300 font-bold">{drv.distance.toFixed(1)}m</span></span>
                                  <span>•</span>
                                  <span>VECTOR: <span className="text-pink-400 font-bold">{Math.round(drv.relativePos[0])}, {Math.round(drv.relativePos[2])}</span></span>
                                </div>
                              </div>
                            </div>
    
                            {/* Speed tape & Lock button */}
                            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-2.5 md:pt-0">
                              <div className="flex flex-col text-right pr-2">
                                <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-tight">VELOCITY VECTOR</span>
                                <span className="text-xs font-black text-white">{drv.speed.toFixed(2)} m/s</span>
                              </div>
    
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newTarget = targetedDroneId === drv.id ? null : drv.id;
                                    setTargetedDroneId(newTarget);
                                    soundManager.playSysAlert('click');
                                  }}
                                  className={`px-3 py-1.5 rounded text-[9.5px] font-black uppercase tracking-wider transition-all duration-200 select-none flex items-center gap-1.5 cursor-pointer border ${
                                    targetedDroneId === drv.id
                                      ? 'bg-cyan-500/25 text-cyan-300 border-cyan-500/60 shadow-[0_0_8px_rgba(6,182,212,0.3)] animate-pulse'
                                      : 'bg-zinc-950/60 hover:bg-cyan-950/40 text-cyan-400 hover:text-white border-cyan-500/20 hover:border-cyan-400/40'
                                  }`}
                                  title={targetedDroneId === drv.id ? "De-target drone" : "Lock persistent target highlight"}
                                >
                                  <Crosshair className={`w-3.5 h-3.5 ${targetedDroneId === drv.id ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
                                  {targetedDroneId === drv.id ? 'LOCK ACTIVE' : 'TARGET HUD'}
                                </button>
  
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    pingDrone(drv.id, drv.position);
                                  }}
                                  className={`px-3 py-1.5 rounded text-[9.5px] font-black uppercase tracking-wider transition-all duration-200 select-none flex items-center gap-1.5 cursor-pointer ${
                                    isPinned
                                      ? 'bg-gradient-to-r from-red-650 to-rose-700 text-white border border-red-500/50 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                                      : 'bg-zinc-950/60 hover:bg-cyan-950/40 text-cyan-300 hover:text-white border-cyan-500/30 hover:border-cyan-400'
                                  }`}
                                >
                                  <Target className={`w-3.5 h-3.5 ${isPinned ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
                                  {isPinned ? 'TARGET LOCKED' : 'FOCUS PIN'}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Expanded Detail View: battery, weapon status, armor integrity */}
                          <AnimatePresence initial={false}>
                            {isSelected && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className="overflow-hidden border-t border-white/5 pt-3 w-full"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  {/* Battery Stats Container */}
                                  <div className="bg-zinc-950/70 border border-white/5 rounded-lg p-2.5 flex flex-col gap-1.5 justify-between font-mono">
                                    <div className="flex items-center justify-between text-[7.5px] font-black tracking-widest text-[#10b981] uppercase">
                                      <span className="text-emerald-450">POWER CELLS</span>
                                      <span className="flex items-center gap-1 text-emerald-450 animate-pulse">
                                        <span className="w-1 h-1 rounded-full bg-emerald-500" />
                                        ONLINE
                                      </span>
                                    </div>
                                    <div className="flex items-end justify-between leading-none">
                                      <span className="text-xs font-black text-white">{stats.batteryVal}%</span>
                                      <span className="text-[7px] text-zinc-500 font-extrabold uppercase">LI-ION UNIT</span>
                                    </div>
                                    <div className="w-full bg-black/60 h-1 rounded-sm overflow-hidden border border-white/5 relative">
                                      <div 
                                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_6px_rgba(16,185,129,0.4)]"
                                        style={{ width: `${stats.batteryVal}%` }}
                                      />
                                    </div>
                                  </div>

                                  {/* Weapon Subsytem Container */}
                                  <div className="bg-zinc-950/70 border border-white/5 rounded-lg p-2.5 flex flex-col gap-1.5 justify-between font-mono">
                                    <div className="flex items-center justify-between text-[7.5px] font-black tracking-widest text-cyan-400 uppercase">
                                      <span>WEAPONS ARRAY</span>
                                      <span className="text-zinc-500">RECHARGE</span>
                                    </div>
                                    <div className="flex items-end justify-between leading-none">
                                      <span className="text-[8.5px] font-black text-cyan-200 uppercase truncate max-w-[120px]">{stats.weaponName}</span>
                                      <span className="text-[7.5px] text-cyan-400 font-black uppercase tracking-wider">{stats.weaponStatus}</span>
                                    </div>
                                    <div className="w-full bg-black/60 h-1 rounded-sm overflow-hidden border border-white/5 relative">
                                      <div 
                                        className="h-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.4)]"
                                        style={{ width: `${stats.weaponCharge}%` }}
                                      />
                                    </div>
                                  </div>

                                  {/* Armor Integration Container */}
                                  <div className="bg-zinc-950/70 border border-white/5 rounded-lg p-2.5 flex flex-col gap-1.5 justify-between font-mono">
                                    <div className="flex items-center justify-between text-[7.5px] font-black tracking-widest text-amber-500 uppercase">
                                      <span>ARMOR PLATING</span>
                                      <span className="text-zinc-500">NANOSHIELD</span>
                                    </div>
                                    <div className="flex items-end justify-between leading-none">
                                      <span className="text-xs font-black text-white">{stats.armorVal}%</span>
                                      <span className="text-[7px] text-zinc-500 font-extrabold uppercase">STRENGTH</span>
                                    </div>
                                    <div className="w-full bg-black/60 h-1 rounded-sm overflow-hidden border border-white/5 relative">
                                      <div 
                                        className="h-full bg-gradient-to-r from-amber-500 to-orange-400 shadow-[0_0_6px_rgba(245,158,11,0.4)]"
                                        style={{ width: `${stats.armorVal}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Sliding Tactical Hover HUD Tooltip */}
                          <div className="absolute right-0 top-0 bottom-0 w-[45%] md:w-[38%] bg-[#080f1e]/98 border-l border-cyan-500/50 p-2.5 opacity-0 group-hover:opacity-100 translate-x-[20px] group-hover:translate-x-0 transition-all duration-300 ease-out pointer-events-none z-30 flex flex-col justify-center font-mono text-[8.5px] select-none shadow-[-5px_0_15px_rgba(6,182,212,0.15)] leading-tight">
                            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1 mb-1.5">
                              <span className="flex items-center gap-1 font-black text-[7.5px] text-cyan-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                SCANNER OVERLAY
                              </span>
                              <span className="text-[6.5px] text-cyan-400/50 font-black tracking-widest">REAL-TIME</span>
                            </div>
                            <div className="space-y-1.5 text-zinc-350">
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-zinc-400 text-[8px]">EST THREAT:</span>
                                <span className={`font-black px-1.5 rounded text-[7.5px] tracking-wider uppercase ${threatInfo.colorText} ${threatInfo.colorBg} border ${threatInfo.colorBorder}`} style={{ textShadow: '0 0 6px currentColor' }}>
                                  {threatInfo.label}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-zinc-400 text-[8px]">DISTANCE:</span>
                                <span className="text-white font-black text-[9px]">
                                  {drv.distance.toFixed(1)}m
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-zinc-400 text-[8px]">BEARING:</span>
                                <span className="text-cyan-300 font-bold">
                                  {drv.heading ? Math.round(drv.heading) : 0}° ({drv.heading ? (() => {
                                    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
                                    const idx = Math.round(((drv.heading % 360) / 45)) % 8;
                                    return directions[idx];
                                  })() : 'N'})
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* RIGHT COMPILER: ADVANCED RADAR MAP & ANALYTICS */}
            <div className="lg:col-span-5 flex flex-col gap-5 h-full overflow-hidden">
              
              {/* PANEL B1: GRAPHICS RADAR SCOPE */}
              <div className="flex-1 bg-slate-900/30 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-between relative overflow-hidden">
                <div className="absolute top-3 left-3 flex items-center gap-1.5 text-cyan-400 text-xs font-black uppercase tracking-wider font-mono">
                  <Compass className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span>HUD RADAR SECTOR</span>
                </div>

                <div className="text-[7.5px] text-zinc-500 font-extrabold uppercase absolute top-3 right-3 font-mono">
                  COORDINATE GRID (0, 0) CENTER
                </div>

                {/* SVG Visual Radar Plot */}
                <div className="relative w-56 h-56 flex items-center justify-center my-4">
                  
                  {/* Dynamic rotating scanner lines */}
                  <div className="absolute inset-0 rounded-full border border-cyan-500/10 pointer-events-none" />
                  <div className="absolute inset-4 rounded-full border border-cyan-500/5 pointer-events-none" />
                  <div className="absolute inset-10 rounded-full border border-cyan-500/10 pointer-events-none" />
                  <div className="absolute inset-16 rounded-full border border-cyan-500/5 pointer-events-none" />

                  {/* SVG Canvas drawing radar coordinates */}
                  <svg className="w-full h-full transform -rotate-90 origin-center pointer-events-auto" viewBox="0 0 200 200">
                    {/* Concentric rings */}
                    <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(6, 182, 212, 0.15)" strokeWidth="1" strokeDasharray="3,3" />
                    <circle cx="100" cy="100" r="65" fill="none" stroke="rgba(6, 182, 212, 0.08)" strokeWidth="1" />
                    <circle cx="100" cy="100" r="40" fill="none" stroke="rgba(6, 182, 212, 0.15)" strokeWidth="1" strokeDasharray="3,3" />
                    <circle cx="100" cy="100" r="15" fill="none" stroke="rgba(6, 182, 212, 0.08)" strokeWidth="1" />

                    {/* Crosshair guidelines */}
                    <line x1="10" y1="100" x2="190" y2="100" stroke="rgba(6, 182, 212, 0.12)" strokeWidth="0.8" />
                    <line x1="100" y1="10" x2="100" y2="190" stroke="rgba(6, 182, 212, 0.12)" strokeWidth="0.8" />

                    {/* Scanning sweep path node */}
                    <line 
                      x1="100" 
                      y1="100" 
                      x2={100 + 90 * Math.cos((sweepAngle * Math.PI) / 180)} 
                      y2={100 + 90 * Math.sin((sweepAngle * Math.PI) / 180)} 
                      stroke="rgba(6, 182, 212, 0.45)" 
                      strokeWidth="1.5" 
                      className="shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                    />

                    {/* Plot Drones onto SVG scope */}
                    {allDrones.map(d => {
                      // Normalize distance to radius rMax = 90 (represents 100 meters boundary)
                      const maxDistanceBoundary = 85; 
                      const normalizedDistance = Math.min(90, (d.distance / maxDistanceBoundary) * 90);
                      
                      // Calculate coordinate angles relative to absolute heading in store
                      const dxNorm = d.relativePos[0];
                      const dzNorm = d.relativePos[2];
                      const localAngle = Math.atan2(dzNorm, dxNorm);

                      // Translate coordinates relative to SVG Center (100, 100)
                      const cx = 100 + normalizedDistance * Math.cos(localAngle);
                      const cy = 100 + normalizedDistance * Math.sin(localAngle);

                      const isSelected = focusedNode?.id === d.id;
                      const isPinned = pingedDroneId === d.id;

                      return (
                        <g 
                          key={`radar-node-${d.id}`}
                          onClick={() => {
                            setSelectedDroneId(d.id);
                            soundManager.playSysAlert('click');
                          }}
                          className="cursor-pointer group"
                        >
                          {/* Radial Pulse lock indicator */}
                          {isPinned && (
                            <circle 
                              cx={cx} 
                              cy={cy} 
                              r="10" 
                              fill="none" 
                              stroke="#ef4444" 
                              strokeWidth="0.8" 
                              className="animate-ping" 
                              style={{ animationDuration: '1.2s' }}
                            />
                          )}

                          {/* Selected highlighting border */}
                          {isSelected && (
                            <circle cx={cx} cy={cy} r="6.5" fill="none" stroke="#22d3ee" strokeWidth="1.2" />
                          )}

                          {/* Drone dot core */}
                          <circle 
                            cx={cx} 
                            cy={cy} 
                            r={isSelected ? "4.5" : "3.5"} 
                            fill={isPinned ? '#ef4444' : d.color} 
                            className="transition-all duration-300"
                            filter="drop-shadow(0px 0px 4px rgba(255, 255, 255, 0.4))"
                          />
                        </g>
                      );
                    })}

                    {/* Center Pilot Marker */}
                    <circle cx="100" cy="100" r="3.5" fill="#22d3ee" stroke="#000" strokeWidth="1" />
                  </svg>
                  
                  {/* Digital overlay text labels inside radar boundary */}
                  <div className="absolute top-[18px] text-[7.5px] text-cyan-400 font-extrabold uppercase pointer-events-none">85m limit</div>
                  <div className="absolute bottom-[18px] text-[7.5px] text-cyan-400 font-extrabold uppercase pointer-events-none">SYS CHASSIS</div>
                </div>

                {/* Compass radial information */}
                <div className="flex gap-4 border border-white/5 bg-black/60 p-2.5 rounded-lg w-full font-mono text-[9.5px]">
                  <div className="flex-1 flex flex-col items-center border-r border-white/5">
                    <span className="text-[7.5px] text-zinc-500 uppercase font-black">NEAREST COMPACT</span>
                    <span className="text-white font-extrabold mt-0.5 max-w-[120px] truncate uppercase">{focusedNode?.label || 'NONE'}</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center border-r border-white/5">
                    <span className="text-[7.5px] text-zinc-500 uppercase font-black">RANGE READING</span>
                    <span className="text-cyan-300 font-black mt-0.5">{focusedNode ? `${focusedNode.distance.toFixed(1)}m` : '0.0m'}</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center">
                    <span className="text-[7.5px] text-zinc-500 uppercase font-black">MATRIX STEADY</span>
                    <span className="text-fuchsia-400 font-black mt-0.5 uppercase">{focusedNode?.badge || 'IDLE'}</span>
                  </div>
                </div>
              </div>

              {/* PANEL B2: SIGNAL SPECTROGRAM & SYSTEM NOISE */}
              <div className="bg-slate-900/30 border border-white/5 rounded-xl p-4 flex flex-col gap-3 font-mono">
                <div className="flex justify-between items-center text-cyan-400 text-xs font-black uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span>SIGNAL CALIBRATOR &amp; SPECTRUM</span>
                  </span>
                  
                  <div className="flex gap-1.5 text-[8.5px]">
                    <button 
                      onClick={() => { setSpectrogramMode('alpha'); soundManager.playSysAlert('click'); }}
                      className={`px-1.5 py-0.5 border rounded-xs cursor-pointer select-none ${spectrogramMode === 'alpha' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-transparent text-zinc-500 border-white/5'}`}
                    >
                      ALPHA
                    </button>
                    <button 
                      onClick={() => { setSpectrogramMode('beta'); soundManager.playSysAlert('click'); }}
                      className={`px-1.5 py-0.5 border rounded-xs cursor-pointer select-none ${spectrogramMode === 'beta' ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40' : 'bg-transparent text-zinc-500 border-white/5'}`}
                    >
                      BETA
                    </button>
                  </div>
                </div>

                {/* Oscillating Waveform Viewbox */}
                <div className="relative h-[70px] bg-[#0c0d12]/90 border border-white/5 rounded-lg overflow-hidden flex items-center">
                  <svg className="w-full h-full pointer-events-none" viewBox="0 0 380 70">
                    <path 
                      d={getWavePath()} 
                      fill="none" 
                      stroke={spectrogramMode === 'alpha' ? '#22d3ee' : '#d946ef'} 
                      strokeWidth="1.5" 
                      className="shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all duration-200"
                    />
                    
                    {/* Background horizontal lines */}
                    <line x1="0" y1="35" x2="380" y2="35" stroke="rgba(255,255,255,0.04)" strokeWidth="0.8" />
                  </svg>

                  {/* Noise Dampening Status Overlay */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    <span className="text-[8px] text-cyan-400/80 font-bold uppercase tracking-widest">{noiseStatusText}</span>
                  </div>
                  
                  <div className="absolute bottom-2 right-2 text-[7.5px] text-zinc-650 font-bold uppercase tracking-wider">
                    SQUARE COHERENCY CODE: {Math.round(sweepAngle * 0.45)}
                  </div>
                </div>

                {/* Advanced Quick Control Buttons */}
                <div className="grid grid-cols-2 gap-3 mt-1 text-[9px] font-bold">
                  <button
                    onClick={triggerDampening}
                    disabled={isDampeningNoise}
                    className="py-2.5 bg-cyan-950/20 hover:bg-cyan-950/40 disabled:bg-cyan-950/40 border border-cyan-500/35 hover:border-cyan-400 text-cyan-300 hover:text-white rounded-lg flex items-center justify-center gap-1.5 uppercase tracking-widest transition-all cursor-pointer select-none"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    DAMPEN NOISE CODES
                  </button>

                  <button
                    onClick={triggerCalibration}
                    disabled={isCalibratingFreq}
                    className="py-2.5 bg-fuchsia-950/20 hover:bg-fuchsia-950/40 disabled:bg-fuchsia-950/40 border border-fuchsia-500/35 hover:border-fuchsia-400 text-fuchsia-300 hover:text-white rounded-lg flex items-center justify-center gap-1.5 uppercase tracking-widest transition-all cursor-pointer select-none"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-fuchsia-400 animate-pulse" />
                    {isCalibratingFreq ? 'ALIGNING LINK...' : `RE-ALIGN LINK (${linkDecibels}dB)`}
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Footer Cybernetic telemetry stream */}
          <div className="border-t border-white/5 pt-3 flex flex-col sm:flex-row justify-between items-center gap-2 font-mono text-[8.5px] text-zinc-500">
            <span className="uppercase font-bold tracking-widest">TRANSMISSION CLASSIFIED INTEGRATED SYSTEM SECURITY 256-BIT SECURE</span>
            <span className="flex items-center gap-1.5 uppercase">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              PILOT NODE SYSTEM DEPLOYMENT COMPLETE
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // STANDARD IN-GAME HUD COLLAPSED CARD VIEW
  return (
    <div id="drone-telemetry-panel" className="relative z-40 select-none pointer-events-auto w-full flex flex-col gap-2">
      <AnimatePresence>
        {isPingActive && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: 1,
            }}
            exit={{ 
              scale: 0, 
              opacity: 0,
              transition: { duration: 3.0, ease: "easeInOut" }
            }}
            style={{
              filter: 'drop-shadow(0 0 12px rgba(239, 68, 68, 0.8))'
            }}
            transition={{
              scale: {
                repeat: Infinity,
                duration: 1.5,
                ease: "easeInOut"
              },
              default: { duration: 0.3 }
            }}
            className="flex items-center gap-2.5 p-2.5 rounded bg-red-950/50 border border-red-500/50 text-red-400 font-bold uppercase text-[9px] tracking-widest font-mono"
          >
            <Target className="w-4 h-4 text-red-500 animate-[spin_3s_linear_infinite]" />
            <div className="flex-1 flex justify-between items-center">
              <span className="animate-pulse">TACTICAL LOCK ON ACTIVE</span>
              <span className="text-[8.5px] px-1.5 py-0.5 bg-red-500/30 border border-red-400/50 rounded-sm font-black text-red-200">
                3S COOLDOWN
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!closestDrone ? (
          <motion.div
            key="scanning"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="flex flex-col gap-1.5 p-3 rounded bg-black/80 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)] backdrop-blur-md w-full text-mono font-mono"
          >
            <div className="flex items-center justify-between text-[10px] text-cyan-400/50 uppercase tracking-widest border-b border-cyan-500/10 pb-1">
              <span className="flex items-center gap-1.5 font-bold animate-pulse">
                <Radio className="w-3.5 h-3.5" /> TELEMETRY INTERCEPT
              </span>
              <span className="text-[9px]">v1.4</span>
            </div>
            <div className="flex flex-col items-center justify-center py-4 text-center">
              {/* Radar scanner visual */}
              <div className="relative w-12 h-12 rounded-full border border-cyan-500/30 flex items-center justify-center mb-2">
                <div 
                  className="absolute w-5 h-[1.5px] bg-cyan-500/80 origin-left left-1/2 top-1/2 shadow-[0_0_4px_rgba(6,182,212,1)]"
                  style={{ transform: `rotate(${sweepAngle}deg)` }}
                />
                <div className="w-2 h-2 rounded-full bg-cyan-500/40 animate-ping" />
              </div>
              <span className="text-[10px] text-cyan-400 font-bold animate-pulse uppercase tracking-wider">
                SCANNING DRONE FREQS...
              </span>
              <span className="text-[8px] text-cyan-400/50 mt-1 uppercase font-normal mb-2">
                Searching orbital parameters
              </span>
              <button
                onClick={pingNearestDrone}
                className="w-full py-2 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 hover:text-white text-[9px] font-black tracking-[0.2em] uppercase rounded-lg cursor-pointer transition-all duration-200 select-none shadow-[0_0_12px_rgba(6,182,212,0.15)] flex items-center justify-center gap-1.5 active:scale-[0.98] pointer-events-auto font-mono"
              >
                <Target className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                MANUAL COMBAT PING
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="tracking"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              borderColor: distance !== null && distance < 5.0 ? '#ef4444' : '#d946ef',
              boxShadow: distance !== null && distance < 5.0 
                ? '0 0 25px rgba(239, 68, 68, 0.45)' 
                : '0 0 20px rgba(217, 70, 239, 0.15)'
            }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className={`flex flex-col gap-1.5 p-3 rounded bg-black/85 border backdrop-blur-sm w-full text-mono font-mono text-white transition-all duration-300 ${
              distance !== null && distance < 5.0 
                ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.35)] animate-[pulse_1s_infinite]' 
                : 'border-fuchsia-500/30'
            }`}
          >
            {/* Critical Range Warning Banner */}
            {distance !== null && distance < 5.0 && (
              <div className="bg-red-950/80 border border-red-500/50 text-red-500 font-bold text-[8.5px] tracking-wide text-center py-1 rounded flex items-center justify-center gap-1.5 animate-pulse font-mono">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-[bounce_0.6s_infinite]" />
                ⚠️ COLLISION WARNING: CONTACT THREAT ({distance.toFixed(1)}m &lt; 5.0m)
              </div>
            )}

            {/* Header */}
            <div className={`flex items-center justify-between text-[10px] uppercase tracking-widest border-b pb-1 font-bold ${
              closestDrone.isDecoy 
                ? 'text-sky-400 border-sky-500/20' 
                : (distance !== null && distance < 5.0 ? 'text-red-500 border-red-500/20' : 'text-fuchsia-400 border-fuchsia-500/20')
            }`}>
              <span className="flex items-center gap-1.5">
                <Target className={`w-3.5 h-3.5 animate-spin ${closestDrone.isDecoy ? 'text-sky-400' : (distance !== null && distance < 5.0 ? 'text-red-500' : 'text-fuchsia-400')}`} style={{ animationDuration: '4s' }} /> {closestDrone.isDecoy ? 'COGNITIVE GHOST DECOY' : 'DRONE TELEMETRY ACQUIRED'}
              </span>
              <span className={`px-1.5 py-0.5 text-[8px] border rounded-sm animate-pulse ${
                closestDrone.isDecoy 
                  ? 'bg-sky-500/20 border-sky-400/40 text-sky-300' 
                  : (distance !== null && distance < 5.0 ? 'bg-red-550/20 border-red-500/40 text-red-400' : 'bg-fuchsia-500/20 border-fuchsia-400/40 text-fuchsia-300')
              }`}>
                {closestDrone.isDecoy ? 'TEMPORAL FOCUS' : (distance !== null && distance < 5.0 ? 'DANGER LOCK' : 'LOCKED')}
              </span>
            </div>

            {/* Drone Basics Grid */}
            <div className="grid grid-cols-2 gap-2 mt-0.5">
              <div className="flex flex-col">
                <span className="text-[8px] text-cyan-400/60 uppercase font-semibold">TARGET IDENTIFIER</span>
                <div className="flex items-center gap-1.5 mt-0.5 max-w-full overflow-hidden">
                  <span className={`text-xs font-black tracking-wide uppercase truncate ${
                    closestDrone.isDecoy 
                      ? 'text-sky-300 text-shadow-[0_0_6px_rgba(56,189,248,0.6)]' 
                      : (distance !== null && distance < 5.0 ? 'text-red-400' : 'text-fuchsia-300')
                  }`} style={{ textShadow: closestDrone.isDecoy ? '0 0 6px rgba(56,189,248,0.6)' : (distance !== null && distance < 5.0 ? '0 0 6px rgba(239,68,68,0.6)' : '0 0 6px rgba(217,70,239,0.6)') }}>
                    {closestDrone.label.toUpperCase()}
                  </span>
                  {(() => {
                    const classInfo = getDroneClassInfo(closestDrone.label, closestDrone.badge, closestDrone.isDecoy);
                    return (
                      <div className={`flex items-center gap-1 px-1 py-0.2 rounded border text-[6.5px] font-black tracking-wider uppercase scale-95 shrink-0 select-none ${classInfo.colorClass}`}>
                        <classInfo.Icon className="w-2.5 h-2.5" />
                        <span>{classInfo.tag.split(' ')[0]}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[8px] text-cyan-400/60 uppercase font-semibold">BEHAVIOR MATRIX</span>
                <span className="text-[10px] font-bold text-white uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: distance !== null && distance < 5.0 ? '#ef4444' : closestDrone.color }} />
                  {closestDrone.badge}
                </span>
              </div>
            </div>

            {/* Position, Threat, Distance Grid */}
            <div className="grid grid-cols-3 gap-1 bg-white/5 border border-white/5 p-1.5 rounded text-center text-mono">
              <div className="flex flex-col items-center border-r border-white/5">
                <span className="text-[8px] text-cyan-400/50 uppercase font-bold">VECTOR DISP</span>
                <span className={`text-[10px] font-black ${
                  distance !== null && distance < 5.0 ? 'text-red-400 animate-[ping_0.8s_infinite]' : 'text-cyan-300'
                }`} style={{ animationDuration: '1.2s' }}>
                  {distance !== null ? `${distance.toFixed(1)}m` : '0.0m'}
                </span>
              </div>
              <div className="flex flex-col items-center border-r border-white/5">
                <span className="text-[8px] text-cyan-400/50 uppercase font-bold">THREAT INDEX</span>
                <span className={`text-[10px] font-black uppercase tracking-wide py-0.5 px-1 rounded-sm border ${
                  closestDrone.isDecoy
                    ? 'text-sky-400 border-sky-500/30 bg-sky-500/10'
                    : (distance !== null && distance < 5.0 ? 'text-red-500 border-red-500/30 bg-red-500/10' : threatLevel?.color)
                }`}>
                  {closestDrone.isDecoy ? 'DECOY (+15s)' : (distance !== null && distance < 5.0 ? 'IMMEDIATE' : threatLevel?.label)}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-cyan-400/50 uppercase font-bold">GRID LOC</span>
                <span className="text-[8px] text-pink-400 font-extrabold truncate w-full">
                  {relativePos ? `${Math.round(relativePos[0])}, ${Math.round(relativePos[2])}` : '0, 0'}
                </span>
              </div>
            </div>

            {/* Velocity Section */}
            <div className="flex flex-col gap-1 bg-black/40 border border-fuchsia-500/10 p-2 rounded">
              <div className="flex items-center justify-between text-[9px] font-bold">
                <span className="flex items-center gap-1 text-cyan-400">
                  <Gauge className="w-3.5 h-3.5 text-cyan-400" /> VELOCITY VECTOR:
                </span>
                <span className="text-white font-extrabold text-sm tracking-wider">
                  {closestDrone.speed.toFixed(2)} <span className="text-[9px] font-normal text-white/50">m/s</span>
                </span>
              </div>
              {/* Performance Indicator Bar */}
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden relative border border-white/5">
                <span 
                  className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-cyan-500 to-fuchsia-500 transition-all duration-100 shadow-[0_0_4px_rgba(217,70,239,0.5)]" 
                  style={{ width: `${Math.min(100, (closestDrone.speed / 6) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[7.5px] text-white/40 mt-0.5 font-sans">
                <span>0.00 M/S</span>
                <span>SUB-ORBITAL LIMIT (6.00 M/S)</span>
              </div>
            </div>

            {/* Heading Section */}
            <div className="flex flex-col gap-1 bg-black/40 border border-fuchsia-500/10 p-2 rounded">
              <div className="flex items-center justify-between text-[9px] font-bold">
                <span className="flex items-center gap-1 text-cyan-400">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" /> RADIAL HEADING:
                </span>
                <span className="text-white font-extrabold text-sm tracking-wider flex items-center gap-1">
                  <span className="text-fuchsia-300 font-black">{closestDrone.heading.toFixed(1)}°</span>
                  <span className="text-[10px] text-fuchsia-400/90 font-black bg-fuchsia-500/15 py-0.5 px-1 bg-opacity-20 border border-fuchsia-400/30 rounded-sm">
                    {getCompassDirection(closestDrone.heading)}
                  </span>
                </span>
              </div>
              
              {/* Interactive Compass Tape Ribbon */}
              <div className="relative h-6 bg-[#0c0d12] border border-white/5 rounded overflow-hidden mt-1 flex items-center justify-center font-mono">
                {/* Dial Tick Tapes */}
                <div 
                  className="absolute flex items-center gap-4 transition-transform duration-100 text-white/30 text-[9.5px] whitespace-nowrap"
                  style={{ transform: `translateX(${-((closestDrone.heading / 360) * 180) + 90}px)` }}
                >
                  <span className={`${getCompassDirection(closestDrone.heading) === 'N' ? 'text-cyan-400 font-extrabold' : ''}`}>N (000°)</span>
                  <span>|</span>
                  <span className={`${getCompassDirection(closestDrone.heading) === 'NE' ? 'text-fuchsia-400 font-extrabold' : ''}`}>NE</span>
                  <span>|</span>
                  <span className={`${getCompassDirection(closestDrone.heading) === 'E' ? 'text-cyan-400 font-extrabold' : ''}`}>E (090°)</span>
                  <span>|</span>
                  <span className={`${getCompassDirection(closestDrone.heading) === 'SE' ? 'text-fuchsia-400 font-extrabold' : ''}`}>SE</span>
                  <span>|</span>
                  <span className={`${getCompassDirection(closestDrone.heading) === 'S' ? 'text-cyan-400 font-extrabold' : ''}`}>S (180°)</span>
                  <span>|</span>
                  <span className={`${getCompassDirection(closestDrone.heading) === 'SW' ? 'text-fuchsia-400 font-extrabold' : ''}`}>SW</span>
                  <span>|</span>
                  <span className={`${getCompassDirection(closestDrone.heading) === 'W' ? 'text-cyan-400 font-extrabold' : ''}`}>W (270°)</span>
                  <span>|</span>
                  <span className={`${getCompassDirection(closestDrone.heading) === 'NW' ? 'text-fuchsia-400 font-extrabold' : ''}`}>NW</span>
                  <span>|</span>
                  <span>N (360°)</span>
                </div>
                {/* Center marker lock-line */}
                <div className="absolute top-0 bottom-0 w-[2px] bg-fuchsia-500 shadow-[0_0_8px_rgba(217,70,239,1)] z-10" />
                <div className="absolute top-0 text-[7px] text-fuchsia-400 font-black z-20">▼</div>
              </div>
            </div>
            
            {/* DUAL ACTION BUTTON GRID FOR HUD LOCK & SATELLITE PING */}
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={() => {
                  const newTarget = targetedDroneId === closestDrone.id ? null : closestDrone.id;
                  setTargetedDroneId(newTarget);
                  soundManager.playSysAlert('click');
                }}
                className={`w-full py-2 border rounded-lg cursor-pointer transition-all duration-200 select-none shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98] pointer-events-auto font-mono text-[9px] font-black uppercase tracking-wider ${
                  targetedDroneId === closestDrone.id
                    ? 'bg-cyan-950/40 text-cyan-300 border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.15)] animate-pulse'
                    : 'bg-zinc-950/60 hover:bg-cyan-950/20 text-cyan-450 hover:text-white border-cyan-500/20 hover:border-cyan-400'
                }`}
              >
                <Crosshair className={`w-3.5 h-3.5 ${targetedDroneId === closestDrone.id ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
                {targetedDroneId === closestDrone.id ? 'HUD LOCK ON' : 'HUD HIGHLIGHT'}
              </button>

              <button
                onClick={pingNearestDrone}
                className="w-full py-2 bg-gradient-to-r from-red-650/30 via-rose-600/35 to-pink-600/30 hover:from-red-650/50 hover:via-rose-600/55 hover:to-pink-600/50 border border-red-500/40 hover:border-red-400 text-red-100 hover:text-white text-[9px] font-black tracking-wider uppercase rounded-lg cursor-pointer transition-all duration-200 select-none shadow-[0_0_15px_rgba(239,68,68,0.15)] flex items-center justify-center gap-1.5 active:scale-[0.98] pointer-events-auto font-mono"
              >
                <Target className="w-3.5 h-3.5 text-red-500 animate-[spin_4s_linear_infinite]" />
                SATELLITE PING
              </button>
            </div>

            {/* Bottom Cybernetic Grid Accent Info */}
            <div className="flex items-center justify-between text-[7.5px] text-cyan-400/45 font-semibold mt-1.5 uppercase border-t border-cyan-500/10 pt-1.5">
              <span>SCAN LOCK SECURE</span>
              <span className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
                TELE-SYNCHRONIZED
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
