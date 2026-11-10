/**
 * 3D Procedural Davi Lucas Character Rig for Talking Davi Lucas.
 * Built with Three.js composite geometry groups, rich PBR materials,
 * articulated facial expressions, outfits, and props.
 */

import * as THREE from 'three';
import {
  createIrisTexture,
  createHoodieTexture,
  createContactShadowTexture,
  createPizzaTexture
} from './textures';

export type CharacterExpression = 'neutral' | 'happy' | 'dizzy' | 'surprised' | 'angry' | 'sleepy';
export type WardrobeHat = 'none' | 'snapback' | 'crown' | 'beanie' | 'cyber' | 'bunny';
export type WardrobeGlasses = 'none' | 'thug' | 'goggles' | 'heart';
export type ActiveProp = 'none' | 'pizza' | 'chili' | 'boba' | 'guitar' | 'mic';

export class DaviCharacter {
  public group: THREE.Group;

  // Hierarchical nodes
  public root: THREE.Group;
  public hips: THREE.Group;
  public torso: THREE.Group;
  public headGroup: THREE.Group;
  public leftArm: THREE.Group;
  public rightArm: THREE.Group;
  public leftForearm: THREE.Group;
  public rightForearm: THREE.Group;
  public leftHand: THREE.Group;
  public rightHand: THREE.Group;
  public leftLeg: THREE.Group;
  public rightLeg: THREE.Group;
  public leftFoot: THREE.Group;
  public rightFoot: THREE.Group;

  // Face articulation
  public jaw: THREE.Group;
  public leftEye: THREE.Group;
  public rightEye: THREE.Group;
  public leftEyelid: THREE.Mesh;
  public rightEyelid: THREE.Mesh;
  public leftEyebrow: THREE.Mesh;
  public rightEyebrow: THREE.Mesh;
  public leftCheek: THREE.Mesh;
  public rightCheek: THREE.Mesh;

  // Materials for color changes / expressions
  private skinMaterial: THREE.MeshStandardMaterial;
  private hoodieMaterial: THREE.MeshStandardMaterial;
  private pantsMaterial: THREE.MeshStandardMaterial;
  private cheekMaterial: THREE.MeshStandardMaterial;

  // Attached wardrobe & props
  public hats: Record<WardrobeHat, THREE.Object3D | null>;
  public glasses: Record<WardrobeGlasses, THREE.Object3D | null>;
  public props: Record<ActiveProp, THREE.Object3D | null>;

  public currentHat: WardrobeHat = 'snapback';
  public currentGlasses: WardrobeGlasses = 'none';
  public currentProp: ActiveProp = 'none';

  // Animation states & timers
  public state: 'idle' | 'talking' | 'slapped' | 'tickled' | 'eating' | 'fire' | 'guitar' | 'disco' | 'fart' | 'sleeping' = 'idle';
  private stateTimer: number = 0;
  private idleTime: number = 0;
  private blinkTimer: number = 2.5;
  private currentBlink: number = 0;
  private targetJaw: number = 0;
  private currentJaw: number = 0;
  private expression: CharacterExpression = 'neutral';

  // Target look direction
  private lookTarget = new THREE.Vector2(0, 0);
  private currentLook = new THREE.Vector2(0, 0);

  // Recoil & physics shake
  public recoilRot = new THREE.Vector3(0, 0, 0);
  public squashScale = new THREE.Vector3(1, 1, 1);

  // Hitbox collision proxies for raycasting
  public hitHead: THREE.Mesh;
  public hitBelly: THREE.Mesh;
  public hitFeet: THREE.Mesh;

