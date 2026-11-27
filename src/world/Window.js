import * as THREE from 'three';
import { box, canvasTexture, seeded } from './helpers.js';
import { ROOM, WINDOW } from './layout.js';

// resolução do "céu" em pixel art (mesma proporção do vidro)
const SKY_W = 144;
const SKY_H = 120;
const FRAME = '#f4efe6';
const CURTAIN = ['#3d5a80', '#34506f'];

const rand = seeded(11);
const between = (a, b) => a + rand() * (b - a);

/**
 * Janela da parede esquerda: moldura, parapeito (o gato sobe aqui),
 * cortinas e o céu desenhado num canvas que muda com a hora e o clima.
 * Quem decide hora/clima é o Environment; aqui só desenha.
 */
export class RoomWindow {
  constructor(scene) {
    const { z, bottom, width: W, height: H, sillDepth } = WINDOW;
    const g = (this.group = new THREE.Group());
    g.name = 'window';
    // local: x ao longo da parede, y pra cima, +z pra dentro do quarto
    g.position.set(-ROOM.half + 0.02, bottom + H / 2, z);
    g.rotation.y = Math.PI / 2;

    // ----- céu -----
    this.canvas = document.createElement('canvas');
    this.canvas.width = SKY_W;
    this.canvas.height = SKY_H;
    this.ctx = this.canvas.getContext('2d');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.minFilter = THREE.NearestFilter;
    const sky = new THREE.Mesh(
      new THREE.PlaneGeometry(W, H),
      new THREE.MeshBasicMaterial({ map: this.texture }),
    );
    sky.position.z = 0.004;
    g.add(sky);

    // reflexo diagonal no vidro
    const shine = canvasTexture(64, 64, (ctx, w, h) => {
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 6;
      for (const o of [-10, 14]) {
        ctx.beginPath();
        ctx.moveTo(o, h);
        ctx.lineTo(o + h, 0);
        ctx.stroke();
      }
    });
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(W, H),
      new THREE.MeshBasicMaterial({
        map: shine,
        transparent: true,
        opacity: 0.1,
        depthWrite: false,
      }),
    );
    glass.position.z = 0.012;
    g.add(glass);

    // ----- moldura (cruz = 4 vidros) -----
    const f = { parent: g };
    box(W + 0.2, 0.1, 0.14, FRAME, { y: H / 2, ...f });
    box(W + 0.2, 0.1, 0.14, FRAME, { y: -H / 2 - 0.1, ...f });
    for (const side of [-1, 1])
      box(0.1, H + 0.2, 0.14, FRAME, { x: side * (W / 2 + 0.05), y: -H / 2 - 0.1, ...f });
    box(0.05, H, 0.06, FRAME, { y: -H / 2, z: 0.02, ...f });
    box(W, 0.05, 0.06, FRAME, { y: -0.025, z: 0.02, ...f });

    // parapeito: fundo o bastante pro gato
    box(W + 0.35, 0.08, sillDepth, '#e8dfd0', { y: -H / 2 - 0.08, z: sillDepth / 2, ...f });
    box(W + 0.15, 0.14, 0.05, '#d8cdb9', { y: -H / 2 - 0.22, z: 0.03, ...f });

