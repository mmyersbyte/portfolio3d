/**
 * "Dino Corre": corrida infinita em pixel art, com arte e personagem próprios
 * (um dinossaurinho com placas nas costas). Pula pedras e arbustos, abaixa dos morcegos.
 *
 * Controles: espaço/↑/W pula · ↓/S abaixa · toque/clique pula.
 */

const W = 600;
const H = 180;
const GROUND = 150;
const GRAVITY = 2100;
const JUMP_V = 690;
const BEST_KEY = 'portfolio3d:dino-best';

// sprites em texto: cada caractere é uma cor (espaço = vazio)
const PALETTE = {
  g: '#2a9d8f', // corpo
  d: '#1f7a6f', // sombra do corpo
  y: '#f4d58d', // barriga
  o: '#f4a261', // placas das costas
  k: '#1d1b2e', // olho / contorno
  w: '#ffffff',
};

const DINO_BASE = [
  '          gggggg ',
  '         gggggggg',
  '         ggkwgggg',
  '         gggggggg',
  '   o o   ggggg   ',
  '  oooooo gggg    ',
  ' gggggggggggg    ',
  'gggggyyyyyggg    ',
  ' gggyyyyyyggg    ',
  '  ggyyyyyygg     ',
  '   gggggggg      ',
];
const LEGS = [
  ['   gg   dd      ', '   gg    dd     '],
  ['   dd   gg      ', '    dd  gg      '],
];
const DINO_DUCK = [
  '                    ',
  '   o o o     gggggg ',
  '  ooooooo   ggggkwgg',
  ' gggggggggggggggggg ',
  'gggggyyyyyyyggggg   ',
  ' gggyyyyyyyyggg     ',
  '   gg  dd  gg       ',
];
const ROCK = ['  bbbb  ', ' bbbbbb ', 'bbcbbbbb', 'bbbbbcbb', 'bbbbbbbb'];
const BUSH = ['  ll   l ', ' llll lll', 'llmlllllm', 'lllllmlll', ' lllllll ', '  n  n   '];
const BAT = [
  ['p     p', 'pp q pp', ' ppppp ', '  p p  '],
  ['  q    ', ' ppppp ', 'ppp ppp', 'p     p'],
];
const OBST_COLORS = {
  b: '#8d7b68',
  c: '#6f5f50',
  l: '#52b788',
  m: '#2d6a4f',
  n: '#6b4630',
  p: '#5e548e',
  q: '#e63946',
};

const PX = 3; // tamanho do "pixel" do sprite

function drawSprite(ctx, rows, x, y, colors, px = PX) {
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const color = colors[row[c]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x + c * px), Math.round(y + r * px), px, px);
    }
  }
}

