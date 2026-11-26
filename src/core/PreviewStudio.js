import * as THREE from 'three';
import { Avatar } from '../entities/Avatar.js';

const LIVE_TARGET = new THREE.Vector3(0, 1.08, 0);
const LIVE_YAW = 0.45;
const THUMB = 160; // px lógicos de cada miniatura
const FOV = 30;

/**
 * Enquadramento das miniaturas, por id da opção ou chave do grupo.
 * `target` é um ponto fixo; `part` mira no centro de uma peça do boneco.
 * yaw gira o boneco (0 = de frente), dist é a distância da câmera.
 */
const FRAMES = {
  style: { target: [0, 0.98, 0], dist: 1.75, yaw: 0.5, elev: 0.15 },
  hat: { target: [0, 1.82, 0], dist: 1.6, yaw: 0.55, elev: 0.3 },
  glasses: { target: [0, 1.65, 0.05], dist: 1.05, yaw: 0.4, elev: 0.1 },
  beard: { target: [0, 1.58, 0.05], dist: 1.05, yaw: 0.4, elev: 0.1 },
  backpack: { part: (a) => a.extras.backpack, dist: 1.8, yaw: Math.PI - 0.7, elev: 0.3 },
  chain: { part: (a) => a.extras.chain, dist: 0.85, yaw: 0.3, elev: 0.1 },
  watch: { part: (a) => a.extras.watch, dist: 0.6, yaw: 1.1, elev: 0.2 },
  mug: { part: (a) => a.extras.mug, dist: 0.9, yaw: -0.7, elev: 0.25 },
};

/**
 * "Estúdio" do guarda-roupa: uma cópia do boneco com luz própria.
 * - prévia ao vivo (girável) no celular
 * - miniaturas 3D de cada opção, desenhadas num canto do canvas e copiadas pros cards
 * Um renderer só pras duas coisas, pra não abrir mais um contexto WebGL.
 */
export class PreviewStudio {
  constructor(exp, canvas) {
    this.canvas = canvas;
    this.active = false;
    this.yaw = LIVE_YAW;
    this.drag = null;

    const r = (this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true, // pra copiar as miniaturas com drawImage
    }));
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.setClearColor(0x000000, 0);

    this.scene = new THREE.Scene();
    this.scene.add(new THREE.HemisphereLight('#fff6ea', '#7a6a5a', 1.6));
    const key = new THREE.DirectionalLight('#ffffff', 2.4);
    key.position.set(2, 4, 5);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight('#9fb4ff', 1.4);
    rim.position.set(-3, 2, -3);
    this.scene.add(rim);

    this.pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.62, 0.68, 0.08, 8),
      new THREE.MeshStandardMaterial({ color: '#e9dcc6', roughness: 0.9, flatShading: true }),
    );
    this.pedestal.position.y = -0.04;
    this.scene.add(this.pedestal);

    this.avatar = new Avatar(null, { scene: this.scene, standalone: true });
    this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50);
    this._box = new THREE.Box3();
    this._v = new THREE.Vector3();

    // arrastar gira o boneco
    canvas.addEventListener('pointerdown', (e) => {
      this.drag = { x: e.clientX, yaw: this.yaw };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (this.drag) this.yaw = this.drag.yaw + (e.clientX - this.drag.x) * 0.012;
    });
    const end = () => (this.drag = null);
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);

    window.addEventListener('resize', () => this.resize());
    this.resize();
    exp.onUpdate((dt, t) => this.update(dt, t));
  }

  /** Canvas visível (prévia do celular)? No desktop ele fica escondido e só serve pras miniaturas. */
  get visible() {
    return this.canvas.getClientRects().length > 0 && this.canvas.clientWidth > 0;
  }

  resize() {
    const w = this.visible ? this.canvas.clientWidth : THUMB;
    const h = this.visible ? this.canvas.clientHeight : THUMB;
    // o canvas precisa comportar pelo menos uma miniatura
    this.renderer.setSize(Math.max(w, THUMB), Math.max(h, THUMB), false);
  }

  setActive(on) {
    this.active = on;
    if (on) {
      this.yaw = LIVE_YAW;
      this.resize();
    }
  }

  setOutfit(outfit) {
    this.avatar.setOutfit(outfit);
  }

  update(dt, t) {
    if (!this.active || !this.visible) return;
    const a = this.avatar;
    if (!this.drag) this.yaw += Math.sin(t * 0.6) * dt * 0.08; // balancinho quando parado
    a.heading = this.yaw;
    a.root.rotation.y = this.yaw;
    a.update(dt, t);

    const size = this.renderer.getSize(this._v);
    const cam = this.camera;
    cam.aspect = size.x / size.y;
    // cabe o corpo inteiro (com chapéu) na altura disponível
    const dist = 2.35 / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
    cam.position.set(0, LIVE_TARGET.y + 0.45, dist);
    cam.lookAt(LIVE_TARGET);
    cam.updateProjectionMatrix();

    const r = this.renderer;
    r.setScissorTest(false);
    r.setViewport(0, 0, size.x, size.y);
    this.pedestal.visible = true;
    r.render(this.scene, cam);
  }

  /** Desenha a miniatura de `outfit` no <canvas> do card. */
  thumbnail(target, outfit, frameKey) {
    const f = FRAMES[frameKey] ?? FRAMES.style;
    const a = this.avatar;
    const r = this.renderer;

    a.setOutfit(outfit);
    a.root.rotation.y = f.yaw;
    a.head.rotation.set(0, 0, 0);
    for (const eye of a.eyes) eye.scale.y = 1;
    a.root.updateMatrixWorld(true);

    const point = f.part
      ? this._box.setFromObject(f.part(a)).getCenter(this._v)
      : this._v.fromArray(f.target);
    const cam = this.camera;
    cam.aspect = 1;
    cam.position.set(point.x, point.y + (f.elev ?? 0.2), point.z + f.dist);
    cam.lookAt(point);
    cam.updateProjectionMatrix();

    this.pedestal.visible = false;
    r.setScissorTest(true);
    r.setViewport(0, 0, THUMB, THUMB);
    r.setScissor(0, 0, THUMB, THUMB);
    r.clear();
    r.render(this.scene, cam);
    r.setScissorTest(false);

    // viewport do WebGL começa embaixo; no canvas 2D a origem é em cima
    const px = THUMB * r.getPixelRatio();
    const ctx = target.getContext('2d');
    ctx.clearRect(0, 0, target.width, target.height);
    ctx.drawImage(
      r.domElement,
      0,
      r.domElement.height - px,
      px,
      px,
      0,
      0,
      target.width,
      target.height,
    );
  }
}
