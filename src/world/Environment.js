import * as THREE from 'three';
import { SKY_SIZE } from './Window.js';

/**
 * Hora (de Brasília) e clima do quarto.
 * - céu, sol/lua e luzes seguem a hora real em America/Sao_Paulo
 * - chuva aleatória: começa, fica um tempo e vai parando aos poucos
 *
 * Pra testar: ?hora=18:30 (congela o horário) e ?chuva=1 / ?chuva=0.
 * No `pnpm dev` dá pra mexer em window.__scene.env pelo console.
 */

// pontos-chave do dia; entre eles tudo é interpolado
const NIGHT = {
  top: '#0b1030',
  bottom: '#24306a',
  day: 0,
  sun: '#8fa2ff',
  // noite ainda legível: é um portfólio, o boneco precisa aparecer
  sunI: 0.85,
  hemi: '#8f9de0',
  hemiI: 1.15,
  win: '#8fa8ff',
  winI: 4.5,
  lampI: 7,
};
const DAY = {
  top: '#4f9fe6',
  bottom: '#cde9ff',
  day: 1,
  sun: '#fff1dc',
  sunI: 2.3,
  hemi: '#fff6ea',
  hemiI: 1.45,
  win: '#ffe7c2',
  winI: 5,
  lampI: 2.5,
};
const KEYS = [
  { h: 0, ...NIGHT },
  { h: 5, ...NIGHT },
  {
    h: 6.2,
    top: '#3b4a8f',
    bottom: '#f4a07a',
    day: 0.45,
    sun: '#ffb38a',
    sunI: 1.3,
    hemi: '#d9c2e0',
    hemiI: 1.1,
    win: '#ffb38a',
    winI: 4,
    lampI: 5,
  },
  { h: 8, ...DAY },
  { h: 16, ...DAY },
  {
    h: 17.6,
    top: '#5a7fc4',
    bottom: '#ffc18a',
    day: 0.8,
    sun: '#ffcf9a',
    sunI: 2.1,
    hemi: '#ffe2c4',
    hemiI: 1.3,
    win: '#ffc48a',
    winI: 5.5,
    lampI: 3.5,
  },
  {
    h: 18.6,
    top: '#3b3f80',
    bottom: '#ef8a6e',
    day: 0.4,
    sun: '#ff9f7a',
    sunI: 1.2,
    hemi: '#c9a8c8',
    hemiI: 1.05,
    win: '#ff9f7a',
    winI: 4,
    lampI: 5.5,
  },
  { h: 19.6, ...NIGHT, top: '#111845', bottom: '#2c336e' },
  { h: 24, ...NIGHT },
];

// luz do quarto acesa: iluminação fixa, independe da hora e do clima
const INDOOR = { sun: '#fff1dc', sunI: 2.1, hemi: '#fff4e6', hemiI: 1.55, ceilingI: 3.2 };
const LIGHT_KEY = 'portfolio3d:light';

const COLOR_KEYS = ['top', 'bottom', 'sun', 'hemi', 'win'];
const NUM_KEYS = ['day', 'sunI', 'hemiI', 'winI', 'lampI'];

const SKY_FPS = 15;
const brasilia = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'America/Sao_Paulo',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

const rand = (a, b) => a + Math.random() * (b - a);
const c1 = new THREE.Color();
const c2 = new THREE.Color();

function mixColor(a, b, t) {
  return '#' + c1.set(a).lerp(c2.set(b), t).getHexString();
}

/** Hora em Brasília como número (14.5 = 14:30). */
export function brasiliaHour(date = new Date()) {
  const [h, m, s] = brasilia.format(date).split(':').map(Number);
  return h + m / 60 + s / 3600;
}

