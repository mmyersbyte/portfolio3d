import * as THREE from 'three';

const RISE_SPEED = 16; // px/s
const SAY_LIFE = 5; // s
const FADE = 0.8; // s

/**
 * Balões em HTML que seguem um ponto 3D (fala do boneco, "miau" do gato...).
 * `say()` cria balões de fala estilo Habbo: sobem devagar, empurram os
 * anteriores pra cima e somem com o tempo.
 */
export class WorldLabels {
  constructor(exp, container) {
    this.exp = exp;
    this.container = container;
    this.items = new Set();
    this.rising = new Set();
    this.v = new THREE.Vector3();
    exp.onUpdate((dt) => this.update(dt));
  }

  add(anchor, { text = '', className = '' } = {}) {
    const el = document.createElement('div');
    el.className = `bubble ${className}`.trim();
    el.textContent = text;
    this.container.append(el);
    const item = {
      el,
      anchor,
      set text(value) {
        el.textContent = value;
      },
      show: () => el.classList.remove('is-hidden'),
      hide: () => el.classList.add('is-hidden'),
      remove: () => {
        el.remove();
        this.items.delete(item);
      },
    };
    this.items.add(item);
    return item;
  }

  /** Balão temporário que some sozinho. Retorna o item (dá pra remover antes). */
  flash(anchor, text, ms = 1600, className = '') {
    const item = this.add(anchor, { text, className });
    setTimeout(() => {
      item.hide();
      setTimeout(() => item.remove(), 300);
    }, ms);
    return item;
  }

  /** Balão de fala com nome em negrito, estilo chat do Habbo. */
  say(anchor, name, text) {
    const el = document.createElement('div');
    el.className = 'bubble bubble--say';
    const who = document.createElement('b');
    who.textContent = `${name}: `;
    el.append(who, text);
    this.container.append(el);
    // empurra os balões anteriores pra cima, igual no Habbo
    const push = el.offsetHeight + 8;
    for (const item of this.rising) item.offset += push;
    this.rising.add({ el, anchor, offset: 0, age: 0 });
  }

  update(dt = 0) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    for (const item of this.items) {
      item.anchor.getWorldPosition(this.v).project(this.exp.camera);
      const x = (this.v.x * 0.5 + 0.5) * w;
      const y = (-this.v.y * 0.5 + 0.5) * h;
      item.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    }

    for (const item of this.rising) {
      item.age += dt;
      item.offset += RISE_SPEED * dt;
      if (item.age > SAY_LIFE) {
        item.el.remove();
        this.rising.delete(item);
        continue;
      }
      item.anchor.getWorldPosition(this.v).project(this.exp.camera);
      const x = (this.v.x * 0.5 + 0.5) * w;
      const y = (-this.v.y * 0.5 + 0.5) * h - item.offset;
      item.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      item.el.style.opacity = Math.min(1, (SAY_LIFE - item.age) / FADE, item.age / 0.15).toFixed(2);
    }
  }
}
