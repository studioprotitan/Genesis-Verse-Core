/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../store';
import * as THREE from 'three';
import { useRef, useMemo, useEffect } from 'react';
import { Html } from '@react-three/drei';

export function Effects() {
  const lasers = useGameStore(state => state.lasers);
  const particles = useGameStore(state => state.particles);
  const pings = useGameStore(state => state.pings || []);

  return (
    <>
      {lasers.map(laser => (
        <Laser key={laser.id} start={laser.start} end={laser.end} color={laser.color} />
      ))}
      {particles.map(p => (
        <ParticleBurst key={p.id} position={p.position} color={p.color} />
      ))}
      {pings.filter(p => p && p.position && p.position.length >= 3).map(p => (
        <PingIndicator 
          key={p.id} 
          position={p.position} 
          color={p.senderColor} 
          label={p.senderName} 
          type={p.type || 'general'} 
        />
      ))}
    </>
  );
}

function PingIndicator({ 
  position, 
  color, 
  label, 
  type 
}: { 
  position: [number, number, number], 
  color: string, 
  label: string, 
  type: 'drone' | 'rift' | 'general' 
}) {
  const beamRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    
    if (beamRef.current) {
      const scaleVal = 1 + Math.sin(elapsed * 12) * 0.15;
      beamRef.current.scale.set(scaleVal, 1, scaleVal);
    }
    
    if (ringRef.current) {
      const cycle = (elapsed * 1.5) % 1.0;
      ringRef.current.scale.setScalar(0.2 + cycle * 5.0);
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = (1.0 - cycle) * 0.7;
      }
    }

    if (coreRef.current) {
      coreRef.current.rotation.y = elapsed * 3.0;
      coreRef.current.rotation.x = elapsed * 1.5;
      
      if (type === 'rift') {
        const bounce = 1.8 + Math.sin(elapsed * 6.0) * 0.4;
        coreRef.current.position.y = bounce;
      } else if (type === 'drone') {
        const pulse = 1.0 + Math.sin(elapsed * 15.0) * 0.25;
        coreRef.current.scale.setScalar(pulse);
      }
    }
  });

  // Pick HUD text headers based on type
  const hazardLabel = type === 'drone' 
    ? '⚠️ HOSTILE ACQUIRED' 
    : type === 'rift' 
      ? '🌀 RIFT ANOMALY' 
      : '🎯 TACTICAL MARKER';

  return (
    <group position={position}>
      {/* Waypoint Beam column */}
      <mesh ref={beamRef} position={[0, 15, 0]}>
        <cylinderGeometry args={[0.08, 0.4, 30, 8, 1, true]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.35} 
          side={THREE.DoubleSide} 
          toneMapped={false}
        />
      </mesh>
      
      {/* core glow beacon cylinder close to base */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.15, 0.22, 3, 8]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.7} 
          toneMapped={false}
        />
      </mesh>

      {/* Specialty 3D Holographic Geometry representing Target Type */}
      {type === 'drone' ? (
        // Red-hazard spinning target cage
        <mesh ref={coreRef} position={[0, 2.0, 0]}>
          <octahedronGeometry args={[0.7, 0]} />
          <meshBasicMaterial 
            color={color} 
            wireframe 
            transparent 
            opacity={0.8} 
            toneMapped={false} 
          />
        </mesh>
      ) : type === 'rift' ? (
        // Swirling purple-pink gravitational core ring
        <mesh ref={coreRef} position={[0, 1.8, 0]}>
          <torusGeometry args={[0.5, 0.15, 8, 24]} />
          <meshBasicMaterial 
            color={color} 
            transparent 
            opacity={0.9} 
            toneMapped={false} 
          />
        </mesh>
      ) : (
        // Standard small core sphere
        <mesh ref={coreRef} position={[0, 1.8, 0]}>
          <sphereGeometry args={[0.25, 8, 8]} />
          <meshBasicMaterial 
            color={color} 
            transparent 
            opacity={0.9} 
            toneMapped={false} 
          />
        </mesh>
      )}

      {/* Expanding Ground Radar Ring */}
      <mesh ref={ringRef} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1.0, 16]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.6} 
          side={THREE.DoubleSide} 
          toneMapped={false}
        />
      </mesh>

      {/* Futuristic Floating Holographic Diagnostic Card Overlay */}
      <Html position={[0, 3.2, 0]} center distanceFactor={16} zIndexRange={[10, 50]} style={{ transition: 'opacity 0.2s', pointerEvents: 'none' }}>
        <div 
          className="flex flex-col items-center select-none"
          style={{ textShadow: `0 0 6px ${color}` }}
        >
          {/* Animated pulsing reticle circle */}
          <div 
            className="w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center animate-[spin_8s_linear_infinite]"
            style={{ borderColor: color, boxShadow: `0 0 10px ${color}33, inset 0 0 10px ${color}33` }}
          >
            {/* Center target node dot */}
            <div className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: color }} />
          </div>

          {/* Connected floating digital label plate */}
          <div 
            className="mt-2.5 bg-black/90 border rounded-md py-1 px-2.5 flex flex-col gap-0.5 min-w-[125px] text-center backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.85)] border-solid animate-pulse"
            style={{ borderColor: color, boxShadow: `0 0 10px ${color}22` }}
          >
            <span className="text-[9px] uppercase font-bold tracking-[0.14em]" style={{ color }}>
              {hazardLabel}
            </span>
            <span className="text-[7.5px] text-zinc-300 font-mono font-bold tracking-tight">
              SENDER: {label.toUpperCase()}
            </span>
            <span className="text-[7px] text-zinc-400 font-mono uppercase tracking-widest mt-0.5">
              X:{position[0].toFixed(1)} Z:{position[2].toFixed(1)}
            </span>
          </div>
          
          {/* Futuristic pointer arrow */}
          <div 
            className="w-2.5 h-2.5 rotate-45 border-r border-b -mt-[5.5px] bg-black/95"
            style={{ borderColor: color }}
          />
        </div>
      </Html>
    </group>
  );
}

