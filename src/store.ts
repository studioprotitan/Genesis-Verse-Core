/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { create } from 'zustand';
import * as THREE from 'three';
import { io, Socket } from 'socket.io-client';
import { soundManager } from './utils/audio';

export type GameState = 'menu' | 'playing' | 'gameover';
export type EntityState = 'active' | 'disabled';
export type DroneAIMode = 'aggressive' | 'defensive' | 'scout';

export interface EnemyData {
  id: string;
  position: [number, number, number];
  state: EntityState;
  disabledUntil: number;
  color?: string;
  speedMultiplier?: number;
  scale?: number;
  label?: string;
  chassisSkin?: 'standard' | 'quadcopter' | 'heavy_armor' | 'ring_fury' | 'stealth_delta';
  isDecoy?: boolean;
}

export interface PlayerData {
  id: string;
  name: string;
  position: [number, number, number];
  rotation: number;
  state: EntityState;
  disabledUntil: number;
  score: number;
  color: string;
}

export interface LaserData {
  id: string;
  start: [number, number, number];
  end: [number, number, number];
  timestamp: number;
  color: string;
}

export interface ParticleData {
  id: string;
  position: [number, number, number];
  timestamp: number;
  color: string;
}

export interface GameEvent {
  id: string;
  message: string;
  timestamp: number;
}

export interface KillFeedEntry {
  id: string;
  killer: string;
  victim: string;
  killerColor: string;
  victimColor: string;
  timestamp: number;
  weapon: 'plasma' | 'laser' | 'collision' | 'system' | 'nanoshield' | 'decoy';
}

export interface PowerUpData {
  id: string;
  type: 'invulnerability' | 'double_damage';
  position: [number, number, number];
  color: string;
}

export interface PingData {
  id: string;
  senderName: string;
  senderColor: string;
  position: [number, number, number];
  timestamp: number;
  type?: 'drone' | 'rift' | 'general';
}

export interface DamageIndicator {
  id: string;
  angle: number;
  timestamp: number;
  isSwarm: boolean;
  damageAmount: number;
}

export type EnvironmentalType = 'nebula' | 'eclipse' | 'overload' | 'nanite_storm';

export interface EnvironmentalState {
  type: EnvironmentalType;
  name: string;
  fogColor: string;
  fogDensity: number;
  lightColor: string;
  lightIntensity: number;
  particleColor: string;
  particleSpeedMultiplier: number;
  particleDirection: [number, number, number];
  description: string;
}

export const ENVIRONMENTAL_PRESETS: Record<EnvironmentalType, EnvironmentalState> = {
  nebula: {
    type: 'nebula',
    name: 'Cosmic Nebula',
    fogColor: '#050510',
    fogDensity: 0.025,
    lightColor: '#ffffff',
    lightIntensity: 1.0,
    particleColor: '#00ffff',
    particleSpeedMultiplier: 1.0,
    particleDirection: [0.2, 0.5, 0.2],
    description: 'Atmospheric stability established.'
  },
  eclipse: {
    type: 'eclipse',
    name: 'Solar Eclipse',
    fogColor: '#020205',
    fogDensity: 0.04,
    lightColor: '#ff7700',
    lightIntensity: 0.25,
    particleColor: '#ffbb44',
    particleSpeedMultiplier: 0.4,
    particleDirection: [-0.05, 0.15, -0.05],
    description: 'Luminosity failure. localized auxiliary solar panels online.'
  },
  overload: {
    type: 'overload',
    name: 'Grid Overload',
    fogColor: '#1b0222',
    fogDensity: 0.03,
    lightColor: '#d946ef',
    lightIntensity: 1.5,
    particleColor: '#f472b6',
    particleSpeedMultiplier: 2.2,
    particleDirection: [0.4, -0.8, 0.4],
    description: 'Severe ionic resonance. Static field sparks falling.'
  },
  nanite_storm: {
    type: 'nanite_storm',
    name: 'Nanite Typhoon',
    fogColor: '#020f06',
    fogDensity: 0.05,
    lightColor: '#22c55e',
    lightIntensity: 1.1,
    particleColor: '#4ade80',
    particleSpeedMultiplier: 1.6,
    particleDirection: [-0.7, -1.2, -0.3],
    description: 'High-density green nanites drifting in high gust vectors.'
  }
};

interface GameStore {
  gameState: GameState;
  score: number;
  timeLeft: number;
  playerState: EntityState;
  playerDisabledUntil: number;
  playerHealth: number;
  lastDamageTime: number;
  isRegenerating: boolean;
  showRepairNotification: boolean;
  lastHitTime: number; // timestamp
  enemies: EnemyData[];
  powerUps: PowerUpData[];
  activePowerUps: {
    invulnerability: number; // timestamp
    double_damage: number;    // timestamp
  };
  lastPowerUpSpawnTime: number; // timestamp
  lasers: LaserData[];
  particles: ParticleData[];
  events: GameEvent[];
  killFeed: KillFeedEntry[];
  environment: EnvironmentalState;
  setEnvironment: (type: EnvironmentalType) => void;
  droneAiMode: DroneAIMode;
  setDroneAiMode: (mode: DroneAIMode) => void;
  
  // Tactical Stats
  shotsFired: number;
  shotsHit: number;
  damageDealt: number;
  incrementShotsFired: () => void;
  comboCount: number;
  maxComboCount: number;
  registerMiss: () => void;
  
  // Local Player and Multiplayer
  playerPosition: [number, number, number];
  playerRotation: number;
  playerSpeed: number;
  socket: Socket | null;
  otherPlayers: Record<string, PlayerData>;

  startGame: () => void;
  endGame: () => void;
  leaveGame: () => void;
  updateTime: (delta: number) => void;
  hitPlayer: (shooterId?: string) => void;
  hitEnemy: (id: string, byPlayer?: boolean, shooterId?: string) => void;
  addLaser: (start: [number, number, number], end: [number, number, number], color: string) => void;
  addParticles: (position: [number, number, number], color: string) => void;
  addEvent: (message: string) => void;
  addKillFeedEntry: (
    killer: string, 
    victim: string, 
    killerColor?: string, 
    victimColor?: string, 
    weapon?: 'plasma' | 'laser' | 'collision' | 'system' | 'nanoshield'
  ) => void;
  updateEnemies: (time: number) => void;
  cleanupEffects: (time: number) => void;
  setPlayerState: (state: EntityState) => void;
  pickupPowerUp: (id: string) => void;
  addDrone: (config?: Partial<EnemyData>) => void;
  
  // Wave & Swarm Logic
  currentWave: number;
  swarmActive: boolean;
  swarmTimeRemaining: number;
  scoreMultiplier: number;
  lastSwarmTriggerTime: number;
  triggerSwarm: () => void;
  nextWave: () => void;
  clearAllDrones: () => void;
  riftExtractionActive: boolean;
  riftExtractionTimeRemaining: number;
  
  // Multiplayer actions
  updatePlayerPosition: (position: [number, number, number], rotation: number) => void;

  // Mobile Controls
  mobileInput: {
    move: { x: number, y: number };
    look: { x: number, y: number };
    shooting: boolean;
  };
  setMobileInput: (input: Partial<{
    move: { x: number, y: number };
    look: { x: number, y: number };
    shooting: boolean;
  }>) => void;

