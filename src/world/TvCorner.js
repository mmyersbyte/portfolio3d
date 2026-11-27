import * as THREE from 'three';
import { box, PIXEL_FONT } from './helpers.js';
import { LAYOUT } from './layout.js';

const SCREEN_W = 1.05;
const SCREEN_H = 0.6;
const TEX_W = 192;
const TEX_H = 108;
const LOGO_COLORS = ['#ffd166', '#8ecae6', '#ff8fab', '#95d5b2', '#cdb4db', '#f4a261'];

const SOFA = '#c0634a';
const SOFA_LIGHT = '#d4785e';
const SOFA_DARK = '#9c4c38';

/**
 * Cantinho da TV: rack de madeira + TV virada pra frente/direita e um sofazinho
 * de frente pra ela. Ligada, a TV mostra:
 *  - com alguém sentado no sofá: desenho de gato e rato (o Frajola, original)
 *  - com o lo-fi tocando: equalizador
 *  - senão: logo "pedro.dev" quicando
 */
export class TvCorner {
  constructor(exp) {
    this.on = false;
    this.music = null;
    this.isWatching = () => false; // ligado em scene.js (eu sentado no sofá)

    this.buildTv(exp);
    this.buildSofa(exp);

    this.logo = { x: 30, y: 20, vx: 38, vy: 26, color: 0 };
    this.bars = new Array(12).fill(0);
    this.acc = 0;
    this.showTime = 0;
    this.drawOff();
    exp.onUpdate((dt) => this.update(dt));
  }

  buildTv(exp) {
    // rack maior: dois armarinhos com nicho no meio (frente = +z local)
    const w = 1.5;
    const d = 0.5;
    const h = 0.5;
    const { x, z, rotY = 0 } = LAYOUT.tvRack;
    const tv = (this.tv = new THREE.Group());
    tv.name = 'tv';
    tv.position.set(x, 0, z);
    tv.rotation.y = rotY;

    box(w, 0.05, d, '#3b2a1e', { y: 0.06, parent: tv }); // base
    box(w, h - 0.11, 0.04, '#4a3a2e', { y: 0.11, z: -d / 2 + 0.02, parent: tv }); // fundo
    box(w, 0.05, d, '#6b4f3a', { y: h - 0.05, parent: tv }); // tampo
    for (const side of [-1, 1]) {
      // pés
      box(0.05, 0.06, 0.05, '#2b1f16', { x: side * (w / 2 - 0.08), z: d / 2 - 0.08, parent: tv });
      box(0.05, 0.06, 0.05, '#2b1f16', { x: side * (w / 2 - 0.08), z: -d / 2 + 0.08, parent: tv });
      // armarinhos laterais com porta e puxador
      box(w * 0.34, h - 0.16, d - 0.04, '#5a4332', {
        x: side * (w / 2 - w * 0.17),
        y: 0.11,
        parent: tv,
      });
      box(w * 0.34 - 0.04, h - 0.2, 0.02, '#7a5a42', {
        x: side * (w / 2 - w * 0.17),
        y: 0.13,
        z: d / 2 - 0.01,
        parent: tv,
        shadow: false,
      });
      box(0.02, 0.1, 0.02, '#d9b26f', {
        x: side * (w * 0.2),
        y: 0.24,
        z: d / 2 + 0.005,
        parent: tv,
        shadow: false,
      });
    }
    // nicho do meio: videogame + controle
    box(0.3, 0.06, 0.24, '#e9e4d8', { y: 0.11, parent: tv });
    box(0.12, 0.03, 0.06, '#2b2d35', { x: 0.06, y: 0.17, z: 0.1, parent: tv, shadow: false });

    // TV em cima do rack
    const base = h + 0.05;
    box(0.36, 0.025, 0.2, '#1f1f26', { y: h, parent: tv });
    box(0.07, 0.07, 0.05, '#1f1f26', { y: h + 0.02, parent: tv });
    box(SCREEN_W + 0.07, SCREEN_H + 0.07, 0.05, '#1f1f26', { y: base, parent: tv });

    this.canvas = document.createElement('canvas');
    this.canvas.width = TEX_W;
    this.canvas.height = TEX_H;
    this.ctx = this.canvas.getContext('2d');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.magFilter = THREE.NearestFilter;
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(SCREEN_W, SCREEN_H),
      new THREE.MeshBasicMaterial({ map: this.texture, toneMapped: false }),
    );
    screen.position.set(0, base + 0.035 + SCREEN_H / 2, 0.026);
    tv.add(screen);

