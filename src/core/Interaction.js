import * as THREE from 'three';

const TAP_MAX_MOVE = 8; // px
const TAP_MAX_TIME = 450; // ms
const HOVER_SCALE = 1.08;

/**
 * Raycast de hover/clique.
 * - Objetos se registram com `register(object, { label, onClick, hoverScale })`.
 * - Meshes com `userData.floor = true` contam como piso: disparam onFloorHover/onFloorClick
 *   com o ponto (x, z) atingido.
 * Clique só dispara se o ponteiro quase não se moveu (senão era um arrasto da câmera).
 */
export class Interaction {
  constructor(exp) {
    this.exp = exp;
    this.raycaster = new THREE.Raycaster();
    this.ndc = new THREE.Vector2(0, 0); // posição do ponteiro em NDC, usada também pelo boneco
    this.entries = [];
    this.hovered = null;
    this.down = null;
    this.onHover = null; // (entry | null, clientX, clientY) => void
    this.onFloorHover = null; // (point | null) => void
    this.onFloorClick = null; // (point) => void

    const el = exp.canvas;
    el.addEventListener('pointermove', (e) => this.handleMove(e));
    el.addEventListener('pointerdown', (e) => {
      this.down = { x: e.clientX, y: e.clientY, t: performance.now() };
    });
    el.addEventListener('pointerup', (e) => this.handleUp(e));
    el.addEventListener('pointerleave', () => {
      this.setHovered(null);
      this.onFloorHover?.(null);
    });

    exp.onUpdate((dt) => this.animate(dt));
  }

  register(object, { label, onClick, hoverScale = HOVER_SCALE }) {
    const entry = {
      object,
      label,
      onClick,
      hoverScale,
      baseScale: object.scale.clone(),
      hover: 0,
    };
    object.traverse((child) => (child.userData.interactive = entry));
    this.entries.push(entry);
    return entry;
  }

  setPointer(clientX, clientY) {
    this.ndc.set((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
  }

  /** Primeiro objeto sob o ponteiro: { entry } se for clicável, { floor: Vector3 } se for piso. */
  pick(clientX, clientY) {
    this.setPointer(clientX, clientY);
    this.raycaster.setFromCamera(this.ndc, this.exp.camera);
    // raycast na cena inteira para que móveis na frente bloqueiem o que está atrás
    const hits = this.raycaster.intersectObjects(this.exp.scene.children, true);
    for (const hit of hits) {
      const data = hit.object.userData;
      if (!hit.object.visible || data.noRaycast) continue;
      if (data.interactive) return { entry: data.interactive };
      if (data.floor) return { floor: hit.point };
      return {};
    }
    return {};
  }

  handleMove(e) {
    this.setPointer(e.clientX, e.clientY);
    if (e.pointerType !== 'mouse' || e.buttons) return;
    const { entry = null, floor = null } = this.pick(e.clientX, e.clientY);
    this.setHovered(entry, e.clientX, e.clientY);
    this.onFloorHover?.(floor);
  }

  handleUp(e) {
    const d = this.down;
    this.down = null;
    if (!d) return;
    const moved = Math.hypot(e.clientX - d.x, e.clientY - d.y);
    if (moved > TAP_MAX_MOVE || performance.now() - d.t > TAP_MAX_TIME) return;
    const { entry, floor } = this.pick(e.clientX, e.clientY);
    if (entry) {
      this.setHovered(null); // some o tooltip quando abre modal/chat
      entry.onClick?.();
    } else if (floor) {
      this.onFloorClick?.(floor);
    }
  }

  setHovered(entry, x = 0, y = 0) {
    this.hovered = entry;
    this.exp.canvas.style.cursor = entry ? 'pointer' : '';
    this.onHover?.(entry, x, y);
  }

  animate(dt) {
    const k = 1 - Math.exp(-dt * 14);
    for (const entry of this.entries) {
      entry.hover += ((entry === this.hovered ? 1 : 0) - entry.hover) * k;
      const s = 1 + (entry.hoverScale - 1) * entry.hover;
      entry.object.scale.copy(entry.baseScale).multiplyScalar(s);
    }
  }
}