  // Manual Ping Systems
  pingedDroneId: string | null;
  targetedDroneId: string | null;
  setTargetedDroneId: (id: string | null) => void;
  lastPingTime: number;
  showPingCooldownAlert: boolean;
  pingNearestDrone: () => void;
  pingDrone: (id: string, position: [number, number, number]) => void;
  pings: PingData[];
  addPing: (position: [number, number, number], senderName?: string, senderColor?: string, type?: 'drone' | 'rift' | 'general') => void;
  damageIndicators: DamageIndicator[];
  removeDamageIndicator: (id: string) => void;
  isGhostMode: boolean;
  setIsGhostMode: (val: boolean) => void;

  // Compact Async Weapon Loadout Extensions
  activeSelectedWeapon: 'laser' | 'plasma' | 'emp' | 'railgun';
  companionDrone: 'none' | 'guardian' | 'sentry' | 'recon';
  golemSummon: 'none' | 'abyssum' | 'iron_core' | 'prism';
  activeWeaponChargeUnits: number;
  selectWeapon: (weapon: 'laser' | 'plasma' | 'emp' | 'railgun') => void;
  setCompanionDrone: (drone: 'none' | 'guardian' | 'sentry' | 'recon') => void;
  setGolemSummon: (golem: 'none' | 'abyssum' | 'iron_core' | 'prism') => void;
  incrementActiveWeaponCharge: (amt: number) => void;

  // Weapon Calibration Upgrade Extensions
  calibrationFireRateActiveUntil: number;
  calibrationRangeActiveUntil: number;
  purchaseCalibrationUpgrade: (type: 'fireRate' | 'range', cost: number, durationSec: number) => boolean;

  // Pilot Profile Identity State
  pilotName: string;
  pilotHours: number;
  pilotAvatarUrl: string;
  setPilotProfile: (profile: Partial<{ name: string; hours: number; avatarUrl: string }>) => void;

  // Damage distribution history for D3 visualization
  damageHistory: number[];
  recordMissionDamage: (damage: number) => void;
}

