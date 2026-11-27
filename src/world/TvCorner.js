import * as THREE from 'three';
import { box, mat, PIXEL_FONT } from './helpers.js';
import { LAYOUT } from './layout.js';

const SCREEN_W = 0.92;
const SCREEN_H = 0.52;
const TEX_W = 192;
const TEX_H = 108;
const FPS = 15;
const LOGO_COLORS = ['#ffd166', '#8ecae6', '#ff8fab', '#95d5b2', '#cdb4db', '#f4a261'];

/**
 * Cantinho da TV: rack baixo + TV virada pra frente do quarto e um pufe redondo.
 * Ligada, a tela mostra o logo "pedro.dev" quicando; com o lo-fi tocando, vira equalizador.
 */
export class TvCorner {
  constructor(exp) {
    this.on = false;
    this.music = null;

    // ----- rack + TV -----
    // medidas locais do rack (frente = +z local); o layout diz onde e pra onde vira
    const w = 1.15;
    const d = 0.45;
    const { x, z, rotY = 0 } = LAYOUT.tvRack;
    const tv = (this.tv = new THREE.Group());
    tv.name = 'tv';
    tv.position.set(x, 0, z);
    tv.rotation.y = rotY;
    box(w, 0.4, d, '#4a3a2e', { parent: tv });
    for (const side of [-1, 1]) {
      box(w / 2 - 0.08, 0.26, 0.02, '#6b4f3a', {
        x: side * (w / 4),
        y: 0.07,
        z: d / 2,
        parent: tv,
        shadow: false,
      });
      box(0.12, 0.025, 0.02, '#d9b26f', {
        x: side * (w / 4),
        y: 0.2,
        z: d / 2 + 0.012,
        parent: tv,
        shadow: false,
      });
    }
    // videogame em cima do rack
    box(0.3, 0.06, 0.2, '#e9e4d8', { x: -w / 2 + 0.22, y: 0.4, z: 0.04, parent: tv });

    const screenBase = 0.4 + 0.1;
    box(0.3, 0.03, 0.18, '#1f1f26', { x: 0.12, y: 0.4, parent: tv });
    box(0.06, 0.08, 0.05, '#1f1f26', { x: 0.12, y: 0.43, parent: tv });
    box(SCREEN_W + 0.06, SCREEN_H + 0.06, 0.05, '#1f1f26', { x: 0.12, y: screenBase, parent: tv });

    this.canvas = document.createElement('canvas');
    this.canvas.width = TEX_W;
    this.canvas.height = TEX_H;
    this.ctx = this.canvas.getContext('2d');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.magFilter = THREE.NearestFilter;
    this.screen = new THREE.Mesh(
      new THREE.PlaneGeometry(SCREEN_W, SCREEN_H),
      new THREE.MeshBasicMaterial({ map: this.texture, toneMapped: false }),
    );
    this.screen.position.set(0.12, screenBase + 0.03 + SCREEN_H / 2, 0.026);
    tv.add(this.screen);

    // LED de standby
    this.led = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.012, 0.005),
      new THREE.MeshBasicMaterial({ color: '#e63946', toneMapped: false }),
    );
    this.led.position.set(0.12 + SCREEN_W / 2 - 0.04, screenBase + 0.012, 0.027);
    tv.add(this.led);

    // brilho da tela no quarto (à noite fica bonito)
    this.glow = new THREE.PointLight('#8ecae6', 0, 3.2, 2);
    this.glow.position.set(0.12, screenBase + 0.3, 0.5);
    tv.add(this.glow);
    exp.scene.add(tv);

    // ----- pufe -----
    const pf = LAYOUT.pouf;
    const pouf = (this.pouf = new THREE.Group());
    pouf.name = 'pouf';
    pouf.position.set(pf.x, 0, pf.z);
    const fabric = mat('#e9c46a');
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.36, 0.36, 14), fabric);
    body.position.y = 0.18;
    const cushion = new THREE.Mesh(
      new THREE.CylinderGeometry(0.31, 0.33, 0.08, 14),
      mat('#f1d488'),
    );
    cushion.position.y = 0.39;
    const button = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.02, 8),
      mat('#c9a227'),
    );
    button.position.y = 0.435;
    for (const m of [body, cushion, button]) {
      m.castShadow = m.receiveShadow = true;
      pouf.add(m);
    }
    // costura em volta
    const seam = new THREE.Mesh(new THREE.TorusGeometry(0.345, 0.012, 4, 20), mat('#c9a227'));
    seam.rotation.x = Math.PI / 2;
    seam.position.y = 0.35;
    pouf.add(seam);
    exp.scene.add(pouf);

    // estado da animação da tela
    this.logo = { x: 30, y: 20, vx: 38, vy: 26, color: 0 };
    this.bars = new Array(12).fill(0);
    this.acc = 0;
    this.drawOff();
    exp.onUpdate((dt, t) => this.update(dt, t));
  }

  get isOn() {
    return this.on;
  }

  setOn(on) {
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
    // reflexo na tela desligada
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
    this.acc += dt;
    if (this.acc < 1 / FPS) return;
    const step = this.acc;
    this.acc = 0;
    const ctx = this.ctx;

    const music = this.music?.isPlaying;
    ctx.fillStyle = music ? '#141026' : '#101826';
    ctx.fillRect(0, 0, TEX_W, TEX_H);

    if (music) {
      // equalizador de mentirinha, no clima do lo-fi
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
    } else {
      // logo quicando nas bordas (muda de cor a cada batida)
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

    // scanlines de TV antiga
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let y = 0; y < TEX_H; y += 3) ctx.fillRect(0, y, TEX_W, 1);
    this.texture.needsUpdate = true;
  }
}
