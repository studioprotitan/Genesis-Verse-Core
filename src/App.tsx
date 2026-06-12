/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from './store';
import { Game } from './components/Game';
import { HeroPortals } from './components/HeroPortals';
import { D3DamageDistributionChart } from './components/D3DamageDistributionChart';
import { BreathingHudPanel } from './components/BreathingHudPanel';
import MissionBriefing from './components/MissionBriefing';
import { Minimap } from './components/Minimap';
import { EnvironmentTelemetry } from './components/EnvironmentTelemetry';
import { DroneTelemetryOverlay } from './components/DroneTelemetryOverlay';
import { RiftExtractionOverlay } from './components/RiftExtractionOverlay';
import { SwarmAlertOverlay } from './components/SwarmAlertOverlay';
import { MobileControls } from './components/MobileControls';
import { CrosshairAndHitmarker } from './components/CrosshairAndHitmarker';
import { DirectionalHitIndicators } from './components/DirectionalHitIndicators';
import { CombatLog } from './components/CombatLog';
import { TacticalPulseHUD } from './components/TacticalPulseHUD';
import { WeaponLoadout } from './components/WeaponLoadout';
import { soundManager } from './utils/audio';
import { Pin, PinOff, Trophy, Clock, Shield, Flame, Activity, RefreshCw, LogOut, Maximize2, Gauge, Ghost, Award, Zap, Sparkles, Star, Target, TrendingUp, User, BookOpen } from 'lucide-react';

