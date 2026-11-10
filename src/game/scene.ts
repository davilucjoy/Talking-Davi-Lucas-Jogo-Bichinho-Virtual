/**
 * Three.js Scene Manager for Talking Davi Lucas.
 * Handles PBR RoomEnvironment, studio lighting, contact shadow,
 * camera damping & shake, raycasting interaction, and 60fps simulation loop.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { DaviCharacter, WardrobeHat, WardrobeGlasses, ActiveProp } from './character';
import { ParticleManager } from './particles';
import { soundEngine } from './audio';
import { createFloorTexture, createWallTexture } from './textures';

export interface SceneCallbacks {
  onInteract?: (part: 'head' | 'belly' | 'feet' | 'pet') => void;
  onCoinEarned?: (amount: number) => void;
}

export class DaviSceneManager {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean = false;
  private animFrameId: number = 0;
  private isDisposed: boolean = false;

  // Components
  public character: DaviCharacter;
  public particles: ParticleManager;
  private roomGroup: THREE.Group;
  private spotLight: THREE.SpotLight | null = null;

  // Lighting
  private keyLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;

  // Interaction & Raycasting
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2(-999, -999);
  private isPointerDown: boolean = false;
  private dragDistance: number = 0;
  private lastPointerPos = new THREE.Vector2();
  private callbacks: SceneCallbacks;

  // Camera dynamics & shake
  private baseCamPos = new THREE.Vector3(0, 1.8, 3.6);
  private camPos = new THREE.Vector3(0, 1.8, 3.6);
  private camTarget = new THREE.Vector3(0, 1.35, 0);
  private cameraShakeTrauma: number = 0;

  // Idle tracking
  private lastInteractionTime: number = Date.now();
  private isAsleep: boolean = false;

  // Disco lights effect
  public isDiscoActive: boolean = false;
  private discoTime: number = 0;
  private discoColors = [0xec4899, 0x8b5cf6, 0x06b6d4, 0xfacc15, 0x22c55e];

  constructor(container: HTMLElement, callbacks: SceneCallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;

    // 1. Detect Software WebGL
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Initialize Renderer
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 3. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1e293b);
    this.scene.fog = new THREE.Fog(0x1e293b, 8, 20);

    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 50);
    this.camera.position.copy(this.baseCamPos);
    this.camera.lookAt(this.camTarget);

    // 4. Procedural Studio Environment Map
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Lighting Rig
    this.hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 0.7);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xfff7ed, 1.8);
    this.keyLight.position.set(3, 5, 4);
    this.keyLight.castShadow = !this.isSoftwareGl;
    if (this.keyLight.castShadow) {
      this.keyLight.shadow.mapSize.width = 1024;
      this.keyLight.shadow.mapSize.height = 1024;
      this.keyLight.shadow.bias = -0.0005;
      this.keyLight.shadow.normalBias = 0.02;
      const d = 2.5;
      this.keyLight.shadow.camera.left = -d;
      this.keyLight.shadow.camera.right = d;
      this.keyLight.shadow.camera.top = d;
      this.keyLight.shadow.camera.bottom = -d;
    }
    this.scene.add(this.keyLight);

    // Rim light from behind
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    rimLight.position.set(-3, 4, -3);
    this.scene.add(rimLight);

    // 6. Build Room Studio Set
    this.roomGroup = this.buildRoom('studio');
    this.scene.add(this.roomGroup);

    // 7. Add Character & Particles
    this.character = new DaviCharacter();
    this.scene.add(this.character.group);

    this.particles = new ParticleManager();
    this.scene.add(this.particles.group);

    // 8. Event Listeners
    window.addEventListener('resize', this.onResize);
    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointerleave', this.onPointerUp);

    // Warm shaders once
    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    // Start 60fps Loop
    this.startLoop();
  }

  // --- Room Environment Construction ---

  private buildRoom(theme: string): THREE.Group {
    const room = new THREE.Group();

    // Floor
    const floorGeo = new THREE.PlaneGeometry(12, 12);
    const floorMat = new THREE.MeshStandardMaterial({
      map: createFloorTexture(),
      roughness: 0.35,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    room.add(floor);

    // Back Wall
    const wallGeo = new THREE.PlaneGeometry(12, 8);
    const wallMat = new THREE.MeshStandardMaterial({
      map: createWallTexture(theme),
      roughness: 0.85,
    });
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 4, -4);
    backWall.receiveShadow = true;
    room.add(backWall);

    // Left Wall with Acoustic Panels
    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-6, 4, 0);
    room.add(leftWall);

    // Right Wall
    const rightWall = new THREE.Mesh(wallGeo, wallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(6, 4, 0);
    room.add(rightWall);

    // Studio baseboard moulding
    const baseboardGeo = new THREE.BoxGeometry(12, 0.25, 0.1);
    const baseboardMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
    const bb = new THREE.Mesh(baseboardGeo, baseboardMat);
    bb.position.set(0, 0.125, -3.95);
    room.add(bb);

    // Overhead Studio Disco Spotlight
    this.spotLight = new THREE.SpotLight(0x38bdf8, 2.5, 10, Math.PI / 4, 0.4);
    this.spotLight.position.set(0, 5, 1);
    this.spotLight.target = this.character.group;
    room.add(this.spotLight);

    return room;
  }

  public setRoomTheme(theme: string) {
    this.scene.remove(this.roomGroup);
    this.roomGroup = this.buildRoom(theme);
    this.scene.add(this.roomGroup);
  }

  // --- Interaction / Raycasting Handlers ---

  private onPointerMove = (e: PointerEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Head look-at cursor
    this.character.setLookAt(this.mouse.x, this.mouse.y);

    // Petting gesture detection while holding down
    if (this.isPointerDown) {
      const dx = e.clientX - this.lastPointerPos.x;
      const dy = e.clientY - this.lastPointerPos.y;
      this.dragDistance += Math.hypot(dx, dy);

      if (this.dragDistance > 35) {
        this.dragDistance = 0;
        this.handlePetting();
      }
      this.lastPointerPos.set(e.clientX, e.clientY);
    }
  };

  private onPointerDown = (e: PointerEvent) => {
    this.isPointerDown = true;
    this.dragDistance = 0;
    this.lastPointerPos.set(e.clientX, e.clientY);
    this.lastInteractionTime = Date.now();

    // Wake up if asleep
    if (this.isAsleep) {
      this.wakeUp();
      return;
    }

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hitCandidates = [
      this.character.hitHead,
      this.character.hitBelly,
      this.character.hitFeet,
    ];
    const intersects = this.raycaster.intersectObjects(hitCandidates, false);

    if (intersects.length > 0) {
      const hitName = intersects[0].object.name;
      if (hitName === 'hitbox_head') {
        this.handleSlap();
      } else if (hitName === 'hitbox_belly') {
        this.handleBellyPoke();
      } else if (hitName === 'hitbox_feet') {
        this.handleFootTickle();
      }
    }
  };

  private onPointerUp = () => {
    this.isPointerDown = false;
  };

  // --- Core Reactions ---

  public handleSlap() {
    this.lastInteractionTime = Date.now();
    soundEngine.playSlap();
    this.character.triggerSlap();
    this.cameraShakeTrauma = 0.55; // Camera shake

    // Spawn dizzy stars around head
    const headPos = new THREE.Vector3();
    this.character.headGroup.getWorldPosition(headPos);
    headPos.y += 0.2;
    this.particles.burstDizzyStars(headPos);

    this.callbacks.onInteract?.('head');
    this.callbacks.onCoinEarned?.(5);
  }

  public handleBellyPoke() {
    this.lastInteractionTime = Date.now();
    // 30% chance of burp, otherwise playful giggle
    if (Math.random() < 0.3) {
      soundEngine.playBurp();
    } else {
      soundEngine.playGiggle();
    }
    this.character.triggerBellyPoke();
    this.callbacks.onInteract?.('belly');
    this.callbacks.onCoinEarned?.(3);
  }

  public handleFootTickle() {
    this.lastInteractionTime = Date.now();
    soundEngine.playGiggle();
    this.character.triggerFootTickle();
    this.callbacks.onInteract?.('feet');
    this.callbacks.onCoinEarned?.(4);
  }

  public handlePetting() {
    this.lastInteractionTime = Date.now();
    const bodyPos = new THREE.Vector3();
    this.character.torso.getWorldPosition(bodyPos);
    this.particles.emitHearts(bodyPos);
    this.character.setExpression('happy');
    this.callbacks.onInteract?.('pet');
    this.callbacks.onCoinEarned?.(2);
  }

  // --- Foods & Fun Actions ---

  public feedItem(food: 'pizza' | 'chili' | 'boba' | 'lemon' | 'potion') {
    this.lastInteractionTime = Date.now();
    if (food === 'pizza') {
      soundEngine.playChomp();
      this.character.triggerEat('pizza');
      this.callbacks.onCoinEarned?.(10);
    } else if (food === 'chili') {
      soundEngine.playChomp();
      this.character.triggerEat('chili');
      setTimeout(() => {
        soundEngine.playFireBreath();
        this.character.triggerFireBreath();
        this.cameraShakeTrauma = 0.7; // Heavy shake
        // Emit flame stream from mouth
        const mouthPos = new THREE.Vector3();
        this.character.jaw.getWorldPosition(mouthPos);
        for (let i = 0; i < 6; i++) {
          setTimeout(() => this.particles.emitFire(mouthPos), i * 120);
        }
      }, 700);
      this.callbacks.onCoinEarned?.(15);
    } else if (food === 'boba') {
      soundEngine.playSlurp();
      this.character.triggerEat('boba');
      this.callbacks.onCoinEarned?.(10);
    } else if (food === 'lemon') {
      soundEngine.playChomp();
      this.character.setExpression('dizzy');
      this.character.squashScale.set(0.7, 1.3, 0.7);
      soundEngine.playGiggle();
    } else if (food === 'potion') {
      soundEngine.playSlurp();
      this.character.triggerEat('boba');
      setTimeout(() => {
        // Super Davi transformation bounce
        this.character.squashScale.set(1.4, 1.4, 1.4);
        soundEngine.playCoin();
      }, 800);
    }
  }

  public triggerGuitarShred() {
    this.lastInteractionTime = Date.now();
    soundEngine.playGuitarSolo();
    this.character.triggerGuitarShred();
    this.cameraShakeTrauma = 0.3;
  }

  public triggerDiscoDance() {
    this.lastInteractionTime = Date.now();
    this.isDiscoActive = true;
    this.discoTime = 0;
    this.character.triggerDiscoDance();
    soundEngine.playDiscoBeat((step) => {
      if (this.spotLight) {
        this.spotLight.color.setHex(this.discoColors[step % this.discoColors.length]);
      }
    });
    setTimeout(() => {
      this.isDiscoActive = false;
      if (this.spotLight) {
        this.spotLight.color.setHex(0x38bdf8);
      }
    }, 4000);
  }

  public triggerFart() {
    this.lastInteractionTime = Date.now();
    this.character.triggerFart();
    setTimeout(() => {
      soundEngine.playFart();
      const backPos = new THREE.Vector3();
      this.character.hips.getWorldPosition(backPos);
      this.particles.emitFartCloud(backPos);
    }, 400);
  }

  public toggleSleep() {
    if (this.isAsleep) {
      this.wakeUp();
    } else {
      this.putToSleep();
    }
  }

  private putToSleep() {
    this.isAsleep = true;
    this.character.triggerSleep(true);
    soundEngine.playSnore();
  }

  private wakeUp() {
    this.isAsleep = false;
    this.lastInteractionTime = Date.now();
    this.character.triggerSleep(false);
    soundEngine.playGiggle();
  }

  // --- Wardrobe Customization ---

  public setHat(hat: WardrobeHat) {
    this.character.applyHat(hat);
  }

  public setGlasses(glasses: WardrobeGlasses) {
    this.character.applyGlasses(glasses);
  }

  public setOutfitColor(hex: string) {
    this.character.setHoodieColor(hex);
  }

  // --- Simulation & Render Loop ---

  private startLoop() {
    let lastTime = performance.now();

    const tick = (now: number) => {
      if (this.isDisposed) return;

      const rawDt = (now - lastTime) / 1000;
      const dt = Math.min(rawDt, 0.05); // Clamp dt to 0.05
      lastTime = now;

      // Check speech amplitude for mouth visemes
      const speechAmp = soundEngine.getSpeechAmplitude();

      // Idle sleeping timer: if untouched for 25s, fall asleep
      if (!this.isAsleep && Date.now() - this.lastInteractionTime > 25000) {
        this.putToSleep();
      }

      // If sleeping, emit Zzz every 2.5s
      if (this.isAsleep && Math.random() < 0.015) {
        const headPos = new THREE.Vector3();
        this.character.headGroup.getWorldPosition(headPos);
        this.particles.emitSleepZ(headPos);
      }

      // Update character & particles
      this.character.update(dt, speechAmp);
      this.particles.update(dt, this.camera);

      // Camera Shake decay
      if (this.cameraShakeTrauma > 0) {
        this.cameraShakeTrauma = Math.max(0, this.cameraShakeTrauma - dt * 2.5);
        const shake = this.cameraShakeTrauma * this.cameraShakeTrauma * 0.15;
        this.camera.position.x = this.camPos.x + (Math.random() - 0.5) * shake;
        this.camera.position.y = this.camPos.y + (Math.random() - 0.5) * shake;
        this.camera.position.z = this.camPos.z + (Math.random() - 0.5) * shake;
      } else {
        this.camera.position.copy(this.camPos);
      }
      this.camera.lookAt(this.camTarget);

      // Render
      this.renderer.render(this.scene, this.camera);

      // Skill pacing for software WebGL vs GPU
      if (this.isSoftwareGl) {
        this.afterDraw(() => {
          this.animFrameId = requestAnimationFrame(tick);
        });
      } else {
        this.animFrameId = requestAnimationFrame(tick);
      }
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  // WebGL fence sync for software render pacing
  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.isDisposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        window.setTimeout(cb, 60);
      }
    };
    window.setTimeout(poll, 5);
  }

  private onResize = () => {
    if (!this.container || this.isDisposed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public dispose() {
    this.isDisposed = true;
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this.onResize);
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointermove', this.onPointerMove);
    canvas.removeEventListener('pointerdown', this.onPointerDown);
    canvas.removeEventListener('pointerup', this.onPointerUp);
    canvas.removeEventListener('pointerleave', this.onPointerUp);
    this.renderer.dispose();
  }
}
