/**
 * Snack Catcher - Arcade Falling Food Challenge for Talking Davi Lucas.
 * 45-second frenzy with combo streaks, hazard avoidance, and coin collection.
 */

import { soundEngine } from './audio';
import { MiniGameResult } from './skyJumpMiniGame';

interface FallingObject {
  x: number;
  y: number;
  speed: number;
  type: 'pizza' | 'burger' | 'boba' | 'gold_taco' | 'stinky_shoe' | 'bomb';
  radius: number;
}

export class SnackCatchGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animId: number = 0;
  private isRunning: boolean = false;

  private playerX: number = 200;
  private playerWidth: number = 70;
  private targetPlayerX: number = 200;

  private items: FallingObject[] = [];
  private spawnTimer: number = 0;
  private timeLeft: number = 45;
  private score: number = 0;
  private coins: number = 0;
  private combo: number = 0;
  private maxCombo: number = 0;

  private onGameOver: (result: MiniGameResult) => void;

  constructor(canvas: HTMLCanvasElement, onGameOver: (result: MiniGameResult) => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onGameOver = onGameOver;
    this.playerX = canvas.width / 2;
    this.targetPlayerX = canvas.width / 2;
    this.bindInputs();
  }

  private bindInputs() {
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('keydown', this.onKeyDown);
  }

  private onPointerMove = (e: PointerEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    this.targetPlayerX = ((e.clientX - rect.left) / rect.width) * this.canvas.width;
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      this.targetPlayerX = Math.max(35, this.targetPlayerX - 40);
    }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      this.targetPlayerX = Math.min(this.canvas.width - 35, this.targetPlayerX + 40);
    }
  };

  public setMoveDir(dir: 'left' | 'right') {
    if (dir === 'left') {
      this.targetPlayerX = Math.max(35, this.targetPlayerX - 45);
    } else {
      this.targetPlayerX = Math.min(this.canvas.width - 35, this.targetPlayerX + 45);
    }
  }

  public start() {
    this.isRunning = true;
    this.score = 0;
    this.coins = 0;
    this.combo = 0;
    this.timeLeft = 45;
    this.items = [];

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

  private spawnObject() {
    const rand = Math.random();
    let type: FallingObject['type'] = 'pizza';
    let speed = 180 + Math.random() * 120;

    if (rand < 0.35) {
      type = 'pizza';
    } else if (rand < 0.55) {
      type = 'burger';
    } else if (rand < 0.72) {
      type = 'boba';
    } else if (rand < 0.82) {
      type = 'gold_taco';
      speed += 80;
    } else if (rand < 0.93) {
      type = 'stinky_shoe';
    } else {
      type = 'bomb';
    }

    this.items.push({
      x: 30 + Math.random() * (this.canvas.width - 60),
      y: -20,
      speed,
      type,
      radius: 18,
    });
  }

  private update(dt: number) {
    // Timer
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.stop();
      soundEngine.playCoin();
      this.onGameOver({ score: this.score, coinsEarned: this.coins });
      return;
    }

    // Player position interpolation
    this.playerX += (this.targetPlayerX - this.playerX) * Math.min(1, dt * 14);

    // Spawn timer
    this.spawnTimer += dt;
    if (this.spawnTimer > 0.45) {
      this.spawnTimer = 0;
      this.spawnObject();
    }

    // Update items
    const catcherY = this.canvas.height - 50;

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.y += item.speed * dt;

      // Check catch
      if (item.y >= catcherY - 20 && item.y <= catcherY + 20) {
        if (Math.abs(item.x - this.playerX) < this.playerWidth / 2 + item.radius) {
          // Caught!
          if (item.type === 'stinky_shoe' || item.type === 'bomb') {
            soundEngine.playSlap();
            this.combo = 0;
            this.score = Math.max(0, this.score - 20);
          } else {
            this.combo++;
            if (this.combo > this.maxCombo) this.maxCombo = this.combo;
            soundEngine.playChomp();

            let pts = 10;
            if (item.type === 'burger') pts = 15;
            if (item.type === 'boba') pts = 20;
            if (item.type === 'gold_taco') {
              pts = 40;
              soundEngine.playCoin();
            }

            const multiplier = Math.min(4, 1 + Math.floor(this.combo / 5));
            this.score += pts * multiplier;
            this.coins += Math.ceil((pts * multiplier) / 5);
          }
          this.items.splice(i, 1);
          continue;
        }
      }

      // Offscreen
      if (item.y > this.canvas.height + 30) {
        if (item.type !== 'stinky_shoe' && item.type !== 'bomb') {
          this.combo = 0; // Dropped food breaks combo
        }
        this.items.splice(i, 1);
      }
    }
  }

  private render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Background
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(1, '#0f172a');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Falling Snacks
    for (const item of this.items) {
      this.ctx.save();
      this.ctx.translate(item.x, item.y);

      if (item.type === 'pizza') {
        this.ctx.fillStyle = '#f59e0b';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -14);
        this.ctx.lineTo(14, 14);
        this.ctx.lineTo(-14, 14);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.fillStyle = '#dc2626';
        this.ctx.beginPath();
        this.ctx.arc(0, 3, 4, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (item.type === 'burger') {
        this.ctx.fillStyle = '#d97706';
        this.ctx.beginPath();
        this.ctx.arc(0, -2, 14, Math.PI, 0);
        this.ctx.fill();
        this.ctx.fillStyle = '#16a34a';
        this.ctx.fillRect(-14, -2, 28, 4);
        this.ctx.fillStyle = '#78350f';
        this.ctx.fillRect(-14, 2, 28, 6);
        this.ctx.fillStyle = '#d97706';
        this.ctx.fillRect(-14, 8, 28, 5);
      } else if (item.type === 'boba') {
        this.ctx.fillStyle = '#d97706';
        this.ctx.fillRect(-8, -12, 16, 24);
        this.ctx.fillStyle = '#a855f7';
        this.ctx.fillRect(-2, -20, 4, 10);
      } else if (item.type === 'gold_taco') {
        this.ctx.fillStyle = '#facc15';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 16, Math.PI, 0);
        this.ctx.fill();
      } else if (item.type === 'stinky_shoe') {
        this.ctx.fillStyle = '#84cc16'; // Stinky green
        this.ctx.fillRect(-12, -4, 24, 12);
        this.ctx.fillRect(0, -12, 12, 8);
      } else if (item.type === 'bomb') {
        this.ctx.fillStyle = '#0f172a';
        this.ctx.beginPath();
        this.ctx.arc(0, 2, 12, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#ef4444';
        this.ctx.fillRect(-2, -14, 4, 6);
      }

      this.ctx.restore();
    }

    // Draw Davi Catcher Basket
    const px = this.playerX;
    const py = this.canvas.height - 45;

    // Basket / Davi's open mouth & hands
    this.ctx.fillStyle = '#2563eb';
    this.ctx.beginPath();
    this.ctx.roundRect(px - this.playerWidth / 2, py, this.playerWidth, 24, 8);
    this.ctx.fill();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 12px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('DAVI CATCH', px, py + 16);

    // Davi face peaking over basket
    this.ctx.fillStyle = '#e0a97c';
    this.ctx.beginPath();
    this.ctx.arc(px, py - 8, 16, Math.PI, 0);
    this.ctx.fill();

    // Eyes
    this.ctx.fillStyle = '#0f172a';
    this.ctx.beginPath();
    this.ctx.arc(px - 6, py - 12, 3, 0, Math.PI * 2);
    this.ctx.arc(px + 6, py - 12, 3, 0, Math.PI * 2);
    this.ctx.fill();

    // Top HUD
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 18px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`SCORE: ${this.score}`, 16, 30);
    this.ctx.fillStyle = '#facc15';
    this.ctx.fillText(`🪙 COINS: ${this.coins}`, 16, 55);

    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = this.timeLeft <= 10 ? '#ef4444' : '#38bdf8';
    this.ctx.fillText(`⏱️ ${Math.ceil(this.timeLeft)}s`, this.canvas.width - 16, 30);

    if (this.combo > 1) {
      this.ctx.fillStyle = '#ec4899';
      this.ctx.fillText(`🔥 ${this.combo}x COMBO`, this.canvas.width - 16, 55);
    }
  }

  public destroy() {
    this.stop();
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('keydown', this.onKeyDown);
  }
}
