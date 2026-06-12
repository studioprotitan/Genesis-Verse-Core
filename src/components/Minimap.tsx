/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useEffect } from 'react';
import { useGameStore, EnemyData, PlayerData, PowerUpData } from '../store';
import { Radio, Zap } from 'lucide-react';

export function Minimap() {
  const playerState = useGameStore(state => state.playerState);
  const playerPosition = useGameStore(state => state.playerPosition);
  const playerRotation = useGameStore(state => state.playerRotation);
  const enemies = useGameStore(state => state.enemies);
  const otherPlayers = useGameStore(state => state.otherPlayers);
  const powerUps = useGameStore(state => state.powerUps);
  const gameState = useGameStore(state => state.gameState);
  const pings = useGameStore(state => state.pings || []);
  const showPingCooldownAlert = useGameStore(state => state.showPingCooldownAlert);

  // Define size of the minimap
  const size = 150; // px diameter
  const radius = size / 2;
  const arenaHalfSize = 100; // Arena is 200x200, bounds are -100 to 100

  // Helper to map 3D coordinates (x, z) to 2D Minimap coordinates
  const mapCoords = (x: number, z: number) => {
    // Map -100..100 to 0..size space
    // Standard Math: x ranges from -100 to +100 -> (x + 100) / 200 * size
    const mapX = radius + (x / arenaHalfSize) * radius;
    // For Z axis, negative Z is North (top), positive Z is South (bottom)
    const mapY = radius + (z / arenaHalfSize) * radius;
    return { x: mapX, y: mapY };
  };

  // Convert other players record to array
  const otherPlayersArray = useMemo(() => {
    return Object.values(otherPlayers);
  }, [otherPlayers]);

  // Map local player
  const localMap = mapCoords(playerPosition[0], playerPosition[2]);
  
  // Calculate player rotation angle in degrees for the arrowhead
  // In ThreeJS, Y rotation is counter-clockwise. For CSS rotate, clockwise rotation is positive.
  // Negating the rotation and offsetting is required for screen space alignment.
  const arrowAngle = -(playerRotation * (180 / Math.PI)) + 180;

  const signalDroneLocation = () => {
    if (gameState !== 'playing' || playerState === 'disabled') return;
    
    // Find closest active drone to player position
    let closestDrone: EnemyData | null = null;
    let minDistance = Infinity;
    
    enemies.forEach((drone) => {
      if (drone.state !== 'active') return;
      const dx = drone.position[0] - playerPosition[0];
      const dy = drone.position[1] - playerPosition[1];
      const dz = drone.position[2] - playerPosition[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < minDistance) {
        minDistance = dist;
        closestDrone = drone;
      }
    });

    if (closestDrone) {
      useGameStore.getState().addPing(closestDrone.position, 'You', '#ef4444', 'drone');
    } else {
      // If no drones are active, ping our current position as fallback but marked drone
      useGameStore.getState().addPing([playerPosition[0], playerPosition[1], playerPosition[2]], 'You', '#ef4444', 'drone');
    }
  };

  const signalRiftEnergy = () => {
    if (gameState !== 'playing' || playerState === 'disabled') return;
    
    // Find closest power-up as representation of Rift Energy
    let closestPowerUp: PowerUpData | null = null;
    let minDistance = Infinity;

    powerUps.forEach((p) => {
      const dx = p.position[0] - playerPosition[0];
      const dy = p.position[1] - playerPosition[1];
      const dz = p.position[2] - playerPosition[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < minDistance) {
        minDistance = dist;
        closestPowerUp = p;
      }
    });

    if (closestPowerUp) {
      useGameStore.getState().addPing(closestPowerUp.position, 'You', '#d946ef', 'rift');
    } else {
      // Ping a cool Rift Anomaly point relative to current player position
      const angle = Math.random() * Math.PI * 2;
      const rDistance = 15 + Math.random() * 20;
      const rx = playerPosition[0] + Math.cos(angle) * rDistance;
      const rz = playerPosition[2] + Math.sin(angle) * rDistance;
      useGameStore.getState().addPing([rx, 1, rz], 'You', '#d946ef', 'rift');
    }
  };

  // Setup keyboard shortcuts Q and E for tactical operations:
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing' || playerState === 'disabled') return;
      
      // Avoid triggering when user is focusing on an input field
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      if (e.key.toLowerCase() === 'q') {
        e.preventDefault();
        signalDroneLocation();
      } else if (e.key.toLowerCase() === 'e') {
        e.preventDefault();
        signalRiftEnergy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState, playerState, enemies, powerUps, playerPosition]);

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (gameState !== 'playing' || playerState === 'disabled') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert coordinates relative to center of circle
    const relX = clickX - radius;
    const relY = clickY - radius;

    // Check if the click lies inside the radar's circular boundary
    if (relX * relX + relY * relY <= radius * radius) {
      const arenaX = (relX / radius) * arenaHalfSize;
      const arenaZ = (relY / radius) * arenaHalfSize;

      // Smart check: see if player clicked near an active drone on the map
      let clickedNearDrone: EnemyData | null = null;
      let minDroneDist = Infinity;
      enemies.forEach((drone) => {
        if (drone.state !== 'active') return;
        const dx = drone.position[0] - arenaX;
        const dz = drone.position[2] - arenaZ;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 15 && dist < minDroneDist) {
          minDroneDist = dist;
          clickedNearDrone = drone;
        }
      });

      if (clickedNearDrone) {
        useGameStore.getState().addPing(clickedNearDrone.position, 'You', '#ef4444', 'drone');
        return;
      }

      // Check if clicked near power-up (rift core)
      let clickedNearPowerUp: PowerUpData | null = null;
      let minPUDist = Infinity;
      powerUps.forEach((p) => {
        const dx = p.position[0] - arenaX;
        const dz = p.position[2] - arenaZ;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 15 && dist < minPUDist) {
          minPUDist = dist;
          clickedNearPowerUp = p;
        }
      });

      if (clickedNearPowerUp) {
        useGameStore.getState().addPing(clickedNearPowerUp.position, 'You', '#d946ef', 'rift');
        return;
      }

      // Standard map location coordinates ping
      useGameStore.getState().addPing([arenaX, 1, arenaZ], 'You', '#22d3ee', 'general');
    }
  };

  return (
    <div 
      id="tactical-minimap"
      className="flex flex-col items-center select-none pointer-events-auto animate-fade-in"
    >
      {/* Container Frame with Tech Glowing Borders */}
      <div 
        className="relative rounded-full border border-cyan-500/40 bg-black/60 shadow-[0_0_20px_rgba(34,211,238,0.25)] backdrop-blur-md overflow-hidden cursor-crosshair select-none transition-all duration-200 hover:border-cyan-400 active:scale-98"
        style={{ width: size, height: size }}
        onClick={handleMinimapClick}
      >
        {/* Cooldown limit warning overlay */}
        {showPingCooldownAlert && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/45 backdrop-blur-[1.5px] z-50 pointer-events-none transition-all duration-300 animate-pulse rounded-full">
            <span className="text-[10px] font-black tracking-widest text-red-500 bg-black/90 px-1.5 py-0.5 rounded border border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.7)] text-center">
              COOLDOWN
            </span>
            <span className="text-[6px] font-mono font-bold text-stone-400 mt-0.5 tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,1)] text-center">
              2.0s SPAM GUARD
            </span>
          </div>
        )}

        {/* Conic-gradient Radar Sweeper Line Effect */}
        <div 
          className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
          style={{ zIndex: 1 }}
        >
          <div 
            className="w-full h-full origin-center animate-[spin_3.5s_linear_infinite]"
            style={{
              background: 'conic-gradient(from 0deg, rgba(6,182,212,0) 0deg, rgba(6,182,212,0.03) 240deg, rgba(6,182,212,0.18) 350deg, rgba(6,182,212,0.3) 359deg, rgba(6,182,212,0) 360deg)'
            }}
          />
        </div>

        {/* Radar Crosshairs and Concentric Rings */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center border border-dashed border-cyan-500/10 rounded-full">
          {/* Inner Range Ring */}
          <div className="w-[33%] h-[33%] rounded-full border border-cyan-500/10 pointer-events-none absolute" />
          {/* Middle Range Ring */}
          <div className="w-[66%] h-[66%] rounded-full border border-cyan-500/10 pointer-events-none absolute" />
          
          {/* Vertical Grid Axis */}
          <div className="absolute w-[1px] h-full bg-cyan-500/10" />
          {/* Horizontal Grid Axis */}
          <div className="absolute h-[1px] w-full bg-cyan-500/10" />
        </div>

        {/* Game Entities Rendered inside the Map Bounds */}
        <div className="absolute inset-0" style={{ zIndex: 2 }}>
          {/* Power-ups list */}
          {powerUps.map((p: PowerUpData) => {
            const pt = mapCoords(p.position[0], p.position[2]);
            return (
              <div
                key={p.id}
                className="absolute w-2 h-2 -ml-1 -mt-1 rounded-full flex items-center justify-center animate-ping"
                style={{
                  left: pt.x,
                  top: pt.y,
                  backgroundColor: p.color,
                  boxShadow: `0 0 8px ${p.color}`,
                  animationDuration: '2s'
                }}
                title={p.type === 'invulnerability' ? 'Shield' : 'Double Damage'}
              />
            );
          })}
          {powerUps.map((p: PowerUpData) => {
            const pt = mapCoords(p.position[0], p.position[2]);
            return (
              <div
                key={`static-${p.id}`}
                className="absolute w-2.5 h-2.5 -ml-1.25 -mt-1.25 rounded-sm flex items-center justify-center border border-black/40 rotate-45"
                style={{
                  left: pt.x,
                  top: pt.y,
                  backgroundColor: p.color,
                  boxShadow: `0 0 6px ${p.color}`
                }}
              />
            );
          })}

          {/* Enemies (Bots) */}
          {enemies.map((enemy: EnemyData) => {
            const pt = mapCoords(enemy.position[0], enemy.position[2]);
            const isDisabled = enemy.state === 'disabled';
            return (
              <div
                key={enemy.id}
                className={`absolute w-2 h-2 -ml-1 -mt-1 rounded-full transition-all duration-300 ${
                  isDisabled ? 'bg-red-900/40 border border-red-500/50 animate-pulse' : 'bg-red-500'
                }`}
                style={{
                  left: pt.x,
                  top: pt.y,
                  boxShadow: isDisabled ? 'none' : '0 0 6px #ef4444'
                }}
              />
            );
          })}

          {/* Other Players (Multiplayer competitors) */}
          {otherPlayersArray.map((p: PlayerData) => {
            const pt = mapCoords(p.position[0], p.position[2]);
            const isDisabled = p.state === 'disabled';
            return (
              <div key={p.id} className="absolute -ml-1.5 -mt-1.5" style={{ left: pt.x, top: pt.y }}>
                <div
                  className={`w-3 h-3 rounded-full flex items-center justify-center ${
                    isDisabled ? 'bg-fuchsia-900/40 border border-fuchsia-500/50' : 'bg-fuchsia-500'
                  }`}
                  style={{
                    boxShadow: isDisabled ? 'none' : '0 0 8px #d946ef'
                  }}
                />
                {/* Simplified floating identity initials hover text */}
                <span 
                  className="absolute left-3 -top-1 px-[3px] py-[1px] bg-black/75 border border-fuchsia-500/20 rounded text-[7px] text-fuchsia-300 font-bold tracking-tight whitespace-nowrap"
                >
                  {p.name.substring(0, 4).toUpperCase()}
                </span>
              </div>
            );
          })}

          {/* Local Player (You) Pointing Arrow */}
          <div 
            className="absolute -ml-2 -mt-2 w-4 h-4 flex items-center justify-center transition-all duration-75"
            style={{ 
              left: localMap.x, 
              top: localMap.y,
              transform: `rotate(${arrowAngle}deg)`
            }}
          >
            {/* Draw a slick futuristic cyan arrowhead */}
            <svg 
              viewBox="0 0 100 100" 
              className={`w-full h-full filter ${
                playerState === 'disabled' 
                  ? 'drop-shadow-[0_0_4px_rgba(239,68,68,0.8)] text-red-500' 
                  : 'drop-shadow-[0_0_5px_rgba(34,211,238,0.85)] text-cyan-400'
              }`}
              fill="currentColor"
            >
              <polygon points="50,15 85,85 50,70 15,85" />
            </svg>
          </div>

          {/* Active Tactical Pings on Minimap */}
          {pings.filter(p => p && p.position && p.position.length >= 3).map((ping) => {
            const pt = mapCoords(ping.position[0], ping.position[2]);
            const dx = ping.position[0] - playerPosition[0];
            const dy = ping.position[1] - playerPosition[1];
            const dz = ping.position[2] - playerPosition[2];
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            return (
              <div 
                key={ping.id} 
                className="absolute -ml-3 -mt-3 w-6 h-6 pointer-events-none animate-ping-fade-out" 
                style={{ left: pt.x, top: pt.y }}
              >
                {/* Tactical Radar Wavefront Waves */}
                <div 
                  className="absolute inset-0 rounded-full border border-cyan-400 animate-radar-ripple opacity-75"
                  style={{ 
                    borderColor: ping.senderColor,
                    boxShadow: `0 0 8px ${ping.senderColor}`
                  }}
                />
                <div 
                  className="absolute inset-2 rounded-full border border-cyan-400 animate-radar-ripple opacity-40"
                  style={{ 
                    borderColor: ping.senderColor,
                    animationDelay: '0.6s'
                  }}
                />

                {/* Core breathing beacon */}
                <div 
                  className="absolute left-2 top-2 w-2 h-2 rounded-full animate-ping-pulse z-20 shadow-[0_0_8px_currentColor]"
                  style={{ 
                    backgroundColor: ping.senderColor,
                    color: ping.senderColor
                  }}
                />
                
                {/* Solid cross marker backing */}
                <div 
                  className="absolute left-[11px] top-[7px] w-[2px] h-[10px] opacity-60"
                  style={{ backgroundColor: ping.senderColor }}
                />
                <div 
                  className="absolute left-[7px] top-[11px] w-[10px] h-[2px] opacity-60"
                  style={{ backgroundColor: ping.senderColor }}
                />

                {/* Pilot badge identifier */}
                <span 
                  className="absolute -top-4 left-4 px-[4px] py-[1.5px] bg-black/95 border rounded-[3px] text-[5.5px] font-black tracking-wider whitespace-nowrap z-30 shadow-[0_1px_4px_rgba(0,0,0,0.8)]"
                  style={{ 
                    borderColor: ping.senderColor,
                    color: ping.senderColor,
                    textShadow: `0 0 1.5px ${ping.senderColor}`
                  }}
                >
                  📍 {ping.senderName.toUpperCase()}
                </span>

                {/* Distance indicator label */}
                <span 
                  className="absolute -top-0.5 left-4 px-[4px] py-[1px] bg-black/95 border border-dashed rounded-[3px] text-[5px] font-bold font-mono whitespace-nowrap z-30 shadow-[0_1px_4px_rgba(0,0,0,0.8)]"
                  style={{ 
                    borderColor: `${ping.senderColor}60`,
                    color: '#e5e5e5'
                  }}
                >
                  {distance.toFixed(1)}m
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modern, clean labeling indicator subheader */}
      <div className="mt-1 flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_4px_rgba(34,211,238,1)]" />
          <span className="text-[9px] font-bold text-cyan-400/80 tracking-widest uppercase">PILOT</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_4px_rgba(239,68,68,1)]" />
          <span className="text-[9px] font-bold text-red-500/80 tracking-widest uppercase">HOSTILE</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 shadow-[0_0_4px_rgba(217,70,239,1)]" />
          <span className="text-[9px] font-bold text-fuchsia-500/80 tracking-widest uppercase">RIFT KEY</span>
        </div>
      </div>

      {/* Interactive Cyberpunk Tactical Signaling Console */}
      <div className="mt-3.5 w-full flex flex-col gap-1.5 border border-cyan-500/10 bg-slate-950/80 p-2.5 rounded-lg pointer-events-auto">
        <div className="flex items-center justify-between text-[8px] font-black font-mono text-zinc-500 tracking-wider mb-0.5">
          <span>COVEN TACTICAL CONSOLE</span>
          <span className="animate-pulse text-cyan-400/80">ONLINE</span>
        </div>
        
        <div className="grid grid-cols-2 gap-1.5 font-mono text-[9px]">
          <button
            id="ping-drone-action"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              signalDroneLocation();
            }}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-red-950/45 border border-red-500/20 text-red-400 hover:border-red-500/50 hover:bg-red-900/40 transition-all rounded font-bold cursor-pointer select-none active:scale-95"
            title="Signal closest active hostile drones on pilot channel (Press Q)"
          >
            <Radio className="w-3 h-3 text-red-500 animate-[pulse_1s_infinite]" />
            <span>DRONE GPS [Q]</span>
          </button>
          
          <button
            id="ping-rift-action"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              signalRiftEnergy();
            }}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-fuchsia-950/45 border border-fuchsia-500/20 text-fuchsia-400 hover:border-fuchsia-500/50 hover:bg-fuchsia-900/40 transition-all rounded font-bold cursor-pointer select-none active:scale-95"
            title="Pings closest rift energy / powerup target (Press E)"
          >
            <Zap className="w-3 h-3 text-fuchsia-400 animate-pulse" />
            <span>RIFT CORE [E]</span>
          </button>
        </div>
        
        <div className="text-[7.5px] font-mono text-center text-zinc-500 tracking-wide mt-0.5">
          TAP MAP TO MARK ANY SECTOR MANUALLY
        </div>
      </div>
    </div>
  );
}