export class Environment {
  constructor(exp, { window: win, lights, setClock }) {
    this.exp = exp;
    this.win = win;
    this.lights = lights;
    this.setClock = setClock;

    const params = new URLSearchParams(location.search);
    const fixed = params.get('hora');
    if (fixed) {
      const [h, m = 0] = fixed.split(':').map(Number);
      if (!Number.isNaN(h)) this.fixedHour = THREE.MathUtils.clamp(h + m / 60, 0, 23.99);
    }
    this.hour = this.fixedHour ?? brasiliaHour();

    // clima: clear → raining → clearing → clear...
    this.rain = 0;
    this.rainTarget = 0;
    this.wet = 0;
    this.flash = 0;
    const forced = params.get('chuva');
    this.noRain = forced === '0';
    if (forced === '1' || (!this.noRain && Math.random() < 0.2)) {
      this.startRain();
      if (forced === '1') this.rain = this.rainTarget; // já começa chovendo
    } else {
      this.weather = 'clear';
      this.weatherTimer = rand(60, 180);
    }

    // interruptor: estado salvo no navegador de quem visita
    try {
      this.lightOn = localStorage.getItem(LIGHT_KEY) === 'on';
    } catch {
      this.lightOn = false;
    }
    this.indoor = this.lightOn ? 1 : 0;
    this.flicker = 0;

    this.skyAcc = 1;
    this.clockAcc = 1;
    this.lastClock = '';
    this.state = {};
    exp.onUpdate((dt, t) => this.update(dt, t));
  }

  get isRaining() {
    return this.rain > 0.25;
  }

  /** Força chuva (true) ou faz parar (false). Útil pelo console. */
  setRain(on) {
    if (on) this.startRain();
    else this.stopRain();
  }

  startRain() {
    this.weather = 'raining';
    this.rainTarget = rand(0.55, 1);
    this.weatherTimer = rand(45, 110);
  }

  stopRain() {
    this.weather = 'clearing';
    this.rainTarget = 0;
  }

  /** Liga/desliga a luz do quarto. Retorna o novo estado. */
  toggleLight(on = !this.lightOn) {
    this.lightOn = on;
    if (on) this.flicker = 0.3; // piscadinha de lâmpada acendendo
    try {
      localStorage.setItem(LIGHT_KEY, on ? 'on' : 'off');
    } catch {
      /* sem storage: vale só nesta visita */
    }
    return on;
  }

  setHour(h) {
    this.fixedHour = h;
  }

  updateWeather(dt) {
    this.weatherTimer -= dt;
    if (this.weather === 'clear' && this.weatherTimer <= 0) {
      if (!this.noRain && Math.random() < 0.45) this.startRain();
      else this.weatherTimer = rand(60, 180);
    } else if (this.weather === 'raining' && this.weatherTimer <= 0) {
      this.stopRain();
    } else if (this.weather === 'clearing' && this.rain < 0.01) {
      this.weather = 'clear';
      this.rain = 0;
      this.weatherTimer = rand(90, 240);
    }

    // a chuva engrossa em ~15 s e vai parando devagar (~1 min até secar o céu)
    const rate = this.rainTarget > this.rain ? 0.065 : 0.05;
    this.rain += (this.rainTarget - this.rain) * Math.min(1, dt * rate);
    // vidro molha rápido e seca bem mais devagar que a chuva
    const dry = this.rain > this.wet ? 0.5 : 0.03;
    this.wet += (this.rain - this.wet) * Math.min(1, dt * dry);

    // relâmpago de vez em quando na chuva forte
    this.flash = Math.max(0, this.flash - dt * 3);
    if (this.rain > 0.8 && Math.random() < dt * 0.04) this.flash = 1;
  }

  /** Interpola os pontos-chave pra hora atual. */
  sample(h) {
    let i = 0;
    while (i < KEYS.length - 2 && KEYS[i + 1].h <= h) i++;
    const a = KEYS[i];
    const b = KEYS[i + 1];
    const t = (h - a.h) / (b.h - a.h || 1);
    const out = {};
    for (const k of COLOR_KEYS) out[k] = mixColor(a[k], b[k], t);
    for (const k of NUM_KEYS) out[k] = a[k] + (b[k] - a[k]) * t;
    return out;
  }

