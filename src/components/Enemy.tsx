/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, useRapier, CapsuleCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { useGameStore, EnemyData } from '../store';
import { Text, Html } from '@react-three/drei';
import { soundManager } from '../utils/audio';
import { motion, AnimatePresence } from 'motion/react';

const ENEMY_SPEED = 3;

export function Enemy({ data }: { data: EnemyData }) {
  const body = useRef<RapierRigidBody>(null);
  const { camera } = useThree();
  const { world, rapier } = useRapier();
  
  const gameState = useGameStore(state => state.gameState);
  const playerState = useGameStore(state => state.playerState);
  const hitPlayer = useGameStore(state => state.hitPlayer);
  const addLaser = useGameStore(state => state.addLaser);
  const addParticles = useGameStore(state => state.addParticles);
  const droneAiMode = useGameStore(state => state.droneAiMode);

  const pingedDroneId = useGameStore(state => state.pingedDroneId);
  const lastPingTime = useGameStore(state => state.lastPingTime);
  const targetedDroneId = useGameStore(state => state.targetedDroneId);
  const isTargeted = targetedDroneId === data.id;
  const [isPingActive, setIsPingActive] = useState(false);

  useEffect(() => {
    if (pingedDroneId === data.id) {
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
  }, [pingedDroneId, lastPingTime, data.id]);

  // Configure modular behavioral overrides responsive to active combat instructions
  const aiConfig = useMemo(() => {
    switch (droneAiMode) {
      case 'defensive':
        return {
          speedMultiplier: 0.65,
          chaseDist: 10,
          shootDist: 10,
          shootCooldown: 4000,
          colorOverride: '#3b82f6', // Protective blue glow
          labelBadge: '🛡️ DEFENSE',
          laserColor: '#3b82f6'
        };
      case 'scout':
        return {
          speedMultiplier: 1.8,
          chaseDist: 18,
          shootDist: 18,
          shootCooldown: 1500, // Quick frequent scan sweeps
          colorOverride: '#22c55e', // Scanning green
          labelBadge: '📡 SCANNER',
          laserColor: '#22c55e'
        };
      case 'aggressive':
      default:
        return {
          speedMultiplier: 1.35,
          chaseDist: 22,
          shootDist: 18,
          shootCooldown: 2200, // Fast combat firing rate
          colorOverride: '#ef4444', // Aggressive red
          labelBadge: '⚠️ SEEKER',
          laserColor: '#ef4444'
        };
    }
  }, [droneAiMode]);

  const lastShootTime = useRef(0);
  const patrolTarget = useRef(new THREE.Vector3());
  const lastPatrolChange = useRef(0);
  const state = useRef<'patrol' | 'chase'>('patrol');

  const groupRef = useRef<THREE.Group>(null);
  const rotor1Ref = useRef<THREE.Mesh>(null);
  const rotor2Ref = useRef<THREE.Mesh>(null);
  const rotor3Ref = useRef<THREE.Mesh>(null);
  const rotor4Ref = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  // Initialize patrol target
  useMemo(() => {
    patrolTarget.current.set(
      data.position[0] + (Math.random() - 0.5) * 10,
      data.position[1],
      data.position[2] + (Math.random() - 0.5) * 10
    );
  }, [data.position]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        const g = window as any;
        if (g.droneTelemetry) {
          delete g.droneTelemetry[data.id];
        }
      }
    };
  }, [data.id]);

  useFrame((state_fiber) => {
    if (!body.current || gameState !== 'playing' || data.state === 'disabled') {
      if (body.current) {
        body.current.setLinvel({ x: 0, y: body.current.linvel().y, z: 0 }, true);
      }
      if (typeof window !== 'undefined') {
        const g = window as any;
        if (g.droneTelemetry && g.droneTelemetry[data.id]) {
          if (data.state === 'disabled') {
            g.droneTelemetry[data.id].speed = 0;
            g.droneTelemetry[data.id].velocity = [0, 0, 0];
            g.droneTelemetry[data.id].state = 'disabled';
          } else {
            delete g.droneTelemetry[data.id];
          }
        }
      }
      return;
    }

    const pos = body.current.translation();
    const currentPos = new THREE.Vector3(pos.x, pos.y, pos.z);
    
    let closestTargetPos: THREE.Vector3 | null = null;
    let closestDist = aiConfig.chaseDist;

    // Check player
    if (playerState === 'active') {
      const playerPos = camera.position.clone();
      playerPos.y = pos.y; // Ignore height difference for distance
      const distToPlayer = currentPos.distanceTo(playerPos);
      if (distToPlayer < closestDist) {
        closestDist = distToPlayer;
        closestTargetPos = playerPos;
      }
    }

    // Check other enemies
    const allEnemies = useGameStore.getState().enemies;
    allEnemies.forEach(e => {
      if (e.id !== data.id && e.state === 'active') {
        const ePos = new THREE.Vector3(e.position[0], pos.y, e.position[2]);
        const distToEnemy = currentPos.distanceTo(ePos);
        if (distToEnemy < closestDist) {
          closestDist = distToEnemy;
          closestTargetPos = ePos;
        }
      }
    });

    // AI Logic
    if (closestTargetPos) {
      state.current = 'chase';
    } else if (state.current === 'chase') {
      state.current = 'patrol';
      patrolTarget.current.set(
        currentPos.x + (Math.random() - 0.5) * 40,
        currentPos.y,
        currentPos.z + (Math.random() - 0.5) * 40
      );
      lastPatrolChange.current = Date.now();
    }

    const direction = new THREE.Vector3();

    if (state.current === 'chase' && closestTargetPos) {
      direction.subVectors(closestTargetPos, currentPos).normalize();
      
      // Shooting logic
      const now = Date.now();
      if (closestDist < aiConfig.shootDist && now - lastShootTime.current > aiConfig.shootCooldown) {
        soundManager.playLaser(false);
        // Raycast to check line of sight
        const rayDir = new THREE.Vector3().subVectors(closestTargetPos, currentPos).normalize();
        
        // Add random spread so they miss sometimes
        const spread = 0.15;
        rayDir.x += (Math.random() - 0.5) * spread;
        rayDir.y += (Math.random() - 0.5) * spread;
        rayDir.z += (Math.random() - 0.5) * spread;
        rayDir.normalize();
        
        // Offset start position to avoid hitting self
        const startPos = new THREE.Vector3(currentPos.x, currentPos.y + 0.5, currentPos.z);
        startPos.add(rayDir.clone().multiplyScalar(1.5));

        const ray = new rapier.Ray(startPos, rayDir);
        const hit = world.castRay(ray, aiConfig.shootDist, true);

        if (hit) {
          const collider = hit.collider;
          const rb = collider.parent();
          if (rb && rb.userData) {
            const userData = rb.userData as { name?: string };
            if (userData.name === 'player') {
              // Hit player!
              if (droneAiMode === 'scout') {
                // Scout scanning: harmless!
                addParticles([camera.position.x, camera.position.y, camera.position.z], aiConfig.laserColor);
                addLaser(
                  [startPos.x, startPos.y, startPos.z],
                  [camera.position.x, camera.position.y, camera.position.z],
                  aiConfig.laserColor
                );
              } else {
                hitPlayer(data.id);
                addParticles([camera.position.x, camera.position.y, camera.position.z], aiConfig.laserColor);
                addLaser(
                  [startPos.x, startPos.y, startPos.z],
                  [camera.position.x, camera.position.y, camera.position.z],
                  aiConfig.laserColor
                );
              }
              lastShootTime.current = now;
            } else if (userData.name?.startsWith('bot-')) {
              // Hit another enemy!
              if (droneAiMode !== 'scout') {
                useGameStore.getState().hitEnemy(userData.name, false, data.id);
              }
              const hitPoint = ray.pointAt(hit.timeOfImpact);
              addParticles([hitPoint.x, hitPoint.y, hitPoint.z], aiConfig.laserColor);
              addLaser(
                [startPos.x, startPos.y, startPos.z],
                [hitPoint.x, hitPoint.y, hitPoint.z],
                aiConfig.laserColor
              );
              lastShootTime.current = now;
            } else {
              // Hit wall or obstacle
              const hitPoint = ray.pointAt(hit.timeOfImpact);
              addParticles([hitPoint.x, hitPoint.y, hitPoint.z], aiConfig.laserColor);
              addLaser(
                [startPos.x, startPos.y, startPos.z],
                [hitPoint.x, hitPoint.y, hitPoint.z],
                aiConfig.laserColor
              );
              lastShootTime.current = now;
            }
          } else {
            // Hit wall or obstacle
            const hitPoint = ray.pointAt(hit.timeOfImpact);
            addParticles([hitPoint.x, hitPoint.y, hitPoint.z], aiConfig.laserColor);
            addLaser(
              [startPos.x, startPos.y, startPos.z],
              [hitPoint.x, hitPoint.y, hitPoint.z],
              aiConfig.laserColor
            );
            lastShootTime.current = now;
          }
        }
      }
    } else {
      // Patrol
      const now = Date.now();
      // Change target if reached or if stuck for 4 seconds
      if (currentPos.distanceTo(patrolTarget.current) < 2 || now - lastPatrolChange.current > 4000) {
        patrolTarget.current.set(
          currentPos.x + (Math.random() - 0.5) * 60,
          currentPos.y,
          currentPos.z + (Math.random() - 0.5) * 60
        );
        lastPatrolChange.current = now;
      }
      direction.subVectors(patrolTarget.current, currentPos).normalize();
    }

    // Apply movement
    const velocity = body.current.linvel();
    const currentSpeed = ENEMY_SPEED * (data.speedMultiplier || 1) * aiConfig.speedMultiplier;
    body.current.setLinvel({
      x: direction.x * currentSpeed,
      y: velocity.y,
      z: direction.z * currentSpeed
    }, true);

    // Rotate to face direction
    if (groupRef.current && direction.lengthSq() > 0.1) {
      const targetRotation = Math.atan2(direction.x, direction.z);
      // Simple lerp for rotation
      const currentRotation = groupRef.current.rotation.y;
      // Handle angle wrap-around
      let diff = targetRotation - currentRotation;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      groupRef.current.rotation.y += diff * 0.1;
    }

    // Publish telemetry to window object for high-performance HUD readouts
    if (typeof window !== 'undefined') {
      const g = window as any;
      if (!g.droneTelemetry) g.droneTelemetry = {};
      const headingRad = Math.atan2(velocity.x, -velocity.z);
      let headingDeg = headingRad * (180 / Math.PI);
      if (headingDeg < 0) headingDeg += 360;

      const currentColor = data.isDecoy 
        ? '#38bdf8' 
        : (aiConfig.colorOverride || data.color || '#ff0055');

      g.droneTelemetry[data.id] = {
        id: data.id,
        label: data.label || data.id,
        position: [pos.x, pos.y, pos.z],
        velocity: [velocity.x, velocity.y, velocity.z],
        speed: Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z),
        heading: headingDeg,
        state: data.state,
        mode: droneAiMode,
        badge: data.isDecoy ? '👻 DECOY' : aiConfig.labelBadge,
        color: currentColor,
        isDecoy: !!data.isDecoy
      };
    }

    // Animate custom skin visual parts
    const elapsed = state_fiber.clock.getElapsedTime();
    if (rotor1Ref.current) rotor1Ref.current.rotation.y = elapsed * 25;
    if (rotor2Ref.current) rotor2Ref.current.rotation.y = elapsed * -25;
    if (rotor3Ref.current) rotor3Ref.current.rotation.y = elapsed * 25;
    if (rotor4Ref.current) rotor4Ref.current.rotation.y = elapsed * -25;
    if (ringRef.current) {
      ringRef.current.rotation.y = elapsed * 4;
      ringRef.current.rotation.x = Math.sin(elapsed * 2) * 0.2;
    }
  });

  const modeColor = data.state === 'disabled' 
    ? '#444' 
    : (data.isDecoy 
        ? '#38bdf8' 
        : (aiConfig.colorOverride || data.color || '#ff0055'));
  const visorColor = data.state === 'disabled' 
    ? '#111' 
    : (data.isDecoy 
        ? '#c084fc' // ghostly violet
        : (droneAiMode === 'scout' ? '#22c55e' : (droneAiMode === 'defensive' ? '#3b82f6' : '#00ffff')));
  const scaleValue = data.scale || 1.0;

  return (
    <RigidBody
      ref={body}
      colliders={false}
      mass={1}
      type="dynamic"
      position={data.position}
      enabledRotations={[false, false, false]}
      userData={{ name: data.id }}
    >
      <CapsuleCollider args={[0.5 * scaleValue, 0.5 * scaleValue]} position={[0, 1 * scaleValue, 0]} />
      <group ref={groupRef} position={[0, 0, 0]} scale={scaleValue}>
        {/* Render Drone based on select chassisSkin style variety */}
        {(!data.chassisSkin || data.chassisSkin === 'standard') && (
          <>
            {/* Standard: Capsule geometry core with face visor */}
            <mesh castShadow position={[0, 1, 0]}>
              <capsuleGeometry args={[0.5, 1]} />
              <meshStandardMaterial 
                color={modeColor} 
                roughness={0.3} 
                metalness={0.8} 
                emissive={modeColor}
                emissiveIntensity={data.state === 'disabled' ? 0 : 0.6}
                transparent={!!data.isDecoy}
                opacity={data.isDecoy ? 0.45 : 1.0}
              />
            </mesh>
            <mesh position={[0, 1.6, 0.45]}>
              <boxGeometry args={[0.6, 0.2, 0.2]} />
              <meshBasicMaterial color={visorColor} />
            </mesh>
          </>
        )}

        {data.chassisSkin === 'quadcopter' && (
          <>
            {/* Quadcopter skin: Center core sphere, 4 diagonal horizontal arms, spinning blades */}
            <mesh castShadow position={[0, 1, 0]}>
              <sphereGeometry args={[0.48, 16, 16]} />
              <meshStandardMaterial 
                color={modeColor} 
                roughness={0.25} 
                metalness={0.85} 
                emissive={modeColor}
                emissiveIntensity={data.state === 'disabled' ? 0 : 0.5}
                transparent={!!data.isDecoy}
                opacity={data.isDecoy ? 0.45 : 1.0}
              />
            </mesh>
            
            {/* Arms + Spinning Blades */}
            {/* FL */}
            <mesh position={[-0.45, 1.0, 0.45]} rotation={[0, Math.PI / 4, 0]}>
              <boxGeometry args={[0.7, 0.08, 0.08]} />
              <meshStandardMaterial color="#2d3748" metalness={0.6} />
            </mesh>
            <mesh position={[-0.7, 1.08, 0.7]}>
              <cylinderGeometry args={[0.02, 0.02, 0.08, 8]} />
              <meshStandardMaterial color="#1a202c" />
            </mesh>
            <mesh ref={rotor1Ref} position={[-0.7, 1.13, 0.7]}>
              <boxGeometry args={[0.7, 0.02, 0.05]} />
              <meshStandardMaterial color="#cbd5e1" roughness={0.1} transparent opacity={0.85} />
            </mesh>

            {/* FR */}
            <mesh position={[0.45, 1.0, 0.45]} rotation={[0, -Math.PI / 4, 0]}>
              <boxGeometry args={[0.7, 0.08, 0.08]} />
              <meshStandardMaterial color="#2d3748" metalness={0.6} />
            </mesh>
            <mesh position={[0.7, 1.08, 0.7]}>
              <cylinderGeometry args={[0.02, 0.02, 0.08, 8]} />
              <meshStandardMaterial color="#1a202c" />
            </mesh>
            <mesh ref={rotor2Ref} position={[0.7, 1.13, 0.7]}>
              <boxGeometry args={[0.7, 0.02, 0.05]} />
              <meshStandardMaterial color="#cbd5e1" roughness={0.1} transparent opacity={0.85} />
            </mesh>

            {/* BL */}
            <mesh position={[-0.45, 1.0, -0.45]} rotation={[0, -Math.PI / 4, 0]}>
              <boxGeometry args={[0.7, 0.08, 0.08]} />
              <meshStandardMaterial color="#2d3748" metalness={0.6} />
            </mesh>
            <mesh position={[-0.7, 1.08, -0.7]}>
              <cylinderGeometry args={[0.02, 0.02, 0.08, 8]} />
              <meshStandardMaterial color="#1a202c" />
            </mesh>
            <mesh ref={rotor3Ref} position={[-0.7, 1.13, -0.7]}>
              <boxGeometry args={[0.7, 0.02, 0.05]} />
              <meshStandardMaterial color="#cbd5e1" roughness={0.1} transparent opacity={0.85} />
            </mesh>

            {/* BR */}
            <mesh position={[0.45, 1.0, -0.45]} rotation={[0, Math.PI / 4, 0]}>
              <boxGeometry args={[0.7, 0.08, 0.08]} />
              <meshStandardMaterial color="#2d3748" metalness={0.6} />
            </mesh>
            <mesh position={[0.7, 1.08, -0.7]}>
              <cylinderGeometry args={[0.02, 0.02, 0.08, 8]} />
              <meshStandardMaterial color="#1a202c" />
            </mesh>
            <mesh ref={rotor4Ref} position={[0.7, 1.13, -0.7]}>
              <boxGeometry args={[0.7, 0.02, 0.05]} />
              <meshStandardMaterial color="#cbd5e1" roughness={0.1} transparent opacity={0.85} />
            </mesh>

            <mesh position={[0, 1.32, 0.35]}>
              <boxGeometry args={[0.5, 0.14, 0.14]} />
              <meshBasicMaterial color={visorColor} />
            </mesh>
          </>
        )}

        {data.chassisSkin === 'heavy_armor' && (
          <>
            {/* Heavy armor skin: Bulky cube central core with side shielding panels */}
            <mesh castShadow position={[0, 0.9, 0]}>
              <boxGeometry args={[0.78, 1.1, 0.78]} />
              <meshStandardMaterial 
                color={modeColor} 
                roughness={0.45} 
                metalness={0.85} 
                emissive={modeColor}
                emissiveIntensity={data.state === 'disabled' ? 0 : 0.45}
                transparent={!!data.isDecoy}
                opacity={data.isDecoy ? 0.45 : 1.0}
              />
            </mesh>
            {/* Left and right defensive bulk panels */}
            <mesh castShadow position={[-0.52, 1.0, 0]}>
              <boxGeometry args={[0.2, 0.7, 0.55]} />
              <meshStandardMaterial color="#111827" roughness={0.3} metalness={0.7} />
            </mesh>
            <mesh castShadow position={[0.52, 1.0, 0]}>
              <boxGeometry args={[0.2, 0.7, 0.55]} />
              <meshStandardMaterial color="#111827" roughness={0.3} metalness={0.7} />
            </mesh>
            {/* Heavy visor slit */}
            <mesh position={[0, 1.25, 0.4]}>
              <boxGeometry args={[0.42, 0.12, 0.12]} />
              <meshBasicMaterial color={visorColor} />
            </mesh>
          </>
        )}

        {data.chassisSkin === 'ring_fury' && (
          <>
            {/* Ring Fury skin: floating central orb inside spinning gyroscope ring */}
            <mesh castShadow position={[0, 1, 0]}>
              <sphereGeometry args={[0.42, 20, 20]} />
              <meshStandardMaterial 
                color={modeColor} 
                roughness={0.2} 
                metalness={0.9} 
                emissive={modeColor}
                emissiveIntensity={data.state === 'disabled' ? 0 : 0.6}
                transparent={!!data.isDecoy}
                opacity={data.isDecoy ? 0.45 : 1.0}
              />
            </mesh>
            {/* Ambient rotating gyroscope frame */}
            <mesh ref={ringRef} position={[0, 1, 0]} castShadow>
              <torusGeometry args={[0.72, 0.08, 10, 30]} />
              <meshStandardMaterial 
                color={modeColor} 
                roughness={0.1} 
                metalness={0.9} 
                emissive={modeColor}
                emissiveIntensity={data.state === 'disabled' ? 0 : 0.7}
                transparent={!!data.isDecoy}
                opacity={data.isDecoy ? 0.45 : 1.0}
              />
            </mesh>
            <mesh position={[0, 1.0, 0.35]}>
              <sphereGeometry args={[0.12, 8, 8]} />
              <meshBasicMaterial color={visorColor} />
            </mesh>
          </>
        )}

        {data.chassisSkin === 'stealth_delta' && (
          <>
            {/* Stealth Delta skin: High-octane supersonic delta aircraft body */}
            <mesh castShadow position={[0, 1.0, 0.1]} rotation={[Math.PI / 6, 0, 0]}>
              <coneGeometry args={[0.38, 1.2, 4]} />
              <meshStandardMaterial 
                color={modeColor} 
                roughness={0.2} 
                metalness={0.9} 
                emissive={modeColor}
                emissiveIntensity={data.state === 'disabled' ? 0 : 0.5}
                transparent={!!data.isDecoy}
                opacity={data.isDecoy ? 0.45 : 1.0}
              />
            </mesh>
            {/* Supersonic swept delta wings */}
            <mesh position={[-0.55, 0.85, -0.2]} rotation={[0, -Math.PI / 6, -Math.PI / 12]} castShadow>
              <boxGeometry args={[0.65, 0.05, 0.42]} />
              <meshStandardMaterial color="#0b0f19" roughness={0.15} metalness={0.5} />
            </mesh>
            <mesh position={[0.55, 0.85, -0.2]} rotation={[0, Math.PI / 6, Math.PI / 12]} castShadow>
              <boxGeometry args={[0.65, 0.05, 0.42]} />
              <meshStandardMaterial color="#0b0f19" roughness={0.15} metalness={0.5} />
            </mesh>
            {/* Aerospace glowing cockpit visor */}
            <mesh position={[0, 1.15, 0.28]} rotation={[Math.PI / 6, 0, 0]}>
              <boxGeometry args={[0.26, 0.08, 0.08]} />
              <meshBasicMaterial color={visorColor} />
            </mesh>
          </>
        )}

        {/* Username Label */}
        <Text
          position={[0, 2.7, 0]}
          fontSize={0.3}
          color={data.state === 'active' ? modeColor : '#666666'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {`${data.label || data.id} [${aiConfig.labelBadge}]`}
        </Text>

         <AnimatePresence>
           {isPingActive && (
             <Html position={[0, 1, 0]} center distanceFactor={12}>
               <motion.div
                 initial={{ scale: 0, opacity: 0 }}
                 animate={{
                   scale: [1, 1.1, 1],
                   opacity: 1,
                 }}
                 exit={{
                   scale: 0,
                   opacity: 0,
                   transition: { duration: 3.0, ease: "easeInOut" }
                 }}
                 style={{
                   filter: 'drop-shadow(0 0 16px rgba(239, 68, 68, 0.9))'
                 }}
                 transition={{
                   scale: {
                     repeat: Infinity,
                     duration: 1.5,
                     ease: "easeInOut"
                   },
                   default: { duration: 0.35 }
                 }}
                 className="pointer-events-none select-none flex flex-col items-center justify-center font-mono text-cyan-400"
               >
                 {/* Spinning, pulsing targeting reticle lines */}
                 <div className="relative w-24 h-24 flex items-center justify-center border border-dashed border-red-500/10 rounded-full animate-[spin_8s_linear_infinite]">
                   <div className="absolute inset-0 border-2 border-red-500 rounded-full opacity-60 animate-ping animate-infinite" style={{ animationDuration: '1.5s' }} />
                   {/* 4 Corner brackets */}
                   <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-red-500 rounded-tl shadow-[0_0_8px_#ef4444]" />
                   <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-red-500 rounded-tr shadow-[0_0_8px_#ef4444]" />
                   <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-red-500 rounded-bl shadow-[0_0_8px_#ef4444]" />
                   <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-red-500 rounded-br shadow-[0_0_8px_#ef4444]" />
                 </div>
                 
                 {/* Text Badge on Screen */}
                 <div className="mt-2 bg-black/90 border border-red-500 text-red-500 text-[10px] font-black tracking-widest px-2.5 py-1 rounded shadow-[0_0_12px_rgba(239,68,68,0.5)] whitespace-nowrap uppercase font-mono">
                    🎯 PING ACTIVE: {data.label || 'DRONE'}
                 </div>
               </motion.div>
             </Html>
           )}

           {isTargeted && (
             <Html position={[0, 1.2, 0]} center distanceFactor={14}>
               <motion.div
                 initial={{ scale: 1.4, opacity: 0 }}
                 animate={{
                   scale: [1, 1.05, 1],
                   opacity: 0.95,
                 }}
                 exit={{ scale: 1.4, opacity: 0 }}
                 style={{
                   filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.85))'
                 }}
                 transition={{
                   scale: {
                     repeat: Infinity,
                     duration: 1.8,
                     ease: "easeInOut"
                   },
                   default: { duration: 0.3 }
                 }}
                 className="pointer-events-none select-none flex flex-col items-center justify-center font-mono text-cyan-450"
               >
                 {/* 3D scene targeted boundary box indicator */}
                 <div className="relative w-28 h-28 flex items-center justify-center">
                   {/* Subtle spinning outer dotted cyan loop */}
                   <div className="absolute inset-0 border border-dotted border-cyan-400 rounded-full animate-[spin_12s_linear_infinite] opacity-50" />
                   
                   {/* Glowing thin active border */}
                   <div className="absolute -inset-2 border border-cyan-400/20 rounded shadow-[inset_0_0_8px_rgba(34,211,238,0.15)]" />
                   
                   {/* 4 neon corner brackets */}
                   <div className="absolute -top-3 -left-3 w-4 h-4 border-t-2 border-l-2 border-cyan-400 shadow-[0_0_6px_#22d3ee]" />
                   <div className="absolute -top-3 -right-3 w-4 h-4 border-t-2 border-r-2 border-cyan-400 shadow-[0_0_6px_#22d3ee]" />
                   <div className="absolute -bottom-3 -left-3 w-4 h-4 border-b-2 border-l-2 border-cyan-400 shadow-[0_0_6px_#22d3ee]" />
                   <div className="absolute -bottom-3 -right-3 w-4 h-4 border-b-2 border-r-2 border-cyan-400 shadow-[0_0_6px_#22d3ee]" />
                   
                   {/* Centered blinking lock reticle dot */}
                   <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/95 animate-ping opacity-90" style={{ animationDuration: '1.2s' }} />
                 </div>
                 
                 {/* Tactical HUD Highlight Box banner */}
                 <div className="mt-2.5 bg-cyan-950/90 border border-cyan-400/70 text-cyan-300 text-[8px] font-black tracking-[0.25em] px-3 py-1 rounded shadow-[0_0_12px_rgba(34,211,238,0.5)] whitespace-nowrap uppercase flex items-center gap-1">
                   <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                   HUD LOCK-ON: {data.label?.toUpperCase() || 'TARGET'}
                 </div>
               </motion.div>
             </Html>
           )}
         </AnimatePresence>
      </group>
    </RigidBody>
  );
}
