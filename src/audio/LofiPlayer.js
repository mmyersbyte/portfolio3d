/**
 * Lo-fi gerado na hora com Web Audio (nada de arquivo de música: original e sem
 * direitos autorais). Piano elétrico com acordes jazz, baixo, bateria boom-bap
 * com swing, chiado de vinil e uma melodia de vez em quando com eco.
 *
 * Agenda as notas com "lookahead" (padrão do Web Audio pra timing preciso) e
 * avisa os visuais a cada passo via onStep (caixinha pulsando, notinhas saindo).
 */

const BPM = 72;
const STEP = 60 / BPM / 4; // semicolcheia
const SWING = 0.16; // atraso dos contratempos (o "balanço" do lo-fi)
const VOLUME = 0.7;

// ii–V–I–vi em C: Dm9 · G13 · Cmaj9 · Am9 (MIDI)
const CHORDS = [
  [50, 53, 57, 60, 64],
  [43, 53, 59, 64],
  [48, 52, 55, 59, 62],
  [45, 55, 60, 64, 71],
];
const BASS = [38, 31, 36, 33];
const PENTATONIC = [72, 74, 76, 79, 81, 84];

// padrões de 16 passos (1 compasso)
const KICK = [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0];
const SNARE = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
const HAT = [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0];

const freq = (midi) => 440 * 2 ** ((midi - 69) / 12);

export class LofiPlayer {
  constructor() {
    this.playing = false;
    this.step = 0;
    this.changeListeners = new Set();
    this.stepListeners = new Set();
  }

  get isPlaying() {
    return this.playing;
  }

  /** (playing) => void */
  onChange(fn) {
    this.changeListeners.add(fn);
    return () => this.changeListeners.delete(fn);
  }

  /** ({ step, bar }) => void, sincronizado com o som */
  onStep(fn) {
    this.stepListeners.add(fn);
    return () => this.stepListeners.delete(fn);
  }

  toggle() {
    return this.playing ? this.pause() : this.play();
  }

  async play() {
    if (this.playing) return;
    if (!this.ctx) this.setup();
    this.playing = true;
    this.emitChange();
    clearTimeout(this.suspendTimer);
    await this.ctx.resume();
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(VOLUME, now, 0.4); // entra suave
    this.nextTime = now + 0.1;
    this.timer = setInterval(() => this.schedule(), 25);
    this.schedule();
  }

  pause() {
    if (!this.playing) return;
    this.playing = false;
    this.emitChange();
    clearInterval(this.timer);
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(0, now, 0.15);
    // suspende o contexto depois do fade (economiza CPU/bateria)
    this.suspendTimer = setTimeout(() => !this.playing && this.ctx.suspend(), 700);
  }

  emitChange() {
    for (const fn of this.changeListeners) fn(this.playing);
  }

  setup() {
    const ctx = (this.ctx = new AudioContext());

    // cadeia final: tudo abafadinho, como fita/vinil
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const warm = ctx.createBiquadFilter();
    warm.type = 'lowpass';
    warm.frequency.value = 2600;
    warm.Q.value = 0.4;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    this.master.connect(warm).connect(comp).connect(ctx.destination);
    this.bus = this.master;

    // eco da melodia
    this.delay = ctx.createDelay(1);
    this.delay.delayTime.value = STEP * 3; // colcheia pontuada
    const feedback = ctx.createGain();
    feedback.gain.value = 0.35;
    const delayTone = ctx.createBiquadFilter();
    delayTone.type = 'lowpass';
    delayTone.frequency.value = 1400;
    this.delay.connect(delayTone).connect(feedback).connect(this.delay);
    delayTone.connect(this.bus);

    // ruído branco reaproveitado pela bateria
    this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    this.startCrackle();
  }

  /** Chiado de vinil em loop: chiadinho de fundo + estalos aleatórios. */
  startCrackle() {
    const ctx = this.ctx;
    const len = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * 0.006;
      if (Math.random() < 0.0004) {
        const amp = 0.15 + Math.random() * 0.25;
        for (let j = 0; j < 40 && i + j < len; j++)
          d[i + j] += amp * (Math.random() - 0.5) * (1 - j / 40);
      }
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 3500;
    const gain = ctx.createGain();
    gain.gain.value = 0.55;
    src.connect(tone).connect(gain).connect(this.bus);
    src.start();
  }