export class DinoGame {
  constructor(container, strings) {
    this.t = strings; // (key) => texto traduzido
    this.canvas = document.createElement('canvas');
    this.canvas.width = W;
    this.canvas.height = H;
    this.canvas.className = 'dino__canvas';
    this.canvas.setAttribute('role', 'img');
    this.canvas.setAttribute('aria-label', 'Dino Corre');
    this.ctx = this.canvas.getContext('2d');
    container.append(this.canvas);

    try {
      this.best = Number(localStorage.getItem(BEST_KEY)) || 0;
    } catch {
      this.best = 0;
    }

    this.onKey = this.onKey.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKeyUp);
    this.canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.press();
    });

    this.reset();
    this.state = 'ready';
    this.last = performance.now();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  reset() {
    this.y = 0; // altura acima do chão
    this.vy = 0;
    this.ducking = false;
    this.speed = 330;
    this.score = 0;
    this.obstacles = [];
    this.spawnIn = 1.2;
    this.time = 0;
    this.clouds = Array.from({ length: 4 }, (_, i) => ({
      x: i * 170 + 40,
      y: 20 + Math.random() * 40,
    }));
    this.pebbles = Array.from({ length: 18 }, () => ({
      x: Math.random() * W,
      y: GROUND + 6 + Math.random() * 18,
    }));
    this.flash = 0;
  }

  press() {
    if (this.state === 'ready' || this.state === 'over') {
      this.reset();
      this.state = 'run';
      return;
    }
    if (this.y === 0) this.vy = JUMP_V;
  }

  duck(on) {
    if (this.state !== 'run') return;
    this.ducking = on;
    if (on && this.y > 0) this.vy = Math.min(this.vy, -JUMP_V * 0.8); // desce rápido
  }

  onKey(e) {
    if (!this.canvas.isConnected) return;
    if ([' ', 'ArrowUp', 'w', 'W'].includes(e.key)) {
      e.preventDefault();
      this.press();
    } else if (['ArrowDown', 's', 'S'].includes(e.key)) {
      e.preventDefault();
      this.duck(true);
    }
  }

  onKeyUp(e) {
    if (['ArrowDown', 's', 'S'].includes(e.key)) this.duck(false);
  }

  spawn() {
    const r = Math.random();
    const canBat = this.score > 150;
    if (canBat && r < 0.25) {
      // morcego: baixo (pula) ou alto (abaixa)
      const high = Math.random() < 0.6;
      this.obstacles.push({ kind: 'bat', x: W + 10, y: high ? 34 : 12, w: 7 * PX, h: 4 * PX });
    } else if (r < 0.62) {
      // pedra grande = pixels maiores (inteiros, pra não aparecer "risco" entre eles)
      const px = Math.random() < 0.4 ? PX + 1 : PX;
      this.obstacles.push({ kind: 'rock', x: W + 10, y: 0, w: 8 * px, h: 5 * px, px });
    } else {
      const n = Math.random() < 0.3 ? 2 : 1;
      for (let i = 0; i < n; i++)
        this.obstacles.push({ kind: 'bush', x: W + 10 + i * 26, y: 0, w: 9 * PX, h: 6 * PX });
    }
    // distância mínima cresce com a velocidade (sempre dá pra passar)
    this.spawnIn = 0.75 + Math.random() * 0.9 + 120 / this.speed;
  }

  loop(now) {
    const dt = Math.min(0.033, (now - this.last) / 1000);
    this.last = now;
    if (this.state === 'run') this.update(dt);
    this.draw();
    this.raf = requestAnimationFrame(this.loop);
  }

  update(dt) {
    this.time += dt;
    this.speed = Math.min(720, this.speed + dt * 9);
    const before = Math.floor(this.score / 100);
    this.score += dt * this.speed * 0.05;
    if (Math.floor(this.score / 100) > before) this.flash = 0.6;
    this.flash = Math.max(0, this.flash - dt);

    // pulo
    this.vy -= GRAVITY * dt;
    this.y = Math.max(0, this.y + this.vy * dt);
    if (this.y === 0) this.vy = 0;

    this.spawnIn -= dt;
    if (this.spawnIn <= 0) this.spawn();

    for (const o of this.obstacles) o.x -= this.speed * dt * (o.kind === 'bat' ? 1.12 : 1);
    this.obstacles = this.obstacles.filter((o) => o.x > -60);
    for (const c of this.clouds) {
      c.x -= this.speed * dt * 0.15;
      if (c.x < -60) c.x = W + Math.random() * 80;
    }
    for (const p of this.pebbles) {
      p.x -= this.speed * dt;
      if (p.x < 0) p.x += W;
    }

    // colisão com caixas um pouco menores que o desenho (mais justo)
    const dino = this.dinoBox();
    for (const o of this.obstacles) {
      const ow = o.w;
      const oh = o.h;
      const ox = o.x + 4;
      const oy = GROUND - o.y - oh + 3;
      if (
        dino.x < ox + ow - 8 &&
        dino.x + dino.w > ox &&
        dino.y < oy + oh - 4 &&
        dino.y + dino.h > oy
      ) {
        this.gameOver();
        break;
      }
    }
  }

  dinoBox() {
    const x = 50;
    if (this.ducking && this.y === 0)
      return { x: x + 6, y: GROUND - 6 * PX, w: 17 * PX, h: 5 * PX };
    return { x: x + 8, y: GROUND - this.y - 13 * PX, w: 11 * PX, h: 12 * PX };
  }

  gameOver() {
    this.state = 'over';
    const score = Math.floor(this.score);
    if (score > this.best) {
      this.best = score;
      try {
        localStorage.setItem(BEST_KEY, String(score));
      } catch {
        /* ok */
      }
    }
  }

  draw() {
    const ctx = this.ctx;
    // céu em degradê + morros ao fundo
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
    sky.addColorStop(0, '#a9def9');
    sky.addColorStop(1, '#fdf0d5');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e4f1d4';
    const span = W + 200;
    for (let i = 0; i < 4; i++) {
      // parallax lento, dando a volta pela tela
      const raw = i * 190 - this.time * this.speed * 0.05;
      const hx = (((raw % span) + span) % span) - 100;
      ctx.beginPath();
      ctx.arc(hx, GROUND + 10, 90, Math.PI, 0);
      ctx.fill();
    }

    ctx.fillStyle = '#ffffff';
    for (const c of this.clouds) {
      ctx.fillRect(c.x, c.y + 6, 46, 10);
      ctx.fillRect(c.x + 10, c.y, 22, 8);
    }

    // chão
    ctx.fillStyle = '#c9a27e';
    ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = '#a07855';
    ctx.fillRect(0, GROUND, W, 3);
    for (const p of this.pebbles) ctx.fillRect(Math.round(p.x), Math.round(p.y), 4, 2);

    // obstáculos
    for (const o of this.obstacles) {
      if (o.kind === 'bat') {
        const frame = BAT[Math.floor(this.time * 8) % 2];
        drawSprite(ctx, frame, o.x, GROUND - o.y - o.h - 20, OBST_COLORS);
        continue;
      }
      const sprite = o.kind === 'rock' ? ROCK : BUSH;
      drawSprite(ctx, sprite, o.x, GROUND - o.h + 2, OBST_COLORS, o.px ?? PX);
    }

    // dino
    const running = this.state === 'run' && this.y === 0;
    const frame = running ? Math.floor(this.time * 12) % 2 : 0;
    if (this.ducking && this.y === 0 && this.state === 'run') {
      drawSprite(ctx, DINO_DUCK, 50, GROUND - DINO_DUCK.length * PX + 1, PALETTE);
    } else {
      const rows = [...DINO_BASE, ...LEGS[frame]];
      drawSprite(ctx, rows, 50, GROUND - this.y - rows.length * PX + 1, PALETTE);
    }

    // placar
    ctx.fillStyle = '#1d1b2e';
    ctx.font = 'bold 14px "Pixelify Sans", monospace';
    ctx.textAlign = 'right';
    const score = String(Math.floor(this.score)).padStart(5, '0');
    if (this.flash === 0 || Math.floor(this.flash * 10) % 2 === 0) {
      ctx.fillText(
        `${this.t('dino.best')} ${String(this.best).padStart(5, '0')}   ${score}`,
        W - 12,
        22,
      );
    }

    // telas de início/fim
    if (this.state !== 'run') {
      ctx.fillStyle = 'rgba(255,255,255,0.72)';
      ctx.fillRect(W / 2 - 170, 52, 340, 62);
      ctx.fillStyle = '#1d1b2e';
      ctx.textAlign = 'center';
      ctx.font = 'bold 18px "Pixelify Sans", monospace';
      ctx.fillText(this.state === 'over' ? this.t('dino.over') : 'Dino Corre', W / 2, 78);
      ctx.font = '13px "Pixelify Sans", monospace';
      ctx.fillText(this.t(this.state === 'over' ? 'dino.restart' : 'dino.start'), W / 2, 100);
    }
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('keyup', this.onKeyUp);
    this.canvas.remove();
  }
}