const INITIAL_ENEMIES: EnemyData[] = [
  { id: 'bot-1', position: [40, 1, 40], state: 'active', disabledUntil: 0, chassisSkin: 'standard' },
  { id: 'bot-2', position: [-40, 1, 40], state: 'active', disabledUntil: 0, chassisSkin: 'quadcopter' },
  { id: 'bot-3', position: [40, 1, -40], state: 'active', disabledUntil: 0, chassisSkin: 'heavy_armor' },
  { id: 'bot-4', position: [-40, 1, -40], state: 'active', disabledUntil: 0, chassisSkin: 'ring_fury' },
  { id: 'bot-5', position: [0, 1, -50], state: 'active', disabledUntil: 0, chassisSkin: 'stealth_delta' },
  { id: 'bot-6', position: [60, 1, 0], state: 'active', disabledUntil: 0, chassisSkin: 'quadcopter' },
  { id: 'bot-7', position: [-60, 1, 0], state: 'active', disabledUntil: 0, chassisSkin: 'heavy_armor' },
  { id: 'bot-8', position: [0, 1, 50], state: 'active', disabledUntil: 0, chassisSkin: 'ring_fury' },
];

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: 'menu',
  score: 0,
  timeLeft: 120, // 2 minutes
  playerState: 'active',
  playerDisabledUntil: 0,
  playerHealth: 100,
  lastDamageTime: 0,
  isRegenerating: false,
  showRepairNotification: false,
  lastHitTime: 0,
  enemies: [],
  powerUps: [],
  activePowerUps: {
    invulnerability: 0,
    double_damage: 0,
  },
  lastPowerUpSpawnTime: 0,
  lasers: [],
  particles: [],
  events: [],
  killFeed: [],
  environment: ENVIRONMENTAL_PRESETS.nebula,
  droneAiMode: 'aggressive',
  isGhostMode: typeof window !== 'undefined' ? (localStorage.getItem('isGhostMode') === 'true') : false,
  setIsGhostMode: (val: boolean) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('isGhostMode', String(val));
    }
    set({ isGhostMode: val });
  },
  
  // Wave & Swarm initial state
  currentWave: 1,
  swarmActive: false,
  swarmTimeRemaining: 0,
  scoreMultiplier: 1,
  lastSwarmTriggerTime: Date.now() + 10000, // delay first auto swarm by 10 seconds of playtime
  riftExtractionActive: false,
  riftExtractionTimeRemaining: 0,
  
  // Tactical Stats
  shotsFired: 0,
  shotsHit: 0,
  damageDealt: 0,
  comboCount: 0,
  maxComboCount: 0,
  incrementShotsFired: () => set((state) => {
    if (state.gameState !== 'playing') return state;
    return { shotsFired: state.shotsFired + 1 };
  }),
  registerMiss: () => set((state) => {
    if (state.gameState !== 'playing') return state;
    return { comboCount: 0 };
  }),
  
  playerPosition: [0, 2, 0],
  playerRotation: 0,
  playerSpeed: 0,
  socket: null,
  otherPlayers: {},

  mobileInput: {
    move: { x: 0, y: 0 },
    look: { x: 0, y: 0 },
    shooting: false
  },

  setMobileInput: (input) => set((state) => ({
    mobileInput: { ...state.mobileInput, ...input }
  })),

  pingedDroneId: null,
  targetedDroneId: null,
  setTargetedDroneId: (id) => set({ targetedDroneId: id }),
  lastPingTime: 0,
  showPingCooldownAlert: false,
  pings: [],
  damageIndicators: [],

  removeDamageIndicator: (id) => set((state) => ({
    damageIndicators: (state.damageIndicators || []).filter(di => di.id !== id)
  })),

  // Compact Async Weapon Loadout Defaults and Setters
  activeSelectedWeapon: 'laser',
  companionDrone: 'none',
  golemSummon: 'none',
  activeWeaponChargeUnits: 30, // Starts with some partial charge
  selectWeapon: (weapon) => set({ activeSelectedWeapon: weapon }),
  setCompanionDrone: (drone) => set({ companionDrone: drone }),
  setGolemSummon: (golem) => set({ golemSummon: golem }),
  incrementActiveWeaponCharge: (amt) => set((state) => ({
    activeWeaponChargeUnits: Math.min(100, Math.max(0, state.activeWeaponChargeUnits + amt))
  })),

  // Weapon Calibration Implementation
  calibrationFireRateActiveUntil: 0,
  calibrationRangeActiveUntil: 0,
  purchaseCalibrationUpgrade: (type, cost, durationSec) => {
    let success = false;
    set((state) => {
      if (state.score < cost) return {};
      
      const expireTime = Date.now() + durationSec * 1000;
      const updatedScore = state.score - cost;
      
      const nextEvents = [
        ...state.events,
        {
          id: Math.random().toString(),
          message: `🔧 CALIBRATION: -${cost} pts! Activated ${type === 'fireRate' ? 'Fire-Rate Overclock' : 'Extended Range Sensors'} (+${durationSec}s)`,
          timestamp: Date.now()
        }
      ];

      success = true;

      if (type === 'fireRate') {
        return {
          score: updatedScore,
          calibrationFireRateActiveUntil: expireTime,
          events: nextEvents
        };
      } else {
        return {
          score: updatedScore,
          calibrationRangeActiveUntil: expireTime,
          events: nextEvents
        };
      }
    });
    return success;
  },

  // Pilot Profile implementation with localStorage backup
  pilotName: typeof window !== 'undefined' ? (localStorage.getItem('pilot_name') || 'VALKYRIE-09') : 'VALKYRIE-09',
  pilotHours: typeof window !== 'undefined' ? parseFloat(localStorage.getItem('pilot_hours') || '42.8') : 42.8,
  pilotAvatarUrl: typeof window !== 'undefined' ? (localStorage.getItem('pilot_avatar_url') || '/src/assets/images/pilot_avatar_cyber_1781258061439.jpg') : '/src/assets/images/pilot_avatar_cyber_1781258061439.jpg',
  setPilotProfile: (profile) => set((state) => {
    const nextName = profile.name !== undefined ? profile.name : state.pilotName;
    const nextHours = profile.hours !== undefined ? profile.hours : state.pilotHours;
    const nextAvatar = profile.avatarUrl !== undefined ? profile.avatarUrl : state.pilotAvatarUrl;

    if (typeof window !== 'undefined') {
      localStorage.setItem('pilot_name', nextName);
      localStorage.setItem('pilot_hours', String(nextHours));
      localStorage.setItem('pilot_avatar_url', nextAvatar);
    }

    return {
      pilotName: nextName,
      pilotHours: nextHours,
      pilotAvatarUrl: nextAvatar
    };
  }),

  // Damage distribution history for D3 visualization
  damageHistory: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('pilot_damage_history') || '[1200, 850, 1950, 1400, 2100]') : [1200, 850, 1950, 1400, 2100],
  recordMissionDamage: (damage) => set((state) => {
    const nextHistory = [...state.damageHistory, damage].slice(-5);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pilot_damage_history', JSON.stringify(nextHistory));
    }
    return { damageHistory: nextHistory };
  }),

  pingNearestDrone: () => {
    const { enemies, playerPosition, addPing } = get();
    let minDistance = Infinity;
    let nearestDrone: EnemyData | null = null;

    enemies.forEach((drone) => {
      if (drone.state !== 'active') return;
      const dx = drone.position[0] - playerPosition[0];
      const dy = drone.position[1] - playerPosition[1];
      const dz = drone.position[2] - playerPosition[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < minDistance) {
        minDistance = dist;
        nearestDrone = drone;
      }
    });

    if (nearestDrone) {
      const droneLabel = (nearestDrone as EnemyData).label || (nearestDrone as EnemyData).id;
      set({ pingedDroneId: (nearestDrone as EnemyData).id });
      addPing((nearestDrone as EnemyData).position);
    } else {
      soundManager.playSysAlert('click');
    }
  },

  pingDrone: (id, position) => {
    const { addPing } = get();
    set({ pingedDroneId: id, lastPingTime: Date.now() });
    addPing(position, 'You', '#ef4444', 'drone');
  },

  addPing: (position, customSenderName, customSenderColor, type = 'general') => {
    const { socket, events, lastPingTime } = get();
    const selfName = 'You';
    
    // Choose professional cyberpunk color palettes for our different tactical modes
    let defaultColor = '#22d3ee'; // standard Cyan for general
    if (type === 'drone') {
      defaultColor = '#ef4444'; // Red-orange for hostiles
    } else if (type === 'rift') {
      defaultColor = '#d946ef'; // Fuchsia for Rift Energy points
    }

    const senderName = customSenderName || selfName;
    const senderColor = customSenderColor || defaultColor;

    // For local players, enforce a 2-second cooldown on pings
    if (!customSenderName) {
      const now = Date.now();
      if (now - lastPingTime < 200) { // allow rapid tactile cues but limit spam
        // Too rapid! Alert but do not spawn ping
        soundManager.playSysAlert('click');
        set({ showPingCooldownAlert: true });
        
        if ((globalThis as any)._pingCooldownTimeout) {
          clearTimeout((globalThis as any)._pingCooldownTimeout);
        }
        (globalThis as any)._pingCooldownTimeout = setTimeout(() => {
          set({ showPingCooldownAlert: false });
        }, 1500);
        return;
      }
      // Update lastPingTime for successful ping
      set({ lastPingTime: now, showPingCooldownAlert: false });
    }

    const newPing: PingData = {
      id: Math.random().toString(36).substr(2, 9),
      senderName,
      senderColor,
      position,
      timestamp: Date.now(),
      type
    };

    // Play player-specific chirp or teammate tactical scan
    soundManager.playPing(!customSenderName);

    let prefix = '📡 TACTICAL REGION MARKED:';
    if (type === 'drone') {
      prefix = '⚠️ HOSTILE TARGET SPOTTED:';
    } else if (type === 'rift') {
      prefix = '🌀 RIFT COLDSTREAM ENERGY MARKER:';
    }

    set((state) => ({
      pings: [...(state.pings || []), newPing],
      events: [
        ...state.events,
        {
          id: Math.random().toString(),
          message: `${prefix} Pilot [${senderName.toUpperCase()}] at [${position[0].toFixed(1)}, ${position[2].toFixed(1)}]`,
          timestamp: Date.now()
        }
      ]
    }));

    // Emit via socket if it's our own local ping
    if (socket && !customSenderName) {
      socket.emit('playerPing', { position, color: senderColor, type });
    }
  },

  setEnvironment: (type) => set((state) => {
    const preset = ENVIRONMENTAL_PRESETS[type];
    if (!preset) return state;
    return {
      environment: preset,
      events: [
        ...state.events,
        {
          id: Math.random().toString(),
          message: `📡 DEEP SPACE FEED: Shifted to [${preset.name.toUpperCase()}]. ${preset.description}`,
          timestamp: Date.now()
        }
      ]
    };
  }),

  setDroneAiMode: (mode) => set((state) => {
    let modeDesc = 'All tactical sentinels calibrated for hyper-aggressive targeting.';
    if (mode === 'defensive') {
      modeDesc = 'Sentinel defense mesh active. Guard threshold limited to proximity vectors.';
    } else if (mode === 'scout') {
      modeDesc = 'Recalibrated for wide-area scanning. Lethal outputs disabled; green scan sensors online.';
    }

    return {
      droneAiMode: mode,
      events: [
        ...state.events,
        {
          id: Math.random().toString(),
          message: `🛰️ SQUAD COMMAND DIRECTIVE: Set drones to [${mode.toUpperCase()} MODE]. ${modeDesc}`,
          timestamp: Date.now()
        }
      ]
    };
  }),

  startGame: () => {
    const { socket } = get();
    
    if (socket) {
      socket.disconnect();
    }

    let newSocket: Socket | null = null;

    // Initialize multiplayer
    newSocket = io(window.location.origin);
    
    newSocket.on('connect', () => {
      newSocket!.emit('joinGame');
    });

    newSocket.on('gameError', (msg: string) => {
      alert(msg);
      get().leaveGame();
    });

    newSocket.on('gameJoined', (players: Record<string, PlayerData>) => {
      const otherPlayers = { ...players };
      delete otherPlayers[newSocket!.id!];
      set({ 
        otherPlayers,
        gameState: 'playing',
        timeLeft: 120,
        score: 0,
        comboCount: 0,
        maxComboCount: 0,
        playerHealth: 100,
        lastDamageTime: 0,
        isRegenerating: false,
        lastHitTime: 0,
        killFeed: [],
        enemies: INITIAL_ENEMIES.map(e => ({ ...e, state: 'active', disabledUntil: 0 })),
        currentWave: 1,
        swarmActive: false,
        swarmTimeRemaining: 0,
        scoreMultiplier: 1,
        lastSwarmTriggerTime: Date.now() + 10000,
        riftExtractionActive: false,
        riftExtractionTimeRemaining: 0
      });
    });

      newSocket.on('playerJoined', (player: PlayerData) => {
        set(state => ({
          otherPlayers: { ...state.otherPlayers, [player.id]: player },
          events: [...state.events, { id: Math.random().toString(), message: `${player.name} joined`, timestamp: Date.now() }]
        }));
      });

      newSocket.on('playerMoved', (data: { id: string, position: [number, number, number], rotation: number }) => {
        set(state => {
          if (!state.otherPlayers[data.id]) return state;
          return {
            otherPlayers: {
              ...state.otherPlayers,
              [data.id]: {
                ...state.otherPlayers[data.id],
                position: data.position,
                rotation: data.rotation
              }
            }
          };
        });
      });

      newSocket.on('playerShot', (data: { id: string, start: [number, number, number], end: [number, number, number], color: string }) => {
        set(state => ({
          lasers: [...state.lasers, { id: Math.random().toString(36).substr(2, 9), start: data.start, end: data.end, timestamp: Date.now(), color: data.color }],
          particles: [...state.particles, { id: Math.random().toString(36).substr(2, 9), position: data.end, timestamp: Date.now(), color: data.color }]
        }));
      });

      newSocket.on('playerPinged', (data: { name: string, position: [number, number, number], color: string }) => {
        get().addPing(data.position, data.name || 'Teammate', data.color || '#ff00ff');
      });

      newSocket.on('playerHit', (data: { targetId: string, shooterId: string, targetDisabledUntil: number, shooterScore: number }) => {
        set(state => {
          const now = Date.now();
          const isLocalShooter = data.shooterId === newSocket!.id;
          const isLocalTarget = data.targetId === newSocket!.id;
          
          const shooterName = isLocalShooter ? 'You' : (state.otherPlayers[data.shooterId]?.name || 'Unknown');
          const targetName = isLocalTarget ? 'You' : (state.otherPlayers[data.targetId]?.name || 'Unknown');
          const eventMsg = `${shooterName} tagged ${targetName}`;
          const newEvent = { id: Math.random().toString(), message: eventMsg, timestamp: now };

          const entryKiller = isLocalShooter ? 'YOU' : shooterName;
          const entryVictim = isLocalTarget ? 'YOU' : targetName;
          const killerCol = isLocalShooter ? '#22d3ee' : '#d946ef'; // Cyan or Fuchsia
          const victimCol = isLocalTarget ? '#22d3ee' : '#d946ef'; // Cyan or Fuchsia
          
          const newKillFeedEntry: KillFeedEntry = {
            id: Math.random().toString(),
            killer: entryKiller,
            victim: entryVictim,
            killerColor: killerCol,
            victimColor: victimCol,
            timestamp: now,
            weapon: 'laser'
          };

          let newState: Partial<GameStore> = {
            events: [...state.events, newEvent],
            killFeed: [...state.killFeed, newKillFeedEntry]
          };

          if (isLocalTarget) {
            newState.playerState = 'disabled';
            newState.playerDisabledUntil = data.targetDisabledUntil;
          }

          if (isLocalShooter) {
            newState.score = data.shooterScore;
          }

          // Update other players' states
          const players = { ...state.otherPlayers };
          let playersChanged = false;

          if (!isLocalTarget && players[data.targetId]) {
            players[data.targetId] = {
              ...players[data.targetId],
              state: 'disabled',
              disabledUntil: data.targetDisabledUntil
            };
            playersChanged = true;
          }

          if (!isLocalShooter && players[data.shooterId]) {
            players[data.shooterId] = {
              ...players[data.shooterId],
              score: data.shooterScore
            };
            playersChanged = true;
          }

          if (playersChanged) {
            newState.otherPlayers = players;
          }

          return newState;
        });
      });

      newSocket.on('playerLeft', (id: string) => {
        set(state => {
          const players = { ...state.otherPlayers };
          const playerName = players[id]?.name || 'Unknown';
          delete players[id];
          return { 
            otherPlayers: players,
            events: [...state.events, { id: Math.random().toString(), message: `${playerName} left`, timestamp: Date.now() }]
          };
        });
      });
    soundManager.playSysAlert('start');
    set({
      gameState: 'playing',
      score: 0,
      shotsFired: 0,
      shotsHit: 0,
      damageDealt: 0,
      comboCount: 0,
      maxComboCount: 0,
      timeLeft: 120,
      playerState: 'active',
      playerDisabledUntil: 0,
      playerHealth: 100,
      lastDamageTime: 0,
      isRegenerating: false,
      lastHitTime: 0,
      enemies: INITIAL_ENEMIES.map(e => ({ ...e, state: 'active', disabledUntil: 0 })),
      currentWave: 1,
      swarmActive: false,
      swarmTimeRemaining: 0,
      scoreMultiplier: 1,
      lastSwarmTriggerTime: Date.now() + 10000,
      riftExtractionActive: false,
      riftExtractionTimeRemaining: 0,
      powerUps: [],
      activePowerUps: {
        invulnerability: 0,
        double_damage: 0
      },
      lastPowerUpSpawnTime: Date.now() + 5000, // spawn first powerup after 5s
      lasers: [],
      particles: [],
      events: [],
      killFeed: [],
      pings: [],
      environment: ENVIRONMENTAL_PRESETS.nebula,
      socket: newSocket,
      otherPlayers: {},
      playerPosition: [0, 2, 0],
      playerRotation: 0,
    });
  },

  endGame: () => {
    const { socket, damageDealt, recordMissionDamage } = get();
    if (socket) {
      socket.disconnect();
    }
    soundManager.playSysAlert('gameover');
    recordMissionDamage(damageDealt);
    set({ gameState: 'gameover', socket: null });
  },

  leaveGame: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
    }
    set({
      gameState: 'menu',
      socket: null,
      otherPlayers: {},
      enemies: [],
      powerUps: [],
      pings: [],
      currentWave: 1,
      swarmActive: false,
      swarmTimeRemaining: 0,
      scoreMultiplier: 1,
      lastSwarmTriggerTime: 0,
      riftExtractionActive: false,
      riftExtractionTimeRemaining: 0,
      activePowerUps: {
        invulnerability: 0,
        double_damage: 0
      },
      lastPowerUpSpawnTime: 0,
      lasers: [],
      particles: [],
      events: [],
      killFeed: [],
      environment: ENVIRONMENTAL_PRESETS.nebula,
      score: 0,
      timeLeft: 120,
      playerState: 'active',
      playerHealth: 100,
      lastDamageTime: 0,
      isRegenerating: false,
      playerPosition: [0, 2, 0],
      playerRotation: 0,
    });
  },

  updateTime: (delta) => set((state) => {
    if (state.gameState !== 'playing') return state;
    const newTime = state.timeLeft - delta;
    if (newTime <= 0) {
      if (state.socket) state.socket.disconnect();
      state.recordMissionDamage(state.damageDealt);
      return { timeLeft: 0, gameState: 'gameover', socket: null, roomId: null };
    }

    const now = Date.now();
    let updatedHealth = state.playerHealth;
    let isRegenStartedNow = false;
    let isStillRegenerating = state.isRegenerating;

    // Trigger passive regeneration after 10s of no damage
    if (state.playerState === 'active' && now - state.lastDamageTime >= 10000 && updatedHealth < 100) {
      updatedHealth = Math.min(100, updatedHealth + 12 * delta);
      if (!state.isRegenerating) {
        isRegenStartedNow = true;
        isStillRegenerating = true;
      }
    }

    if (updatedHealth >= 100) {
      isStillRegenerating = false;
    }

    // Swarm Timing and Automation Logic
    let swarmActive = state.swarmActive;
    let swarmTimeRemaining = state.swarmTimeRemaining;
    let scoreMultiplier = state.scoreMultiplier;
    let lastSwarmTriggerTime = state.lastSwarmTriggerTime;
    let currentEnemies = [...state.enemies];
    let swarmTriggeredNow = false;
    let swarmDeactivatedNow = false;
    let riftExtractionActive = state.riftExtractionActive;
    let riftExtractionTimeRemaining = state.riftExtractionTimeRemaining;
    let riftExtractionTriggeredNow = false;

    if (swarmActive) {
      swarmTimeRemaining = Math.max(0, swarmTimeRemaining - delta);
      // Early swarm defeat check: are there active swarm drones left?
      const activeSwarmDrones = currentEnemies.filter(e => e.id.startsWith('bot-swarm-') && e.state === 'active');
      const allDefeated = activeSwarmDrones.length === 0;

      if (swarmTimeRemaining <= 0 || allDefeated) {
        swarmActive = false;
        scoreMultiplier = 1;
        swarmDeactivatedNow = true;
        // Trigger Rift Extraction
        riftExtractionActive = true;
        riftExtractionTimeRemaining = 2.0;
        riftExtractionTriggeredNow = true;
      }
    } else if (riftExtractionActive) {
      riftExtractionTimeRemaining = Math.max(0, riftExtractionTimeRemaining - delta);
      if (riftExtractionTimeRemaining <= 0) {
        riftExtractionActive = false;
      }
    } else {
      // Occasional automated swarm: trigger after 45 seconds of play/stability
      if (lastSwarmTriggerTime > 0 && now - lastSwarmTriggerTime > 45000) {
        swarmActive = true;
        swarmTimeRemaining = 25; // 25 seconds of active overdrive
        scoreMultiplier = 4; // 4X point multiplier
        lastSwarmTriggerTime = now;
        swarmTriggeredNow = true;
        riftExtractionActive = false;
        riftExtractionTimeRemaining = 0;

        // Spawn heavy-duty alert swarm drones
        const swarmCount = 5 + Math.floor(Math.random() * 3);
        const skins: ('standard' | 'quadcopter' | 'heavy_armor' | 'ring_fury' | 'stealth_delta')[] = ['standard', 'quadcopter', 'heavy_armor', 'ring_fury', 'stealth_delta'];
        const colors = ['#ef4444', '#ec4899', '#f43f5e', '#d946ef', '#f59e0b'];
        
        for (let i = 0; i < swarmCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = 12 + Math.random() * 16;
          const px = state.playerPosition[0] + Math.cos(angle) * distance;
          const pz = state.playerPosition[2] + Math.sin(angle) * distance;
          const x = Math.max(-75, Math.min(75, px));
          const z = Math.max(-75, Math.min(75, pz));
          const skin = skins[Math.floor(Math.random() * skins.length)];
          const color = colors[Math.floor(Math.random() * colors.length)];
          const id = `bot-swarm-${Date.now().toString().slice(-4)}-${i}`;
          
          currentEnemies.push({
            id,
            position: [x, 1, z] as [number, number, number],
            state: 'active' as EntityState,
            disabledUntil: 0,
            color,
            speedMultiplier: 1.35 + Math.random() * 0.7,
            scale: 0.7 + Math.random() * 0.5,
            label: i % 2 === 0 ? `🚨 Swarm Predator` : `🚨 Swarm Interceptor`,
            chassisSkin: skin
          });
        }
        soundManager.playSysAlert('reboot');
      }
    }

    let currentType: EnvironmentalType = 'nebula';
    if (newTime <= 30) {
      currentType = 'nanite_storm';
    } else if (newTime <= 60) {
      currentType = 'overload';
    } else if (newTime <= 90) {
      currentType = 'eclipse';
    }

    const isEnvChanged = state.environment.type !== currentType;
    const updatedEnvironment = isEnvChanged ? ENVIRONMENTAL_PRESETS[currentType] : state.environment;

    const baseEvents = isRegenStartedNow ? [
      ...state.events,
      {
        id: Math.random().toString(),
        message: `✨ SYSTEM INTEGRITY RESTORE: Self-repairing nanoshield...`,
        timestamp: now
      }
    ] : state.events;

    let nextEvents = isEnvChanged ? [
      ...baseEvents,
      {
        id: Math.random().toString(),
        message: `🚨 SPACE WEATHER ALERT: Area shifted to [${updatedEnvironment.name.toUpperCase()}]. ${updatedEnvironment.description}`,
        timestamp: now
      }
    ] : baseEvents;

    if (swarmTriggeredNow) {
      nextEvents.push({
        id: Math.random().toString(),
        message: `🚨 ALERT: SWARM INBOUND! 4X POINT MULTIPLIER AUTHORIZED FOR 25s!`,
        timestamp: now
      });
    } else if (swarmDeactivatedNow) {
      nextEvents.push({
        id: Math.random().toString(),
        message: `🕊️ SYSTEM CODES NOMINAL: Swarm threat deactivated. Multiplier restored to 1x.`,
        timestamp: now
      });
    }

    if (riftExtractionTriggeredNow) {
      nextEvents.push({
        id: Math.random().toString(),
        message: `🌌 RIFT EXTRACTION DETECTED: 2.0s double-point overdrive extraction window is now active!`,
        timestamp: now
      });
    }

    const shouldSpawn = now - state.lastPowerUpSpawnTime > 18000 && state.powerUps.length < 5;
    if (shouldSpawn) {
      const types: ('invulnerability' | 'double_damage')[] = ['invulnerability', 'double_damage'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      let x = (Math.random() - 0.5) * 140;
      let z = (Math.random() - 0.5) * 140;
      if (Math.abs(x) < 20 && Math.abs(z) < 20) {
        x += (Math.random() > 0.5 ? 25 : -25);
        z += (Math.random() > 0.5 ? 25 : -25);
      }

      const id = `powerup-${Math.random().toString(36).substring(2, 9)}`;
      const colors = {
        invulnerability: '#ffcc00', // Amber/gold
        double_damage: '#ff00aa',    // Cyber magenta
      };

      const newPowerUp: PowerUpData = {
        id,
        type,
        position: [x, 0.8, z],
        color: colors[type],
      };

      return {
        timeLeft: newTime,
        powerUps: [...state.powerUps, newPowerUp],
        lastPowerUpSpawnTime: now,
        playerHealth: updatedHealth,
        isRegenerating: isStillRegenerating,
        environment: updatedEnvironment,
        swarmActive,
        swarmTimeRemaining,
        scoreMultiplier,
        lastSwarmTriggerTime,
        enemies: currentEnemies,
        riftExtractionActive,
        riftExtractionTimeRemaining,
        events: [
          ...nextEvents,
          {
            id: Math.random().toString(),
            message: `⚡ A ${type === 'invulnerability' ? '🛡️ SHIELD' : '🔥 DOUBLE DAMAGE'} powerup has spawned!`,
            timestamp: now
          }
        ]
      };
    }

    return { 
      timeLeft: newTime,
      playerHealth: updatedHealth,
      isRegenerating: isStillRegenerating,
      environment: updatedEnvironment,
      swarmActive,
      swarmTimeRemaining,
      scoreMultiplier,
      lastSwarmTriggerTime,
      enemies: currentEnemies,
      riftExtractionActive,
      riftExtractionTimeRemaining,
      events: nextEvents
    };
  }),

  hitPlayer: (shooterId) => set((state) => {
    if (state.playerState === 'disabled' || state.gameState !== 'playing') return state;
    
    // Check if player is currently invulnerable
    if (Date.now() < state.activePowerUps.invulnerability) {
      soundManager.playSysAlert('click');
      return {
        events: [
          ...state.events,
          {
            id: Math.random().toString(),
            message: `🛡️ SHIELD POWER-UP BLOCKED DAMAGING HIT!`,
            timestamp: Date.now()
          }
        ]
      };
    }

    const nextHealth = Math.max(0, state.playerHealth - 25);
    const now = Date.now();
    const isCritical = nextHealth === 0;

    let warningMessage = `⚠️ Nanoshield hit: Integrity at ${nextHealth}%`;
    let disabledTime = now + 2000; // standard hit: 2 seconds stun
    let scorePenalty = 30; // standard hit penalty

    if (isCritical) {
      soundManager.playSysAlert('reboot');
      warningMessage = `🚨 SYSTEM CRASH: Nanoshield depleted! EMERGENCY REBOOT (5s)...`;
      disabledTime = now + 5000; // system crash: 5 seconds reboot
      scorePenalty = 100; // critical failure penalty
    } else {
      soundManager.playHit(true);
    }

    const killerName = shooterId 
      ? (state.otherPlayers[shooterId]?.name || shooterId.replace('bot-', 'Drone #'))
      : 'AI Drone';
    const killerColor = shooterId && !shooterId.startsWith('bot-') ? '#d946ef' : '#ef4444';

    const newKillFeedEntry = {
      id: Math.random().toString(),
      killer: killerName,
      victim: 'YOU',
      killerColor,
      victimColor: '#22d3ee', // Cyan
      timestamp: now,
      weapon: 'laser' as const
    };

    // Calculate relative shooter angle in degrees relative to player facing direction
    let angle = 0;
    let foundShooter = false;
    let shooterPos: [number, number, number] | null = null;

    if (shooterId) {
      const enemy = state.enemies.find(e => e.id === shooterId);
      if (enemy) {
        shooterPos = enemy.position;
        foundShooter = true;
      } else {
        const otherPlayer = state.otherPlayers[shooterId];
        if (otherPlayer) {
          shooterPos = otherPlayer.position;
          foundShooter = true;
        }
      }
    }

    if (foundShooter && shooterPos) {
      const dx = shooterPos[0] - state.playerPosition[0];
      const dz = shooterPos[2] - state.playerPosition[2];
      
      const rCam = state.playerRotation;
      const lx = dx * Math.cos(rCam) + dz * Math.sin(rCam);
      const lz = -dx * Math.sin(rCam) + dz * Math.cos(rCam);
      
      // Compute clockwise degrees relative to looking direction (0deg = front, 180deg = behind)
      angle = Math.atan2(lx, -lz) * (180 / Math.PI);
    } else {
      // Fallback random angle
      angle = (Math.random() - 0.5) * 360;
    }

    const nextDamageIndicator = {
      id: Math.random().toString(),
      angle,
      timestamp: now,
      isSwarm: state.swarmActive,
      damageAmount: 25
    };

    return {
      playerHealth: nextHealth,
      lastDamageTime: now,
      isRegenerating: false,
      playerState: 'disabled',
      playerDisabledUntil: disabledTime,
      score: Math.max(0, state.score - scorePenalty),
      events: [
        ...state.events,
        {
          id: Math.random().toString(),
          message: warningMessage,
          timestamp: now
        }
      ],
      killFeed: [...state.killFeed, newKillFeedEntry],
      damageIndicators: [...(state.damageIndicators || []), nextDamageIndicator].slice(-10)
    };
  }),

  hitEnemy: (id, byPlayer = false, shooterId) => set((state) => {
    if (state.gameState !== 'playing') return state;
    
    const isDoubleDamage = Date.now() < state.activePowerUps.double_damage;

    // Check if it's a multiplayer player
    if (state.socket && state.otherPlayers[id]) {
      const targetPlayer = state.otherPlayers[id];
      if (targetPlayer && targetPlayer.state === 'active') {
        state.socket.emit('hitPlayer', id);
        soundManager.playHit(false);
        const hitDamage = isDoubleDamage ? 50 : 25;
        return { 
          lastHitTime: Date.now(),
          shotsHit: state.shotsHit + 1,
          damageDealt: state.damageDealt + hitDamage
        };
      }
      return state;
    }

    const isDefensive = state.droneAiMode === 'defensive';
    const disableDuration = isDefensive 
      ? (isDoubleDamage ? 3000 : 1200) // Much shorter disruption duration
      : (isDoubleDamage ? 6000 : 3000);

    let hitSuccess = false;
    const enemies = state.enemies.map(e => {
      if (e.id === id && e.state === 'active') {
        hitSuccess = true;
        return { ...e, state: 'disabled' as EntityState, disabledUntil: Date.now() + disableDuration };
      }
      return e;
    });

    const hitDrone = state.enemies.find(e => e.id === id);
    const isDecoy = hitDrone && hitDrone.isDecoy;

    // Manage combo counts
    let nextComboCount = state.comboCount;
    let nextMaxComboCount = state.maxComboCount;
    let nextWeaponCharge = state.activeWeaponChargeUnits || 0;
    if (byPlayer && hitSuccess) {
      nextComboCount = (state.comboCount || 0) + 1;
      if (nextComboCount > (state.maxComboCount || 0)) {
        nextMaxComboCount = nextComboCount;
      }
      nextWeaponCharge = Math.min(100, nextWeaponCharge + 5);
      // Play rhythmic sound cue with the updated combo count
      soundManager.playComboHit(nextComboCount);
    }

    const basePoints = isDoubleDamage ? 200 : 100;
    const currentMultiplier = state.scoreMultiplier || 1;
    const comboMultiplier = 1 + (nextComboCount * 0.1);
    let points = isDecoy ? 0 : Math.round(basePoints * currentMultiplier * comboMultiplier);
    
    const isRiftActive = state.riftExtractionActive;
    if (isRiftActive && !isDecoy) {
      points *= 2; // Play bonus Rift Double Points
    }

    const riftSuffix = isRiftActive && !isDecoy ? " 🎉 [RIFT EXTRACTION DOUBLE!]" : "";
    const comboSuffix = nextComboCount > 1 && !isDecoy ? ` 🔥 [COMBO x${comboMultiplier.toFixed(1)}!]` : "";
    
    let nextKillFeed = state.killFeed;
    if (hitSuccess) {
      if (byPlayer) {
        if (isDecoy) {
          soundManager.playSysAlert('regenerate');
        }
      }
      const now = Date.now();
      const newEntry: KillFeedEntry = byPlayer ? {
        id: Math.random().toString(),
        killer: 'YOU',
        victim: isDecoy ? 'Decoy Core' : id.replace('bot-', 'Drone #'),
        killerColor: '#22d3ee', // Cyan
        victimColor: isDecoy ? '#7dd3fc' : (isDefensive ? '#3b82f6' : '#ef4444'), 
        timestamp: now,
        weapon: isDecoy ? 'decoy' : (isDoubleDamage ? 'plasma' : (isDefensive ? 'nanoshield' : 'laser'))
      } : {
        id: Math.random().toString(),
        killer: shooterId ? shooterId.replace('bot-', 'Drone #') : 'AI Drone',
        victim: id.replace('bot-', 'Drone #'),
        killerColor: '#ef4444', 
        victimColor: '#ef4444', 
        timestamp: now,
        weapon: 'laser'
      };
      nextKillFeed = [...state.killFeed, newEntry];
    }

    // Dynamic Swarm early-victory check
    let swarmActive = state.swarmActive;
    let scoreMultiplier = state.scoreMultiplier;
    let riftExtractionActive = state.riftExtractionActive;
    let riftExtractionTimeRemaining = state.riftExtractionTimeRemaining;
    let riftExtractionEarlyTrigger = false;

    if (swarmActive) {
      const activeSwarmDronesAfter = enemies.filter(e => e.id.startsWith('bot-swarm-') && e.state === 'active');
      if (activeSwarmDronesAfter.length === 0) {
        swarmActive = false;
        scoreMultiplier = 1;
        riftExtractionActive = true;
        riftExtractionTimeRemaining = 2.0;
        riftExtractionEarlyTrigger = true;
      }
    }

    let nextEvents = byPlayer && hitSuccess ? [
      ...state.events,
      {
        id: Math.random().toString(),
        message: isDecoy
          ? `👻 DECOY DISRUPTED: Quantum core overload grants +15.0s Match Time! (0 pts) [COMBO CONSERVED]`
          : (isDefensive 
              ? `🛡️ DEFENSIVE SHIELD DEFLECTED: Tagged ${id.replace('bot-', '#')} (+${points} pts)${riftSuffix}${comboSuffix} (Stunned briefly ${((disableDuration)/1000).toFixed(1)}s)`
              : (isDoubleDamage ? `💥 DOUBLE DAMAGE TAG: +${points} points on ${id.replace('bot-', '#')}!${riftSuffix}${comboSuffix}` : `Tagged ${id.replace('bot-', '#')} (+${points} pts)${riftSuffix}${comboSuffix}`)),
        timestamp: Date.now()
      }
    ] : state.events;

    if (riftExtractionEarlyTrigger) {
      nextEvents.push({
        id: Math.random().toString(),
        message: `🌌 RIFT EXTRACTION SECURED: All swarm sentinels purged early! 2.0s Rift Open!`,
        timestamp: Date.now()
      });
    }

    return {
      enemies,
      swarmActive,
      scoreMultiplier,
      riftExtractionActive,
      riftExtractionTimeRemaining,
      comboCount: nextComboCount,
      maxComboCount: nextMaxComboCount,
      activeWeaponChargeUnits: nextWeaponCharge,
      score: byPlayer && hitSuccess ? state.score + points : state.score, // Points for hitting enemy
      shotsHit: byPlayer && hitSuccess ? state.shotsHit + 1 : state.shotsHit,
      damageDealt: byPlayer && hitSuccess ? state.damageDealt + (isDoubleDamage ? 50 : 25) : state.damageDealt,
      timeLeft: byPlayer && hitSuccess && isDecoy ? state.timeLeft + 15 : state.timeLeft,
      lastHitTime: byPlayer && hitSuccess ? Date.now() : state.lastHitTime,
      killFeed: nextKillFeed,
      events: nextEvents
    };
  }),

  addLaser: (start, end, color) => {
    const { socket } = get();
    if (socket) {
      socket.emit('shoot', { start, end, color });
    }
    set((state) => ({
      lasers: [...state.lasers, { id: Math.random().toString(36).substr(2, 9), start, end, timestamp: Date.now(), color }]
    }));
  },

  addParticles: (position, color) => set((state) => ({
    particles: [...state.particles, { id: Math.random().toString(36).substr(2, 9), position, timestamp: Date.now(), color }]
  })),

  addEvent: (message) => set((state) => ({
    events: [...state.events, { id: Math.random().toString(), message, timestamp: Date.now() }]
  })),

  addKillFeedEntry: (killer, victim, killerColor = '#22d3ee', victimColor = '#ef4444', weapon = 'laser') => set((state) => ({
    killFeed: [
      ...state.killFeed,
      {
        id: Math.random().toString(),
        killer,
        victim,
        killerColor,
        victimColor,
        timestamp: Date.now(),
        weapon
      }
    ]
  })),

  addDrone: (config) => set((state) => {
    const currentCount = state.enemies.length;
    const angle = Math.random() * Math.PI * 2;
    const distance = 15 + Math.random() * 20;
    const px = state.playerPosition[0] + Math.cos(angle) * distance;
    const pz = state.playerPosition[2] + Math.sin(angle) * distance;
    const x = Math.max(-75, Math.min(75, px));
    const z = Math.max(-75, Math.min(75, pz));
    const y = 1;
    
    const colors = ['#ea580c', '#eab308', '#ec4899', '#3b82f6', '#10b981', '#f43f5e', '#a855f7'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const droneId = `bot-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 10)}`;
    const label = config?.label || `Drone Class-${Math.floor(Math.random() * 5 + 1)}`;

    const skins: ('standard' | 'quadcopter' | 'heavy_armor' | 'ring_fury' | 'stealth_delta')[] = ['standard', 'quadcopter', 'heavy_armor', 'ring_fury', 'stealth_delta'];
    const randomSkin = skins[Math.floor(Math.random() * skins.length)];

    const newDrone: EnemyData = {
      id: config?.id || droneId,
      position: config?.position || [x, y, z],
      state: 'active',
      disabledUntil: 0,
      color: config?.color || randomColor,
      speedMultiplier: config?.speedMultiplier || (0.7 + Math.random() * 0.8),
      scale: config?.scale || (0.7 + Math.random() * 0.6),
      label: label,
      chassisSkin: config?.chassisSkin || randomSkin,
      isDecoy: config?.isDecoy || false
    };

    return {
      enemies: [...state.enemies, newDrone],
      events: [
        ...state.events,
        {
          id: Math.random().toString(),
          message: `🛰️ SYSTEM DEPLOYMENT: ${label} (${newDrone.id}) activated near core grid!`,
          timestamp: Date.now()
        }
      ]
    };
  }),

  triggerSwarm: () => set((state) => {
    if (state.gameState !== 'playing') return state;

    const count = 5 + Math.floor(Math.random() * 3); // 5 to 7 drones
    const newEnemies = [];
    const skins: ('standard' | 'quadcopter' | 'heavy_armor' | 'ring_fury' | 'stealth_delta')[] = ['standard', 'quadcopter', 'heavy_armor', 'ring_fury', 'stealth_delta'];
    const colors = ['#ef4444', '#ec4899', '#f43f5e', '#d946ef', '#f59e0b']; // Alarm colors
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 12 + Math.random() * 16;
      const px = state.playerPosition[0] + Math.cos(angle) * distance;
      const pz = state.playerPosition[2] + Math.sin(angle) * distance;
      const x = Math.max(-75, Math.min(75, px));
      const z = Math.max(-75, Math.min(75, pz));
      const skin = skins[Math.floor(Math.random() * skins.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const id = `bot-swarm-${Date.now().toString().slice(-4)}-${i}`;
      
      newEnemies.push({
        id,
        position: [x, 1, z] as [number, number, number],
        state: 'active' as EntityState,
        disabledUntil: 0,
        color,
        speedMultiplier: 1.35 + Math.random() * 0.7, // Supersonic swarm!
        scale: 0.7 + Math.random() * 0.5,
        label: i % 2 === 0 ? `🚨 Swarm Predator` : `🚨 Swarm Interceptor`,
        chassisSkin: skin
      });
    }

    soundManager.playSysAlert('reboot');

    return {
      swarmActive: true,
      swarmTimeRemaining: 25, // 25 seconds of overdrive
      scoreMultiplier: 4, // 4X score rewards!
      lastSwarmTriggerTime: Date.now(),
      enemies: [...state.enemies, ...newEnemies],
      riftExtractionActive: false,
      riftExtractionTimeRemaining: 0,
      events: [
        ...state.events,
        {
          id: Math.random().toString(),
          message: `⚠️ WARNING: DIRECTIVE SWARM INCOMING! 4X SCORE MULTIPLIER UNLOCKED! (${count} high-speed drones detected)`,
          timestamp: Date.now()
        }
      ]
    };
  }),

  nextWave: () => set((state) => {
    if (state.gameState !== 'playing') return state;

    const nextWaveNum = state.currentWave + 1;
    const count = 3 + nextWaveNum;
    const newEnemies = [];
    const skins: ('standard' | 'quadcopter' | 'heavy_armor' | 'ring_fury' | 'stealth_delta')[] = ['standard', 'quadcopter', 'heavy_armor', 'ring_fury', 'stealth_delta'];
    const colors = ['#ea580c', '#eab308', '#ec4899', '#3b82f6', '#10b981', '#f43f5e', '#a855f7'];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 15 + Math.random() * 20;
      const px = state.playerPosition[0] + Math.cos(angle) * distance;
      const pz = state.playerPosition[2] + Math.sin(angle) * distance;
      const x = Math.max(-75, Math.min(75, px));
      const z = Math.max(-75, Math.min(75, pz));
      const skin = skins[Math.floor(Math.random() * skins.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const id = `bot-wave-${Date.now().toString().slice(-4)}-${i}`;
      const isDecoy = (i % 4 === 3); // Spawns approx 1 decoy per 4 drones

      newEnemies.push({
        id,
        position: [x, 1, z] as [number, number, number],
        state: 'active' as EntityState,
        disabledUntil: 0,
        color: isDecoy ? '#38bdf8' : color,
        speedMultiplier: 0.75 + (nextWaveNum * 0.1) + Math.random() * 0.5, // gradual increase in speed
        scale: 0.8 + Math.random() * 0.6,
        label: isDecoy ? 'Ghost Decoy' : `Shield-Wave ${nextWaveNum} Class`,
        chassisSkin: skin,
        isDecoy: isDecoy
      });
    }

    soundManager.playSysAlert('ping');

    return {
      currentWave: nextWaveNum,
      enemies: [...state.enemies, ...newEnemies],
      events: [
        ...state.events,
        {
          id: Math.random().toString(),
          message: `🌊 WAVE ${nextWaveNum} INITIALIZED: ${count} tactical drones deployed on grid. Difficulty calibrated.`,
          timestamp: Date.now()
        }
      ]
    };
  }),

  clearAllDrones: () => set((state) => {
    soundManager.playSysAlert('regenerate');
    return {
      enemies: [],
      events: [
        ...state.events,
        {
          id: Math.random().toString(),
          message: `🧹 COMBAT SWEEP: Cleared grid of all active drone chassis!`,
          timestamp: Date.now()
        }
      ]
    };
  }),

  updateEnemies: (time) => set((state) => {
    let changed = false;
    const enemies = state.enemies.map(e => {
      if (e.state === 'disabled' && time > e.disabledUntil) {
        changed = true;
        return { ...e, state: 'active' as EntityState };
      }
      return e;
    });
    
    // Also update other players' states
    let otherPlayers = state.otherPlayers;
    let playersChanged = false;
    Object.values(state.otherPlayers).forEach(p => {
      if (p.state === 'disabled' && time > p.disabledUntil) {
        if (!playersChanged) {
          otherPlayers = { ...state.otherPlayers };
          playersChanged = true;
        }
        otherPlayers[p.id] = { ...p, state: 'active' };
      }
    });

    if (state.playerState === 'disabled' && time > state.playerDisabledUntil) {
      return { 
        enemies, 
        playerState: 'active', 
        playerHealth: 100, 
        lastDamageTime: Date.now(), // delay passive regen by 10s after reboot
        otherPlayers: playersChanged ? otherPlayers : state.otherPlayers 
      };
    }
    return changed || playersChanged ? { enemies, otherPlayers } : state;
  }),

  cleanupEffects: (time) => set((state) => {
    const lasers = state.lasers.filter(l => time - l.timestamp < 200); // Lasers last 200ms
    const particles = state.particles.filter(p => time - p.timestamp < 500); // Particles last 500ms
    const events = state.events.filter(e => time - e.timestamp < 5000); // Events last 5s
    const pings = state.pings ? state.pings.filter(p => time - p.timestamp < 5000) : []; // Pings last 5s
    
    const lasersChanged = lasers.length !== state.lasers.length;
    const particlesChanged = particles.length !== state.particles.length;
    const eventsChanged = events.length !== state.events.length;
    const pingsChanged = !state.pings || pings.length !== state.pings.length;

    if (lasersChanged || particlesChanged || eventsChanged || pingsChanged) {
      return { lasers, particles, events, pings };
    }
    return state;
  }),

  setPlayerState: (playerState) => set({ playerState }),

  pickupPowerUp: (id) => set((state) => {
    const powerUp = state.powerUps.find(p => p.id === id);
    if (!powerUp) return state;

    soundManager.playPowerup();

    const activePowerUps = { ...state.activePowerUps };
    const duration = 15000; // 15 seconds
    const message = powerUp.type === 'invulnerability' 
      ? '🛡️ SHIELD ACTIVE (15s)!' 
      : '🔥 DOUBLE DAMAGE ACTIVE (15s)!';

    activePowerUps[powerUp.type] = Date.now() + duration;

    let showRepairNotification = state.showRepairNotification;
    let playerHealth = state.playerHealth;

    if (powerUp.type === 'invulnerability') {
      showRepairNotification = true;
      playerHealth = 100;

      if ((globalThis as any)._repairNotificationTimeout) {
        clearTimeout((globalThis as any)._repairNotificationTimeout);
      }
      (globalThis as any)._repairNotificationTimeout = setTimeout(() => {
        set({ showRepairNotification: false });
      }, 3000);
    }

    const pickupParticles: ParticleData[] = Array.from({ length: 15 }).map(() => ({
      id: Math.random().toString(36).substring(2, 9),
      position: [
        powerUp.position[0] + (Math.random() - 0.5) * 1.5,
        powerUp.position[1] + (Math.random() - 0.5) * 1.5,
        powerUp.position[2] + (Math.random() - 0.5) * 1.5,
      ],
      timestamp: Date.now(),
      color: powerUp.color,
    }));

    return {
      powerUps: state.powerUps.filter(p => p.id !== id),
      activePowerUps,
      playerHealth,
      showRepairNotification,
      particles: [...state.particles, ...pickupParticles],
      events: [
        ...state.events,
        {
          id: Math.random().toString(),
          message,
          timestamp: Date.now(),
        },
      ],
    };
  }),

  updatePlayerPosition: (position, rotation) => {
    const { socket } = get();
    if (socket) {
      socket.emit('updatePosition', { position, rotation });
    }
    set({ playerPosition: position, playerRotation: rotation });
  }
}));