export default function App() {
  // Main Store Hooks
  const gameState = useGameStore(state => state.gameState);
  const score = useGameStore(state => state.score);
  const timeLeft = useGameStore(state => state.timeLeft);
  const playerHealth = useGameStore(state => state.playerHealth);
  const playerState = useGameStore(state => state.playerState);
  const enemies = useGameStore(state => state.enemies);
  const playerPosition = useGameStore(state => state.playerPosition);
  const playerSpeed = useGameStore(state => state.playerSpeed);
  const droneAiMode = useGameStore(state => state.droneAiMode);
  const swarmActive = useGameStore(state => state.swarmActive);
  const riftExtractionActive = useGameStore(state => state.riftExtractionActive);
  const shotsFired = useGameStore(state => state.shotsFired);
  const shotsHit = useGameStore(state => state.shotsHit);
  const damageDealt = useGameStore(state => state.damageDealt);
  const comboCount = useGameStore(state => state.comboCount);
  const maxComboCount = useGameStore(state => state.maxComboCount);
  const pilotName = useGameStore(state => state.pilotName);
  const pilotHours = useGameStore(state => state.pilotHours);
  const pilotAvatarUrl = useGameStore(state => state.pilotAvatarUrl);
  const damageHistory = useGameStore(state => state.damageHistory);

  const startGame = useGameStore(state => state.startGame);
  const leaveGame = useGameStore(state => state.leaveGame);

  // Local Controls and Layout states
  const [showBriefing, setShowBriefing] = useState(false);
  const [isHudHovered, setIsHudHovered] = useState(false);
  const [isHudPinned, setIsHudPinned] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isTelemetryExpanded, setIsTelemetryExpanded] = useState(false);
  const [distanceFilter, setDistanceFilter] = useState<'all' | '20' | '50'>('all');
  const isGhostMode = useGameStore(state => state.isGhostMode);
  const setIsGhostMode = useGameStore(state => state.setIsGhostMode);

  // Health refill animation tracking
  const [showRefillAnimation, setShowRefillAnimation] = useState(false);
  const [refillTriggerKey, setRefillTriggerKey] = useState(0);
  const prevHealthRef = React.useRef(playerHealth);

  // Persistent wallet coordinates
  const [savedWalletAddress, setSavedWalletAddress] = useState(() => {
    return localStorage.getItem('pilot_wallet_address') || '';
  });

  const handleWalletAddressChange = (addr: string) => {
    setSavedWalletAddress(addr);
    localStorage.setItem('pilot_wallet_address', addr);
  };

  // Check pointer/coarse layout size
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Compute closest active drone and distances
  const closestThreeDrones = useMemo(() => {
    return enemies
      .filter(e => e.state === 'active')
      .map(e => {
        const dx = e.position[0] - playerPosition[0];
        const dy = e.position[1] - playerPosition[1];
        const dz = e.position[2] - playerPosition[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        return { drone: e, dist };
      })
      .sort((a, b) => a.dist - b.dist);
  }, [enemies, playerPosition]);

  const closestHighThreatDrone = useMemo(() => {
    return closestThreeDrones.find(d => !d.drone.isDecoy) || null;
  }, [closestThreeDrones]);

  const hazardPulseConfig = useMemo(() => {
    if (!closestHighThreatDrone) return { active: false, duration: 2, opacity: 0, insetSpread: 10, ringColor: 'rgba(239, 68, 68, 0)', dist: 999 };
    const { dist } = closestHighThreatDrone;
    if (dist > 35) {
      return { active: false, duration: 2, opacity: 0, insetSpread: 10, ringColor: 'rgba(239, 68, 68, 0)', dist };
    }

    // Proximity factor: 0 at 35m, 1 at 5m
    const t = Math.max(0, Math.min(1, (35 - dist) / 30));

    // Accelerating pulse frequency:
    // At 35m, pulse takes 2.0s
    // At 20m, pulse takes 0.65s
    // At 5m, pulse takes 0.22s
    const duration = Math.max(0.22, 2.0 - t * 1.78);

    // Subtle edge border opacity:
    // At 35m, max opacity is 0.08
    // At 20m, max opacity is 0.24
    // At 5m, max opacity is 0.50
    const opacity = 0.08 + t * 0.42;

    // Pulse size scale fluctuation (visual ripple feedback):
    const insetSpread = dist <= 20 
      ? Math.round(15 + (20 - dist) * 1.5) 
      : 10;

    // Use warning orange/amber for warning, and alert red for danger zone (< 20m)
    const ringColor = dist <= 20 
      ? 'rgba(239, 68, 68, ' // red
      : 'rgba(245, 158, 11, '; // amber/orange

    return {
      active: true,
      duration,
      opacity,
      insetSpread,
      ringColor,
      dist,
    };
  }, [closestHighThreatDrone]);

  const targetDistance = useMemo(() => {
    return closestThreeDrones[0]?.dist ?? null;
  }, [closestThreeDrones]);

  // Compute combat zone active thresholds
  const lastDamageTime = useGameStore(state => state.lastDamageTime);
  const inCombat = useMemo(() => {
    const hasNearbyActiveEnemies = closestThreeDrones.some(d => d.dist < 45);
    return swarmActive || riftExtractionActive || hasNearbyActiveEnemies || (Date.now() - lastDamageTime < 8000);
  }, [closestThreeDrones, swarmActive, riftExtractionActive, lastDamageTime]);

  // Dynamic Threat level based on nearby active enemies and presence of a Swarm
  const threatLevel = useMemo(() => {
    const nearbyDrones = closestThreeDrones.filter(d => d.dist < 45);
    const count = nearbyDrones.length;
    const extremelyClose = nearbyDrones.some(d => d.dist < 22);

    if (swarmActive) {
      return {
        label: 'THREAT: CRITICAL SWARM',
        desc: `${count} Hostiles Alerted`,
        color: 'text-fuchsia-400',
        bg: 'bg-fuchsia-950/85',
        border: 'border-fuchsia-500/50',
        shadow: 'shadow-[0_0_15px_rgba(217,70,239,0.45)]',
        pingColor: 'bg-fuchsia-500'
      };
    }

    if (count >= 4 || (extremelyClose && count >= 3)) {
      return {
        label: 'THREAT: CRITICAL',
        desc: `${count} Targets Nearby`,
        color: 'text-rose-400 font-extrabold',
        bg: 'bg-rose-950/85',
        border: 'border-rose-500/55',
        shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.5)]',
        pingColor: 'bg-rose-500'
      };
    }

    if (count >= 2 || extremelyClose) {
      return {
        label: 'THREAT: HIGH',
        desc: `${count} Drones in Proximity`,
        color: 'text-orange-400 font-bold',
        bg: 'bg-orange-950/85',
        border: 'border-orange-500/50',
        shadow: 'shadow-[0_0_12px_rgba(249,115,22,0.4)]',
        pingColor: 'bg-orange-500'
      };
    }

    if (count === 1) {
      return {
        label: 'THREAT: MEDIUM',
        desc: 'Single Hostile Sector',
        color: 'text-amber-400',
        bg: 'bg-amber-950/80',
        border: 'border-amber-500/40',
        shadow: 'shadow-[0_0_10px_rgba(245,158,11,0.3)]',
        pingColor: 'bg-amber-500'
      };
    }

    return {
      label: 'THREAT: LOW',
      desc: 'No Proximity Drones',
      color: 'text-cyan-400',
      bg: 'bg-cyan-950/75',
      border: 'border-cyan-500/30',
      shadow: 'shadow-[0_0_8px_rgba(6,182,212,0.2)]',
      pingColor: 'bg-cyan-500'
    };
  }, [closestThreeDrones, swarmActive]);

  const [combatStateActive, setCombatStateActive] = useState(false);

  useEffect(() => {
    if (gameState !== 'playing') {
      setCombatStateActive(false);
      return;
    }
    if (inCombat !== combatStateActive) {
      setCombatStateActive(inCombat);
      if (inCombat) {
        soundManager.playSysAlert('ping');
      } else {
        soundManager.playSysAlert('click');
      }
    }
  }, [inCombat, combatStateActive, gameState]);

  useEffect(() => {
    if (playerHealth > prevHealthRef.current && !combatStateActive) {
      setShowRefillAnimation(true);
      setRefillTriggerKey(prev => prev + 1);
      const timer = setTimeout(() => {
        setShowRefillAnimation(false);
      }, 1000);
      prevHealthRef.current = playerHealth;
      return () => clearTimeout(timer);
    }
    prevHealthRef.current = playerHealth;
  }, [playerHealth, combatStateActive]);

  // Map contextual parameter states
  const wavePulseActive = swarmActive;
  const isStealthHud = droneAiMode === 'scout';

  // Format accuracy rating
  const accuracyPercent = useMemo(() => {
    if (shotsFired === 0) return 0;
    return Math.round((shotsHit / shotsFired) * 100);
  }, [shotsFired, shotsHit]);

  // 1. ROUTING LAYER A: Portal Universe menu / Lobby view
  if (gameState === 'menu') {
    return (
      <div className="w-screen h-screen relative overflow-hidden bg-black flex flex-col">
        <HeroPortals 
          onEnterLaserTag={() => {
            setShowBriefing(true);
            soundManager.playSysAlert('click');
          }}
          savedWalletAddress={savedWalletAddress}
          onWalletAddressChange={handleWalletAddressChange}
        />

        <AnimatePresence>
          {showBriefing && (
            <MissionBriefing 
              onDeploy={() => {
                setShowBriefing(false);
                startGame();
              }}
              onCancel={() => {
                setShowBriefing(false);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // 2. ROUTING LAYER B: Game Simulation and HUD layout
  if (gameState === 'playing') {
    return (
      <div className="w-screen h-screen relative overflow-hidden bg-black select-none text-white font-sans pointer-events-none">
        
        {/* React Three Fiber canvas backdrop wrapper */}
        <div className="absolute inset-0 z-0 pointer-events-auto">
          <Game />
        </div>

        {/* Screen-wide Swarm Alert overlay */}
        <SwarmAlertOverlay isGhostActive={isGhostMode && !combatStateActive} />

        {/* Screen-wide Rift Extraction Overdrive Overlay */}
        <RiftExtractionOverlay isGhostActive={isGhostMode && !combatStateActive} />

        {/* Directional Screen Edge Damage Indicators */}
        <DirectionalHitIndicators isGhostActive={isGhostMode && !combatStateActive} />

        {/* Tactical HUD Signal Pulse Wavefront Overlays */}
        <TacticalPulseHUD isGhostActive={isGhostMode && !combatStateActive} />

        {/* Subtle Screen-Edge Hazard Pulse border */}
        <AnimatePresence>
          {hazardPulseConfig.active && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 pointer-events-none z-45 overflow-hidden"
            >
              <motion.div
                className="w-full h-full border border-transparent"
                style={{
                  boxShadow: `inset 0 0 ${hazardPulseConfig.insetSpread}px ${hazardPulseConfig.ringColor}${hazardPulseConfig.opacity})`,
                  borderWidth: hazardPulseConfig.dist <= 20 ? '4px' : '2px',
                  borderColor: `${hazardPulseConfig.ringColor}${hazardPulseConfig.opacity * 1.2})`,
                }}
                animate={{
                  opacity: [0.35, 1, 0.35],
                }}
                transition={{
                  repeat: Infinity,
                  duration: hazardPulseConfig.duration,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Combat Threat Indicator Banner */}
        <AnimatePresence>
          {combatStateActive && (
            <motion.div
              initial={{ opacity: 0, y: -45, x: '-50%', scale: 0.85 }}
              animate={isGhostMode ? {
                opacity: [0.65, 0.4, 0.65],
                scale: 0.95,
                y: 0,
                x: '-50%',
                transition: {
                  opacity: { repeat: Infinity, duration: 3.2, ease: "easeInOut" },
                  y: { type: 'spring', damping: 15, stiffness: 150 },
                  scale: { duration: 0.3 }
                }
              } : {
                opacity: [1, 0.85, 1],
                scale: 1,
                y: 0,
                x: '-50%',
                transition: {
                  opacity: { repeat: Infinity, duration: 1.4, ease: "easeInOut" },
                  y: { type: 'spring', damping: 15, stiffness: 150 },
                  scale: { duration: 0.3 }
                }
              }}
              exit={{ opacity: 0, y: -45, x: '-50%', scale: 0.85 }}
              className="absolute top-16 left-1/2 flex flex-col items-center z-50 pointer-events-none select-none cursor-none"
            >
              <div className={`flex items-center gap-2 px-3.5 py-1.5 border backdrop-blur-md rounded-full transition-all duration-300 ${
                isGhostMode 
                  ? 'bg-slate-950/50 border-cyan-500/20 shadow-[0_0_8px_rgba(6,182,212,0.15)] text-cyan-400/80 saturate-75' 
                  : `${threatLevel.bg} ${threatLevel.border} ${threatLevel.shadow}`
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isGhostMode 
                    ? 'animate-[ping_3.0s_infinite] bg-cyan-400/40' 
                    : `animate-[ping_1.2s_infinite] ${threatLevel.pingColor}`
                }`} />
                <span className={`text-[10px] md:text-xs font-black tracking-[0.2em] font-mono flex items-center gap-1.5 ${
                  isGhostMode ? 'text-cyan-400/80 font-medium' : threatLevel.color
                }`}>
                  ⚠️ {isGhostMode ? 'COVERT SENSOR LOCK' : threatLevel.label} <span className="opacity-45">|</span> <span className="opacity-75 text-[9px] uppercase tracking-wider font-semibold">{threatLevel.desc}</span>
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tactical Crosshair Sight & Dynamic animated hit markers */}
        <div className="absolute inset-0 z-30 pointer-events-none">
          <CrosshairAndHitmarker />
        </div>

        {/* Game Stats Upper Deck: Top HUD floating channel */}
        <div className="absolute top-4 left-4 right-4 z-40 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          
          {/* Top-Left: Active Pilot Statistics Panel */}
          <BreathingHudPanel comboCount={comboCount} className="flex items-center gap-4 bg-slate-950/80 backdrop-blur-md border border-cyan-500/20 px-4 py-2.5 rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-cyan-500 tracking-[0.15em] font-mono leading-none mb-1">PILOT SCORE</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-white font-mono tracking-tight">{score}</span>
                {swarmActive && (
                  <span className="text-[10px] font-extrabold text-amber-400 animate-pulse font-mono">4X OVERDRIVE</span>
                )}
              </div>
            </div>
            
            <div className="w-[1px] h-8 bg-white/10" />

            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] font-mono">
              <span className="text-zinc-500">ACCURACY:</span>
              <span className="text-white font-bold">{accuracyPercent}%</span>
              <span className="text-zinc-500">DAMAGE:</span>
              <span className="text-white font-bold">{damageDealt} pts</span>
            </div>

            <div className="w-[1px] h-8 bg-white/10" />

            {/* Velocity Gauge */}
            <div className="flex flex-col min-w-[95px]">
              <span className="text-[9px] font-black text-cyan-500 tracking-[0.15em] font-mono leading-none mb-1.5 flex items-center gap-1">
                <Gauge className="w-2.5 h-2.5 text-cyan-400" />
                VELOCITY
              </span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 bg-zinc-950/80 rounded-sm overflow-hidden border border-white/5 relative">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                    animate={{ width: `${Math.min(100, ((playerSpeed || 0) / 12) * 100)}%` }}
                    transition={{ type: 'spring', stiffness: 180, damping: 15 }}
                  />
                </div>
                <span className="text-[10px] font-mono font-black text-white leading-none">
                  {(playerSpeed || 0).toFixed(1)}<span className="text-[7px] text-zinc-500 ml-0.5">M/S</span>
                </span>
              </div>
            </div>

            {comboCount > 1 && (
              <>
                <div className="w-[1px] h-8 bg-white/10" />
                <div className="flex items-center gap-1.5 animate-bounce">
                  <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                  <span className="text-xs font-black text-orange-400 font-mono">x{comboCount}</span>
                </div>
              </>
            )}
          </BreathingHudPanel>

          {/* Top-Center: Integrated Clock and Match Status */}
          <div className="self-center md:absolute md:left-1/2 md:-translate-x-1/2 bg-slate-950/80 backdrop-blur-md border border-white/5 py-1.5 px-4 rounded-full">
            <BreathingHudPanel comboCount={comboCount} className="flex items-center gap-3">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <div className="flex items-baseline gap-1.5 font-mono">
                <span className="text-sm font-black text-zinc-100">{Math.floor(timeLeft / 60)}:{('0' + Math.floor(timeLeft % 60)).slice(-2)}</span>
                <span className="text-[8px] tracking-wider text-zinc-500">SEC</span>
              </div>
            </BreathingHudPanel>
          </div>

          {/* Top-Right: Shield Integrity and Health Bars */}
          <BreathingHudPanel comboCount={comboCount} className="w-full md:w-auto flex items-center justify-between md:justify-end gap-4 bg-slate-950/80 backdrop-blur-md border border-cyan-500/20 px-4 py-2.5 rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <div className="flex flex-col md:items-end">
              <div className="flex items-center gap-1.5 md:justify-end mb-1.5 h-3.5 select-none pointer-events-none">
                <AnimatePresence mode="wait">
                  {showRefillAnimation ? (
                    <motion.span
                      key="recharging"
                      initial={{ opacity: 0, y: 2 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -2 }}
                      className="text-[9px] font-black text-teal-400 tracking-[0.15em] font-mono leading-none"
                    >
                      SHIELD RECHARGING
                    </motion.span>
                  ) : (
                    <motion.span
                      key="normal"
                      initial={{ opacity: 0, y: 2 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -2 }}
                      className="text-[9px] font-black text-cyan-500 tracking-[0.15em] font-mono leading-none"
                    >
                      SHIELD STRENGTH
                    </motion.span>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {showRefillAnimation && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8, x: -5 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: 5 }}
                      className="text-[8px] font-black font-mono text-teal-300 bg-teal-950/80 px-1 py-0.5 rounded border border-teal-500/30 flex items-center gap-0.5"
                    >
                      <motion.span 
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 0.6, repeat: Infinity }}
                        className="w-1 h-1 rounded-full bg-teal-300 inline-block"
                      />
                      +REGEN
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex gap-0.5 p-0.5 rounded overflow-hidden">
                  {/* Subtle sweep overlay */}
                  {showRefillAnimation && (
                    <motion.div
                      key={`sweep-${refillTriggerKey}`}
                      initial={{ x: '-110%' }}
                      animate={{ x: '110%' }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                      className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent pointer-events-none z-10"
                    />
                  )}
                  {Array.from({ length: 10 }).map((_, i) => {
                    const isFilled = playerHealth > i * 10;
                    return (
                      <motion.div 
                        key={i} 
                        initial={false}
                        animate={isFilled && showRefillAnimation ? {
                          scale: [1, 1.25, 1],
                          filter: ['brightness(1)', 'brightness(1.8)', 'brightness(1)'],
                        } : {
                          scale: 1,
                          filter: 'brightness(1)',
                        }}
                        transition={showRefillAnimation ? {
                          duration: 0.4,
                          delay: i * 0.04,
                          ease: "easeOut"
                        } : undefined}
                        className={`w-3 h-2.5 rounded-sm transition-all duration-300 origin-center ${
                          isFilled 
                            ? playerHealth <= 30 
                              ? 'bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.5)]' 
                              : 'bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.5)]'
                            : 'bg-zinc-800'
                        }`}
                      />
                    );
                  })}
                </div>
                <motion.span 
                  animate={showRefillAnimation ? {
                    scale: [1, 1.2, 1],
                    textShadow: [
                      '0 0 0px rgba(34,211,238,0)',
                      '0 0 8px rgba(34,211,238,0.8)',
                      '0 0 0px rgba(34,211,238,0)'
                    ]
                  } : {}}
                  transition={{ duration: 0.4 }}
                  className={`text-xs font-mono font-black ${playerHealth <= 30 ? 'text-rose-500' : 'text-cyan-400'}`}
                >
                  {Math.round(playerHealth)}%
                </motion.span>
              </div>
            </div>

            {playerState === 'disabled' && (
              <div className="px-2.5 py-1 bg-rose-950/60 border border-rose-500/30 text-[9px] font-black text-rose-400 font-mono animate-pulse rounded">
                ⚡ SHIELD CRASH // REBOOTING
              </div>
            )}
          </BreathingHudPanel>
        </div>

        {/* Mobile joystick controls */}
        {isMobile && (
          <div className="absolute inset-0 z-20 pointer-events-auto">
            <MobileControls />
          </div>
        )}

        {/* Bottom-Left: Systems Telemetry card */}
        <motion.div
          onMouseEnter={() => setIsHudHovered(true)}
          onMouseLeave={() => setIsHudHovered(false)}
          animate={{ 
            opacity: (isGhostMode && !combatStateActive && !isHudHovered) ? 0.35 : 1, 
            x: combatStateActive ? 16 : 0,
            scale: combatStateActive ? 1.02 : 0.98,
            rotateY: combatStateActive ? 10 : 2,
            rotateX: combatStateActive ? -8 : -2,
            width: (isHudHovered || isHudPinned) ? (isMobile ? 310 : 420) : (isMobile ? 256 : 288),
            borderColor: (targetDistance !== null && targetDistance < 5.0)
              ? 'rgba(239, 68, 68, 0.7)' 
              : combatStateActive
                ? 'rgba(239, 68, 68, 0.4)'
                : wavePulseActive 
                  ? 'rgba(217, 70, 239, 0.7)' 
                  : 'rgba(6, 182, 212, 0.15)',
            boxShadow: (targetDistance !== null && targetDistance < 5.0)
              ? '0 0 25px rgba(239, 68, 68, 0.5)'
              : combatStateActive
                ? '0 0 20px rgba(239, 68, 68, 0.15)'
                : wavePulseActive
                  ? '0 0 25px rgba(217, 70, 239, 0.5)'
                  : '0 0 10px rgba(6, 182, 212, 0.05)'
          }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ 
            type: 'spring', 
            damping: 22, 
            stiffness: 110,
            width: { type: 'spring', damping: 25, stiffness: 180 },
            borderColor: { duration: 0.3 },
            boxShadow: { duration: 0.3 },
            opacity: { duration: 0.4 }
          }}
          style={{ perspective: 800, transformStyle: 'preserve-3d' }}
          className={`absolute bottom-4 left-2 md:bottom-6 md:left-4 z-40 flex flex-col gap-1 pointer-events-auto max-h-[75vh] md:max-h-[80vh] justify-end p-2 border rounded-lg transition-all duration-300 ${
            isStealthHud
              ? 'bg-black/20 backdrop-blur-xs shadow-none'
              : combatStateActive
                ? 'bg-red-950/5 backdrop-blur-sm shadow-[0_8px_32px_rgba(239,68,68,0.05)]'
                : 'bg-slate-950/95 shadow-[0_8px_32px_rgba(0,0,0,0.85)]'
          } ${
            (targetDistance !== null && targetDistance < 5.0)
              ? 'border-red-500 animate-[pulse_1s_infinite]' 
              : combatStateActive
                ? 'border-red-500/30'
                : wavePulseActive 
                  ? 'border-fuchsia-500 animate-[pulse_1.5s_infinite]' 
                  : isStealthHud 
                    ? 'border-cyan-500/10' 
                    : 'border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
          }`}
        >
          <BreathingHudPanel comboCount={comboCount} className="w-full h-full flex flex-col justify-end gap-1">
            <div className="flex justify-between items-center px-1 pb-1 mb-1 border-b border-white/5 font-mono text-[9px] text-zinc-500 select-none gap-2">
            <span className="font-extrabold tracking-widest text-[8px] uppercase truncate">COGNITIVE SENSOR TELEMETRY</span>
            
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Ghost Mode Toggle */}
              <div className="flex items-center bg-zinc-950/60 border border-white/5 px-1 py-0.5 rounded text-[7px] font-bold text-zinc-500">
                <button
                  type="button"
                  onClick={() => {
                    setIsGhostMode(!isGhostMode);
                    soundManager.playSysAlert('click');
                  }}
                  className={`flex items-center gap-1 px-1.5 py-0.2 rounded-xs select-none transition-all cursor-pointer font-extrabold tracking-widest ${
                    isGhostMode 
                      ? 'bg-cyan-500/25 text-cyan-350 border border-cyan-500/20 shadow-[0_0_8px_rgba(6,182,212,0.15)] animate-pulse' 
                      : 'text-zinc-500 hover:text-zinc-350 border border-transparent'
                  }`}
                  title="Ghost Mode automatically reduces panel opacity outside active combat to reveal 3D scene"
                >
                  <Ghost className={`w-2.5 h-2.5 ${isGhostMode ? 'text-cyan-400' : 'text-zinc-500'}`} />
                  <span>GHOST: {isGhostMode ? 'ACTIVE' : 'OFF'}</span>
                </button>
              </div>

              {/* Inline high-tech toggle controls in header */}
              <div className="flex items-center gap-1 bg-zinc-950/60 border border-white/5 px-1 py-0.5 rounded text-[7px] font-bold text-zinc-500">
                <span className="text-[6px] uppercase tracking-wider text-zinc-650 font-extrabold mr-1">LIMIT:</span>
                <button
                  type="button"
                  onClick={() => {
                    setDistanceFilter('all');
                    soundManager.playSysAlert('click');
                  }}
                  className={`px-1 py-0.2 rounded-xs select-none transition-all cursor-pointer ${distanceFilter === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-extrabold border border-cyan-500/20' : 'hover:text-zinc-350 border border-transparent'}`}
                >
                  ALL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDistanceFilter('50');
                    soundManager.playSysAlert('click');
                  }}
                  className={`px-1 py-0.2 rounded-xs select-none transition-all cursor-pointer ${distanceFilter === '50' ? 'bg-fuchsia-500/20 text-fuchsia-300 font-extrabold border border-fuchsia-500/20' : 'hover:text-zinc-350 border border-transparent'}`}
                >
                  &lt;50M
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDistanceFilter('20');
                    soundManager.playSysAlert('click');
                  }}
                  className={`px-1 py-0.2 rounded-xs select-none transition-all cursor-pointer ${distanceFilter === '20' ? 'bg-rose-500/20 text-rose-300 font-extrabold border border-rose-500/20' : 'hover:text-zinc-350 border border-transparent'}`}
                >
                  &lt;20M
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button 
                type="button"
                onClick={() => {
                  setIsTelemetryExpanded(true);
                  soundManager.playSysAlert('click');
                }}
                className="text-zinc-500 hover:text-cyan-400 p-0.5 cursor-pointer"
                title="Expand Telemetry Grid Dashboard"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
              <button 
                type="button"
                onClick={() => {
                  setIsHudPinned(!isHudPinned);
                  soundManager.playSysAlert('click');
                }}
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                {isHudPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3 text-cyan-400" />}
              </button>
            </div>
          </div>
          <DroneTelemetryOverlay 
            distanceFilter={distanceFilter} 
            onDistanceFilterChange={setDistanceFilter} 
          />
          </BreathingHudPanel>
        </motion.div>

        {/* Minimap radar */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ 
            opacity: 1, 
            x: combatStateActive ? -16 : 0,
            scale: combatStateActive ? 1.05 : 0.95,
            rotateY: combatStateActive ? -12 : -3,
          }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ type: 'spring', damping: 20, stiffness: 120 }}
          style={{ perspective: 800, transformStyle: 'preserve-3d' }}
          className="absolute top-32 right-2 md:top-36 md:right-4 z-30"
        >
          <BreathingHudPanel comboCount={comboCount}>
            <Minimap />
          </BreathingHudPanel>
        </motion.div>

        {/* Combat Log + Environment Telemetry */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ 
            opacity: 1, 
            x: combatStateActive ? -16 : 0,
            scale: combatStateActive ? 1.02 : 0.96,
            rotateY: combatStateActive ? -14 : -3,
          }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ type: 'spring', damping: 20, stiffness: 120, delay: 0.1 }}
          style={{ perspective: 800, transformStyle: 'preserve-3d' }}
          className="absolute bottom-4 right-2 md:bottom-6 md:right-4 z-30"
        >
          <BreathingHudPanel comboCount={comboCount} className="flex flex-col gap-3 items-end w-full h-full">
            <CombatLog />
            <EnvironmentTelemetry />
          </BreathingHudPanel>
        </motion.div>

        {/* Compact Async Tactical Weapon Loadout Selection and Triggers */}
        <WeaponLoadout />

        {/* Global exit button */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
          <button 
            onClick={() => {
              setShowExitConfirm(true);
              soundManager.playSysAlert('click');
            }}
            className="flex items-center gap-1.5 bg-black/60 hover:bg-black/90 border border-white/10 hover:border-rose-500/30 px-3 py-1 rounded text-[10px] font-mono font-bold tracking-wider text-zinc-400 hover:text-white uppercase transition-all duration-200 shadow-lg cursor-pointer"
          >
            <LogOut className="w-3 h-3 text-rose-500" />Disconnect
          </button>
        </div>

        {/* Accidental Disconnection Warning HUD Modal */}
        <AnimatePresence>
          {showExitConfirm && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md pointer-events-auto"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="w-full max-w-sm mx-4 bg-slate-950 border border-red-500/30 rounded-xl p-6 shadow-[0_0_40px_rgba(239,68,68,0.25)] text-center font-mono relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                <div className="flex justify-center mb-4">
                  <div className="p-2 bg-red-500/10 border border-red-500/35 rounded-full text-red-500">
                    <LogOut className="w-5 h-5 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-red-500 text-[10px] font-black tracking-[0.2em] uppercase mb-1">SYSTEM WARNING // ALIGNMENT</h3>
                <h4 className="text-white text-xs font-black uppercase tracking-wider mb-2.5">DISCONNECT CONFIRMATION</h4>
                <p className="text-[10px] text-zinc-400 leading-normal mb-5 max-w-[280px] mx-auto">
                  Rupturing the pilot chassis telemetry link will terminate your current active match simulation on the vector grid. Confirm exit?
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setShowExitConfirm(false);
                      soundManager.playSysAlert('click');
                    }}
                    className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-[10px] font-bold text-zinc-300 hover:text-white tracking-widest uppercase rounded transition cursor-pointer"
                  >
                    ABORT
                  </button>
                  <button 
                    onClick={() => {
                      setShowExitConfirm(false);
                      leaveGame();
                      soundManager.playSysAlert('click');
                    }}
                    className="flex-1 py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-[10px] font-bold text-white tracking-widest uppercase rounded transition shadow-[0_0_15px_rgba(239,68,68,0.3)] cursor-pointer"
                  >
                    CONFIRM
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full-screen Cognitive Telemetry Dialog */}
        <AnimatePresence>
          {isTelemetryExpanded && (
            <DroneTelemetryOverlay 
              isExpanded={true} 
              onToggleExpand={() => setIsTelemetryExpanded(false)} 
              distanceFilter={distanceFilter}
              onDistanceFilterChange={setDistanceFilter}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // 3. ROUTING LAYER C: Match gameover report
  if (gameState === 'gameover') {
    // Dynamic calculate Mission Rank Contribution parameters
    const scoreVal = score || 0;
    const accuracyVal = accuracyPercent || 0;
    const damageVal = damageDealt || 0;

    const scoreContrib = Math.min(45, (scoreVal / 4000) * 45);
    const accuracyContrib = Math.min(30, (accuracyVal / 100) * 30);
    const damageContrib = Math.min(25, (damageVal / 2500) * 25);
    const rankPoints = Math.round(scoreContrib + accuracyContrib + damageContrib);

    let rankMeta = {
      grade: 'D',
      title: 'SIM APPRENTICE',
      themeClass: 'text-zinc-500 border-zinc-500/20 bg-zinc-950/40 shadow-none',
      badgeClass: 'bg-zinc-600',
      colorName: 'Slate',
      description: 'Simulation terminated prematurely. Re-routing core neural connection is recommended.'
    };

    if (rankPoints >= 92) {
      rankMeta = {
        grade: 'S+',
        title: 'APEX REAVER',
        themeClass: 'text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-rose-400 to-pink-500 border-fuchsia-500/30 bg-fuchsia-950/20 shadow-[0_0_30px_rgba(217,70,239,0.3)]',
        badgeClass: 'bg-gradient-to-r from-fuchsia-500 to-pink-500',
        colorName: 'Neon Fuchsia',
        description: 'Spectacular neural alignment. Absolute control over cybernetic combat sectors.'
      };
    } else if (rankPoints >= 80) {
      rankMeta = {
        grade: 'S',
        title: 'ECHELON COMMANDER',
        themeClass: 'text-red-400 border-red-500/30 bg-red-950/10 shadow-[0_0_20px_rgba(239,68,68,0.25)]',
        badgeClass: 'bg-red-500',
        colorName: 'Crimson Red',
        description: 'Exceptional tactical response index. Highly calibrated targeting vectors.'
      };
    } else if (rankPoints >= 65) {
      rankMeta = {
        grade: 'A',
        title: 'VECTOR CHAMPION',
        themeClass: 'text-amber-400 border-amber-500/30 bg-amber-950/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
        badgeClass: 'bg-amber-500',
        colorName: 'Amber gold',
        description: 'Excellent performance. Highly synchronized tagging logic and combo streams.'
      };
    } else if (rankPoints >= 45) {
      rankMeta = {
        grade: 'B',
        title: 'STRIKE OPERATIVE',
        themeClass: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/10 shadow-[0_0_12px_rgba(6,182,212,0.15)]',
        badgeClass: 'bg-cyan-500',
        colorName: 'Neon Cyan',
        description: 'Satisfactory drone extraction threshold. Consistent response capabilities.'
      };
    } else if (rankPoints >= 25) {
      rankMeta = {
        grade: 'C',
        title: 'GRID RECRUIT',
        themeClass: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/10 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
        badgeClass: 'bg-emerald-500',
        colorName: 'Emerald Green',
        description: 'Standard baseline complete. Recommended further pilot training under low atmospheres.'
      };
    }

    // Leaderboard entries for Formula Pilot Illustrated Magazine
    const staticLeaderboard = [
      { name: 'ARC-SOLIS', score: 4820, rank: 'S+', hours: 145.4, visor: 'visor-cyan' },
      { name: 'XENON-ALPHA', score: 3950, rank: 'S', hours: 88.2, visor: 'visor-amber' },
      { name: 'VALKYRIE-09', score: 2120, rank: 'A', hours: 42.8, visor: 'visor-emerald' },
      { name: 'GHOST-CHASSIS', score: 1480, rank: 'B', hours: 18.5, visor: 'visor-magenta' },
      { name: 'CYPHER-CORE', score: 980, rank: 'C', hours: 12.0, visor: 'visor-cyan' }
    ];

    // Merge actual player run and sort
    const magazineLeaderboard = [
      ...staticLeaderboard.filter(item => item.name !== pilotName),
      { name: pilotName, score: scoreVal, rank: rankMeta.grade, hours: pilotHours, visor: 'visor-user', isPlayer: true }
    ].sort((a, b) => b.score - a.score).slice(0, 5);

    return (
      <div className="w-screen h-screen relative bg-black flex items-center justify-center p-3 md:p-6 overflow-y-auto select-none text-white font-mono">
        {/* Glowing holographic vector grid backdrop */}
        <div className="absolute inset-0 pointer-events-none select-none bg-[radial-gradient(circle_at_center,#130536_0%,#000_85%)] bg-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(6,182,212,0.02)_50%)] bg-[length:100%_6px] pointer-events-none select-none" />

        {/* Dynamic score background highlights */}
        <div className="absolute blur-[120px] rounded-full w-[400px] h-[400px] bg-red-950/40 -top-20 -left-20 pointer-events-none" />
        <div className="absolute blur-[120px] rounded-full w-[400px] h-[400px] bg-fuchsia-950/30 -bottom-20 -right-20 pointer-events-none" />

        {/* Standard UI controls container */}
        <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-5 relative z-10 p-2 pointer-events-auto items-stretch">
          
          {/* LEFT PANEL: Tactical Chronicle & Mission Rank (calculated based on scoring criteria) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="flex-1 bg-slate-950/85 border border-red-500/20 rounded-2xl flex flex-col p-5 md:p-6 backdrop-blur-xl relative overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.8)] justify-between"
          >
            {/* Structural top line accent */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.4)]" />

            <div>
              <div className="flex items-center gap-3 mb-5 border-b border-white/5 pb-3">
                <div className="p-2 bg-red-500/10 border border-red-500/25 text-red-500 rounded-lg animate-pulse shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[8px] font-black tracking-[0.25em] text-red-500 uppercase">TACTICAL ANALYSIS COMPLETED</span>
                  <h2 className="text-sm font-black text-white/90 uppercase tracking-wider">CHRONICLE REPORT COMPASS</h2>
                </div>
              </div>

              {/* MISSION RANK PRESENTATION PANEL */}
              <div className="bg-gradient-to-b from-white/[0.03] to-white/0 border border-white/10 rounded-xl p-4 mb-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-inner">
                <div className="flex flex-col text-left gap-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[7.5px] font-black tracking-widest text-zinc-500 uppercase">COMPUTED PERFORMANCE EVALUATION</span>
                    <Sparkles className="w-2.5 h-2.5 text-yellow-400 animate-spin" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-200 uppercase leading-none tracking-tight flex items-center gap-1.5 mt-0.5">
                    <Award className="w-4 h-4 text-cyan-400" />
                    {rankMeta.title}
                  </h3>
                  <p className="text-[9px] text-zinc-400 leading-normal max-w-[280px] mt-1 pr-1 font-sans">
                    {rankMeta.description}
                  </p>
                </div>

                {/* Big Glowing Rank Letter with ring indicator */}
                <div className="relative shrink-0 flex items-center justify-center">
                  <div className="absolute w-20 h-20 rounded-full border border-white/5 bg-zinc-950 flex items-center justify-center" />
                  <div className={`w-16 h-16 rounded-full border flex flex-col justify-center items-center font-black text-3xl leading-none transition-all duration-300 z-10 ${rankMeta.themeClass}`}>
                    <span className="drop-shadow-[0_0_12px_rgba(244,63,94,0.5)]">{rankMeta.grade}</span>
                    <span className="text-[6.5px] font-bold text-zinc-500 uppercase tracking-widest mt-1">RANK</span>
                  </div>
                </div>
              </div>

              {/* GRADING COMPOSITE CRITERIA METER BREAKDOWN */}
              <div className="bg-white/[0.015] border border-white/5 rounded-xl p-3 mb-5 text-left flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-white/[0.03] pb-1.5">
                  <span className="text-[7.5px] text-zinc-500 font-extrabold tracking-widest uppercase">GRADING CRITERIA MATHEMATICS</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    <span className="text-[8px] text-cyan-400 font-bold uppercase">SCORE MATRIX: {rankPoints}/100 PTS</span>
                  </div>
                </div>

                {/* Criteria 1: Score contribution (45%) */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[8px] font-black tracking-tight leading-none text-zinc-400 uppercase">
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-cyan-400" />
                      Tactical Points Cap
                    </span>
                    <span className="font-mono text-zinc-300">{scoreVal} pts</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-cyan-500" style={{ width: `${(scoreContrib / 45) * 100}%` }} />
                  </div>
                  <span className="text-[6.5px] text-zinc-500 text-right uppercase">Weight: 45% · Dynamic contribution: +{scoreContrib.toFixed(1)}</span>
                </div>

                {/* Criteria 2: Precision rating (30%) */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[8px] font-black tracking-tight leading-none text-zinc-400 uppercase">
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3 text-amber-500" />
                      Weapon Tag Precision
                    </span>
                    <span className="font-mono text-zinc-300">{accuracyVal}%</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-amber-500" style={{ width: `${accuracyVal}%` }} />
                  </div>
                  <span className="text-[6.5px] text-zinc-500 text-right uppercase">Weight: 30% · Dynamic contribution: +{accuracyContrib.toFixed(1)}</span>
                </div>

                {/* Criteria 3: Cyber Damage (25%) */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[8px] font-black tracking-tight leading-none text-zinc-400 uppercase">
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-red-500" />
                      Plasma Discharge Volume
                    </span>
                    <span className="font-mono text-zinc-300">{damageVal} MJ</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-red-500" style={{ width: `${Math.min(100, (damageVal / 2500) * 100)}%` }} />
                  </div>
                  <span className="text-[6.5px] text-zinc-500 text-right uppercase">Weight: 25% · Dynamic contribution: +{damageContrib.toFixed(1)}</span>
                </div>
              </div>

              {/* D3 CYBERNETIC DAMAGE DISTRIBUTION TREND GRAPH */}
              <div className="mb-5 md:mb-6">
                <D3DamageDistributionChart damageHistory={damageHistory} />
              </div>
            </div>

            {/* BUTTONS FOR BOTH REPLANS & DISCONNECT */}
            <div className="flex flex-col sm:flex-row gap-3 border-t border-white/5 pt-4">
              <button
                onClick={() => {
                  setShowBriefing(true);
                  soundManager.playSysAlert('click');
                }}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs uppercase tracking-[0.15em] rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_15px_rgba(6,182,212,0.2)]"
              >
                <RefreshCw className="w-4 h-4 animate-[spin_8s_infinite_linear]" />
                Replan Mission
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(true);
                  soundManager.playSysAlert('click');
                }}
                className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white font-bold text-xs uppercase tracking-[0.15em] rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                Disconnect Pilot
              </button>
            </div>
          </motion.div>

          {/* RIGHT PANEL: 'Formula Pilot Illustrated' Magazine styled cover & Leaderboard */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex-1 bg-zinc-950 border border-cyan-500/20 rounded-2xl flex flex-col p-4 backdrop-blur-xl relative overflow-hidden shadow-[0_12px_45px_the-black] text-left justify-between"
          >
            {/* Cover background visualizer paper elements */}
            <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-transparent pointer-events-none z-10" />

            {/* Top decorative magazine bar */}
            <div className="flex justify-between items-center text-[7.5px] border-b border-cyan-500/25 pb-1 font-sans text-zinc-500 tracking-wider">
              <span>SPECIAL COGNITIVE CHASSIS EDITION</span>
              <span className="text-cyan-400 font-mono font-bold">$0.00 CORPS-CREDITS // NET-MAG</span>
              <span>VOLUME XII · ISSUE 42</span>
            </div>

            {/* Premium Magazine Title Masthead */}
            <div className="text-center mt-3 mb-1.5 flex flex-col leading-none items-center">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-[-0.035em] text-white flex items-center gap-1 select-none leading-none">
                FORMULA<span className="text-cyan-400 tracking-[0.1em] font-sans font-black italic ml-1">PILOT</span>
              </h1>
              <div className="mt-1 w-full flex items-center justify-center gap-1.5">
                <div className="h-[1px] bg-red-500/60 flex-1" />
                <span className="text-[7.5px] tracking-[0.45em] text-red-500 font-extrabold font-mono text-center uppercase whitespace-nowrap pl-[0.45em]">
                  ILLUSTRATED
                </span>
                <div className="h-[1px] bg-red-500/60 flex-1" />
              </div>
            </div>

            {/* Core Interactive Layout Cover Graphic / Top Pilot on Deck */}
            <div className="relative w-full rounded-xl border border-white/5 overflow-hidden bg-black aspect-[16/8.5] mt-2 mb-3 shadow-[0_4px_22px_rgba(0,0,0,0.6)] flex items-center justify-between">
              {/* Scanlines overlay index */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(6,182,212,0.06)_50%)] bg-[length:100%_4px] pointer-events-none z-10" />
              
              {/* Dynamic decorative backdrop circles */}
              <div className="absolute w-24 h-24 rounded-full border border-cyan-500/10 animate-[ping_4s_infinite] -left-5 -bottom-5" />

              {/* Pilot Info text overlap (Left aligned) */}
              <div className="p-3.5 z-10 text-left flex flex-col gap-1 w-1/2">
                <div className="flex items-center gap-1 text-red-500">
                  <Star className="w-2.5 h-2.5 fill-red-500 animate-pulse animate-duration-1000" />
                  <span className="text-[7px] font-black tracking-widest uppercase">COVER PILOT FEATURE</span>
                </div>
                <h4 className="text-sm font-black text-white hover:text-cyan-300 transition duration-150 tracking-wider uppercase leading-none break-all">
                  {pilotName}
                </h4>
                <div className="text-[7.5px] text-zinc-400 font-sans leading-tight mt-1 flex flex-col gap-0.5">
                  <span>Chassis hours: <strong className="text-zinc-300 font-bold">{pilotHours.toFixed(1)} Hrs</strong></span>
                  <span>Neural sync: <strong className="text-cyan-400 font-mono font-bold">99.8%</strong></span>
                  <span>Accuracy factor: <strong className="text-amber-500 font-mono font-bold">{accuracyVal}%</strong></span>
                </div>
              </div>

              {/* Pilot Portrait Visual graphic frame (Right side) */}
              <div className="w-1/2 h-full relative shrink-0 overflow-hidden bg-zinc-950 flex justify-end">
                <div className="w-full h-full relative overflow-hidden border-l border-white/5">
                  <img 
                    src={pilotAvatarUrl} 
                    alt="Pilot Cover Art" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover grayscale brightness-90 contrast-125 transition-transform duration-500 hover:scale-105"
                  />
                  {/* Holographic matrix color mapping */}
                  <div className="absolute inset-0 bg-cyan-950/20 mix-blend-darken pointer-events-none" />
                </div>
                <div className="absolute top-2 right-2 text-[7px] bg-red-600 border border-red-500 text-white px-1.5 py-0.2 rounded font-mono font-bold tracking-widest uppercase animate-pulse">
                  ON DECK
                </div>
                {/* Visual crop markings */}
                <div className="absolute bottom-1 right-1 text-[5.5px] text-zinc-500/70 font-mono">GRID RECON // VIII</div>
              </div>
            </div>

            {/* PERSISTENT LEADERBOARD SECTION inside Magazine Margins */}
            <div className="w-full">
              <div className="flex justify-between items-center bg-cyan-950/20 border border-cyan-500/10 rounded px-2.5 py-1.5 mb-1.5">
                <span className="text-[8px] text-cyan-400 font-extrabold tracking-widest uppercase flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  PERSISTENT HIGH-PILOT CHRONICLE
                </span>
                <span className="text-[7px] text-zinc-500 uppercase">SORTED BY SCORE</span>
              </div>

              <div className="flex flex-col gap-1 w-full text-left">
                {magazineLeaderboard.map((item, index) => {
                  const isCurMatchScore = item.name === pilotName && item.score === scoreVal;
                  return (
                    <div 
                      key={index} 
                      className={`relative flex items-center justify-between text-[9px] px-2.5 py-2.5 rounded-lg border leading-none transition-all duration-200 ${
                        isCurMatchScore 
                          ? 'bg-gradient-to-r from-red-950/40 to-slate-900/60 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)] ring-1 ring-red-500/20' 
                          : 'bg-white/[0.01] border-white/5 hover:border-zinc-700'
                      }`}
                    >
                      {/* Flex layout and pilot profile detail components */}
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-[9px] font-bold ${isCurMatchScore ? 'text-red-400 font-extrabold text-xs' : 'text-zinc-500'}`}>
                          #0{index + 1}
                        </span>

                        {/* Rank indicator badge layout */}
                        <span className={`w-6 text-center text-[7.5px] font-black rounded uppercase py-0.5 leading-none ${
                          item.rank.includes('S') 
                            ? 'bg-red-500/15 border border-red-500/30 text-red-400' 
                            : item.rank === 'A' 
                              ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                              : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
                        }`}>
                          {item.rank}
                        </span>

                        <span className={`font-mono uppercase font-bold tracking-wide truncate max-w-[85px] md:max-w-[120px] ${isCurMatchScore ? 'text-white' : 'text-zinc-400'}`}>
                          {item.name}
                        </span>

                        {isCurMatchScore && (
                          <span className="text-[6.5px] bg-red-500/20 text-red-400 border border-red-500/40 px-1 rounded font-black tracking-widest uppercase animate-pulse">
                            YOUR SCORE
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-zinc-500 font-sans text-[7.5px] mt-0.5 uppercase">
                          {item.hours.toFixed(1)}h logged
                        </span>
                        <span className={`font-mono font-black text-right text-[10px] tracking-tight ${isCurMatchScore ? 'text-red-400 text-xs' : 'text-zinc-300'}`}>
                          {item.score.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-[7.5px] text-zinc-500 font-sans leading-relaxed mt-3.5 border-t border-white/[0.03] pt-2 text-center md:text-left select-none">
              Magazine Issue 42 compiled dynamically following pilot neural termination sequences. Space-grade audio filters in the Echelon Arena enable 3D tracking vectors under 20m danger environments. All simulation data has been signed securely to Echelon Vault records.
            </p>
          </motion.div>

        </div>

        {/* Dynamic confirm exit portal Modal */}
        <AnimatePresence>
          {showExitConfirm && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md pointer-events-auto"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="w-full max-w-sm mx-4 bg-slate-950 border border-red-500/30 rounded-xl p-6 shadow-[0_0_40px_rgba(239,68,68,0.25)] text-center font-mono relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                <div className="flex justify-center mb-4">
                  <div className="p-2 bg-red-500/10 border border-red-500/35 rounded-full text-red-500">
                    <LogOut className="w-5 h-5 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-red-500 text-[10px] font-black tracking-[0.2em] uppercase mb-1">SYSTEM DISCONNECT // SECURE</h3>
                <h4 className="text-white text-xs font-black uppercase tracking-wider mb-2.5">LEAVE COMPROMISED LINK</h4>
                <p className="text-[10px] text-zinc-400 leading-normal mb-5 max-w-[280px] mx-auto">
                  Are you sure you want to disconnect your pilot shell sessions and return to the main gate entry?
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setShowExitConfirm(false);
                      soundManager.playSysAlert('click');
                    }}
                    className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-[10px] font-bold text-zinc-300 hover:text-white tracking-widest uppercase rounded transition cursor-pointer"
                  >
                    ABORT
                  </button>
                  <button 
                    onClick={() => {
                      setShowExitConfirm(false);
                      leaveGame();
                      soundManager.playSysAlert('click');
                    }}
                    className="flex-1 py-1.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-[10px] font-bold text-white tracking-widest uppercase rounded transition shadow-[0_0_15px_rgba(239,68,68,0.3)] cursor-pointer"
                  >
                    CONFIRM
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showBriefing && (
            <MissionBriefing 
              onDeploy={() => {
                setShowBriefing(false);
                startGame();
              }}
              onCancel={() => {
                setShowBriefing(false);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return null;
}