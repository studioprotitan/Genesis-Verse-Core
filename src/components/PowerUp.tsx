/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore, PowerUpData } from '../store';

export function PowerUp({ data }: { data: PowerUpData }) {
  const meshRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const orbitRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const pickupPowerUp = useGameStore(state => state.pickupPowerUp);

  const initialY = data.position[1];

  useFrame((state, delta) => {
    const elapsed = state.clock.getElapsedTime();

    // Floating and rotating animation
    if (meshRef.current) {
      meshRef.current.position.y = initialY + Math.sin(elapsed * 4.5) * 0.18;
      meshRef.current.rotation.y += delta * 1.5;
    }

    if (ringRef.current) {
      ringRef.current.rotation.x = elapsed * 2.0;
      ringRef.current.rotation.z = elapsed * 1.0;
    }

    if (orbitRef.current) {
      orbitRef.current.rotation.y = -elapsed * 3.0;
    }

    // Distance check to player camera
    const playerPos = camera.position.clone();
    // Projects player position onto the same height level
    const powerupPos = new THREE.Vector3(data.position[0], playerPos.y, data.position[2]);
    const dist = playerPos.distanceTo(powerupPos);

    if (dist < 2.5) {
      pickupPowerUp(data.id);
    }
  });

  return (
    <group position={[data.position[0], initialY, data.position[2]]}>
      {/* Visual geometry group */}
      <group ref={meshRef}>
        {data.type === 'invulnerability' ? (
          // Invulnerability Shield: Glowing Spherical core + Spinning safety ring
          <group>
            {/* Core */}
            <mesh castShadow>
              <dodecahedronGeometry args={[0.35, 1]} />
              <meshStandardMaterial
                color="#ffcc00"
                roughness={0.1}
                metalness={0.9}
                emissive="#ffcc00"
                emissiveIntensity={1.2}
              />
            </mesh>
            {/* Protective Ring */}
            <mesh ref={ringRef}>
              <torusGeometry args={[0.65, 0.05, 8, 32]} />
              <meshBasicMaterial color="#ffcc00" transparent opacity={0.75} toneMapped={false} />
            </mesh>
          </group>
        ) : (
          // Double Damage: Dual sharp crystal core + orbiting particle ring
          <group>
            {/* Core Crystal */}
            <mesh castShadow rotation={[0, 0, Math.PI / 4]}>
              <octahedronGeometry args={[0.38]} />
              <meshStandardMaterial
                color="#ff00aa"
                roughness={0.1}
                metalness={0.9}
                emissive="#ff00aa"
                emissiveIntensity={1.5}
              />
            </mesh>
            {/* Orbiting Square */}
            <mesh ref={orbitRef} rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.6, 0.65, 4]} />
              <meshBasicMaterial color="#ff00aa" side={THREE.DoubleSide} transparent opacity={0.8} toneMapped={false} />
            </mesh>
          </group>
        )}
      </group>

      {/* Floating Neon Label */}
      <group position={[0, 1.2, 0]}>
        <Text
          fontSize={0.28}
          color={data.color}
          font="https://fonts.gstatic.com/s/spacegrotesk/v13/V8mDoQDjQ05e9Ph5_88S3-b_t7eT.woff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#000"
          fontWeight="bold"
        >
          {data.type === 'invulnerability' ? '🛡️ SHIELD' : '🔥 DBL DAMAGE'}
        </Text>
      </group>

      {/* Neon glowing aura underneath on the grid floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -initialY + 0.02, 0]}>
        <ringGeometry args={[0, 1.0, 16]} />
        <meshBasicMaterial color={data.color} transparent opacity={0.18} side={THREE.DoubleSide} />
      </mesh>

      {/* Subtle pointlight reflecting off objects */}
      <pointLight color={data.color} intensity={2.5} distance={6} />
    </group>
  );
}

export function PowerUpsManager() {
  const powerUps = useGameStore(state => state.powerUps);

  return (
    <group>
      {powerUps.map(p => (
        <PowerUp key={p.id} data={p} />
      ))}
    </group>
  );
}
