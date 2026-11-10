/**
 * 3D Procedural Particle System for Talking Davi Lucas.
 * Handles Dizzy Stars, Love Hearts, Fire Breath, Fart Smoke, and Sleep Zzzs.
 */

import * as THREE from 'three';
import { createParticleTexture } from './textures';

interface Particle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  scale: number;
  rotSpeed: number;
  active: boolean;
  type: 'star' | 'heart' | 'flame' | 'smoke' | 'zzz';
}

export class ParticleManager {
  public group: THREE.Group;
  private pool: Particle[] = [];
  private materials: Record<string, THREE.MeshBasicMaterial> = {};
  private planeGeo: THREE.PlaneGeometry;

  constructor() {
    this.group = new THREE.Group();
    this.planeGeo = new THREE.PlaneGeometry(0.35, 0.35);

    // Initialize materials
    const types: ('star' | 'heart' | 'flame' | 'smoke' | 'zzz')[] = [
      'star',
      'heart',
      'flame',
      'smoke',
      'zzz',
    ];
    types.forEach((t) => {
      this.materials[t] = new THREE.MeshBasicMaterial({
        map: createParticleTexture(t),
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
    });

    // Pre-allocate 120 particle pool
    for (let i = 0; i < 120; i++) {
      const mesh = new THREE.Mesh(this.planeGeo, this.materials.star);
      mesh.visible = false;
      this.group.add(mesh);
      this.pool.push({
        mesh,
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 1,
        scale: 1,
        rotSpeed: 0,
        active: false,
        type: 'star',
      });
    }
  }

  private spawn(
    type: 'star' | 'heart' | 'flame' | 'smoke' | 'zzz',
    pos: THREE.Vector3,
    vel: THREE.Vector3,
    maxLife: number,
    baseScale: number,
    rotSpeed: number = 0
  ) {
    const p = this.pool.find((item) => !item.active);
    if (!p) return;

    p.active = true;
    p.type = type;
    p.mesh.material = this.materials[type];
    p.mesh.position.copy(pos);
    p.vel.copy(vel);
    p.life = 0;
    p.maxLife = maxLife;
    p.scale = baseScale;
    p.rotSpeed = rotSpeed;
    p.mesh.scale.set(baseScale, baseScale, baseScale);
    p.mesh.visible = true;
  }

  // Dizzy Stars burst around head
  public burstDizzyStars(headPos: THREE.Vector3) {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const speed = 0.8 + Math.random() * 0.4;
      const vel = new THREE.Vector3(
        Math.cos(angle) * speed,
        0.3 + Math.random() * 0.4,
        Math.sin(angle) * speed
      );
      this.spawn('star', headPos, vel, 1.2, 0.45, (Math.random() - 0.5) * 6);
    }
  }

  // Hearts on Petting
  public emitHearts(bodyPos: THREE.Vector3) {
    for (let i = 0; i < 3; i++) {
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 0.6,
        (Math.random() - 0.5) * 0.4,
        0.4
      );
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        0.8 + Math.random() * 0.5,
        (Math.random() - 0.5) * 0.2
      );
      this.spawn('heart', bodyPos.clone().add(offset), vel, 1.4, 0.4, (Math.random() - 0.5) * 2);
    }
  }

  // Fire breath stream
  public emitFire(mouthPos: THREE.Vector3) {
    for (let i = 0; i < 4; i++) {
      const spread = 0.25;
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread + 0.1,
        1.8 + Math.random() * 0.8
      );
      this.spawn('flame', mouthPos, vel, 0.8, 0.5 + Math.random() * 0.3, (Math.random() - 0.5) * 4);
    }
  }

  // Stinky fart smoke puff
  public emitFartCloud(backPos: THREE.Vector3) {
    for (let i = 0; i < 10; i++) {
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.8,
        0.2 + Math.random() * 0.6,
        -0.8 - Math.random() * 0.6
      );
      this.spawn('smoke', backPos, vel, 1.5, 0.6 + Math.random() * 0.4, (Math.random() - 0.5) * 2);
    }
  }

  // Sleeping Zzz
  public emitSleepZ(headPos: THREE.Vector3) {
    const offset = new THREE.Vector3(0.2, 0.3, 0.2);
    const vel = new THREE.Vector3(0.2, 0.45, 0.1);
    this.spawn('zzz', headPos.clone().add(offset), vel, 2.0, 0.5, 0);
  }

  public update(dt: number, camera: THREE.Camera) {
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (!p.active) continue;

      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }

      // Billboard orientation towards camera
      p.mesh.quaternion.copy(camera.quaternion);

      // Physics
      p.mesh.position.addScaledVector(p.vel, dt);

      if (p.type === 'flame') {
        p.vel.y += dt * 0.5; // Flame rises
      } else if (p.type === 'star') {
        p.vel.y -= dt * 0.8; // Gravity on stars
        p.mesh.rotation.z += p.rotSpeed * dt;
      }

      // Fade & scale out
      const progress = p.life / p.maxLife;
      const currentScale = p.scale * (1.0 - progress * 0.4);
      p.mesh.scale.set(currentScale, currentScale, currentScale);

      // Material opacity
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = 1.0 - progress;
    }
  }
}