function Laser({ start, end, color }: { start: [number, number, number], end: [number, number, number], color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  
  const { position, rotation, length } = useMemo(() => {
    const s = new THREE.Vector3(...start);
    const e = new THREE.Vector3(...end);
    const length = s.distanceTo(e);
    const position = s.clone().lerp(e, 0.5);
    
    const direction = e.clone().sub(s).normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      direction
    );
    const rotation = new THREE.Euler().setFromQuaternion(quaternion);
    
    return { position, rotation, length };
  }, [start, end]);

  useFrame((_, delta) => {
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, mat.opacity - delta * 4);
    }
  });

  return (
    <mesh ref={ref} position={position} rotation={rotation}>
      <boxGeometry args={[0.2, 0.2, length]} />
      <meshBasicMaterial color={color} toneMapped={false} transparent opacity={1} />
    </mesh>
  );
}

function ParticleBurst({ position, color }: { position: [number, number, number], color: string }) {
  const group = useRef<THREE.Group>(null);
  
  const particles = useMemo(() => {
    return Array.from({ length: 15 }).map(() => ({
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8
      )
    }));
  }, []);

  useFrame((_, delta) => {
    if (group.current) {
      group.current.children.forEach((child, i) => {
        child.position.addScaledVector(particles[i].velocity, delta);
        const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, mat.opacity - delta * 3);
        child.scale.setScalar(Math.max(0.001, child.scale.x - delta * 2));
      });
    }
  });

  return (
    <group ref={group} position={position}>
      {particles.map((_, i) => (
        <mesh key={i}>
          <boxGeometry args={[0.05, 0.05, 0.05]} />
          <meshBasicMaterial color={color} transparent opacity={1} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