  constructor() {
    this.group = new THREE.Group();
    this.root = new THREE.Group();
    this.group.add(this.root);

    // 1. Materials
    this.skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xe0a97c, // Warm tan skin
      roughness: 0.62,
      metalness: 0.04,
    });

    this.hoodieMaterial = new THREE.MeshStandardMaterial({
      map: createHoodieTexture('#2563eb'), // Royal blue streetwear
      roughness: 0.85,
      metalness: 0.05,
    });

    this.pantsMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Dark navy streetwear joggers
      roughness: 0.8,
      metalness: 0.08,
    });

    this.cheekMaterial = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      roughness: 0.9,
      transparent: true,
      opacity: 0.25,
    });

    // 2. Ground Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(2.4, 2.4);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: createContactShadowTexture(),
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.01;
    this.root.add(shadowPlane);

    // 3. Legs & Sneakers
    this.hips = new THREE.Group();
    this.hips.position.y = 1.35;
    this.root.add(this.hips);

    const legGeo = new THREE.CylinderGeometry(0.16, 0.14, 0.9, 16);
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.35, -0.45, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, this.pantsMaterial);
    leftLegMesh.castShadow = true;
    this.leftLeg.add(leftLegMesh);
    this.hips.add(this.leftLeg);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.35, -0.45, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, this.pantsMaterial);
    rightLegMesh.castShadow = true;
    this.rightLeg.add(rightLegMesh);
    this.hips.add(this.rightLeg);

    // Sneakers (Cool high-top street kicks)
    this.leftFoot = this.createSneaker();
    this.leftFoot.position.set(-0.35, -0.9, 0.1);
    this.hips.add(this.leftFoot);

    this.rightFoot = this.createSneaker();
    this.rightFoot.position.set(0.35, -0.9, 0.1);
    this.hips.add(this.rightFoot);

    // 4. Torso & Hoodie
    this.torso = new THREE.Group();
    this.torso.position.y = 0.45;
    this.hips.add(this.torso);

    // Main hoodie body (rounded tapered capsule)
    const torsoGeo = new THREE.CylinderGeometry(0.55, 0.48, 1.05, 24);
    const torsoMesh = new THREE.Mesh(torsoGeo, this.hoodieMaterial);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    this.torso.add(torsoMesh);

    // Kangaroo pocket
    const pocketGeo = new THREE.BoxGeometry(0.52, 0.32, 0.22);
    const pocketMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.88,
    });
    const pocketMesh = new THREE.Mesh(pocketGeo, pocketMat);
    pocketMesh.position.set(0, -0.2, 0.46);
    pocketMesh.rotation.x = -0.08;
    this.torso.add(pocketMesh);

    // Gold Chain Necklace (Accent detail)
    const chainGeo = new THREE.TorusGeometry(0.36, 0.05, 12, 32);
    const chainMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Polished gold
      roughness: 0.22,
      metalness: 0.92,
    });
    const chainMesh = new THREE.Mesh(chainGeo, chainMat);
    chainMesh.position.set(0, 0.44, 0.18);
    chainMesh.rotation.x = Math.PI / 3;
    this.torso.add(chainMesh);

    // 5. Arms & Hands
    const armGeo = new THREE.CylinderGeometry(0.14, 0.12, 0.65, 16);
    armGeo.translate(0, -0.3, 0);

    // Left Arm
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.68, 0.38, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, this.hoodieMaterial);
    leftArmMesh.castShadow = true;
    this.leftArm.add(leftArmMesh);
    this.torso.add(this.leftArm);

    this.leftForearm = new THREE.Group();
    this.leftForearm.position.set(0, -0.6, 0);
    this.leftArm.add(this.leftForearm);

    this.leftHand = this.createCartoonHand();
    this.leftHand.position.set(0, -0.15, 0);
    this.leftForearm.add(this.leftHand);

    // Right Arm
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.68, 0.38, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, this.hoodieMaterial);
    rightArmMesh.castShadow = true;
    this.rightArm.add(rightArmMesh);
    this.torso.add(this.rightArm);

    this.rightForearm = new THREE.Group();
    this.rightForearm.position.set(0, -0.6, 0);
    this.rightArm.add(this.rightForearm);

    this.rightHand = this.createCartoonHand();
    this.rightHand.position.set(0, -0.15, 0);
    this.rightForearm.add(this.rightHand);

    // 6. Head Group & Facial Expression
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.78, 0);
    this.torso.add(this.headGroup);

    // Stylized Head Mesh
    const headGeo = new THREE.SphereGeometry(0.62, 32, 28);
    headGeo.scale(1.0, 1.15, 1.05);
    const headMesh = new THREE.Mesh(headGeo, this.skinMaterial);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    this.headGroup.add(headMesh);

    // Textured Fade / Curly Hair
    const hairGeo = new THREE.SphereGeometry(0.66, 24, 20);
    hairGeo.scale(1.04, 1.12, 1.05);
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917, // Jet black hair
      roughness: 0.95,
      metalness: 0.05,
    });
    const hairMesh = new THREE.Mesh(hairGeo, hairMat);
    hairMesh.position.set(0, 0.16, -0.06);
    this.headGroup.add(hairMesh);

    // Hair top textured curls
    for (let i = 0; i < 18; i++) {
      const curlGeo = new THREE.DodecahedronGeometry(0.12);
      const curl = new THREE.Mesh(curlGeo, hairMat);
      const angle = (i / 18) * Math.PI * 2;
      const rad = 0.35 + Math.random() * 0.15;
      curl.position.set(Math.cos(angle) * rad, 0.68 + Math.random() * 0.08, Math.sin(angle) * rad * 0.8 - 0.05);
      this.headGroup.add(curl);
    }

    // Ears
    const earGeo = new THREE.SphereGeometry(0.15, 16, 12);
    earGeo.scale(0.4, 0.9, 0.7);
    const leftEar = new THREE.Mesh(earGeo, this.skinMaterial);
    leftEar.position.set(-0.62, 0.0, 0);
    this.headGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, this.skinMaterial);
    rightEar.position.set(0.62, 0.0, 0);
    this.headGroup.add(rightEar);

    // Eyes
    const irisTex = createIrisTexture();
    const eyeGeo = new THREE.SphereGeometry(0.18, 24, 20);
    const eyeMat = new THREE.MeshStandardMaterial({
      map: irisTex,
      roughness: 0.15,
      metalness: 0.1,
    });

    this.leftEye = new THREE.Group();
    this.leftEye.position.set(-0.24, 0.12, 0.52);
    const leftEyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
    leftEyeMesh.rotation.y = -Math.PI / 2; // Orient texture towards front
    this.leftEye.add(leftEyeMesh);
    this.headGroup.add(this.leftEye);

    this.rightEye = new THREE.Group();
    this.rightEye.position.set(0.24, 0.12, 0.52);
    const rightEyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
    rightEyeMesh.rotation.y = -Math.PI / 2;
    this.rightEye.add(rightEyeMesh);
    this.headGroup.add(this.rightEye);

    // Eyelids (Blinking mechanism)
    const eyelidGeo = new THREE.SphereGeometry(0.19, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const eyelidMat = new THREE.MeshStandardMaterial({
      color: 0xd9986b,
      roughness: 0.65,
    });
    this.leftEyelid = new THREE.Mesh(eyelidGeo, eyelidMat);
    this.leftEyelid.position.set(0, 0, 0);
    this.leftEyelid.rotation.x = -Math.PI * 0.5; // Starts retracted
    this.leftEye.add(this.leftEyelid);

    this.rightEyelid = new THREE.Mesh(eyelidGeo, eyelidMat);
    this.rightEyelid.position.set(0, 0, 0);
    this.rightEyelid.rotation.x = -Math.PI * 0.5;
    this.rightEye.add(this.rightEyelid);

    // Eyebrows
    const browGeo = new THREE.BoxGeometry(0.26, 0.06, 0.06);
    const browMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.9,
    });

    this.leftEyebrow = new THREE.Mesh(browGeo, browMat);
    this.leftEyebrow.position.set(-0.24, 0.34, 0.58);
    this.leftEyebrow.rotation.z = 0.08;
    this.headGroup.add(this.leftEyebrow);

    this.rightEyebrow = new THREE.Mesh(browGeo, browMat);
    this.rightEyebrow.position.set(0.24, 0.34, 0.58);
    this.rightEyebrow.rotation.z = -0.08;
    this.headGroup.add(this.rightEyebrow);

    // Cheeks
    const cheekGeo = new THREE.CircleGeometry(0.1, 16);
    this.leftCheek = new THREE.Mesh(cheekGeo, this.cheekMaterial);
    this.leftCheek.position.set(-0.38, -0.08, 0.54);
    this.leftCheek.rotation.y = -0.4;
    this.headGroup.add(this.leftCheek);

    this.rightCheek = new THREE.Mesh(cheekGeo, this.cheekMaterial);
    this.rightCheek.position.set(0.38, -0.08, 0.54);
    this.rightCheek.rotation.y = 0.4;
    this.headGroup.add(this.rightCheek);

    // Cute stylized nose
    const noseGeo = new THREE.SphereGeometry(0.09, 16, 12);
    noseGeo.scale(1.0, 0.8, 1.2);
    const noseMesh = new THREE.Mesh(noseGeo, this.skinMaterial);
    noseMesh.position.set(0, 0.02, 0.62);
    this.headGroup.add(noseMesh);

    // Mouth & Jaw Group (Pivot at back of mouth)
    this.jaw = new THREE.Group();
    this.jaw.position.set(0, -0.22, 0.48);
    this.headGroup.add(this.jaw);

    // Lower Lip / Chin
    const jawGeo = new THREE.SphereGeometry(0.18, 16, 12);
    jawGeo.scale(1.2, 0.6, 0.8);
    const jawMesh = new THREE.Mesh(jawGeo, this.skinMaterial);
    jawMesh.position.set(0, -0.05, 0.08);
    this.jaw.add(jawMesh);

    // Inside mouth cavity (dark pink)
    const mouthCavityGeo = new THREE.CylinderGeometry(0.18, 0.16, 0.14, 16);
    mouthCavityGeo.scale(1.4, 1, 0.6);
    const mouthCavityMat = new THREE.MeshBasicMaterial({ color: 0x881337 });
    const mouthCavity = new THREE.Mesh(mouthCavityGeo, mouthCavityMat);
    mouthCavity.position.set(0, 0, 0.02);
    this.jaw.add(mouthCavity);

    // Tongue
    const tongueGeo = new THREE.SphereGeometry(0.1, 12, 10);
    tongueGeo.scale(1.2, 0.5, 1.1);
    const tongueMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      roughness: 0.3,
    });
    const tongueMesh = new THREE.Mesh(tongueGeo, tongueMat);
    tongueMesh.position.set(0, -0.02, 0.06);
    this.jaw.add(tongueMesh);

    // White cartoon teeth
    const teethGeo = new THREE.BoxGeometry(0.24, 0.06, 0.08);
    const teethMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
    });
    const upperTeeth = new THREE.Mesh(teethGeo, teethMat);
    upperTeeth.position.set(0, 0.05, 0.08);
    this.jaw.add(upperTeeth);

    // 7. Raycasting Hit Proxies
    const hitBoxMat = new THREE.MeshBasicMaterial({ visible: false });

    // Head hitbox
    this.hitHead = new THREE.Mesh(new THREE.SphereGeometry(0.72, 8, 8), hitBoxMat);
    this.hitHead.name = 'hitbox_head';
    this.hitHead.position.set(0, 0.1, 0);
    this.headGroup.add(this.hitHead);

    // Belly hitbox
    this.hitBelly = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.6, 0.9, 8), hitBoxMat);
    this.hitBelly.name = 'hitbox_belly';
    this.hitBelly.position.set(0, 0, 0);
    this.torso.add(this.hitBelly);

    // Feet hitbox
    this.hitFeet = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.8), hitBoxMat);
    this.hitFeet.name = 'hitbox_feet';
    this.hitFeet.position.set(0, -0.75, 0.1);
    this.hips.add(this.hitFeet);

    // 8. Build Wardrobe Accessories & Props
    this.hats = {
      none: null,
      snapback: this.buildSnapback(),
      crown: this.buildCrown(),
      beanie: this.buildBeanie(),
      cyber: this.buildCyberVisor(),
      bunny: this.buildBunnyEars(),
    };

    this.glasses = {
      none: null,
      thug: this.buildThugShades(),
      goggles: this.buildGoggles(),
      heart: this.buildHeartShades(),
    };

    this.props = {
      none: null,
      pizza: this.buildPizzaSlice(),
      chili: this.buildSpicyChili(),
      boba: this.buildBobaCup(),
      guitar: this.buildElectricGuitar(),
      mic: this.buildMicrophone(),
    };

    // Attach default accessories
    this.applyHat('snapback');
    this.applyGlasses('none');
    this.applyProp('none');
  }

  // --- Accessory Builders ---

  private createSneaker(): THREE.Group {
    const sneaker = new THREE.Group();
    // Rubber sole
    const soleGeo = new THREE.BoxGeometry(0.34, 0.1, 0.65);
    const soleMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.35,
    });
    const soleMesh = new THREE.Mesh(soleGeo, soleMat);
    soleMesh.position.y = 0.05;
    sneaker.add(soleMesh);

    // Upper sneaker body
    const upperGeo = new THREE.BoxGeometry(0.32, 0.22, 0.56);
    const upperMat = new THREE.MeshStandardMaterial({
      color: 0xef4444, // Red high-top accents
      roughness: 0.7,
    });
    const upperMesh = new THREE.Mesh(upperGeo, upperMat);
    upperMesh.position.set(0, 0.18, -0.02);
    sneaker.add(upperMesh);

    // White toe cap
    const toeGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.16, 16);
    toeGeo.scale(1, 0.8, 1);
    const toeMesh = new THREE.Mesh(toeGeo, soleMat);
    toeMesh.position.set(0, 0.12, 0.2);
    sneaker.add(toeMesh);

    return sneaker;
  }

  private createCartoonHand(): THREE.Group {
    const hand = new THREE.Group();
    // Palm
    const palmGeo = new THREE.SphereGeometry(0.16, 16, 12);
    palmGeo.scale(1, 0.7, 1);
    const palmMat = this.skinMaterial;
    const palmMesh = new THREE.Mesh(palmGeo, palmMat);
    palmMesh.castShadow = true;
    hand.add(palmMesh);

    // Thumb
    const thumbGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.14, 8);
    const thumbMesh = new THREE.Mesh(thumbGeo, palmMat);
    thumbMesh.position.set(0.12, 0.05, 0.05);
    thumbMesh.rotation.z = -0.6;
    hand.add(thumbMesh);

    // 3 cartoon chunky fingers
    [-0.08, 0, 0.08].forEach((xOffset) => {
      const fingerGeo = new THREE.CylinderGeometry(0.045, 0.04, 0.18, 8);
      const fingerMesh = new THREE.Mesh(fingerGeo, palmMat);
      fingerMesh.position.set(xOffset, -0.12, 0);
      hand.add(fingerMesh);
    });

    return hand;
  }

  private buildSnapback(): THREE.Group {
    const cap = new THREE.Group();
    cap.position.set(0, 0.42, -0.08);

    // Dome
    const domeGeo = new THREE.SphereGeometry(0.64, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const capMat = new THREE.MeshStandardMaterial({
      color: 0xef4444, // Red street cap
      roughness: 0.75,
    });
    const dome = new THREE.Mesh(domeGeo, capMat);
    cap.add(dome);

    // Flat Brim (Turned backwards or forwards)
    const brimGeo = new THREE.CylinderGeometry(0.68, 0.68, 0.04, 16, 1, false, 0, Math.PI * 0.9);
    const brimMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Dark flat brim
      roughness: 0.6,
    });
    const brim = new THREE.Mesh(brimGeo, brimMat);
    brim.rotation.x = 0.12;
    brim.position.set(0, 0.02, 0.2);
    cap.add(brim);

    // Front badge
    const badgeGeo = new THREE.BoxGeometry(0.24, 0.16, 0.03);
    const badgeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const badge = new THREE.Mesh(badgeGeo, badgeMat);
    badge.position.set(0, 0.22, 0.6);
    badge.rotation.x = -0.2;
    cap.add(badge);

    return cap;
  }

  private buildCrown(): THREE.Group {
    const crown = new THREE.Group();
    crown.position.set(0, 0.7, 0);

    const baseGeo = new THREE.CylinderGeometry(0.5, 0.45, 0.25, 6, 1, true);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.25,
      metalness: 0.9,
    });
    const baseMesh = new THREE.Mesh(baseGeo, goldMat);
    crown.add(baseMesh);

    // Crown spikes with red rubies
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const spikeGeo = new THREE.ConeGeometry(0.08, 0.28, 6);
      const spike = new THREE.Mesh(spikeGeo, goldMat);
      spike.position.set(Math.cos(angle) * 0.48, 0.22, Math.sin(angle) * 0.48);
      crown.add(spike);

      const rubyGeo = new THREE.SphereGeometry(0.05, 8, 8);
      const rubyMat = new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        roughness: 0.1,
        metalness: 0.3,
      });
      const ruby = new THREE.Mesh(rubyGeo, rubyMat);
      ruby.position.set(Math.cos(angle) * 0.48, 0.36, Math.sin(angle) * 0.48);
      crown.add(ruby);
    }

    return crown;
  }

  private buildBeanie(): THREE.Group {
    const beanie = new THREE.Group();
    beanie.position.set(0, 0.45, -0.04);
    const geo = new THREE.SphereGeometry(0.66, 20, 16);
    geo.scale(1, 1.25, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x10b981, // Emerald green knit
      roughness: 0.95,
    });
    const mesh = new THREE.Mesh(geo, mat);
    beanie.add(mesh);

    // Folded cuff
    const cuffGeo = new THREE.TorusGeometry(0.64, 0.08, 8, 24);
    const cuff = new THREE.Mesh(cuffGeo, mat);
    cuff.rotation.x = Math.PI / 2;
    beanie.add(cuff);

    return beanie;
  }

  private buildCyberVisor(): THREE.Group {
    const visor = new THREE.Group();
    visor.position.set(0, 0.14, 0.58);
    const geo = new THREE.BoxGeometry(0.78, 0.22, 0.14);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.6,
      roughness: 0.1,
      metalness: 0.8,
    });
    const mesh = new THREE.Mesh(geo, mat);
    visor.add(mesh);
    return visor;
  }

  private buildBunnyEars(): THREE.Group {
    const ears = new THREE.Group();
    ears.position.set(0, 0.72, 0);

    [-0.24, 0.24].forEach((x) => {
      const earGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.65, 12);
      earGeo.scale(1, 1, 0.4);
      const earMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
      const earMesh = new THREE.Mesh(earGeo, earMat);
      earMesh.position.set(x, 0.3, 0);
      earMesh.rotation.z = x * 0.2;
      ears.add(earMesh);

      // Pink inner ear
      const innerGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.55, 12);
      innerGeo.scale(1, 1, 0.2);
      const innerMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.8 });
      const innerMesh = new THREE.Mesh(innerGeo, innerMat);
      innerMesh.position.set(x, 0.3, 0.03);
      innerMesh.rotation.z = x * 0.2;
      ears.add(innerMesh);
    });

    return ears;
  }

  private buildThugShades(): THREE.Group {
    const shades = new THREE.Group();
    shades.position.set(0, 0.14, 0.58);

    const frameGeo = new THREE.BoxGeometry(0.82, 0.18, 0.08);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.15,
      metalness: 0.8,
    });
    const frame = new THREE.Mesh(frameGeo, mat);
    shades.add(frame);

    // Pixel glints on lens
    const glintGeo = new THREE.BoxGeometry(0.12, 0.05, 0.02);
    const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const g1 = new THREE.Mesh(glintGeo, glintMat);
    g1.position.set(-0.25, 0.04, 0.05);
    shades.add(g1);
    const g2 = new THREE.Mesh(glintGeo, glintMat);
    g2.position.set(0.15, 0.04, 0.05);
    shades.add(g2);

    return shades;
  }

  private buildGoggles(): THREE.Group {
    const goggles = new THREE.Group();
    goggles.position.set(0, 0.14, 0.58);
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.3,
      metalness: 0.85,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.1,
    });

    [-0.22, 0.22].forEach((x) => {
      const rimGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.1, 16);
      rimGeo.rotateX(Math.PI / 2);
      const rim = new THREE.Mesh(rimGeo, brassMat);
      rim.position.set(x, 0, 0);
      goggles.add(rim);

      const glassGeo = new THREE.CircleGeometry(0.14, 16);
      const glass = new THREE.Mesh(glassGeo, glassMat);
      glass.position.set(x, 0, 0.06);
      goggles.add(glass);
    });

    return goggles;
  }

  private buildHeartShades(): THREE.Group {
    const shades = new THREE.Group();
    shades.position.set(0, 0.14, 0.58);
    const pinkMat = new THREE.MeshStandardMaterial({
      color: 0xec4899,
      roughness: 0.2,
      metalness: 0.4,
    });

    [-0.22, 0.22].forEach((x) => {
      const lensGeo = new THREE.BoxGeometry(0.24, 0.22, 0.06);
      const lens = new THREE.Mesh(lensGeo, pinkMat);
      lens.position.set(x, 0, 0);
      lens.rotation.z = Math.PI / 4;
      shades.add(lens);
    });

    return shades;
  }

  private buildPizzaSlice(): THREE.Group {
    const pizza = new THREE.Group();
    const pizzaTex = createPizzaTexture();
    const geo = new THREE.CylinderGeometry(0.45, 0.45, 0.05, 12, 1, false, 0, Math.PI / 3);
    const mat = new THREE.MeshStandardMaterial({
      map: pizzaTex,
      roughness: 0.6,
    });
    const slice = new THREE.Mesh(geo, mat);
    slice.rotation.x = Math.PI / 2;
    pizza.add(slice);
    return pizza;
  }

  private buildSpicyChili(): THREE.Group {
    const chili = new THREE.Group();
    const bodyGeo = new THREE.ConeGeometry(0.12, 0.55, 12);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626, // Flaming red
      roughness: 0.3,
      metalness: 0.1,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.z = Math.PI * 0.85;
    chili.add(body);

    const stemGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.14, 8);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x15803d });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.set(0, 0.3, 0);
    chili.add(stem);

    return chili;
  }

  private buildBobaCup(): THREE.Group {
    const boba = new THREE.Group();
    const cupGeo = new THREE.CylinderGeometry(0.16, 0.12, 0.45, 16);
    const cupMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Milk tea
      roughness: 0.25,
      metalness: 0.1,
    });
    const cup = new THREE.Mesh(cupGeo, cupMat);
    boba.add(cup);

    // Straw
    const strawGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8);
    const strawMat = new THREE.MeshStandardMaterial({ color: 0xa855f7 });
    const straw = new THREE.Mesh(strawGeo, strawMat);
    straw.position.set(0.04, 0.22, 0);
    straw.rotation.z = 0.25;
    boba.add(straw);

    return boba;
  }

  private buildElectricGuitar(): THREE.Group {
    const guitar = new THREE.Group();
    const bodyGeo = new THREE.BoxGeometry(0.55, 0.8, 0.1);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x9333ea, // Neon Purple Axe
      roughness: 0.3,
      metalness: 0.6,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    guitar.add(body);

    // Neck
    const neckGeo = new THREE.BoxGeometry(0.12, 1.1, 0.06);
    const neckMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.5 });
    const neck = new THREE.Mesh(neckGeo, neckMat);
    neck.position.set(0, 0.8, 0);
    guitar.add(neck);

    // Headstock
    const headGeo = new THREE.BoxGeometry(0.16, 0.25, 0.06);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.set(0, 1.4, 0);
    guitar.add(head);

    guitar.scale.set(0.7, 0.7, 0.7);
    return guitar;
  }

  private buildMicrophone(): THREE.Group {
    const mic = new THREE.Group();
    const handleGeo = new THREE.CylinderGeometry(0.04, 0.03, 0.3, 12);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    mic.add(handle);

    const headGeo = new THREE.SphereGeometry(0.08, 12, 10);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.2,
      metalness: 0.9,
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0.18;
    mic.add(head);

    return mic;
  }

  // --- Wardrobe / Prop Management ---

  public applyHat(hat: WardrobeHat) {
    if (this.hats[this.currentHat]) {
      this.headGroup.remove(this.hats[this.currentHat]!);
    }
    this.currentHat = hat;
    if (this.hats[hat]) {
      this.headGroup.add(this.hats[hat]!);
    }
  }

  public applyGlasses(glasses: WardrobeGlasses) {
    if (this.glasses[this.currentGlasses]) {
      this.headGroup.remove(this.glasses[this.currentGlasses]!);
    }
    this.currentGlasses = glasses;
    if (this.glasses[glasses]) {
      this.headGroup.add(this.glasses[glasses]!);
    }
  }

  public applyProp(prop: ActiveProp) {
    if (this.props[this.currentProp]) {
      this.rightHand.remove(this.props[this.currentProp]!);
    }
    this.currentProp = prop;
    if (this.props[prop]) {
      this.props[prop]!.position.set(0, -0.2, 0.2);
      this.rightHand.add(this.props[prop]!);
    }
  }

  public setHoodieColor(hex: string) {
    this.hoodieMaterial.map = createHoodieTexture(hex);
    this.hoodieMaterial.needsUpdate = true;
  }

  // --- Articulation & Expressions ---

  public setLookAt(normX: number, normY: number) {
    this.lookTarget.set(normX, normY);
  }

  public setExpression(expr: CharacterExpression) {
    this.expression = expr;
    if (expr === 'happy') {
      this.leftEyebrow.rotation.z = 0.25;
      this.rightEyebrow.rotation.z = -0.25;
      this.leftEyebrow.position.y = 0.38;
      this.rightEyebrow.position.y = 0.38;
      this.cheekMaterial.opacity = 0.6;
    } else if (expr === 'surprised') {
      this.leftEyebrow.rotation.z = 0.1;
      this.rightEyebrow.rotation.z = -0.1;
      this.leftEyebrow.position.y = 0.44;
      this.rightEyebrow.position.y = 0.44;
      this.targetJaw = 0.8;
    } else if (expr === 'dizzy') {
      this.leftEyebrow.rotation.z = -0.3;
      this.rightEyebrow.rotation.z = 0.3;
      this.cheekMaterial.opacity = 0.8;
    } else if (expr === 'sleepy') {
      this.leftEyebrow.rotation.z = -0.15;
      this.rightEyebrow.rotation.z = 0.15;
      this.cheekMaterial.opacity = 0.2;
    } else {
      this.leftEyebrow.rotation.z = 0.08;
      this.rightEyebrow.rotation.z = -0.08;
      this.leftEyebrow.position.y = 0.34;
      this.rightEyebrow.position.y = 0.34;
      this.cheekMaterial.opacity = 0.25;
    }
  }

  public setJaw(amount: number) {
    this.targetJaw = Math.max(0, Math.min(1, amount));
  }

  // --- Interactive Actions ---

  public triggerSlap() {
    this.state = 'slapped';
    this.stateTimer = 1.4;
    this.setExpression('dizzy');
    this.recoilRot.set(-0.35, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.5);
    this.squashScale.set(1.2, 0.75, 1.1);
  }

  public triggerBellyPoke() {
    this.state = 'tickled';
    this.stateTimer = 1.2;
    this.setExpression('happy');
    this.squashScale.set(1.25, 0.7, 1.25);
  }

  public triggerFootTickle() {
    this.state = 'tickled';
    this.stateTimer = 1.0;
    this.setExpression('happy');
    this.hips.position.y = 1.7; // Hop!
  }

  public triggerEat(food: ActiveProp) {
    this.state = 'eating';
    this.stateTimer = 2.2;
    this.applyProp(food);
    this.setExpression('happy');
  }

  public triggerFireBreath() {
    this.state = 'fire';
    this.stateTimer = 2.0;
    this.setExpression('surprised');
    this.targetJaw = 1.0;
  }

  public triggerGuitarShred() {
    this.state = 'guitar';
    this.stateTimer = 3.5;
    this.applyProp('guitar');
    this.setExpression('happy');
  }

  public triggerDiscoDance() {
    this.state = 'disco';
    this.stateTimer = 4.0;
    this.setExpression('happy');
  }

  public triggerFart() {
    this.state = 'fart';
    this.stateTimer = 1.8;
  }

  public triggerSleep(enable: boolean) {
    if (enable) {
      this.state = 'sleeping';
      this.setExpression('sleepy');
    } else if (this.state === 'sleeping') {
      this.state = 'idle';
      this.setExpression('neutral');
    }
  }

  // --- Animation Update Loop ---

  public update(dt: number, speechAmp: number = 0) {
    this.idleTime += dt;

    // Jaw interpolation & speech sync
    if (this.state === 'talking' || speechAmp > 0.05) {
      const speechJaw = Math.min(1.0, speechAmp * 2.8 + Math.sin(this.idleTime * 22) * 0.2);
      this.currentJaw = THREE.MathUtils.damp(this.currentJaw, speechJaw, 18, dt);
    } else {
      this.currentJaw = THREE.MathUtils.damp(this.currentJaw, this.targetJaw, 12, dt);
    }
    this.jaw.rotation.x = this.currentJaw * 0.55;

    // Smooth Look-at damping
    this.currentLook.x = THREE.MathUtils.damp(this.currentLook.x, this.lookTarget.x, 6, dt);
    this.currentLook.y = THREE.MathUtils.damp(this.currentLook.y, this.lookTarget.y, 6, dt);

    // Blinking
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) {
      this.blinkTimer = 2.2 + Math.random() * 2.5;
      this.currentBlink = 1.0;
    }
    this.currentBlink = THREE.MathUtils.damp(this.currentBlink, 0, 14, dt);
    const blinkRot = (this.state === 'sleeping') ? 0 : (-Math.PI * 0.5 + this.currentBlink * Math.PI * 0.5);
    this.leftEyelid.rotation.x = blinkRot;
    this.rightEyelid.rotation.x = blinkRot;

    // Recoil recovery
    this.recoilRot.x = THREE.MathUtils.damp(this.recoilRot.x, 0, 8, dt);
    this.recoilRot.y = THREE.MathUtils.damp(this.recoilRot.y, 0, 8, dt);
    this.recoilRot.z = THREE.MathUtils.damp(this.recoilRot.z, 0, 8, dt);

    this.squashScale.x = THREE.MathUtils.damp(this.squashScale.x, 1, 10, dt);
    this.squashScale.y = THREE.MathUtils.damp(this.squashScale.y, 1, 10, dt);
    this.squashScale.z = THREE.MathUtils.damp(this.squashScale.z, 1, 10, dt);
    this.torso.scale.copy(this.squashScale);

    // State machine updates
    if (this.stateTimer > 0) {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        if (this.state === 'eating' || this.state === 'guitar') {
          this.applyProp('none');
        }
        this.state = 'idle';
        this.setExpression('neutral');
        this.targetJaw = 0;
      }
    }

    // Specific state kinematics
    if (this.state === 'idle') {
      // Gentle natural breathing
      const breathe = Math.sin(this.idleTime * 2.2);
      this.hips.position.y = 1.35 + breathe * 0.02;
      this.torso.position.y = 0.45 + breathe * 0.015;

      // Head tracking cursor
      this.headGroup.rotation.y = this.currentLook.x * 0.4 + this.recoilRot.y;
      this.headGroup.rotation.x = -this.currentLook.y * 0.3 + this.recoilRot.x;
      this.headGroup.rotation.z = this.recoilRot.z;

      // Arms resting casually
      this.leftArm.rotation.z = 0.2 + Math.sin(this.idleTime * 2.2) * 0.05;
      this.rightArm.rotation.z = -0.2 - Math.sin(this.idleTime * 2.2) * 0.05;
      this.leftArm.rotation.x = 0;
      this.rightArm.rotation.x = 0;
    } else if (this.state === 'talking') {
      // Animated speaking gestures
      this.headGroup.rotation.y = this.currentLook.x * 0.3 + Math.sin(this.idleTime * 8) * 0.08;
      this.headGroup.rotation.x = Math.sin(this.idleTime * 6) * 0.08;
      this.leftArm.rotation.x = 0.3 + Math.sin(this.idleTime * 10) * 0.2;
      this.rightArm.rotation.x = 0.4 + Math.cos(this.idleTime * 9) * 0.2;
    } else if (this.state === 'slapped') {
      // Slapped reaction: head snaps and wobbles
      this.headGroup.rotation.x = this.recoilRot.x;
      this.headGroup.rotation.y = this.recoilRot.y + Math.sin(this.idleTime * 25) * 0.2;
      this.headGroup.rotation.z = this.recoilRot.z;
      this.leftArm.rotation.z = 0.8;
      this.rightArm.rotation.z = -0.8;
    } else if (this.state === 'tickled') {
      // Giggling belly shake
      const wiggle = Math.sin(this.idleTime * 28) * 0.15;
      this.torso.rotation.z = wiggle;
      this.headGroup.rotation.z = -wiggle * 0.8;
      this.leftArm.rotation.z = 0.7 + wiggle;
      this.rightArm.rotation.z = -0.7 - wiggle;
      this.hips.position.y = THREE.MathUtils.damp(this.hips.position.y, 1.35, 12, dt);
    } else if (this.state === 'eating') {
      // Hand brings food to mouth
      this.rightArm.rotation.x = 1.3 + Math.sin(this.idleTime * 12) * 0.15;
      this.rightArm.rotation.z = -0.5;
      this.targetJaw = (Math.sin(this.idleTime * 14) > 0) ? 0.6 : 0.05;
    } else if (this.state === 'fire') {
      // Roaring fire posture
      this.headGroup.rotation.x = -0.25;
      this.leftArm.rotation.x = 0.8;
      this.rightArm.rotation.x = 0.8;
      this.torso.position.z = -0.1;
    } else if (this.state === 'guitar') {
      // Rock solo shredding
      this.leftArm.rotation.x = 0.8 + Math.sin(this.idleTime * 14) * 0.1;
      this.rightArm.rotation.x = 0.9 + Math.cos(this.idleTime * 26) * 0.3; // Strumming fast
      this.headGroup.rotation.x = Math.sin(this.idleTime * 12) * 0.3; // Headbanging
      this.hips.position.y = 1.35 + Math.abs(Math.sin(this.idleTime * 8)) * 0.1;
    } else if (this.state === 'disco') {
      // Groovy disco dance
      const beat = Math.sin(this.idleTime * 7);
      this.hips.position.y = 1.35 + Math.abs(beat) * 0.15;
      this.hips.rotation.y = Math.sin(this.idleTime * 3.5) * 0.4;
      this.leftArm.rotation.x = 1.5 + beat * 0.6;
      this.rightArm.rotation.z = -1.2 + beat * 0.5;
      this.headGroup.rotation.y = -Math.sin(this.idleTime * 3.5) * 0.3;
    } else if (this.state === 'fart') {
      // Turn around to fart
      this.root.rotation.y = THREE.MathUtils.damp(this.root.rotation.y, Math.PI * 0.75, 8, dt);
      this.torso.position.y = 0.38;
    } else if (this.state === 'sleeping') {
      // Slumped sleep posture
      this.headGroup.rotation.x = 0.4;
      this.headGroup.rotation.z = 0.2;
      this.torso.position.y = 0.38 + Math.sin(this.idleTime * 1.2) * 0.02;
    }

    if (this.state !== 'fart') {
      this.root.rotation.y = THREE.MathUtils.damp(this.root.rotation.y, 0, 8, dt);
    }
  }
}
