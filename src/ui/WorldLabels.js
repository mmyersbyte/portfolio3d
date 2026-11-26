import * as THREE from 'three';

/** Balões em HTML que seguem um ponto 3D (fala do boneco, "miau" do gato...). */
export class WorldLabels {
  constructor(exp, container) {
    this.exp = exp;
    this.container = container;
    this.items = new Set();
    this.v = new THREE.Vector3();
    exp.onUpdate(() => this.update());
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

  /** Balão temporário que some sozinho. */
  flash(anchor, text, ms = 1600) {
    const item = this.add(anchor, { text });
    setTimeout(() => {
      item.hide();
      setTimeout(() => item.remove(), 300);
    }, ms);
  }

  update() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    for (const item of this.items) {
      item.anchor.getWorldPosition(this.v).project(this.exp.camera);
      const x = (this.v.x * 0.5 + 0.5) * w;
      const y = (-this.v.y * 0.5 + 0.5) * h;
      item.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    }
  }
}