    this.led = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.012, 0.005),
      new THREE.MeshBasicMaterial({ color: '#e63946', toneMapped: false }),
    );
    this.led.position.set(SCREEN_W / 2 - 0.04, base + 0.014, 0.027);
    tv.add(this.led);

    this.glow = new THREE.PointLight('#8ecae6', 0, 3.4, 2);
    this.glow.position.set(0, base + 0.3, 0.6);
    tv.add(this.glow);
    exp.scene.add(tv);
  }

  buildSofa(exp) {
    // sofazinho de 2 lugares (frente = +z local), estilo voxel fofinho
    const W = 1.45;
    const D = 0.8;
    const { x, z, rotY = 0 } = LAYOUT.sofa;
    const s = (this.sofa = new THREE.Group());
    s.name = 'sofa';
    s.position.set(x, 0, z);
    s.rotation.y = rotY;

    for (const fx of [-1, 1]) {
      for (const fz of [-1, 1]) {
        box(0.06, 0.07, 0.06, '#2b1f16', {
          x: fx * (W / 2 - 0.1),
          z: fz * (D / 2 - 0.1),
          parent: s,
        });
      }
    }
    box(W, 0.2, D, SOFA_DARK, { y: 0.07, parent: s }); // base
    // assentos: duas almofadas fofas
    for (const side of [-1, 1]) {
      box(W / 2 - 0.2, 0.15, D - 0.24, SOFA_LIGHT, {
        x: side * (W / 4 - 0.05),
        y: 0.27,
        z: 0.1,
        parent: s,
      });
    }
    // encosto (atrás) com duas almofadas
    box(W, 0.42, 0.2, SOFA, { y: 0.27, z: -D / 2 + 0.1, parent: s });
    for (const side of [-1, 1]) {
      box(W / 2 - 0.22, 0.3, 0.12, SOFA_LIGHT, {
        x: side * (W / 4 - 0.05),
        y: 0.36,
        z: -D / 2 + 0.24,
        parent: s,
      });
    }
    // braços arredondados (dois blocos: o de cima mais largo)
    for (const side of [-1, 1]) {
      box(0.16, 0.3, D, SOFA, { x: side * (W / 2 - 0.08), y: 0.27, parent: s });
      box(0.2, 0.07, D + 0.02, SOFA_LIGHT, { x: side * (W / 2 - 0.08), y: 0.55, parent: s });
    }
    // almofadinha de enfeite torta num canto
    const pillow = box(0.26, 0.24, 0.1, '#e9c46a', {
      x: W / 2 - 0.32,
      y: 0.4,
      z: -0.12,
      parent: s,
    });
    pillow.rotation.z = 0.25;
    pillow.rotation.y = 0.3;

    exp.scene.add(s);
  }

  get isOn() {
    return this.on;
  }

  setOn(on) {
    if (on && !this.on) this.showTime = 0;
    this.on = on;
    this.led.material.color.set(on ? '#7dff9a' : '#e63946');
    this.glow.intensity = on ? 1.4 : 0;
    if (!on) this.drawOff();
  }

  toggle() {
    this.setOn(!this.on);
    return this.on;
  }

  drawOff() {
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(0, 0, TEX_W, TEX_H);
    g.addColorStop(0, '#15161b');
    g.addColorStop(1, '#0b0c10');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, TEX_W, TEX_H);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(70, 0);
    ctx.lineTo(30, TEX_H);
    ctx.lineTo(-20, TEX_H);
    ctx.fill();
    this.texture.needsUpdate = true;
  }

  update(dt) {
    if (!this.on) return;
    const watching = this.isWatching();
    this.acc += dt;
    // desenho anima mais liso que o resto
    if (this.acc < 1 / (watching ? 24 : 15)) return;
    const step = this.acc;
    this.acc = 0;
    this.showTime += step;

    if (watching) drawCartoon(this.ctx, this.showTime);
    else if (this.music?.isPlaying) this.drawEqualizer();
    else this.drawLogo(step);

    // scanlines de TV antiga
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    for (let y = 0; y < TEX_H; y += 3) ctx.fillRect(0, y, TEX_W, 1);
    this.texture.needsUpdate = true;
  }

  drawEqualizer() {
    const ctx = this.ctx;
    ctx.fillStyle = '#141026';
    ctx.fillRect(0, 0, TEX_W, TEX_H);
    const n = this.bars.length;
    const bw = Math.floor((TEX_W - 24) / n);
    for (let i = 0; i < n; i++) {
      const target = 0.2 + Math.random() * 0.8 * (1 - Math.abs(i - n / 2) / n);
      this.bars[i] += (target - this.bars[i]) * 0.5;
      const h = Math.round(this.bars[i] * (TEX_H - 34));
      ctx.fillStyle = LOGO_COLORS[i % LOGO_COLORS.length];
      ctx.fillRect(12 + i * bw, TEX_H - 14 - h, bw - 3, h);
    }
    ctx.fillStyle = '#fff';
    ctx.font = `12px ${PIXEL_FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText('lo-fi radio', 10, 16);
  }

  drawLogo(step) {
    const ctx = this.ctx;
    ctx.fillStyle = '#101826';
    ctx.fillRect(0, 0, TEX_W, TEX_H);
    const l = this.logo;
    ctx.font = `bold 18px ${PIXEL_FONT}`;
    const lw = ctx.measureText('pedro.dev').width;
    l.x += l.vx * step;
    l.y += l.vy * step;
    if (l.x < 4 || l.x + lw > TEX_W - 4) {
      l.vx *= -1;
      l.x = Math.max(4, Math.min(TEX_W - 4 - lw, l.x));
      l.color = (l.color + 1) % LOGO_COLORS.length;
    }
    if (l.y < 18 || l.y > TEX_H - 6) {
      l.vy *= -1;
      l.y = Math.max(18, Math.min(TEX_H - 6, l.y));
      l.color = (l.color + 1) % LOGO_COLORS.length;
    }
    ctx.fillStyle = LOGO_COLORS[l.color];
    ctx.textAlign = 'left';
    ctx.fillText('pedro.dev', l.x, l.y);
  }
}

// ---------- desenho: o Frajola correndo atrás de um ratinho (original) ----------

const LOOP = 8.5; // s
const FLOOR = 86;
const HOLE_X = 166;
const ease = (x) => 1 - (1 - x) ** 2;

function drawCatSide(ctx, x, y, frame, { squash = 1 } = {}) {
  // Frajola de lado, olhando pra direita
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(squash, 1 / squash);
  ctx.fillStyle = '#17171c';
  // rabo levantado
  ctx.fillRect(-16, -16, 3, 10);
  ctx.fillRect(-19, -20, 3, 6);
  // corpo
  ctx.fillRect(-14, -12, 24, 10);
  // patas alternando
  const a = frame ? 2 : -2;
  ctx.fillRect(-12 + a, -3, 3, 5);
  ctx.fillRect(-4 - a, -3, 3, 5);
  ctx.fillRect(3 + a, -3, 3, 5);
  ctx.fillRect(8 - a, -3, 3, 5);
  // cabeça + orelhas
  ctx.fillRect(8, -20, 12, 11);
  ctx.fillRect(9, -24, 3, 4);
  ctx.fillRect(16, -24, 3, 4);
  // olho verde e focinho rosa
  ctx.fillStyle = '#c6f36b';
  ctx.fillRect(15, -17, 3, 3);
  ctx.fillStyle = '#d77a8a';
  ctx.fillRect(19, -13, 2, 2);
  ctx.restore();
}

function drawMouse(ctx, x, y, frame, cheese = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#8d8d99';
  ctx.fillRect(-14, -3, 6, 1); // rabo
  ctx.fillRect(-8, -7, 11, 6); // corpo
  ctx.fillRect(2, -9, 6, 6); // cabeça
  ctx.fillStyle = '#e8a5b5';
  ctx.fillRect(1, -13, 4, 4); // orelha
  ctx.fillStyle = '#1d1b2e';
  ctx.fillRect(6, -8, 1, 1); // olho
  ctx.fillStyle = '#8d8d99';
  const a = frame ? 1 : -1;
  ctx.fillRect(-6 + a, -1, 2, 2);
  ctx.fillRect(0 - a, -1, 2, 2);
  if (cheese) {
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(8, -6);
    ctx.lineTo(16, -2);
    ctx.lineTo(8, -1);
    ctx.fill();
  }
  ctx.restore();
}

function drawStar(ctx, x, y) {
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(x - 1, y - 3, 2, 6);
  ctx.fillRect(x - 3, y - 1, 6, 2);
}

function drawCartoon(ctx, time) {
  const t = time % LOOP;
  const frame = Math.floor(time * 10) % 2;

  // cenário: parede com listras, chão de taco e a toquinha do rato
  ctx.fillStyle = '#f2e3c6';
  ctx.fillRect(0, 0, TEX_W, FLOOR);
  ctx.fillStyle = '#e6d3ae';
  for (let x = 6; x < TEX_W; x += 22) ctx.fillRect(x, 0, 8, FLOOR);
  ctx.fillStyle = '#b07d52';
  ctx.fillRect(0, FLOOR, TEX_W, TEX_H - FLOOR);
  ctx.fillStyle = '#8a5f3c';
  ctx.fillRect(0, FLOOR - 4, TEX_W, 4);
  ctx.fillStyle = '#2b1f16';
  ctx.beginPath();
  ctx.arc(HOLE_X, FLOOR - 4, 9, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(HOLE_X - 9, FLOOR - 4, 18, 4);

  if (t < 3.4) {
    // perseguição: o rato na frente, o Frajola atrás
    const p = t / 3.4;
    drawMouse(ctx, -12 + p * (HOLE_X + 8), FLOOR, frame);
    drawCatSide(ctx, -60 + ease(p) * (HOLE_X - 18), FLOOR, frame);
  } else if (t < 5.2) {
    // rato entrou na toca; o gato dá de cara na parede, achatado e tonto
    const k = Math.min(1, (t - 3.4) / 0.15);
    drawCatSide(ctx, HOLE_X - 18 + k * 2, FLOOR, 0, { squash: 1 - 0.35 * k });
    for (let i = 0; i < 3; i++) {
      const a = t * 5 + (i * Math.PI * 2) / 3;
      drawStar(ctx, HOLE_X - 6 + Math.cos(a) * 12, FLOOR - 34 + Math.sin(a) * 4);
    }
  } else {
    // rato espia com o queijo; gato ainda tonto do lado
    drawCatSide(ctx, HOLE_X - 40, FLOOR, 0);
    const peek = Math.min(1, (t - 5.2) / 0.4);
    drawMouse(ctx, HOLE_X - 4 + (1 - peek) * 10, FLOOR, 0, true);
    for (let i = 0; i < 3; i++) {
      const a = t * 4 + (i * Math.PI * 2) / 3;
      drawStar(ctx, HOLE_X - 30 + Math.cos(a) * 10, FLOOR - 32 + Math.sin(a) * 3);
    }
  }

  // título no começo e "íris" fechando no final (clássico de desenho antigo)
  if (t < 1.2) {
    ctx.fillStyle = `rgba(29,27,46,${1 - t / 1.2})`;
    ctx.fillRect(0, 0, TEX_W, TEX_H);
    ctx.fillStyle = `rgba(255,209,102,${1 - t / 1.2})`;
    ctx.font = `bold 16px ${PIXEL_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('Frajola & Queijo', TEX_W / 2, TEX_H / 2 + 5);
  }
  if (t > LOOP - 1.4) {
    const p = (t - (LOOP - 1.4)) / 1.4;
    const r = (1 - p) * 120 + 6;
    ctx.save();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.rect(0, 0, TEX_W, TEX_H);
    ctx.arc(HOLE_X - 2, FLOOR - 8, r, 0, Math.PI * 2, true);
    ctx.fill('evenodd');
    ctx.restore();
  }
}
