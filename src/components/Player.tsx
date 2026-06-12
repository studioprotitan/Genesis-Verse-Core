/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, useRapier, CapsuleCollider } from '@react-three/rapier';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store';
import { soundManager } from '../utils/audio';

const SPEED = 12;
const MAX_LASER_DIST = 100;

export function Player() {
  const body = useRef<RapierRigidBody>(null);
  const { camera } = useThree();
  const { rapier, world } = useRapier();
  
  const activeSelectedWeapon = useGameStore(state => state.activeSelectedWeapon);
  const playerState = useGameStore(state => state.playerState);
  const gameState = useGameStore(state => state.gameState);
  const activePowerUps = useGameStore(state => state.activePowerUps);
  const addLaser = useGameStore(state => state.addLaser);
  const incrementShotsFired = useGameStore(state => state.incrementShotsFired);
  const registerMiss = useGameStore(state => state.registerMiss);
  const hitEnemy = useGameStore(state => state.hitEnemy);
  const addParticles = useGameStore(state => state.addParticles);
  const addPing = useGameStore(state => state.addPing);
  const calibrationFireRateActiveUntil = useGameStore(state => state.calibrationFireRateActiveUntil);
  const calibrationRangeActiveUntil = useGameStore(state => state.calibrationRangeActiveUntil);

  const keys = useRef({ 
    w: false, a: false, s: false, d: false,
    arrowup: false, arrowdown: false, arrowleft: false, arrowright: false,
    q: false, e: false
  });
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const lastEmitTime = useRef(0);
  const lastShootTime = useRef(0);
  const mousePressed = useRef(false);
  const spacePressed = useRef(false);

  const gunGroupRef = useRef<THREE.Group>(null);
  const gunVisualRef = useRef<THREE.Group>(null);
  const gunBarrelRef = useRef<THREE.Group>(null);

  // More robust mobile detection (checks for touch support)
  const isTouchDevice = useRef(false);
  useEffect(() => {
    isTouchDevice.current = window.matchMedia('(pointer: coarse)').matches || 
                           'ontouchstart' in window || 
                           navigator.maxTouchPoints > 0;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keys.current) {
        keys.current[key as keyof typeof keys.current] = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keys.current) {
        keys.current[key as keyof typeof keys.current] = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const updatePlayerPosition = useGameStore(state => state.updatePlayerPosition);

  // Shooting logic function
  const shoot = () => {
    if (gameState !== 'playing' || playerState !== 'active') return;
    
    // Rate limit shooting based on active weapon choice
    const now = Date.now();
    let rateLimit = 200;
    if (activeSelectedWeapon === 'plasma') rateLimit = 350;
    else if (activeSelectedWeapon === 'emp') rateLimit = 300;
    else if (activeSelectedWeapon === 'railgun') rateLimit = 600;

    if (now - lastShootTime.current < rateLimit) return;
    lastShootTime.current = now;

    // Raycast from camera
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

    // Start raycast slightly ahead of the camera to avoid hitting the player's own collider
    const rayStart = camera.position.clone().add(raycaster.ray.direction.clone().multiplyScalar(0.8));
    const ray = new rapier.Ray(rayStart, raycaster.ray.direction);
    const hit = world.castRay(ray, MAX_LASER_DIST, true);

    const startPosVec = new THREE.Vector3();
    if (gunBarrelRef.current) {
      gunBarrelRef.current.getWorldPosition(startPosVec);
    } else {
      startPosVec.copy(camera.position);
    }
    const startPos: [number, number, number] = [startPosVec.x, startPosVec.y, startPosVec.z];

    // Apply recoil
    if (gunVisualRef.current) {
      const recAmt = activeSelectedWeapon === 'railgun' ? -0.8 : activeSelectedWeapon === 'plasma' ? -0.6 : -0.4;
      gunVisualRef.current.position.z = recAmt;
      gunVisualRef.current.rotation.x = activeSelectedWeapon === 'railgun' ? 0.25 : 0.1;
    }

    let endPos: [number, number, number];
    let didHitEnemy = false;

    const isDoubleDamage = Date.now() < activePowerUps.double_damage;
    let laserColor = isDoubleDamage ? '#ff00aa' : '#00ffff';
    if (activeSelectedWeapon === 'plasma') laserColor = '#f43f5e';
    else if (activeSelectedWeapon === 'emp') laserColor = '#d946ef';
    else if (activeSelectedWeapon === 'railgun') laserColor = '#f97316';

    if (hit) {
      const hitPoint = ray.pointAt(hit.timeOfImpact);
      endPos = [hitPoint.x, hitPoint.y, hitPoint.z];
      
      const collider = hit.collider;
      const rb = collider.parent();
      if (rb && rb.userData) {
        const userData = rb.userData as { name?: string };
        const name = userData.name;
        
        if (name) {
          // Check if it's a bot
          if (name.startsWith('bot-')) {
            hitEnemy(name, true);
            didHitEnemy = true;

            // Apply splash damage if using heavy weapon
            if (activeSelectedWeapon === 'plasma') {
              const allEnemies = useGameStore.getState().enemies;
              allEnemies.forEach(other => {
                if (other.id !== name && other.state === 'active') {
                  const dx = other.position[0] - hitPoint.x;
                  const dy = other.position[1] - hitPoint.y;
                  const dz = other.position[2] - hitPoint.z;
                  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                  if (dist < 15) {
                    hitEnemy(other.id, true);
                    addParticles(other.position, '#f43f5e');
                  }
                }
              });
            } else if (activeSelectedWeapon === 'railgun') {
              const allEnemies = useGameStore.getState().enemies;
              allEnemies.forEach(other => {
                if (other.id !== name && other.state === 'active') {
                  const dx = other.position[0] - hitPoint.x;
                  const dy = other.position[1] - hitPoint.y;
                  const dz = other.position[2] - hitPoint.z;
                  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                  if (dist < 22) {
                    hitEnemy(other.id, true);
                    addParticles(other.position, '#f97316');
                  }
                }
              });
            }
          } 
          // Check if it's another player (socket ID)
          else if (name !== 'player' && useGameStore.getState().otherPlayers[name]) {
            hitEnemy(name, true);
            didHitEnemy = true;
          }
        }
      }
      
      addParticles(endPos, laserColor);
    } else {
      endPos = [
        camera.position.x + raycaster.ray.direction.x * MAX_LASER_DIST,
        camera.position.y + raycaster.ray.direction.y * MAX_LASER_DIST,
        camera.position.z + raycaster.ray.direction.z * MAX_LASER_DIST
      ];
    }

    soundManager.playLaser(true);
    incrementShotsFired();
    addLaser(startPos, endPos, laserColor);

    if (!didHitEnemy) {
      registerMiss();
    }
  };

  // Raycast from camera/crosshair to mark/ping position in 3D world
  const triggerPing = () => {
    if (gameState !== 'playing' || playerState !== 'active') return;

    // Raycast from camera
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

    // Start raycast slightly ahead of the camera 
    const rayStart = camera.position.clone().add(raycaster.ray.direction.clone().multiplyScalar(0.8));
    const ray = new rapier.Ray(rayStart, raycaster.ray.direction);
    const hit = world.castRay(ray, MAX_LASER_DIST, true);

    let pingPos: [number, number, number];

    if (hit) {
      const hitPoint = ray.pointAt(hit.timeOfImpact);
      pingPos = [hitPoint.x, hitPoint.y, hitPoint.z];
    } else {
      // Default to 25 meters in front of camera
      const frontPoint = camera.position.clone().add(raycaster.ray.direction.clone().multiplyScalar(25));
      pingPos = [frontPoint.x, frontPoint.y, frontPoint.z];
    }

    addPing(pingPos);
  };

  useFrame((_, delta) => {
    if (!body.current || gameState !== 'playing') return;

    const mobileInput = useGameStore.getState().mobileInput;

    // Handle Shooting (mouse hold, spacebar hold, mobile continuous triggers)
    if (mousePressed.current || spacePressed.current || mobileInput.shooting) {
      shoot();
    }

    // Movement
    const velocity = body.current.linvel();
    
    const k = keys.current;
    
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, camera.up).normalize();

    // Combine keyboard and joystick input
    // Joystick Y is inverted (up is negative), so we negate it for forward movement
    // Actually, in Joystick component: Up is negative Y.
    // Forward movement should be positive.
    // Let's assume Joystick Up -> y < 0.
    // We want moveZ to be negative for forward.
    // So if joystick.y is -1, moveZ should be -1.
    // So we add joystick.y directly?
    // Wait, standard WASD: W -> moveZ = -1 (forward in Threejs is -Z usually? No, camera looks down -Z).
    // Yes, forward is -Z.
    // W key: moveZ = -1.
    // Joystick Up (y < 0): moveZ should be negative.
    // So we add mobileInput.move.y.
    
    const moveZ = (k.w ? 1 : 0) - (k.s ? 1 : 0) + (mobileInput.move.y * -1); // Invert joystick Y to match W/S logic (W is +1 in my logic below? No wait)
    
    // Original logic:
    // const moveZ = (k.w ? 1 : 0) - (k.s ? 1 : 0);
    // const direction = new THREE.Vector3();
    // direction.addScaledVector(forward, moveZ);
    
    // If I press W, moveZ is 1.
    // forward vector points in camera direction.
    // If I add scaled vector (forward * 1), I move forward.
    // So W -> 1 is correct.
    
    // Joystick Up -> y is negative (e.g. -1).
    // We want to move forward (1).
    // So we need -y.
    const joyMoveZ = -mobileInput.move.y;
    
    // Joystick Right -> x is positive.
    // D key -> moveX = 1.
    // We want moveX = 1.
    const joyMoveX = mobileInput.move.x;

    const combinedMoveZ = (k.w || k.arrowup ? 1 : 0) - (k.s || k.arrowdown ? 1 : 0) + joyMoveZ;
    const combinedMoveX = (k.d ? 1 : 0) - (k.a ? 1 : 0) + joyMoveX;

    const direction = new THREE.Vector3();
    direction.addScaledVector(forward, combinedMoveZ);
    direction.addScaledVector(right, combinedMoveX);
    
    if (direction.lengthSq() > 0) {
      // Clamp length to 1 to prevent faster diagonal movement if both inputs active (though rare)
      if (direction.lengthSq() > 1) direction.normalize();
      direction.multiplyScalar(SPEED);
    }

    body.current.setLinvel({ x: direction.x, y: velocity.y, z: direction.z }, true);

    // Keyboard Look Turning (ArrowLeft/Right, Q/E)
    const turnSpeed = 2.0 * delta;
    if (k.arrowleft || k.q) {
      camera.rotation.y += turnSpeed;
    }
    if (k.arrowright || k.e) {
      camera.rotation.y -= turnSpeed;
    }

    // Mobile Look Rotation
    if (Math.abs(mobileInput.look.x) > 0.01 || Math.abs(mobileInput.look.y) > 0.01) {
      const lookSpeed = 2.0 * delta;
      // Yaw (Left/Right) - Rotate around Y axis
      // Joystick Right (x > 0) -> Turn Right (negative rotation around Y in standard right-handed? No, usually -Y is right? Let's test)
      // PointerLockControls: moving mouse right -> camera rotates right.
      // Euler Y decreases?
      camera.rotation.y -= mobileInput.look.x * lookSpeed;
      
      // Pitch (Up/Down) - Rotate around X axis
      // Joystick Up (y < 0) -> Look Up.
      // Looking up means increasing X rotation? Or decreasing?
      // Usually looking up is positive X?
      // Let's try standard mapping.
      camera.rotation.x -= mobileInput.look.y * lookSpeed;
      
      // Clamp pitch to avoid flipping
      camera.rotation.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, camera.rotation.x));
    }

    // Update camera position to follow rigid body
    const pos = body.current.translation();
    camera.position.set(pos.x, pos.y + 1.6, pos.z); // Eye level (raised from 0.8)

    // Sync gun to camera
    if (gunGroupRef.current) {
      gunGroupRef.current.position.copy(camera.position);
      gunGroupRef.current.quaternion.copy(camera.quaternion);
    }
    
    // Recover recoil
    if (gunVisualRef.current) {
      gunVisualRef.current.position.z = THREE.MathUtils.lerp(gunVisualRef.current.position.z, -0.6, delta * 15);
      gunVisualRef.current.rotation.x = THREE.MathUtils.lerp(gunVisualRef.current.rotation.x, 0, delta * 15);
    }

    // Emit position to server
    const now = Date.now();
    const horizontalSpeed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);

    if (now - lastEmitTime.current > 50) {
      updatePlayerPosition([pos.x, pos.y, pos.z], camera.rotation.y);
      useGameStore.setState({ playerSpeed: horizontalSpeed });
      lastEmitTime.current = now;
    } else {
      // Also write locally to the store on cycles in between for perfect 60fps local rendering
      useGameStore.setState({
        playerPosition: [pos.x, pos.y, pos.z],
        playerRotation: camera.rotation.y,
        playerSpeed: horizontalSpeed
      });
    }
  });

  useEffect(() => {
    const isInteractiveElement = (target: any) => {
      if (!target) return false;
      const tagName = target.tagName?.toLowerCase();
      return tagName === 'button' || tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.closest?.('button');
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (isInteractiveElement(e.target)) return;
      if (e.button === 0) { // Left click
        mousePressed.current = true;
        isDragging.current = true;
        previousMousePosition.current = { x: e.clientX, y: e.clientY };
      }
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current && !document.pointerLockElement) {
        const deltaX = e.clientX - previousMousePosition.current.x;
        const deltaY = e.clientY - previousMousePosition.current.y;
        
        const sensitivity = 0.003;
        camera.rotation.y -= deltaX * sensitivity;
        camera.rotation.x -= deltaY * sensitivity;
        camera.rotation.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, camera.rotation.x));
        
        previousMousePosition.current = { x: e.clientX, y: e.clientY };
      }
    };
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        mousePressed.current = false;
        isDragging.current = false;
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      if (e.key === ' ' || e.code === 'Space') {
        spacePressed.current = true;
        if (gameState === 'playing') {
          e.preventDefault();
        }
      }

      if (e.key.toLowerCase() === 'g' || e.key.toLowerCase() === 'p') {
        if (gameState === 'playing' && playerState === 'active') {
          triggerPing();
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        spacePressed.current = false;
      }
    };
    const handleBlur = () => {
      mousePressed.current = false;
      spacePressed.current = false;
      isDragging.current = false;
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [gameState, camera]);

  return (
    <>
      {!isTouchDevice.current && <PointerLockControls />}
      <RigidBody
        ref={body}
        colliders={false}
        mass={1}
        type="dynamic"
        position={[0, 2, 0]}
        enabledRotations={[false, false, false]}
        userData={{ name: 'player' }}
        friction={0}
      >
        <CapsuleCollider args={[0.5, 0.5]} position={[0, 1, 0]} friction={0} />
      </RigidBody>

      {/* First Person Gun */}
      <group ref={gunGroupRef}>
        <group ref={gunVisualRef} position={[0.4, -0.3, -0.6]}>
          {/* Main body */}
          <mesh position={[0, 0, 0.2]}>
            <boxGeometry args={[0.1, 0.15, 0.4]} />
            <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Barrel */}
          <mesh position={[0, 0.05, -0.15]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
            <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Neon accents */}
          <mesh position={[0, 0.08, 0.1]}>
            <boxGeometry args={[0.11, 0.02, 0.2]} />
            <meshBasicMaterial color="#00ffff" toneMapped={false} />
          </mesh>
          <mesh position={[0, 0.05, -0.25]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.05, 8]} />
            <meshBasicMaterial color="#ff00ff" toneMapped={false} />
          </mesh>
          {/* Barrel Tip Reference */}
          <group ref={gunBarrelRef} position={[0, 0.05, -0.3]} />
        </group>
      </group>
    </>
  );
}
