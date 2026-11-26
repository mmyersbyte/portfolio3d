import * as THREE from 'three';

const TAP_MAX_MOVE = 8; // px
const TAP_MAX_TIME = 450; // ms
const HOVER_SCALE = 1.08;

/**
 * Raycast de hover/clique. Objetos se registram com `register(object, { label, onClick })`.
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

    const el = exp.canvas;
    el.addEventListener('pointermove', (e) => this.handleMove(e));
    el.addEventListener('pointerdown', (e) => {
      this.down = { x: e.clientX, y: e.clientY, t: performance.now() };
    });
    el.addEventListener('pointerup', (e) => this.handleUp(e));
    el.addEventListener('pointerleave', () => this.setHovered(null));

    exp.onUpdate((dt) => this.animate(dt));
  }

  register(object, { label, onClick }) {
    const entry = { object, label, onClick, baseScale: object.scale.clone(), hover: 0 };
    object.traverse((child) => (child.userData.interactive = entry));
    this.entries.push(entry);
    return entry;
  }

  pick(clientX, clientY) {
    this.ndc.set((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(this.ndc, this.exp.camera);
    // raycast na cena inteira para que móveis na frente bloqueiem o que está atrás
    const hits = this.raycaster.intersectObjects(this.exp.scene.children, true);
    for (const hit of hits) {
      if (!hit.object.visible || hit.object.userData.noRaycast) continue;
      return hit.object.userData.interactive ?? null;
    }
    return null;
  }

  handleMove(e) {
    this.ndc.set(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1,
    );
    if (e.pointerType !== 'mouse' || e.buttons) return;
    this.setHovered(this.pick(e.clientX, e.clientY), e.clientX, e.clientY);
  }

  handleUp(e) {
    const d = this.down;
    this.down = null;
    if (!d) return;
    const moved = Math.hypot(e.clientX - d.x, e.clientY - d.y);
    if (moved > TAP_MAX_MOVE || performance.now() - d.t > TAP_MAX_TIME) return;
    const entry = this.pick(e.clientX, e.clientY);
    if (!entry) return;
    this.setHovered(null); // some o tooltip quando abre modal/chat
    entry.onClick?.();
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
      const s = 1 + (HOVER_SCALE - 1) * entry.hover;
      entry.object.scale.copy(entry.baseScale).multiplyScalar(s);
    }
  }
}