  schedule() {
    // aba em segundo plano: o navegador atrasa os timers, então agenda mais à frente
    const ahead = document.hidden ? 1.5 : 0.15;
    while (this.nextTime < this.ctx.currentTime + ahead) {
      this.playStep(this.step, this.nextTime);
      this.nextTime += STEP;
      this.step = (this.step + 1) % 64;
    }
  }

  playStep(step, time) {
    const s = step % 16;
    const bar = Math.floor(step / 16) % 4;
    const t = time + (s % 2 ? SWING * STEP : 0);

    if (s === 0) {
      this.chord(CHORDS[bar], t, STEP * 15, 1);
      this.bass(BASS[bar], t, STEP * 7);
    }
    if (s === 8) this.bass(BASS[bar] + (Math.random() < 0.5 ? 7 : 0), t, STEP * 6);
    if (s === 10 && Math.random() < 0.45) this.chord(CHORDS[bar].slice(1), t, STEP * 5, 0.55);

    if (KICK[s]) this.kick(t);
    if (SNARE[s]) this.snare(t);
    if (HAT[s]) this.hat(t, s % 4 === 0 ? 1 : 0.55 + Math.random() * 0.3);

    // melodia: só em alguns compassos, notas soltas da pentatônica
    if (bar % 2 === 1 && s % 2 === 0 && Math.random() < 0.22) {
      this.bell(PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)], t);
    }

    // avisa os visuais no momento em que o som acontece
    const delayMs = Math.max(0, (t - this.ctx.currentTime) * 1000);
    setTimeout(() => {
      if (!this.playing) return;
      for (const fn of this.stepListeners) fn({ step: s, bar });
    }, delayMs);
  }

  // ---------- instrumentos ----------

  envelope(gain, t, peak, attack, release) {
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
  }

  /** Piano elétrico: seno + triângulo levemente desafinados ("wow" de fita). */
  chord(notes, t, dur, vel) {
    const ctx = this.ctx;
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 1500;
    tone.connect(this.bus);
    notes.forEach((m, i) => {
      for (const [type, level] of [
        ['sine', 1],
        ['triangle', 0.35],
      ]) {
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = freq(m);
        osc.detune.value = (Math.random() - 0.5) * 14;
        const g = ctx.createGain();
        // dedilhado: cada nota entra um tiquinho depois
        const start = t + i * 0.012;
        this.envelope(g, start, 0.05 * vel * level, 0.02, dur);
        osc.connect(g).connect(tone);
        osc.start(start);
        osc.stop(start + dur + 0.1);
      }
    });
  }

  bass(m, t, dur) {
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq(m);
    const g = this.ctx.createGain();
    this.envelope(g, t, 0.22, 0.02, dur);
    osc.connect(g).connect(this.bus);
    osc.start(t);
    osc.stop(t + dur + 0.1);
  }

  kick(t) {
    const osc = this.ctx.createOscillator();
    osc.frequency.setValueAtTime(115, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    const g = this.ctx.createGain();
    this.envelope(g, t, 0.55, 0.005, 0.32);
    osc.connect(g).connect(this.bus);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  noiseHit(t, { type, frequency, q = 0.8, peak, release }) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = q;
    const g = this.ctx.createGain();
    this.envelope(g, t, peak, 0.003, release);
    src.connect(filter).connect(g).connect(this.bus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + release + 0.05);
  }

  snare(t) {
    this.noiseHit(t, { type: 'bandpass', frequency: 1700, peak: 0.16, release: 0.17 });
    const body = this.ctx.createOscillator();
    body.type = 'triangle';
    body.frequency.value = 185;
    const g = this.ctx.createGain();
    this.envelope(g, t, 0.06, 0.003, 0.09);
    body.connect(g).connect(this.bus);
    body.start(t);
    body.stop(t + 0.15);
  }

  hat(t, vel) {
    this.noiseHit(t, {
      type: 'highpass',
      frequency: 7000,
      q: 0.5,
      peak: 0.035 * vel,
      release: 0.045,
    });
  }

  /** Sininho da melodia, com eco. */
  bell(m, t) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    this.envelope(g, t, 0.045, 0.01, 1.1);
    g.connect(this.bus);
    g.connect(this.delay);
    for (const [mult, level] of [
      [1, 1],
      [2, 0.25],
    ]) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq(m) * mult;
      const lg = ctx.createGain();
      lg.gain.value = level;
      osc.connect(lg).connect(g);
      osc.start(t);
      osc.stop(t + 1.3);
    }
  }
}

export const LOFI_BPM = BPM;
