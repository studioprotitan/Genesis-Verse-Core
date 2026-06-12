/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { Canvas, useFrame } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Arena } from './Arena';
import { Player } from './Player';
import { PowerUpsManager } from './PowerUp';
import { Enemy } from './Enemy';
import { OtherPlayer } from './OtherPlayer';
import { Effects } from './Effects';
import { useGameStore } from '../store';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useShallow } from 'zustand/react/shallow';
import { useState, useEffect } from 'react';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    const uaMatch = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    return uaMatch || coarsePointer || window.innerWidth < 768;
  });

  useEffect(() => {
    const check = () => {
      const uaMatch = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
      setIsMobile(uaMatch || coarsePointer || window.innerWidth < 768);
    };
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isMobile;
}

function GameLoop() {
  const updateTime = useGameStore(state => state.updateTime);
  const updateEnemies = useGameStore(state => state.updateEnemies);
  const cleanupEffects = useGameStore(state => state.cleanupEffects);

  useFrame((_, delta) => {
    const now = Date.now();
    updateTime(delta);
    updateEnemies(now);
    cleanupEffects(now);
  });
  return null;
}

export function Game() {
  const enemies = useGameStore(state => state.enemies);
  const otherPlayerIds = useGameStore(
    useShallow(state => Object.keys(state.otherPlayers))
  );
  const environment = useGameStore(state => state.environment);
  const isMobile = useIsMobile();

  // Handle EventEmitters MaxListeners and Babylon.js engine/scene/texture cleanup to avoid memory leaks
  useEffect(() => {
    // 1. Solve Node/Socket EventEmitter warnings
    try {
      // Safely access event emitter defaults
      const G: any = typeof window !== 'undefined' ? window : global;
      const anyEventEmitter = G.EventEmitter || (G.process && G.process.listeners ? G.process : null);
      if (anyEventEmitter && typeof anyEventEmitter.defaultMaxListeners !== 'undefined') {
        anyEventEmitter.defaultMaxListeners = 0;
      }
    } catch (err) {
      console.warn('Unable to adjust defaultMaxListeners on EventEmitter:', err);
    }

    try {
      if (typeof window !== 'undefined') {
        const emitters: any[] = [
          (window as any).emitter,
          (window as any).eventEmitter,
          (window as any).socket,
          (window as any).io,
        ].filter(Boolean);

        emitters.forEach(em => {
          if (em && typeof em.setMaxListeners === 'function') {
            em.setMaxListeners(0);
          }
        });
      }
    } catch (err) {
      console.warn('Could not set listeners limit on global objects:', err);
    }

    // 2. Clear any lingering Babylon.js and event listener references on unmount
    return () => {
      try {
        if (typeof window !== 'undefined') {
          console.log('[Game Cleanup] Disposing of unused Babylon.js engines, engine textures, and scene observers');
          
          // Collect engines
          const enginesToDispose: any[] = [];
          if ((window as any).engine) {
            enginesToDispose.push((window as any).engine);
          }
          if ((window as any).babylonEngines && Array.isArray((window as any).babylonEngines)) {
            enginesToDispose.push(...(window as any).babylonEngines);
          }

          enginesToDispose.forEach((engine) => {
            if (engine) {
              // Properly dispose of loaded textures and materials
              if (engine.textures && Array.isArray(engine.textures)) {
                engine.textures.forEach((tex: any) => {
                  if (tex && typeof tex.dispose === 'function') {
                    try { tex.dispose(); } catch (e) {}
                  }
                });
              }

              // Dispose of engine
              if (typeof engine.dispose === 'function') {
                try { engine.dispose(); } catch (e) {}
              }
            }
          });

          // Collect and cleanup scenes / observers
          const scenesToDispose: any[] = [];
          if ((window as any).scene) {
            scenesToDispose.push((window as any).scene);
          }
          if ((window as any).babylonScenes && Array.isArray((window as any).babylonScenes)) {
            scenesToDispose.push(...(window as any).babylonScenes);
          }

          scenesToDispose.forEach((scene) => {
            if (scene) {
              // Clear observers recursively
              Object.keys(scene).forEach((key) => {
                const prop = scene[key];
                if (prop && typeof prop.clear === 'function' && key.endsWith('Observable')) {
                  try { prop.clear(); } catch (e) {}
                }
              });

              // Dispose scene resources properly
              if (typeof scene.dispose === 'function') {
                try { scene.dispose(); } catch (e) {}
              }
            }
          });

          // Remove any custom event handlers attached for throttle / interaction
          if (Array.isArray((window as any)._babylonEventHandlers)) {
            (window as any)._babylonEventHandlers.forEach((item: any) => {
              if (item && item.target && typeof item.target.removeEventListener === 'function') {
                try {
                  item.target.removeEventListener(item.type, item.listener);
                } catch (e) {}
              }
            });
            (window as any)._babylonEventHandlers = [];
          }
        }
      } catch (err) {
        console.error('[Game Cleanup Exception] Error during resource cleanup:', err);
      }
    };
  }, []);

  const fogDensity = isMobile ? environment.fogDensity * 1.6 : environment.fogDensity;
  const ambientIntensity = isMobile 
    ? environment.lightIntensity * 0.8 
    : environment.lightIntensity * 0.4;

  return (
    <Canvas 
      shadows={!isMobile} 
      camera={{ fov: 75 }}
      dpr={isMobile ? [1, 1.5] : [1, 2]} // Lower DPR for mobile performance
    >
      <color attach="background" args={[environment.fogColor]} />
      <fogExp2 attach="fog" args={[environment.fogColor, fogDensity]} />
      
      <ambientLight color={environment.lightColor} intensity={ambientIntensity} />
      <pointLight 
        position={[0, 8, 0]} 
        color={environment.lightColor} 
        intensity={1.5 * environment.lightIntensity} 
        castShadow={!isMobile} 
        distance={60} 
      />
      
      {!isMobile && (
        <>
          <pointLight position={[25, 8, 25]} color={environment.lightColor} intensity={1.2 * environment.lightIntensity} castShadow distance={60} />
          <pointLight position={[-25, 8, -25]} color={environment.lightColor} intensity={1.2 * environment.lightIntensity} castShadow distance={60} />
          <pointLight position={[25, 8, -25]} color={environment.lightColor} intensity={1.2 * environment.lightIntensity} castShadow distance={60} />
          <pointLight position={[-25, 8, 25]} color={environment.lightColor} intensity={1.2 * environment.lightIntensity} castShadow distance={60} />
        </>
      )}
      
      <Physics gravity={[0, -20, 0]}>
        <GameLoop />
        <Arena />
        <Player />
        <PowerUpsManager />
        {enemies.map(enemy => (
          <Enemy key={enemy.id} data={enemy} />
        ))}
        {otherPlayerIds.map(id => (
          <OtherPlayer key={id} id={id} />
        ))}
        <Effects />
      </Physics>

      {/* Bloom can be heavy on mobile, disable or simplify */}
      {!isMobile && (
        <EffectComposer>
          <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
