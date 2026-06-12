/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { useGameStore } from '../store';
import { Cpu, Target, Shield, Flame, Plus, Eye, Radio, Zap, Trash2, Skull, Radar } from 'lucide-react';

interface DronePreset {
  typeId: string;
  name: string;
  color: string;
  speed: number;
  scale: number;
  description: string;
  hotkey: string;
  icon: any;
  isDecoy?: boolean;
}

export const DRONE_CHASSIS_SKINS = [
  { id: 'standard', name: 'Standard Sentinel', description: 'Classic biometric cylinder pod head' },
  { id: 'quadcopter', name: 'Quadcopter Aero', description: 'Four-way rotor bars with high-RPM active spinning propellers' },
  { id: 'heavy_armor', name: 'Heavy Armor Vanguard', description: 'Bulk reinforced cube core with heavy side defensive armor plating' },
  { id: 'ring_fury', name: 'Ring Fury Gyroscope', description: 'Suspended visual sphere surrounded by a multi-axis spinning reactor ring' },
  { id: 'stealth_delta', name: 'Stealth Delta Glider', description: 'Supersonic delta wings with aerodynamic forward cockpit slit' },
];

const DRONE_PRESETS: DronePreset[] = [
  {
    typeId: 'hawk',
    name: 'Hawk Recon',
    color: '#06b6d4', // Cyan
    speed: 1.6,
    scale: 0.75,
    description: 'Blazing fast movement speed. Small target signature.',
    hotkey: '1',
    icon: Target,
  },
  {
    typeId: 'titan',
    name: 'Titan Tank',
    color: '#f97316', // Orange
    speed: 0.65,
    scale: 1.45,
    description: 'Super massive, heavy steel chassis sentinel block.',
    hotkey: '2',
    icon: Shield,
  },
  {
    typeId: 'phantom',
    name: 'Phantom Elite',
    color: '#d946ef', // Fuchsia
    speed: 1.15,
    scale: 1.0,
    description: 'Average metrics. Extremely aggressive chasing vector.',
    hotkey: '3',
    icon: Flame,
  },
  {
    typeId: 'decoy',
    name: 'Ghost Decoy',
    color: '#38bdf8', // Light blue/cyan ghost
    speed: 1.0,
    scale: 0.95,
    description: 'Spectral holographic decoy. Hitting this grants EXTRA TIME (+15s) instead of score.',
    hotkey: '4',
    icon: Eye,
    isDecoy: true,
  }
];

