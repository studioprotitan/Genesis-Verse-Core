/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Flame, 
  ShieldCheck, 
  Locate, 
  Compass, 
  Bomb, 
  Radio, 
  Cpu, 
  Sparkles,
  RefreshCw,
  Clock,
  Skull,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { useGameStore } from '../store';
import { soundManager } from '../utils/audio';
import { BreathingHudPanel } from './BreathingHudPanel';

// Types for items inside our loadout
type LoadoutType = 'weapons' | 'grenades' | 'drones' | 'golems';

interface WeaponItem {
  id: 'laser' | 'plasma' | 'emp' | 'railgun';
  name: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  stats: { rate: string; impact: string; weight: string };
  passiveDesc: string;
}

interface GrenadeItem {
  id: string;
  name: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  cooldownSec: number;
}

interface DroneSupportItem {
  id: string;
  name: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  action: string;
}

interface GolemItem {
  id: string;
  name: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  cost: number;
  perk: string;
}

export function WeaponLoadout() {
  const gameState = useGameStore(state => state.gameState);
  
  // Zustand store triggers
  const activeSelectedWeapon = useGameStore(state => state.activeSelectedWeapon);
  const selectWeapon = useGameStore(state => state.selectWeapon);
  const companionDrone = useGameStore(state => state.companionDrone);
  const setCompanionDrone = useGameStore(state => state.setCompanionDrone);
  const golemSummon = useGameStore(state => state.golemSummon);
  const setGolemSummon = useGameStore(state => state.setGolemSummon);
  const activeWeaponChargeUnits = useGameStore(state => state.activeWeaponChargeUnits);
  const incrementActiveWeaponCharge = useGameStore(state => state.incrementActiveWeaponCharge);
  const addEvent = useGameStore(state => state.addEvent);
  const addParticles = useGameStore(state => state.addParticles);
  const hitEnemy = useGameStore(state => state.hitEnemy);
  const playerHealth = useGameStore(state => state.playerHealth);
  const comboCount = useGameStore(state => state.comboCount);

  // Local tab state
  const [activeTab, setActiveTab] = useState<LoadoutType>('weapons');
  
  // Async dynamic states
  const [grenadeStock, setGrenadeStock] = useState(3);
  const [grenadeCooldown, setGrenadeCooldown] = useState(0); // cooldown timer
  const [activeGrenadeProgress, setActiveGrenadeProgress] = useState<{ active: boolean; name: string; progress: number } | null>(null);
  
  // Active support timers
  const [activeDroneTimer, setActiveDroneTimer] = useState<number>(0);
  const [golemShowreel, setGolemShowreel] = useState<string | null>(null);

  // Weapon definitions
  const weaponsList: WeaponItem[] = [
    {
      id: 'laser',
      name: 'VTR-01 Chrono Laser',
      desc: 'Rapid tactical coherent beam emitter.',
      icon: <Zap className="w-4 h-4" />,
      color: 'shadow-[0_0_12px_rgba(34,211,238,0.7)] text-cyan-400 border-cyan-500/30',
      stats: { rate: '0.2s', impact: '25 pts', weight: 'LIGHT' },
      passiveDesc: 'Standard firing profiles.'
    },
    {
      id: 'plasma',
      name: 'PL-08 Void Plasma',
      desc: 'Fires heavy volatile plasma fields.',
      icon: <Flame className="w-4 h-4 text-rose-400" />,
      color: 'shadow-[0_0_12px_rgba(244,63,94,0.7)] text-rose-400 border-rose-500/30',
      stats: { rate: '0.35s', impact: '50 pts', weight: 'HEAVY' },
      passiveDesc: 'Deals 15M wide splash stun.'
    },
    {
      id: 'emp',
      name: 'EMP-04 Shockwave',
      desc: 'Concussive magnetic disruptor beam.',
      icon: <Radio className="w-4 h-4 text-fuchsia-400" />,
      color: 'shadow-[0_0_12px_rgba(217,70,239,0.7)] text-fuchsia-400 border-fuchsia-500/30',
      stats: { rate: '0.3s', impact: '35 pts', weight: 'MEDIUM' },
      passiveDesc: 'Doubles drone disruption time.'
    },
    {
      id: 'railgun',
      name: 'RA-12 Singularity Rail',
      desc: 'High energy rift acceleration piercing.',
      icon: <Locate className="w-4 h-4 text-orange-400" />,
      color: 'shadow-[0_0_12px_rgba(249,115,22,0.7)] text-orange-400 border-orange-500/30',
      stats: { rate: '0.6s', impact: '100 pts', weight: 'EXTREME' },
      passiveDesc: 'Chain-shocks adjacent drones up to 22M.'
    }
  ];

  // Grenade definitions
  const grenadesList: GrenadeItem[] = [
    {
      id: 'graviton',
      name: 'Graviton Imploder',
      desc: 'Collapses vector coordinate vectors on targets.',
      icon: <Bomb className="w-4 h-4 text-cyan-400" />,
      color: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25',
      cooldownSec: 10
    },
    {
      id: 'cluster',
      name: 'Cluster Shrapnel',
      desc: 'Splits into continuous chain detonations.',
      icon: <Compass className="w-4 h-4 text-amber-400" />,
      color: 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/25',
      cooldownSec: 12
    },
    {
      id: 'nano_reap',
      name: 'Nano Repair Burst',
      desc: 'Discharges cloud of micro-shield repair cell nanites.',
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
      color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25',
      cooldownSec: 15
    }
  ];

  // Support Companion Drone definitions
  const dronesList: DroneSupportItem[] = [
    {
      id: 'guardian',
      name: 'S-12 Shield Guardian',
      desc: 'Deploys a permanent pilot armor nanite repair field.',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />,
      color: 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/20',
      action: 'HEAL'
    },
    {
      id: 'sentry',
      name: 'I-04 Interceptor Sentry',
      desc: 'Discharges defensive pulse-disruption tags at nearby drones.',
      icon: <Loader2 className="w-4 h-4 text-fuchsia-400 animate-spin" />,
      color: 'border-fuchsia-500/30 text-fuchsia-400 hover:bg-fuchsia-950/20',
      action: 'STUN'
    },
    {
      id: 'recon',
      name: 'L-08 Recon Scout',
      desc: 'Coordinates targeting matrices and locks coordinates.',
      icon: <Locate className="w-4 h-4 text-cyan-400 animate-pulse" />,
      color: 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/20',
      action: 'LOCK'
    }
  ];

  // Golem definitions
  const golemsList: GolemItem[] = [
    {
      id: 'abyssum',
      name: 'Abyssum Dread Golem',
      desc: 'Unleashes high-mass vectors crushing drone grid sensors.',
      icon: <Skull className="w-4 h-4 text-rose-500" />,
      color: 'border-rose-500/30 text-rose-400 hover:bg-rose-950/20',
      cost: 100,
      perk: 'FIELD PURGE'
    },
    {
      id: 'iron_core',
      name: 'Aegis Iron Core Golem',
      desc: 'Deep charges pilot cockpit shield systems.',
      icon: <ShieldAlert className="w-4 h-4 text-amber-500" />,
      color: 'border-amber-500/30 text-amber-400 hover:bg-amber-950/20',
      cost: 100,
      perk: 'MAX SHIELD (+55)'
    },
    {
      id: 'prism',
      name: 'Echo Prism Golem',
      desc: 'Generates a double score multiplier matrix prism.',
      icon: <Cpu className="w-4 h-4 text-fuchsia-500" />,
      color: 'border-fuchsia-500/30 text-fuchsia-400 hover:bg-fuchsia-950/20',
      cost: 100,
      perk: 'DOUBLE SCORING (15s)'
    }
  ];

  // Stock regeneration: recovers 1 grenade stock every 15 seconds
  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = setInterval(() => {
      setGrenadeStock(prev => Math.min(3, prev + 1));
    }, 15000);
    return () => clearInterval(interval);
  }, [gameState]);

  // Support Drone periodic operations
  useEffect(() => {
    if (gameState !== 'playing') return;
    if (companionDrone === 'none') return;

    const interval = setInterval(() => {
      if (companionDrone === 'guardian') {
        // Regenerate shield density slowly
        if (playerHealth < 100) {
          const updatedHealth = Math.min(100, playerHealth + 1.5);
          useGameStore.setState({ playerHealth: updatedHealth });
          addParticles([0, 1, 0], '#10b981'); // Emerald particles around player
        }
      } else if (companionDrone === 'sentry') {
        // Occasionally disrupt a random active enemy bot
        const enemies = useGameStore.getState().enemies;
        const activeEnemies = enemies.filter(e => e.state === 'active');
        if (activeEnemies.length > 0) {
          const randomIndex = Math.floor(Math.random() * activeEnemies.length);
          const target = activeEnemies[randomIndex];
          hitEnemy(target.id, true);
          addEvent(`🛰️ COMPANION SENTRY: Tactical disruption tagged on Bot #${target.id.replace('bot-', '')}!`);
          if (target.position) {
            addParticles(target.position, '#d946ef');
          }
          soundManager.playSysAlert('click');
        }
      }
    }, 4500); // Trigger every 4.5 seconds

    return () => clearInterval(interval);
  }, [companionDrone, playerHealth, hitEnemy, addEvent, addParticles, gameState]);

  // Handle weapon swap
  const handleWeaponSelect = (id: WeaponItem['id']) => {
    if (activeSelectedWeapon === id) return;
    selectWeapon(id);
    soundManager.playSysAlert('click');
    addEvent(`⚔️ COGNITIVE COUPLING: Equipped ${id.toUpperCase()} ordnance!`);
  };

  // Launch a grenade (Asynchronous coordination loop)
  const handleGrenadeDeploy = (item: GrenadeItem) => {
    if (grenadeStock <= 0 || grenadeCooldown > 0 || activeGrenadeProgress) {
      soundManager.playSysAlert('click');
      return;
    }

    setGrenadeStock(prev => prev - 1);
    setGrenadeCooldown(item.cooldownSec);
    soundManager.playSysAlert('click');

    // Create async detonation progress step
    let progress = 0;
    setActiveGrenadeProgress({ active: true, name: item.name, progress: 0 });

    const stepInterval = setInterval(() => {
      progress += 10;
      setActiveGrenadeProgress(p => p ? { ...p, progress } : null);

      if (progress >= 100) {
        clearInterval(stepInterval);
        setActiveGrenadeProgress(null);

        // Explode! Impact current active drones
        const enemies = useGameStore.getState().enemies;
        const activeEnemies = enemies.filter(e => e.state === 'active');
        let damageTargetsCount = 0;

        activeEnemies.forEach((enemy) => {
          // Grenade hits a portion or all active enemies on grid simulation
          hitEnemy(enemy.id, true);
          damageTargetsCount++;
          if (enemy.position) {
            addParticles(enemy.position, item.id === 'nano_reap' ? '#10b981' : '#22d3ee');
          }
        });

        // Trigger custom perk operations based on grenade item type
        if (item.id === 'nano_reap') {
          const currH = useGameStore.getState().playerHealth;
          useGameStore.setState({ playerHealth: Math.min(100, currH + 25) });
          addEvent(`🛡️ NANO INJECT: Repercussed ${damageTargetsCount} bots & restored +25 Shield health!`);
        } else {
          addEvent(`💥 GRENADE IMPACT: ${item.name} detonated! Defused ${damageTargetsCount} drone systems.`);
        }

        soundManager.playComboHit(5); // heavy boom noise feedback
        incrementActiveWeaponCharge(12); // award extra calibration core points
      }
    }, 200);

    // Cooldown ticks
    let cooldownLeft = item.cooldownSec;
    const cooldownInterval = setInterval(() => {
      cooldownLeft--;
      setGrenadeCooldown(cooldownLeft);
      if (cooldownLeft <= 0) {
        clearInterval(cooldownInterval);
      }
    }, 1000);
  };

  // Launch support drone
  const handleDroneDeploy = (drone: DroneSupportItem) => {
    soundManager.playSysAlert('click');
    setCompanionDrone(drone.id as any);
    setActiveDroneTimer(20); // 20 seconds duration

    addEvent(`🛰️ SUPPORT LAUNCH: ${drone.name} entered pilot navigation sector!`);

    const timerInterval = setInterval(() => {
      setActiveDroneTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          setCompanionDrone('none');
          addEvent(`🛰️ COLLATERAL TERMINATION: Scout assistance drone depleted core battery.`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Summon Titan Golem!
  const handleGolemSummon = (golem: GolemItem) => {
    if (activeWeaponChargeUnits < golem.cost) {
      soundManager.playSysAlert('click');
      return;
    }

    // Spend energy Core units
    incrementActiveWeaponCharge(-golem.cost);
    soundManager.playSysAlert('click');
    setGolemSummon(golem.id as any);

    // Trigger full screen epic sequence overlay!
    setGolemShowreel(golem.name);

    setTimeout(() => {
      setGolemShowreel(null);

      // Deploy active combat bonuses
      const enemies = useGameStore.getState().enemies;
      const activeEnemies = enemies.filter(e => e.state === 'active');
      let shatteredCount = 0;

      activeEnemies.forEach((e) => {
        hitEnemy(e.id, true);
        shatteredCount++;
        if (e.position) {
          addParticles(e.position, '#f43f5e');
          addParticles(e.position, '#f59e0b');
        }
      });

      if (golem.id === 'iron_core') {
        const hNow = useGameStore.getState().playerHealth;
        useGameStore.setState({ playerHealth: Math.min(150, hNow + 55) }); // Over-shield support
      } else if (golem.id === 'prism') {
        useGameStore.setState({ scoreMultiplier: 2.5 });
        setTimeout(() => {
          useGameStore.setState({ scoreMultiplier: 1.0 });
          addEvent(`🔮 PRISM MATRIX: Scorable frequency returned to baseline levels.`);
        }, 15000);
      }

      addEvent(`🧱 TITAN CORES ASSEMBLED: ${golem.name} summoned! Ground impact paralyzed ${shatteredCount} enemies.`);
      soundManager.playComboHit(12); // Epic trigger music
      setGolemSummon('none');
    }, 2400);
  };

  // We only render in playing state
  if (gameState !== 'playing') return null;

  return (
    <>
      {/* Epic Golem Summon Cinematographic Overlay */}
      <AnimatePresence>
        {golemShowreel && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-xl border border-red-500/20"
          >
            <motion.div 
              initial={{ scale: 0.8, rotate: -2, y: 30 }}
              animate={{ scale: [1, 1.05, 1], rotate: 0, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="text-center font-mono max-w-md p-8 border border-amber-500/30 rounded-xl bg-black relative shadow-[0_0_80px_rgba(245,158,11,0.2)]"
            >
              {/* Scanline decoration */}
              <div className="absolute inset-0 bg-scanline pointer-events-none opacity-15" />
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent shadow-[0_0_15px_#f59e0b]" />

              <div className="flex justify-center mb-4">
                <motion.div 
                  className="p-3 bg-amber-500/10 border border-amber-500/40 rounded-full text-amber-500"
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 0] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                >
                  <Skull className="w-8 h-8" />
                </motion.div>
              </div>

              <span className="text-[10px] font-black tracking-[0.25em] text-amber-500 uppercase animate-pulse">
                [ CRITICAL SUMMON SEQUENCER ]
              </span>
              <h2 className="text-xl font-black text-white tracking-widest mt-2 uppercase">
                {golemShowreel}
              </h2>

              <p className="text-[10px] text-zinc-400 mt-4 leading-relaxed max-w-[300px] mx-auto">
                Bypassing navigation relays. Deploying Abyssum-stabilized structural core onto direct coordinates...
              </p>

              <div className="w-full bg-zinc-900 rounded-sm h-1.5 overflow-hidden mt-6 border border-white/5">
                <motion.div 
                  className="h-full bg-gradient-to-r from-amber-600 to-yellow-400"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2.2, ease: 'easeInOut' }}
                />
              </div>

              <div className="flex justify-between text-[8px] text-zinc-600 mt-2">
                <span>SECTOR LOCK 100%</span>
                <span className="animate-pulse">PARALYSIS CORE PREPARED</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main HUD Loadout Hotbar */}
      <div 
        id="hud-armory-loadout"
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-950/85 backdrop-blur-md border border-cyan-500/25 px-3 py-2 rounded-xl shadow-[0_12px_45px_rgba(0,0,0,0.9)] max-w-full w-[350px] md:w-[480px] pointer-events-auto select-none"
      >
        <BreathingHudPanel comboCount={comboCount} className="w-full h-full">
          {/* Top telemetry bar */}
        <div className="flex justify-between items-center pb-2 mb-2 border-b border-white/5 font-mono text-[8px] text-zinc-500 select-none">
          <span className="font-extrabold tracking-widest text-[7px] text-cyan-500/80 uppercase">
            VECTOR ARMORY SECTOR
          </span>

          <div className="flex items-center gap-2">
            <span className="text-zinc-600">CHARGE:</span>
            <div className="flex items-center gap-1">
              <div className="w-16 h-2 bg-zinc-950 border border-white/5 rounded-sm overflow-hidden relative">
                <motion.div 
                  className="h-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                  style={{ width: `${activeWeaponChargeUnits}%` }}
                />
              </div>
              <span className={`font-black tracking-tight ${activeWeaponChargeUnits >= 100 ? 'text-amber-400 animate-pulse' : 'text-zinc-400'}`}>
                {activeWeaponChargeUnits.toFixed(0)}/100
              </span>
            </div>
          </div>
        </div>

        {/* Tab Headers */}
        <div className="flex gap-1 mb-2.5">
          {(['weapons', 'grenades', 'drones', 'golems'] as LoadoutType[]).map((tab) => {
            const active = activeTab === tab;
            let icon = <Zap className="w-3.5 h-3.5" />;
            if (tab === 'grenades') icon = <Bomb className="w-3.5 h-3.5" />;
            else if (tab === 'drones') icon = <Radio className="w-3.5 h-3.5" />;
            else if (tab === 'golems') icon = <Skull className="w-3.5 h-3.5" />;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab);
                  soundManager.playSysAlert('click');
                }}
                className={`flex-1 py-1.5 rounded flex items-center justify-center gap-1.5 font-mono text-[9px] uppercase tracking-wider transition-all cursor-pointer border ${
                  active 
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-extrabold shadow-[0_0_12px_rgba(6,182,212,0.15)]' 
                    : 'bg-zinc-950/40 border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                }`}
              >
                {icon}
                <span className="hidden md:inline">{tab}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div className="min-h-[140px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {/* WEAPONS PANEL */}
            {activeTab === 'weapons' && (
              <motion.div 
                key="weapons-panel"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-2"
              >
                {weaponsList.map((weapon) => {
                  const equipped = activeSelectedWeapon === weapon.id;
                  return (
                    <button
                      key={weapon.id}
                      type="button"
                      onClick={() => handleWeaponSelect(weapon.id)}
                      className={`p-2 rounded border font-mono text-left relative overflow-hidden flex flex-col justify-between cursor-pointer group min-h-[75px] transition-colors duration-200 ${
                        equipped 
                          ? 'border-transparent text-white' 
                          : 'border-white/5 bg-zinc-950/80 text-zinc-400 hover:text-white hover:border-white/10'
                      }`}
                    >
                      {/* Smooth slide/fade-in layoutId selector background glow */}
                      {equipped && (
                        <motion.div 
                          layoutId="activeWeaponGlow"
                          className={`absolute inset-0 bg-cyan-950/30 rounded-md border ${
                            weapon.id === 'laser' 
                              ? 'border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.30)]' 
                              : weapon.id === 'plasma' 
                                ? 'border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.30)]' 
                                : weapon.id === 'emp' 
                                  ? 'border-fuchsia-500/50 shadow-[0_0_15px_rgba(217,70,239,0.30)]' 
                                  : 'border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.30)]'
                          }`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ type: "spring", stiffness: 380, damping: 28 }}
                        />
                      )}

                      {/* Content wrapped in relative container to render above the layoutId background with correct stacking */}
                      <div className="relative z-10 flex flex-col h-full justify-between w-full">
                        <div className="flex justify-between items-start mb-1 gap-1">
                          <motion.span 
                            animate={{ scale: equipped ? 1.05 : 1 }}
                            className={`p-1 rounded bg-zinc-900 ${equipped ? 'text-cyan-400' : 'text-zinc-500'}`}
                          >
                            {weapon.icon}
                          </motion.span>
                          <span className="text-[7px] text-zinc-650 opacity-60 uppercase font-bold">EQ-ORD</span>
                        </div>
                        
                        <div className="flex flex-col mt-0.5">
                          <span className={`text-[9px] font-black tracking-wide truncate transition-colors ${equipped ? 'text-cyan-300' : 'group-hover:text-cyan-300'}`}>
                            {weapon.name.split(' ').slice(1).join(' ')}
                          </span>
                          <div className="flex justify-between text-[7px] text-zinc-500 mt-1 uppercase">
                            <span>{weapon.stats.rate}</span>
                            <span>{weapon.stats.weight}</span>
                          </div>
                        </div>
                      </div>

                      {equipped && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute right-1 top-1 w-1.5 h-1.5 rounded-full bg-cyan-455 z-20"
                        >
                          <span className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-75" />
                        </motion.div>
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}

            {/* GRENADES PANEL */}
            {activeTab === 'grenades' && (
              <motion.div 
                key="grenades-panel"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-2"
              >
                {/* Active calibrating tracking */}
                {activeGrenadeProgress && (
                  <div className="bg-cyan-950/20 border border-cyan-500/30 p-2 rounded flex flex-col gap-1 text-[9px] font-mono mb-1">
                    <div className="flex justify-between items-center text-cyan-300">
                      <span className="flex items-center gap-1">
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        GRENADE IN FLIGHT FLYBY CALIBRATION
                      </span>
                      <span>{activeGrenadeProgress.progress}%</span>
                    </div>
                    <div className="w-full bg-zinc-900 rounded h-1 overflow-hidden">
                      <div className="h-full bg-cyan-400 transition-all duration-100" style={{ width: `${activeGrenadeProgress.progress}%` }} />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  {grenadesList.map((grenade) => {
                    const unavailable = grenadeStock <= 0 || grenadeCooldown > 0;
                    return (
                      <button
                        key={grenade.id}
                        type="button"
                        disabled={unavailable || !!activeGrenadeProgress}
                        onClick={() => handleGrenadeDeploy(grenade)}
                        className={`p-2 rounded border font-mono text-left transition-all cursor-pointer select-none ${
                          unavailable
                            ? 'bg-zinc-950/20 border-white/5 opacity-40 text-zinc-500 cursor-not-allowed'
                            : `bg-zinc-950/80 border-white/5 text-zinc-300 ${grenade.color}`
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="p-1 rounded bg-zinc-900">
                            {grenade.icon}
                          </span>
                          <span className="text-[10px] font-black text-cyan-400">
                            x{grenadeStock}
                          </span>
                        </div>
                        <h4 className="text-[9px] font-bold leading-tight truncate">{grenade.name}</h4>
                        <span className="text-[7px] text-zinc-500 uppercase mt-0.5 block flex items-center gap-1">
                          <Clock className="w-2 h-2 text-zinc-500" />
                          CD: {grenadeCooldown > 0 ? `${grenadeCooldown}s` : 'READY'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* DRONES PANEL */}
            {activeTab === 'drones' && (
              <motion.div 
                key="drones-panel"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-3 gap-2"
              >
                {dronesList.map((drone) => {
                  const deployed = companionDrone === drone.id;
                  const droneInUse = companionDrone !== 'none';
                  return (
                    <button
                      key={drone.id}
                      type="button"
                      disabled={droneInUse && !deployed}
                      onClick={() => handleDroneDeploy(drone)}
                      className={`p-2 rounded border font-mono text-left transition-all cursor-pointer relative ${
                        deployed 
                          ? `bg-emerald-950/20 border-emerald-500/50 text-white shadow-[0_0_12px_rgba(16,185,129,0.30)]` 
                          : droneInUse 
                            ? 'bg-zinc-950/20 border-white/5 opacity-30 text-zinc-650 cursor-not-allowed'
                            : `bg-zinc-950/80 border-white/5 text-zinc-300 ${drone.color}`
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="p-1 rounded bg-zinc-900">
                          {drone.icon}
                        </span>
                        <span className="text-[7px] text-zinc-500 uppercase font-black">
                          {drone.action}
                        </span>
                      </div>
                      <h4 className="text-[9px] font-bold truncate">{drone.name}</h4>
                      
                      {deployed ? (
                        <div className="text-[7px] text-emerald-400 flex items-center gap-1 mt-1 font-semibold animate-pulse">
                          <Sparkles className="w-1.5 h-1.5 text-emerald-400" />
                          ONLINE ({activeDroneTimer}s)
                        </div>
                      ) : (
                        <span className="text-[7px] text-zinc-500 block mt-1">TAP TO DEPLOY</span>
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}

            {/* GOLEMS PANEL */}
            {activeTab === 'golems' && (
              <motion.div 
                key="golems-panel"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-3 gap-2"
              >
                {golemsList.map((golem) => {
                  const usable = activeWeaponChargeUnits >= golem.cost;
                  return (
                    <button
                      key={golem.id}
                      type="button"
                      disabled={!usable}
                      onClick={() => handleGolemSummon(golem)}
                      className={`p-2 rounded border font-mono text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                        usable 
                          ? `bg-amber-950/15 border-amber-500/30 text-zinc-100 ${golem.color} shadow-[0_0_15px_rgba(245,158,11,0.15)]` 
                          : 'bg-zinc-950/20 border-white/5 text-zinc-600 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1 w-full">
                        <span className="p-1 rounded bg-zinc-900">
                          {golem.icon}
                        </span>
                        <span className={`text-[8px] font-black ${usable ? 'text-amber-400 animate-pulse' : 'text-zinc-650'}`}>
                          {golem.cost} UNIT
                        </span>
                      </div>
                      <div>
                        <h4 className="text-[9px] font-bold truncate leading-tight">{golem.name}</h4>
                        <span className={`text-[7px] block mt-1 uppercase font-semibold ${usable ? 'text-amber-300' : 'text-zinc-500'}`}>
                          {golem.perk}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom active description channel */}
          <div className="text-[8px] font-mono text-zinc-550 mt-2 bg-zinc-950/60 p-2 rounded border border-white/5 flex justify-between items-center gap-3 min-h-[36px] overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.span
                  key={`${activeTab}-${activeSelectedWeapon}`}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.12, ease: "easeOut" }}
                  className="block text-zinc-400 select-none"
                >
                  {activeTab === 'weapons' && weaponsList.find(w => w.id === activeSelectedWeapon)?.desc}
                  {activeTab === 'grenades' && 'Tactical grenades consume flight telemetry coordinate slots.'}
                  {activeTab === 'drones' && 'Drones assist on separate sub-frequencies.'}
                  {activeTab === 'golems' && 'Golems require a fully charged Anxium central core.'}
                </motion.span>
              </AnimatePresence>
            </div>
            <span className="text-[7px] text-cyan-500 shrink-0 uppercase font-black tracking-widest hidden md:inline">
              SYS RE-GRID V1
            </span>
          </div>
        </div>
      </BreathingHudPanel>
    </div>
    </>
  );
}
