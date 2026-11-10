/**
 * Procedural Canvas Textures for Talking Davi Lucas.
 * 100% procedural, crisp, SRGBColorSpace, Zero 404 dependencies.
 */

import * as THREE from 'three';

// Helper to configure texture standard properties
function setupTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// 1. Stylized Cartoon Eye Iris Texture
export function createIrisTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;

  // Outer dark rim
  const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, size / 2);
  grad.addColorStop(0, '#38bdf8'); // Bright cyan/blue center
  grad.addColorStop(0.65, '#0284c7'); // Rich blue
  grad.addColorStop(0.9, '#0369a1');
  grad.addColorStop(1.0, '#0c4a6e'); // Dark outer ring

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, size / 2 - 2, 0, Math.PI * 2);
  ctx.fill();

  // Radial iris rays
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 32; i++) {
    const angle = (i / 32) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * 30, cy + Math.sin(angle) * 30);
    ctx.lineTo(cx + Math.cos(angle) * (size / 2 - 10), cy + Math.sin(angle) * (size / 2 - 10));
    ctx.stroke();
  }

  // Deep black pupil
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(cx, cy, 46, 0, Math.PI * 2);
  ctx.fill();

  // Primary eye glint / catchlight
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx - 20, cy - 20, 16, 0, Math.PI * 2);
  ctx.fill();

  // Secondary smaller glint
  ctx.beginPath();
  ctx.arc(cx + 18, cy + 18, 8, 0, Math.PI * 2);
  ctx.fill();

  return setupTexture(canvas);
}

// 2. Streetwear Hoodie Graphic ("DL" Logo + geometric stripes)
export function createHoodieTexture(colorHex: string = '#3b82f6'): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base hoodie fabric
  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, size, size);

  // Subtle fabric weave texture
  ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
  for (let x = 0; x < size; x += 4) {
    ctx.fillRect(x, 0, 2, size);
  }
  for (let y = 0; y < size; y += 4) {
    ctx.fillRect(0, y, size, 2);
  }

  // Chest Logo: "DL" Monogram Badge
  const cx = size / 2;
  const cy = size / 2 - 30;

  // Diamond shield backing
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(cx - 70, cy - 70, 140, 140, 24);
  ctx.fill();

  ctx.strokeStyle = '#f59e0b'; // Gold border
  ctx.lineWidth = 6;
  ctx.stroke();

  // "DL" Bold Typography
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 68px "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('DL', cx, cy + 4);

  // Streetwear star accents
  ctx.fillStyle = '#38bdf8';
  ctx.font = '24px sans-serif';
  ctx.fillText('★ TALKING ★', cx, cy + 90);

  return setupTexture(canvas);
}

// 3. Room Floor Parquet / Hardwood Texture
export function createFloorTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Warm oak planks
  ctx.fillStyle = '#b45309';
  ctx.fillRect(0, 0, size, size);

  const plankHeight = 64;
  for (let y = 0; y < size; y += plankHeight) {
    const isStaggered = (y / plankHeight) % 2 === 0;
    const plankWidth = 128;
    const xOffset = isStaggered ? 0 : plankWidth / 2;

    for (let x = -plankWidth; x < size + plankWidth; x += plankWidth) {
      // Plank tone variation
      const shade = (Math.sin(x * 12.3 + y * 45.6) * 0.5 + 0.5) * 30;
      ctx.fillStyle = `rgb(${175 + shade}, ${90 + shade * 0.6}, ${35 + shade * 0.3})`;
      ctx.fillRect(x + xOffset, y, plankWidth - 2, plankHeight - 2);

      // Wood grain lines
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.lineWidth = 1;
      for (let g = 0; g < 3; g++) {
        ctx.beginPath();
        const gy = y + 10 + g * 16;
        ctx.moveTo(x + xOffset, gy);
        ctx.bezierCurveTo(
          x + xOffset + 40,
          gy + Math.sin(x) * 4,
          x + xOffset + 80,
          gy - Math.cos(x) * 4,
          x + xOffset + plankWidth - 2,
          gy
        );
        ctx.stroke();
      }
    }
  }

  // Dark grooves between planks
  ctx.strokeStyle = '#5c2b05';
  ctx.lineWidth = 3;
  for (let y = 0; y < size; y += plankHeight) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  const texture = setupTexture(canvas);
  texture.repeat.set(3, 3);
  return texture;
}