  update(dt, t) {
    this.clockAcc += dt;
    if (this.clockAcc >= 1) {
      this.clockAcc = 0;
      if (this.fixedHour == null) this.hour = brasiliaHour();
      else this.hour = this.fixedHour;
      const hh = String(Math.floor(this.hour)).padStart(2, '0');
      const mm = String(Math.floor((this.hour % 1) * 60)).padStart(2, '0');
      const text = `${hh}:${mm}`;
      if (text !== this.lastClock) {
        this.lastClock = text;
        this.setClock?.(text);
      }
    }

    this.updateWeather(dt);

    const s = this.sample(this.hour);
    const rain = this.rain;

    // chuva: céu acinzenta (mais claro de dia, quase preto à noite)
    const greyTop = mixColor('#1b2030', '#5b6573', s.day);
    const greyBottom = mixColor('#2a3045', '#9aa5b1', s.day);
    const top = mixColor(s.top, greyTop, rain * 0.85);
    const bottom = mixColor(s.bottom, greyBottom, rain * 0.85);

    // ----- luzes do quarto -----
    const L = this.lights;
    const flash = this.flash;

    // interruptor: transição rápida, com uma piscada ao acender
    this.indoor += ((this.lightOn ? 1 : 0) - this.indoor) * Math.min(1, dt * 12);
    let indoor = this.indoor;
    if (this.flicker > 0) {
      this.flicker -= dt;
      if (this.flicker > 0.12 && this.flicker < 0.22) indoor *= 0.25;
    }

    // natural (hora + chuva) misturado com a luz acesa
    // chuva escurece mais de dia (à noite já está escuro, não pode sumir tudo)
    const sunI = s.sunI * (1 - rain * 0.5 * s.day);
    const hemiI = s.hemiI * (1 - rain * 0.2 * s.day);
    L.sun.color.set(mixColor(s.sun, INDOOR.sun, indoor));
    L.sun.intensity = sunI + (INDOOR.sunI - sunI) * indoor + flash * 1.5;
    L.hemi.color.set(mixColor(s.hemi, INDOOR.hemi, indoor));
    L.hemi.intensity = hemiI + (INDOOR.hemiI - hemiI) * indoor + flash * 0.8;
    L.ceiling.intensity = INDOOR.ceilingI * indoor;
    L.window.color.set(rain > 0.5 ? mixColor(s.win, '#b8c6dd', rain - 0.5) : s.win);
    L.window.intensity = s.winI * (1 - rain * 0.4) + flash * 8;
    if (L.lamp) L.lamp.intensity = s.lampI;

    // ----- céu da janela (15 fps basta e economiza upload de textura) -----
    this.skyAcc += dt;
    if (this.skyAcc < 1 / SKY_FPS) return;
    const step = this.skyAcc;
    this.skyAcc = 0;

    const h = this.hour;
    const { w, h: skyH } = SKY_SIZE;
    // sol: 6h → 18h num arco; lua: 18h → 6h
    let sunPos = null;
    let moonPos = null;
    if (h > 5.6 && h < 18.8) {
      const p = (h - 5.6) / 13.2;
      sunPos = [w * (0.08 + p * 0.84), skyH * 0.62 - Math.sin(p * Math.PI) * skyH * 0.48];
    } else {
      const p = ((h + 24 - 18.8) % 24) / 10.8;
      moonPos = [w * (0.1 + p * 0.8), skyH * 0.55 - Math.sin(p * Math.PI) * skyH * 0.4];
    }

    Object.assign(this.state, {
      top,
      bottom,
      day: s.day,
      rain,
      wet: this.wet,
      clouds: Math.min(1, 0.3 + rain * 0.9),
      sunPos,
      moonPos,
      sunColor: s.sun,
      flash,
      time: t,
    });
    this.win.draw(this.state, step);
  }
}