export function DroneSpawner() {
  const addDrone = useGameStore(state => state.addDrone);
  const gameState = useGameStore(state => state.gameState);
  const droneAiMode = useGameStore(state => state.droneAiMode);
  const setDroneAiMode = useGameStore(state => state.setDroneAiMode);

  // Wave & Swarm state hooks
  const currentWave = useGameStore(state => state.currentWave);
  const swarmActive = useGameStore(state => state.swarmActive);
  const swarmTimeRemaining = useGameStore(state => state.swarmTimeRemaining);
  const scoreMultiplier = useGameStore(state => state.scoreMultiplier);
  const triggerSwarm = useGameStore(state => state.triggerSwarm);
  const nextWave = useGameStore(state => state.nextWave);
  const clearAllDrones = useGameStore(state => state.clearAllDrones);
  const pingNearestDrone = useGameStore(state => state.pingNearestDrone);
  const pings = useGameStore(state => state.pings || []);
  const showPingCooldownAlert = useGameStore(state => state.showPingCooldownAlert);
  const enemies = useGameStore(state => state.enemies || []);
  const playerPosition = useGameStore(state => state.playerPosition || [0, 0, 0]);

  // Track active drones and their proximity to the player
  const activeDronesWithDistance = enemies
    .filter(e => e.state === 'active')
    .map(e => {
      const dx = e.position[0] - playerPosition[0];
      const dy = e.position[1] - playerPosition[1];
      const dz = e.position[2] - playerPosition[2];
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      return {
        id: e.id,
        label: e.label || e.id,
        position: e.position,
        distance,
        isDecoy: !!e.isDecoy
      };
    })
    .sort((a, b) => a.distance - b.distance);

  const handleSpawn = (preset: DronePreset) => {
    if (gameState !== 'playing') return;
    
    addDrone({
      color: preset.color,
      scale: preset.scale,
      speedMultiplier: preset.speed,
      label: preset.name,
      isDecoy: preset.isDecoy
    });
  };

  // Bind numeric hotkeys and directive hotkeys for rapid active combat play
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      
      const preset = DRONE_PRESETS.find(p => p.hotkey === e.key);
      if (preset) {
        handleSpawn(preset);
        return;
      }

      if (e.key === 'F1') {
        e.preventDefault();
        setDroneAiMode('aggressive');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setDroneAiMode('defensive');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setDroneAiMode('scout');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, addDrone, setDroneAiMode]);

  return (
    <div
      id="tactical-drone-spawner"
      className="relative flex flex-col gap-2.5 p-3 bg-black/75 border border-cyan-500/20 rounded backdrop-blur-md select-none pointer-events-auto z-30 w-full text-xs shadow-[0_0_15px_rgba(34,211,238,0.1)] transition-all duration-300"
    >
      {/* Upper Title metadata header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-[9px] uppercase font-bold tracking-[0.16em] text-cyan-500/60">DRONE SYSTEMS</span>
        </div>
        <span className="text-[7.5px] bg-cyan-500/10 text-cyan-400 px-1 py-0.5 rounded border border-cyan-500/30 uppercase font-mono tracking-wider animate-pulse">
          Active
        </span>
      </div>

      {/* AI Modes Directives Controls Section */}
      <div className="flex flex-col gap-1 py-1-5">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[9px] uppercase font-bold tracking-[0.16em] text-cyan-500/60 flex items-center gap-1">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            AI DIRECTIVE
          </span>
          <span className="text-[8px] text-fuchsia-400 uppercase font-bold tracking-widest font-mono">
            {droneAiMode}
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-1 bg-slate-950/80 p-1 rounded border border-white/5">
          <button
            onClick={() => setDroneAiMode('aggressive')}
            className={`flex flex-col items-center gap-1 py-1.5 px-0.5 rounded cursor-pointer transition-all duration-200 outline-none ${
              droneAiMode === 'aggressive'
                ? 'bg-red-500/15 text-red-400 border border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.2)]'
                : 'text-slate-500 border border-transparent hover:text-slate-300'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span className="text-[7.5px] font-bold uppercase tracking-wider">STRIKE</span>
            <span className="text-[6px] opacity-50 font-mono">[F1]</span>
          </button>

          <button
            onClick={() => setDroneAiMode('defensive')}
            className={`flex flex-col items-center gap-1 py-1.5 px-0.5 rounded cursor-pointer transition-all duration-200 outline-none ${
              droneAiMode === 'defensive'
                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.2)]'
                : 'text-slate-500 border border-transparent hover:text-slate-300'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="text-[7.5px] font-bold uppercase tracking-wider">GUARD</span>
            <span className="text-[6px] opacity-50 font-mono">[F2]</span>
          </button>

          <button
            onClick={() => setDroneAiMode('scout')}
            className={`flex flex-col items-center gap-1 py-1.5 px-0.5 rounded cursor-pointer transition-all duration-200 outline-none ${
              droneAiMode === 'scout'
                ? 'bg-green-500/15 text-green-400 border border-green-500/30 shadow-[0_0_8px_rgba(34,197,94,0.2)]'
                : 'text-slate-500 border border-transparent hover:text-slate-300'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="text-[7.5px] font-bold uppercase tracking-wider">SCAN</span>
            <span className="text-[6px] opacity-50 font-mono">[F3]</span>
          </button>
        </div>
      </div>

      {/* Wave & Swarms Threat Matrix Module */}
      <div className="flex flex-col gap-1.5 border-t border-white/5 pt-2">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-[9px] uppercase font-bold tracking-[0.16em] text-cyan-500/60 flex items-center gap-1.5">
            <Skull className="w-3 h-3 text-red-500 animate-pulse" />
            THREAT MATRIX
          </span>
          <span className="text-[8.5px] font-mono text-cyan-400 font-bold bg-cyan-950/50 px-1 py-0.5 rounded border border-cyan-500/20 font-mono">
            WAVE {currentWave}
          </span>
        </div>

        {/* Dynamic Swarm Alarm Banner and Stats */}
        {swarmActive ? (
          <div className="relative overflow-hidden bg-red-500/10 border border-red-500/40 p-2 rounded flex flex-col gap-1 text-red-400 animate-pulse">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold tracking-wider flex items-center gap-1 animate-bounce">
                <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400 animate-spin" />
                SWARM ACTIVE ({scoreMultiplier}X SCORE!)
              </span>
              <span className="font-mono text-[9px] font-bold bg-red-500/20 px-1 rounded font-mono">
                {swarmTimeRemaining.toFixed(1)}s
              </span>
            </div>
            {/* Visual timer countdown track */}
            <div className="w-full bg-red-950/50 h-1 rounded-full overflow-hidden">
              <div 
                className="bg-red-500 h-full transition-all duration-100 ease-linear"
                style={{ width: `${Math.min(100, Math.max(0, (swarmTimeRemaining / 25) * 100))}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="bg-slate-950/60 border border-white/5 p-2 rounded text-[8.5px] text-slate-400 font-mono leading-normal font-mono">
            Status: <span className="text-emerald-400 font-bold">Stable</span> | Auto-swarm check active. Score Multiplier: <span className="text-yellow-400 font-bold">1x</span>
          </div>
        )}

        {/* Dual Control Buttons: Next Wave & Summon Swarm */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => nextWave()}
            disabled={gameState !== 'playing'}
            className="flex items-center justify-center gap-1 bg-cyan-500/10 hover:bg-cyan-500/20 active:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 py-1.5 px-2 rounded font-bold cursor-pointer transition-all duration-200 uppercase tracking-wide text-[8.5px] disabled:opacity-40 disabled:cursor-not-allowed text-center"
          >
            Deploy Wave {currentWave + 1}
          </button>
          
          <button
            onClick={() => triggerSwarm()}
            disabled={gameState !== 'playing' || swarmActive}
            className="flex items-center justify-center gap-1 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 border border-red-500/30 text-red-300 py-1.5 px-2 rounded font-bold cursor-pointer transition-all duration-200 uppercase tracking-wide text-[8.5px] disabled:opacity-40 disabled:cursor-not-allowed text-center shadow-[0_0_8px_rgba(239,68,68,0.05)]"
          >
            <Zap className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
            Trigger Swarm
          </button>
        </div>

        {/* Wipe/Clear board utility */}
        <button
          onClick={() => clearAllDrones()}
          disabled={gameState !== 'playing'}
          className="flex items-center justify-center gap-1 bg-white/5 hover:bg-red-500/15 hover:border-red-500/20 border border-white/5 text-slate-400 hover:text-red-300 py-1 px-2 rounded font-mono transition-all duration-200 text-[8px] disabled:opacity-40 disabled:cursor-not-allowed font-mono"
        >
          <Trash2 className="w-2.5 h-2.5" />
          Clear Spawner Grid
        </button>

        {/* Proximity Density Tracker Block */}
        <div className="flex flex-col gap-1 border-t border-dashed border-white/10 pt-2.5 mt-0.5">
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-[9px] uppercase font-bold tracking-[0.16em] text-cyan-500/60 flex items-center gap-1.5">
              <Radar className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              PROXIMITY DENSITY RADAR
            </span>
            {activeDronesWithDistance.length > 0 && (
              <span className="text-[7.5px] font-mono text-cyan-400 font-bold bg-cyan-950/40 px-1 py-0.5 rounded border border-cyan-500/20">
                {activeDronesWithDistance.length} THREATS
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1 bg-slate-950/70 border border-white/5 p-1.5 rounded max-h-32 overflow-y-auto custom-scrollbar">
            {activeDronesWithDistance.length === 0 ? (
              <span className="text-slate-500 text-center italic py-1 text-[8px]">No active scanner contacts</span>
            ) : (
              activeDronesWithDistance.map(d => {
                const isCritical = d.distance < 5.0;
                return (
                  <div 
                    key={d.id} 
                    className={`flex items-center justify-between py-1 px-1.5 rounded-sm border transition-all duration-200 ${
                      isCritical 
                        ? 'bg-red-950/40 border-red-500/30 text-red-400 font-bold animate-pulse' 
                        : d.isDecoy
                          ? 'bg-sky-950/35 border-sky-500/25 text-sky-300'
                          : 'bg-black/20 border-transparent text-slate-300'
                    }`}
                  >
                    <span className="truncate max-w-[95px] uppercase tracking-wide text-[8.5px] flex items-center gap-1">
                      {d.isDecoy && <span className="text-[9px]">👻</span>}
                      {d.label}
                    </span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-[7px] opacity-40">({Math.round(d.position[0])}, {Math.round(d.position[2])})</span>
                      <span className={`px-1 rounded text-[8px] font-black tracking-wider ${
                        isCritical 
                          ? 'bg-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
                          : d.isDecoy
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-800 text-slate-200'
                      }`}>
                        {d.distance.toFixed(1)}m
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Interactive Tactical Ping Grid Controller section */}
        <div className="flex flex-col gap-1 border-t border-dashed border-white/10 pt-2 mt-1">
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-[9px] uppercase font-bold tracking-[0.16em] text-cyan-400/80 flex items-center gap-1">
              <Radar className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              TACTICAL SCAN PINGS
            </span>
            {pings.length > 0 && (
              <span className="text-[7px] font-mono text-fuchsia-400 font-bold bg-fuchsia-950/40 px-1 py-0.5 rounded border border-fuchsia-500/20 animate-pulse">
                {pings.length} ACTIVE
              </span>
            )}
          </div>
          <button
            onClick={() => pingNearestDrone()}
            disabled={gameState !== 'playing'}
            className="group flex flex-col items-center justify-center gap-0.5 bg-cyan-500/10 hover:bg-cyan-500/20 active:bg-cyan-500/30 border border-cyan-400/35 text-cyan-300 font-bold rounded py-1 px-2 text-[8px] cursor-pointer transition-all duration-200 outline-none w-full shadow-[0_0_8px_rgba(6,182,212,0.1)] active:scale-[0.98]"
          >
            <div className="flex items-center gap-1">
              <Radar className="w-3 h-3 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>PING NEAREST SENTINEL</span>
            </div>
            <span className="text-[6.5px] opacity-60 font-mono tracking-wider">[P OR G KEY]</span>
          </button>
          
          {showPingCooldownAlert && (
            <span className="text-[7px] text-center font-mono text-amber-400 font-black animate-bounce mt-0.5">
              ⚠️ PING COOLDOWN ACTIVE (1 PER 2S)
            </span>
          )}
        </div>
      </div>

      {/* Preset List Row */}
      <div className="flex flex-col gap-1.5 border-t border-white/5 pt-2">
        <span className="text-[9px] uppercase font-bold tracking-[0.16em] text-cyan-500/60 pb-0.5">
          DEPLOYMENT RIGS
        </span>
        {DRONE_PRESETS.map((preset) => {
          const Icon = preset.icon;
          return (
            <button
              key={preset.typeId}
              onClick={() => handleSpawn(preset)}
              className="group flex flex-col gap-0.5 bg-slate-950/50 hover:bg-slate-900/60 hover:border-cyan-500/30 border border-slate-900 px-2 py-1.5 rounded cursor-pointer text-left transition-all duration-200 outline-none"
            >
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 transition-transform group-hover:scale-110" style={{ color: preset.color }} />
                  <span className="font-bold tracking-wide text-[11px] text-white group-hover:text-cyan-400 transition-colors">
                    {preset.name}
                  </span>
                </div>
                {/* Visual tactile Hotkey guide indicator badge */}
                <span className="font-mono text-[8.5px] font-bold text-slate-500 bg-slate-900 px-1 py-0.5 rounded border border-white/5 group-hover:text-cyan-400 group-hover:border-cyan-500/20 transition-all">
                  [{preset.hotkey}]
                </span>
              </div>
              <p className="text-[8.5px] text-slate-400 leading-normal font-sans pr-1">
                {preset.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Tactical helper advice tip bar */}
      <div className="flex items-center gap-1 text-[8.5px] text-slate-500 font-sans mt-0.5 border-t border-white/5 pt-2">
        <Plus className="w-2.5 h-2.5 text-cyan-400/50" />
        <span>Keys UI [1, 2, 3] and modes [F1, F2, F3]</span>
      </div>
    </div>
  );
}
