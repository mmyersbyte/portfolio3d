import * as THREE from 'three';
import { box, mat } from './helpers.js';
import { LAYOUT } from './layout.js';
import { TOPS } from '../data/wardrobe.js';

const WOOD = '#8a5a3b';
const WOOD_LIGHT = '#a8724b';
const DOOR_OPEN = 1.35; // rad

/**
 * Guarda-roupa encostado na parede esquerda (frente virada pra +x).
 * Duas portas com dobradiça nas bordas, abrem/fecham suavemente.
 */
export class Wardrobe {
  constructor(exp) {
    const { x, z, w, d, h } = LAYOUT.wardrobe;
    this.group = new THREE.Group();
    this.group.name = 'wardrobe';
    this.group.position.set(x, 0, z);
    this.open = 0;
    this.target = 0;

    const g = this.group;
    const front = w / 2;

    // corpo: fundo, laterais, topo, base e pézinhos
    box(0.04, h, d, '#5e3d27', { x: -w / 2 + 0.02, y: 0.08, parent: g });
    for (const side of [-1, 1])
      box(w, h, 0.05, WOOD, { y: 0.08, z: side * (d / 2 - 0.025), parent: g });
    box(w + 0.06, 0.08, d + 0.08, WOOD_LIGHT, { y: h + 0.08, parent: g });
    box(w, 0.06, d, WOOD, { y: 0.08, parent: g });
    for (const fz of [-d / 2 + 0.08, d / 2 - 0.08]) {
      box(0.08, 0.08, 0.08, '#3b2a1e', { x: front - 0.08, z: fz, parent: g });
      box(0.08, 0.08, 0.08, '#3b2a1e', { x: -w / 2 + 0.08, z: fz, parent: g });
    }

    // interior: cabideiro com roupas nas cores do guarda-roupa
    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, d - 0.1, 6),
      mat('#c0c0c8'),
    );
    rod.rotation.x = Math.PI / 2;
    rod.position.set(-0.02, h - 0.2, 0);
    g.add(rod);
    const colors = TOPS.map((o) => o.id);
    const step = (d - 0.25) / (colors.length - 1);
    colors.forEach((c, i) => {
      const cz = -d / 2 + 0.125 + i * step;
      box(0.36, 0.55, 0.07, c, { x: -0.02, y: h - 0.8, z: cz, parent: g });
      box(0.2, 0.06, 0.07, c, { x: -0.02, y: h - 0.29, z: cz, parent: g, shadow: false });
    });
    // gaveta embaixo
    box(0.04, 0.32, d - 0.1, WOOD_LIGHT, { x: front - 0.04, y: 0.14, parent: g });
    box(0.03, 0.04, 0.24, '#d9b26f', { x: front, y: 0.29, parent: g, shadow: false });

    // portas: grupo com pivô na dobradiça
    const doorH = h - 0.42;
    const doorD = d / 2 - 0.04;
    this.doors = [-1, 1].map((side) => {
      const pivot = new THREE.Group();
      pivot.position.set(front - 0.02, 0.48, side * (d / 2 - 0.03));
      // a porta se estende da dobradiça pro centro
      box(0.04, doorH, doorD, WOOD_LIGHT, { z: -side * (doorD / 2), parent: pivot });
      box(0.02, doorH - 0.2, doorD - 0.16, WOOD, {
        x: 0.025,
        y: 0.1,
        z: -side * (doorD / 2),
        parent: pivot,
        shadow: false,
      });
      box(0.03, 0.22, 0.03, '#d9b26f', {
        x: 0.04,
        y: doorH / 2 - 0.1,
        z: -side * (doorD - 0.07),
        parent: pivot,
        shadow: false,
      });
      g.add(pivot);
      return { pivot, side };
    });

    exp.scene.add(g);
    exp.onUpdate((dt) => this.update(dt));
  }

  setOpen(open) {
    this.target = open ? 1 : 0;
  }

  update(dt) {
    this.open += (this.target - this.open) * (1 - Math.exp(-dt * 6));
    for (const { pivot, side } of this.doors) {
      // as duas abrem pra fora (+x): a de -z gira positivo, a de +z negativo
      pivot.rotation.y = -side * DOOR_OPEN * this.open;
    }
  }
}
