import * as THREE from 'three';
import { canvasTexture } from './helpers.js';
import { LAYOUT } from './layout.js';

const TOP = 0.55; // altura do tampo do criado-mudo
const H = 0.2;
const R = 0.085;
const NOTE_LIFE = 2.6;
const NOTE_COLORS = ['#ffd166', '#8ecae6', '#ff8fab', '#95d5b2', '#cdb4db'];

/** Textura de nota musical em pixel art (colcheia ou duas colcheias ligadas). */
function noteTexture(double) {
  return canvasTexture(32, 32, (ctx) => {
    ctx.fillStyle = '#fff';
    const head = (x, y) => {
      ctx.fillRect(x, y + 1, 6, 3);
      ctx.fillRect(x + 1, y, 4, 5);
    };
    if (double) {
      head(5, 22);
      head(19, 19);
      ctx.fillRect(10, 6, 2, 18); // hastes
      ctx.fillRect(24, 3, 2, 18);
      ctx.fillRect(10, 3, 16, 4); // barra
    } else {
      head(10, 22);
      ctx.fillRect(15, 5, 2, 19);
      ctx.fillRect(17, 5, 3, 3); // bandeirinha
      ctx.fillRect(19, 8, 3, 3);
      ctx.fillRect(20, 11, 2, 3);
    }
  });
}

/**
 * Caixinha de som inteligente no criado-mudo: anel de luz que pulsa no ritmo
 * e notinhas que sobem enquanto o lo-fi toca.
 */
export class Speaker {
  constructor(exp) {
    const { x, z } = LAYOUT.nightstand;
    const g = (this.group = new THREE.Group());
    g.name = 'speaker';
    g.position.set(x, TOP, z + 0.04);

    const fabric = new THREE.Mesh(
      new THREE.CylinderGeometry(R, R * 1.04, H, 20),
      new THREE.MeshStandardMaterial({ color: '#3a3d47', roughness: 1 }),
    );
    fabric.position.y = H / 2;
    fabric.castShadow = true;
    g.add(fabric);

    const top = new THREE.Mesh(
      new THREE.CylinderGeometry(R * 0.98, R * 0.98, 0.02, 20),
      new THREE.MeshStandardMaterial({ color: '#23252c', roughness: 0.5 }),
    );
    top.position.y = H + 0.01;
    g.add(top);

    // anel de luz (o brilho é a "cara" da caixinha)
    this.ringMat = new THREE.MeshBasicMaterial({
      color: '#5ad1ff',
      transparent: true,
      opacity: 0.25,
      toneMapped: false,
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R * 0.82, 0.012, 6, 28), this.ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = H + 0.022;
    g.add(ring);

    // brilho suave em volta quando toca
    this.glow = new THREE.PointLight('#5ad1ff', 0, 1.2, 2);
    this.glow.position.y = H + 0.1;
    g.add(this.glow);

    exp.scene.add(g);

    // notas: pool de sprites reaproveitados
    const textures = [noteTexture(false), noteTexture(true)];
    this.notes = Array.from({ length: 14 }, (_, i) => {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: textures[i % 2],
          transparent: true,
          opacity: 0,
          depthWrite: false,
        }),
      );
      sprite.visible = false;
      sprite.userData.noRaycast = true;
      exp.scene.add(sprite);
      return { sprite, age: NOTE_LIFE, sway: 0, drift: 0 };
    });
    this.nextNote = 0;
    this.pulse = 0;
    this.playing = false;
    this.origin = new THREE.Vector3();

    exp.onUpdate((dt, t) => this.update(dt, t));
  }

  /** Liga na música: anel acende e notas saem no ritmo. */
  attach(music) {
    music.onChange((playing) => (this.playing = playing));
    music.onStep(({ step }) => {
      if (step % 4 === 0) this.pulse = 1; // a cada tempo
      if (step === 0 || (step % 8 === 4 && Math.random() < 0.6)) this.emitNote();
    });
  }

  emitNote() {
    const n = this.notes[this.nextNote];
    this.nextNote = (this.nextNote + 1) % this.notes.length;
    this.group.getWorldPosition(this.origin);
    n.sprite.position.set(this.origin.x, this.origin.y + H + 0.08, this.origin.z);
    n.sprite.material.color.set(NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)]);
    n.sprite.visible = true;
    n.age = 0;
    n.sway = Math.random() * Math.PI * 2;
    n.drift = (Math.random() - 0.5) * 0.25;
  }

  update(dt, t) {
    this.pulse = Math.max(0, this.pulse - dt * 3);
    const base = this.playing ? 0.6 : 0.2;
    this.ringMat.opacity = Math.min(1, base + this.pulse * 0.4);
    this.glow.intensity = this.playing ? 0.25 + this.pulse * 0.5 : 0;

    for (const n of this.notes) {
      if (n.age >= NOTE_LIFE) continue;
      n.age += dt;
      const p = n.age / NOTE_LIFE;
      const s = n.sprite;
      s.position.y += dt * 0.32;
      s.position.x += Math.sin(t * 2.5 + n.sway) * dt * 0.12 + n.drift * dt;
      s.position.z += Math.cos(t * 2 + n.sway) * dt * 0.06;
      s.scale.setScalar(0.16 + p * 0.06);
      s.material.opacity = Math.min(1, p * 6) * (1 - p) ** 1.2;
      if (n.age >= NOTE_LIFE) s.visible = false;
    }
  }
}