// 4. Room Wallpaper / Studio Wall Texture
export function createWallTexture(theme: string = 'studio'): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  if (theme === 'disco') {
    // Neon retro disco grid
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 2;
    for (let x = 0; x < size; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
    ctx.strokeStyle = '#8b5cf6';
    for (let y = 0; y < size; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }
  } else if (theme === 'cyber') {
    // Cyber tech panels
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, size - 40, size - 40);
    ctx.strokeRect(60, 60, size - 120, size - 120);
  } else {
    // Elegant warm modern studio with soft acoustic hexagons
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, size, size);

    // Subtle geometrical pattern
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    const r = 32;
    for (let y = 0; y < size + r * 2; y += r * 1.5) {
      for (let x = 0; x < size + r * 2; x += r * Math.sqrt(3)) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          const px = x + r * Math.cos(a);
          const py = y + r * Math.sin(a);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }

    // Davi Lucas wall poster
    ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
    ctx.beginPath();
    ctx.roundRect(100, 100, 312, 312, 16);
    ctx.fill();
    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DAVI STUDIO', size / 2, 230);
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('VIP LOUNGE', size / 2, 270);
  }

  const texture = setupTexture(canvas);
  texture.repeat.set(2, 2);
  return texture;
}

// 5. Pizza Slice Texture
export function createPizzaTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Crust / cheese base
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 0, size, size);

  // Melted mozzarella patches
  ctx.fillStyle = '#fef08a';
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    ctx.arc(
      Math.random() * size,
      Math.random() * size,
      15 + Math.random() * 20,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  // Pepperoni rounds
  ctx.fillStyle = '#b91c1c';
  for (let i = 0; i < 8; i++) {
    const px = 40 + Math.random() * (size - 80);
    const py = 40 + Math.random() * (size - 80);
    ctx.beginPath();
    ctx.arc(px, py, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Oregano green flakes
  ctx.fillStyle = '#15803d';
  for (let i = 0; i < 40; i++) {
    ctx.fillRect(Math.random() * size, Math.random() * size, 3, 3);
  }

  return setupTexture(canvas);
}

// 6. Soft Contact Shadow Radial Texture
export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;
  const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, size / 2);
  grad.addColorStop(0, 'rgba(15, 23, 42, 0.7)');
  grad.addColorStop(0.5, 'rgba(15, 23, 42, 0.35)');
  grad.addColorStop(0.85, 'rgba(15, 23, 42, 0.08)');
  grad.addColorStop(1.0, 'rgba(15, 23, 42, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 7. Particle Textures (Star, Heart, Flame, Smoke)
export function createParticleTexture(type: 'star' | 'heart' | 'flame' | 'smoke' | 'zzz'): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;

  if (type === 'star') {
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const x = cx + Math.cos(angle) * 50;
      const y = cy + Math.sin(angle) * 50;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 4;
    ctx.stroke();
  } else if (type === 'heart') {
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    const topCurveHeight = 24;
    ctx.moveTo(cx, cy + 24);
    ctx.bezierCurveTo(cx, cy + 12, cx - 40, cy - 20, cx - 40, cy - 36);
    ctx.bezierCurveTo(cx - 40, cy - 56, cx - 20, cy - 56, cx, cy - 32);
    ctx.bezierCurveTo(cx + 20, cy - 56, cx + 40, cy - 56, cx + 40, cy - 36);
    ctx.bezierCurveTo(cx + 40, cy - 20, cx, cy + 12, cx, cy + 24);
    ctx.fill();
  } else if (type === 'flame') {
    const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 54);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.25, '#fde047');
    grad.addColorStop(0.65, '#ea580c');
    grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 54, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'smoke') {
    const grad = ctx.createRadialGradient(cx, cy, 6, cx, cy, 50);
    grad.addColorStop(0, 'rgba(101, 163, 13, 0.85)'); // Stinky green
    grad.addColorStop(0.5, 'rgba(132, 204, 22, 0.45)');
    grad.addColorStop(1, 'rgba(163, 230, 53, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 50, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'zzz') {
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 72px "Comic Sans MS", cursive, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Z', cx, cy);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
