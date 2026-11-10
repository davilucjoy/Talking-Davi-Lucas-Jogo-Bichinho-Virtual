/**
 * Lucas Sky Jump - Arcade Bouncy Mini-Game for Talking Davi Lucas.
 * 60fps isolated Canvas simulation with responsive inputs, spring physics, and coin scoring.
 */

import { soundEngine } from './audio';

export interface MiniGameResult {
  score: number;
  coinsEarned: number;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'normal' | 'spring' | 'moving';
  dx: number;
}

interface Item {
  x: number;
  y: number;
  type: 'coin' | 'pizza';
  collected: boolean;
}

export class SkyJumpGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animId: number = 0;
  private isRunning: boolean = false;

  // Player state
  private playerX: number = 200;
  private playerY: number = 400;
  private playerVx: number = 0;
  private playerVy: number = 0;
  private readonly gravity: number = 1100;
  private readonly jumpForce: number = -620;
  private readonly springForce: number = -950;

  // Camera & world
  private cameraY: number = 0;
  private platforms: Platform[] = [];
  private items: Item[] = [];
  private score: number = 0;
  private coins: number = 0;
  private maxScore: number = 0;

  // Input
  private keys: { left: boolean; right: boolean } = { left: false, right: false };

  // Callbacks
  private onGameOver: (result: MiniGameResult) => void;

  constructor(canvas: HTMLCanvasElement, onGameOver: (result: MiniGameResult) => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onGameOver = onGameOver;
    this.initWorld();
    this.bindInputs();
  }

  private initWorld() {
    this.playerX = this.canvas.width / 2;
    this.playerY = this.canvas.height - 120;
    this.playerVx = 0;
    this.playerVy = this.jumpForce;
    this.cameraY = 0;
    this.score = 0;
    this.coins = 0;
    this.maxScore = 0;

    this.platforms = [];
    this.items = [];

    // Starting base platform
    this.platforms.push({
      x: this.canvas.width / 2 - 50,
      y: this.canvas.height - 60,
      width: 100,
      height: 14,
      type: 'normal',
      dx: 0,
    });

    // Generate upward platforms
    let currentY = this.canvas.height - 130;
    for (let i = 0; i < 40; i++) {
      this.generatePlatform(currentY);
      currentY -= 65 + Math.random() * 35;
    }
  }

  private generatePlatform(y: number) {
    const width = 75 + Math.random() * 30;
    const x = Math.random() * (this.canvas.width - width);
    const rand = Math.random();
    let type: 'normal' | 'spring' | 'moving' = 'normal';
    let dx = 0;

    if (rand < 0.2) {
      type = 'spring';
    } else if (rand < 0.45) {
      type = 'moving';
      dx = (Math.random() > 0.5 ? 1 : -1) * (60 + Math.random() * 60);
    }

    this.platforms.push({ x, y, width, height: 14, type, dx });

    // 40% chance of spawning coin or pizza
    if (Math.random() < 0.4) {
      this.items.push({
        x: x + width / 2,
        y: y - 24,
        type: Math.random() < 0.3 ? 'pizza' : 'coin',
        collected: false,
      });
    }
  }

  private bindInputs() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  public setTouchMove(direction: 'left' | 'right' | 'none') {
    if (direction === 'left') {
      this.keys.left = true;
      this.keys.right = false;
    } else if (direction === 'right') {
      this.keys.right = true;
      this.keys.left = false;
    } else {
      this.keys.left = false;
      this.keys.right = false;
    }
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
  };

  public start() {
    this.isRunning = true;
    let lastTime = performance.now();

    const loop = (time: number) => {
      if (!this.isRunning) return;
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      this.update(dt);
      this.render();

      this.animId = requestAnimationFrame(loop);
    };

    this.animId = requestAnimationFrame(loop);
  }

  public stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animId);
  }

  private update(dt: number) {
    // Horizontal physics
    const accel = 1800;
    const friction = 8;
    if (this.keys.left) {
      this.playerVx -= accel * dt;
    } else if (this.keys.right) {
      this.playerVx += accel * dt;
    } else {
      this.playerVx -= this.playerVx * friction * dt;
    }
    this.playerVx = Math.max(-360, Math.min(360, this.playerVx));
    this.playerX += this.playerVx * dt;

    // Screen wrap
    if (this.playerX < -20) this.playerX = this.canvas.width + 10;
    if (this.playerX > this.canvas.width + 20) this.playerX = -10;

    // Vertical physics
    this.playerVy += this.gravity * dt;
    this.playerY += this.playerVy * dt;

    // Camera follow upward
    const targetCamY = this.playerY - this.canvas.height * 0.55;
    if (targetCamY < this.cameraY) {
      this.cameraY = targetCamY;
      const currentHeightScore = Math.floor(-this.cameraY / 10);
      if (currentHeightScore > this.maxScore) {
        this.maxScore = currentHeightScore;
        this.score = this.maxScore;
      }
    }

    // Moving platforms
    for (const p of this.platforms) {
      if (p.type === 'moving') {
        p.x += p.dx * dt;
        if (p.x <= 0 || p.x + p.width >= this.canvas.width) {
          p.dx = -p.dx;
        }
      }
    }

    // Collision with platforms (only while falling)
    if (this.playerVy > 0) {
      const pRadius = 18;
      for (const p of this.platforms) {
        if (
          this.playerX + pRadius > p.x &&
          this.playerX - pRadius < p.x + p.width &&
          this.playerY + pRadius >= p.y &&
          this.playerY + pRadius <= p.y + p.height + 14
        ) {
          // Jump!
          if (p.type === 'spring') {
            this.playerVy = this.springForce;
            soundEngine.playBounce();
          } else {
            this.playerVy = this.jumpForce;
            soundEngine.playBounce();
          }
          break;
        }
      }
    }

    // Items collection
    for (const item of this.items) {
      if (!item.collected) {
        const dist = Math.hypot(this.playerX - item.x, this.playerY - item.y);
        if (dist < 32) {
          item.collected = true;
          if (item.type === 'coin') {
            this.coins += 5;
            soundEngine.playCoin();
          } else {
            this.coins += 15;
            soundEngine.playChomp();
          }
        }
      }
    }

    // Recycle and generate platforms above
    const highestPlatform = this.platforms.reduce((min, p) => Math.min(min, p.y), 99999);
    if (highestPlatform > this.cameraY - 200) {
      this.generatePlatform(highestPlatform - (65 + Math.random() * 35));
    }

    // Clean up platforms far below
    this.platforms = this.platforms.filter((p) => p.y < this.cameraY + this.canvas.height + 150);
    this.items = this.items.filter((item) => item.y < this.cameraY + this.canvas.height + 150);

    // Game Over check: fall below camera
    if (this.playerY > this.cameraY + this.canvas.height + 60) {
      this.stop();
      soundEngine.playGameOver();
      this.onGameOver({ score: this.score, coinsEarned: this.coins });
    }
  }

  private render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Sky gradient background
    const bgGrad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(1, '#1e293b');
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.translate(0, -this.cameraY);

    // Draw Platforms
    for (const p of this.platforms) {
      if (p.type === 'spring') {
        this.ctx.fillStyle = '#ec4899'; // Neon pink spring pad
        this.ctx.fillRect(p.x, p.y, p.width, p.height);
        // Spring coil icon
        this.ctx.fillStyle = '#fdf2f8';
        this.ctx.fillRect(p.x + p.width / 2 - 8, p.y - 6, 16, 6);
      } else if (p.type === 'moving') {
        this.ctx.fillStyle = '#06b6d4'; // Cyan moving platform
        this.ctx.fillRect(p.x, p.y, p.width, p.height);
      } else {
        this.ctx.fillStyle = '#22c55e'; // Green platform
        this.ctx.fillRect(p.x, p.y, p.width, p.height);
      }

      // Rounded edge highlights
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.fillRect(p.x, p.y, p.width, 3);
    }

    // Draw Items
    for (const item of this.items) {
      if (item.collected) continue;
      if (item.type === 'coin') {
        this.ctx.fillStyle = '#facc15';
        this.ctx.beginPath();
        this.ctx.arc(item.x, item.y, 10, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#eab308';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      } else {
        // Pizza slice
        this.ctx.fillStyle = '#ea580c';
        this.ctx.beginPath();
        this.ctx.moveTo(item.x, item.y - 12);
        this.ctx.lineTo(item.x + 12, item.y + 12);
        this.ctx.lineTo(item.x - 12, item.y + 12);
        this.ctx.closePath();
        this.ctx.fill();
      }
    }

    // Draw Davi Lucas Character Sprite
    const px = this.playerX;
    const py = this.playerY;

    // Body
    this.ctx.fillStyle = '#2563eb';
    this.ctx.beginPath();
    this.ctx.arc(px, py - 4, 16, 0, Math.PI * 2);
    this.ctx.fill();

    // Head
    this.ctx.fillStyle = '#e0a97c';
    this.ctx.beginPath();
    this.ctx.arc(px, py - 24, 14, 0, Math.PI * 2);
    this.ctx.fill();

    // Cap
    this.ctx.fillStyle = '#ef4444';
    this.ctx.beginPath();
    this.ctx.arc(px, py - 30, 14, Math.PI, 0);
    this.ctx.fill();
    this.ctx.fillRect(px - 16, py - 30, 32, 4);

    // Eyes
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(px - 5, py - 24, 4, 0, Math.PI * 2);
    this.ctx.arc(px + 5, py - 24, 4, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#0f172a';
    this.ctx.beginPath();
    this.ctx.arc(px - 4, py - 24, 2, 0, Math.PI * 2);
    this.ctx.arc(px + 6, py - 24, 2, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();

    // HUD overlays
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 20px monospace';
    this.ctx.fillText(`HEIGHT: ${this.score}m`, 20, 35);
    this.ctx.fillStyle = '#facc15';
    this.ctx.fillText(`🪙 COINS: ${this.coins}`, 20, 65);
  }

  public destroy() {
    this.stop();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
