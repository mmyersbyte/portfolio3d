import * as THREE from 'three';
import { canvasTexture } from './helpers.js';
import { ROOM } from './layout.js';

const TILE = 1;
const MAX = ROOM.half - TILE / 2;

/** Centro do tile (1x1) que contém o ponto. */
export function snapToTile(point) {
  const snap = (v) => THREE.MathUtils.clamp(Math.floor(v / TILE) * TILE + TILE / 2, -MAX, MAX);
  return { x: snap(point.x), z: snap(point.z) };
}

/**
 * Quadrado branco no piso estilo Habbo: segue o mouse (hover)
 * e marca o destino quando o boneco começa a andar.
 */
export class TileHighlight {
  constructor(exp) {
    const tex = canvasTexture(128, 128, (ctx, w, h) => {
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 7;
      ctx.strokeRect(6, 6, w - 12, h - 12);
    });

    const make = (opacity) => {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(TILE * 0.96, TILE * 0.96),
        new THREE.MeshBasicMaterial({
          map: tex,
          transparent: true,
          opacity,
          depthWrite: false,
          toneMapped: false,
        }),
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.02;
      mesh.renderOrder = 1;
      mesh.visible = false;
      mesh.userData.noRaycast = true;
      exp.scene.add(mesh);
      return mesh;
    };

    this.hover = make(0.9);
    this.target = make(0.6);
    this.targetLife = 0;

    exp.onUpdate((dt, t) => {
      if (this.targetLife <= 0) return;
      this.targetLife -= dt;
      this.target.material.opacity =
        Math.min(0.6, this.targetLife * 2) * (0.75 + Math.sin(t * 10) * 0.25);
      if (this.targetLife <= 0) this.target.visible = false;
    });
  }

  show(tile) {
    this.hover.visible = Boolean(tile);
    if (tile) this.hover.position.set(tile.x, 0.02, tile.z);
  }

  /** Marca o destino por um tempinho (útil no celular, onde não tem hover). */
  mark(tile) {
    this.target.position.set(tile.x, 0.021, tile.z);
    this.target.visible = true;
    this.targetLife = 1.2;
  }
}