    // varão + cortinas presas dos lados
    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, W + 1, 8),
      new THREE.MeshStandardMaterial({ color: '#6b4630', roughness: 0.6 }),
    );
    rod.rotation.z = Math.PI / 2;
    rod.position.set(0, H / 2 + 0.22, 0.2);
    g.add(rod);
    for (const side of [-1, 1]) {
      box(0.08, 0.08, 0.08, '#6b4630', { x: side * (W / 2 + 0.5), y: H / 2 + 0.18, z: 0.2, ...f });
      for (let i = 0; i < 4; i++) {
        box(0.12, H + 0.22, 0.05, CURTAIN[i % 2], {
          x: side * (W / 2 + 0.1 + i * 0.105),
          y: -H / 2 + 0.02,
          z: 0.14 + (i % 2) * 0.04,
          ...f,
        });
      }
      box(0.5, 0.06, 0.12, '#d9b26f', { x: side * (W / 2 + 0.26), y: -0.1, z: 0.2, ...f });
    }
    scene.add(g);

    // ----- mancha de sol no chão (só de dia) -----
    const patchTex = canvasTexture(64, 64, (ctx, w, h) => {
      const grad = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    });
    this.sunPatch = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, W * 1.1),
      new THREE.MeshBasicMaterial({
        map: patchTex,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.sunPatch.rotation.x = -Math.PI / 2;
    this.sunPatch.position.set(-ROOM.half + 1.2, 0.015, z + 0.2);
    this.sunPatch.userData.noRaycast = true; // não atrapalha o clique no piso
    scene.add(this.sunPatch);

    this.initScenery();
  }

  /** Elementos fixos do céu (posições sorteadas uma vez, sempre iguais). */
  initScenery() {
    this.stars = Array.from({ length: 45 }, () => ({
      x: Math.floor(between(0, SKY_W)),
      y: Math.floor(between(0, SKY_H * 0.6)),
      phase: between(0, 6.28),
    }));

    // prédios no horizonte, com janelinhas que acendem à noite
    this.buildings = [];
    let x = -4;
    while (x < SKY_W) {
      const w = Math.floor(between(10, 22));
      const h = Math.floor(between(14, 38));
      const lit = [];
      for (let wy = SKY_H - h + 4; wy < SKY_H - 3; wy += 5) {
        for (let wx = x + 3; wx < x + w - 3; wx += 4) if (rand() < 0.35) lit.push([wx, wy]);
      }
      this.buildings.push({ x, w, h, lit, shade: between(0, 1) });
      x += w + Math.floor(between(0, 3));
    }

    this.clouds = Array.from({ length: 9 }, (_, i) => ({
      x: between(-30, SKY_W),
      y: between(6, 46),
      w: between(22, 40),
      speed: between(1.2, 3),
      order: i / 9, // nuvens aparecem conforme a cobertura aumenta
    }));

    this.drops = Array.from({ length: 140 }, () => ({
      x: between(0, SKY_W + 30),
      y: between(-SKY_H, SKY_H),
      len: between(4, 8),
      speed: between(110, 160),
    }));

    // gotas escorrendo no vidro
    this.beads = Array.from({ length: 26 }, () => ({
      x: between(2, SKY_W - 2),
      y: between(0, SKY_H),
      speed: between(0, 1) < 0.3 ? between(8, 20) : 0,
    }));
  }

  /**
   * Desenha o céu. `s` vem do Environment:
   * { top, bottom, day, rain, wet, clouds, sunPos, moonPos, sunColor, flash }
   */
  draw(s, dt) {
    const ctx = this.ctx;
    const W = SKY_W;
    const H = SKY_H;

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, s.top);
    grad.addColorStop(1, s.bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // estrelas
    const starAlpha = (1 - s.day) * (1 - s.clouds * 0.9);
    if (starAlpha > 0.02) {
      for (const st of this.stars) {
        const tw = 0.6 + 0.4 * Math.sin(s.time * 2 + st.phase);
        ctx.fillStyle = `rgba(255,255,240,${(starAlpha * tw).toFixed(2)})`;
        ctx.fillRect(st.x, st.y, 1, 1);
      }
    }

    // sol (some atrás das nuvens de chuva)
    if (s.sunPos) {
      const [x, y] = s.sunPos;
      const a = 1 - s.rain * 0.85;
      const glow = ctx.createRadialGradient(x, y, 2, x, y, 26);
      glow.addColorStop(0, `rgba(255,236,170,${0.55 * a})`);
      glow.addColorStop(1, 'rgba(255,236,170,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x - 26, y - 26, 52, 52);
      ctx.globalAlpha = a;
      ctx.fillStyle = s.sunColor;
      pixelCircle(ctx, x, y, 7);
      ctx.globalAlpha = 1;
    }

    // lua crescente
    if (s.moonPos) {
      const [x, y] = s.moonPos;
      ctx.globalAlpha = 1 - s.rain * 0.8;
      ctx.fillStyle = '#fff6c9';
      pixelCircle(ctx, x, y, 6);
      ctx.fillStyle = s.top;
      pixelCircle(ctx, x + 3, y - 2, 5);
      ctx.globalAlpha = 1;
    }

    // nuvens: blocos arredondados, mais escuras com chuva/noite
    const cloudLight = Math.round(120 + 135 * s.day * (1 - s.rain * 0.55));
    for (const c of this.clouds) {
      c.x += c.speed * (1 + s.rain * 1.5) * dt;
      if (c.x > W + 10) c.x = -c.w - 10;
      if (c.order > s.clouds) continue;
      const v = cloudLight;
      ctx.fillStyle = `rgb(${v - 10},${v - 6},${v})`;
      ctx.fillRect(Math.round(c.x), Math.round(c.y + 4), Math.round(c.w), 7);
      ctx.fillRect(Math.round(c.x + c.w * 0.15), Math.round(c.y), Math.round(c.w * 0.45), 6);
      ctx.fillRect(Math.round(c.x + c.w * 0.5), Math.round(c.y + 1), Math.round(c.w * 0.3), 5);
    }

    // prédios
    const night = 1 - s.day;
    for (const b of this.buildings) {
      // de dia ficam azulados/enevoados; à noite viram silhueta
      const base = 34 + 125 * s.day * (1 - s.rain * 0.4) + b.shade * 16;
      ctx.fillStyle = `rgb(${base * 0.62},${base * 0.7},${base})`;
      ctx.fillRect(b.x, H - b.h, b.w, b.h);
      if (night > 0.3) {
        ctx.fillStyle = `rgba(255,214,120,${((night - 0.3) * 1.3).toFixed(2)})`;
        for (const [wx, wy] of b.lit) ctx.fillRect(wx, wy, 2, 2);
      }
    }

    // chuva
    if (s.rain > 0.02) {
      const n = Math.floor(this.drops.length * s.rain);
      ctx.strokeStyle = `rgba(200,220,255,${0.35 + s.rain * 0.3})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const d = this.drops[i];
        d.y += d.speed * dt;
        d.x -= d.speed * 0.25 * dt;
        if (d.y > H) {
          d.y = -d.len - Math.random() * 20;
          d.x = Math.random() * (W + 30);
        }
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.len * 0.25, d.y - d.len);
      }
      ctx.stroke();
    }

    // vidro molhado: continua um pouco depois que a chuva para
    if (s.wet > 0.05) {
      const n = Math.floor(this.beads.length * s.wet);
      for (let i = 0; i < n; i++) {
        const b = this.beads[i];
        if (b.speed) {
          b.y += b.speed * dt;
          if (b.y > H) {
            b.y = -2;
            b.x = 2 + Math.random() * (W - 4);
          }
        }
        ctx.fillStyle = `rgba(230,240,255,${0.55 * s.wet})`;
        ctx.fillRect(Math.round(b.x), Math.round(b.y), 2, 2);
        ctx.fillStyle = `rgba(40,50,70,${0.35 * s.wet})`;
        ctx.fillRect(Math.round(b.x), Math.round(b.y) + 2, 2, 1);
      }
    }

    // relâmpago
    if (s.flash > 0.01) {
      ctx.fillStyle = `rgba(255,255,255,${s.flash * 0.8})`;
      ctx.fillRect(0, 0, W, H);
    }

    this.texture.needsUpdate = true;

    this.sunPatch.material.color.set(s.sunColor);
    this.sunPatch.material.opacity = s.day * (1 - s.rain) * 0.32;
  }
}

/** Círculo "pixelado" (sem antialias), combina com o resto do céu. */
function pixelCircle(ctx, cx, cy, r) {
  for (let y = -r; y <= r; y++) {
    const half = Math.round(Math.sqrt(r * r - y * y));
    ctx.fillRect(Math.round(cx - half), Math.round(cy + y), half * 2, 1);
  }
}

export const SKY_SIZE = { w: SKY_W, h: SKY_H };
