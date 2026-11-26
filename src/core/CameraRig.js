import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Ângulo "Habbo": dimétrico 2:1, câmera olhando pela diagonal do quarto.
const AZIMUTH = Math.PI / 4;
const POLAR = Math.PI / 3;
const DISTANCE = 30;
const TARGET = new THREE.Vector3(0, 0.9, 0);

// área (em unidades do mundo) que sempre precisa caber na tela.
// Em tela em pé dá pra cortar as pontinhas do piso e ganhar tamanho.
const FIT_WIDTH = 13;
const FIT_WIDTH_PORTRAIT = 9.6;
const FIT_HEIGHT = 10.5;

// y folgado: os enquadramentos com painel aberto deslocam o alvo bem pra baixo
const PAN_LIMIT = new THREE.Vector3(4, 3, 4);
const FOCUS_TIME = 0.9; // s

export class CameraRig {
  constructor(exp) {
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    this.camera.position.setFromSphericalCoords(DISTANCE, POLAR, AZIMUTH).add(TARGET);
    this.camera.lookAt(TARGET);

    const c = (this.controls = new OrbitControls(this.camera, exp.canvas));
    c.target.copy(TARGET);
    c.enableDamping = true;
    c.dampingFactor = 0.08;
    // dá pra girar um pouco, mas nunca ver o quarto "por trás"
    c.minAzimuthAngle = AZIMUTH - 0.55;
    c.maxAzimuthAngle = AZIMUTH + 0.55;
    c.minPolarAngle = POLAR - 0.3;
    c.maxPolarAngle = POLAR + 0.12;
    c.minZoom = 0.8;
    c.maxZoom = 3;
    c.zoomToCursor = true;
    c.screenSpacePanning = true;
    c.rotateSpeed = 0.6;
    c.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };

    this.intro = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 0;
    this.camera.zoom = this.intro === 1 ? 1 : 0.65;
    c.enabled = this.intro === 1;

    this._min = TARGET.clone().sub(PAN_LIMIT);
    this._max = TARGET.clone().add(PAN_LIMIT);
    this._tmp = new THREE.Vector3();
    this.move = null;
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Leva a câmera até um ponto com zoom. shiftX/shiftY (fração da tela) deslocam
   * o ponto do centro, pra ele não ficar atrás de um painel aberto.
   */
  focus(point, { zoom = 2, shiftX = 0, shiftY = 0 } = {}) {
    const cam = this.camera;
    cam.updateMatrixWorld();
    const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
    const viewW = (cam.right - cam.left) / zoom;
    const viewH = (cam.top - cam.bottom) / zoom;
    const target = point
      .clone()
      .addScaledVector(right, -shiftX * viewW)
      .addScaledVector(up, -shiftY * viewH);
    this.startMove(target, zoom);
  }

  /** Volta pro enquadramento inicial. */
  reset() {
    this.startMove(TARGET, 1);
  }

  startMove(target, zoom) {
    this.move = {
      fromT: this.controls.target.clone(),
      toT: target.clone(),
      fromZ: this.camera.zoom,
      toZ: zoom,
      t: this.reducedMotion ? 1 : 0,
    };
  }

  resize(w, h) {
    const aspect = w / h;
    // garante que o quarto cabe tanto em celular em pé quanto em ultrawide
    const fitW = aspect < 1 ? FIT_WIDTH_PORTRAIT : FIT_WIDTH;
    const halfH = Math.max(FIT_HEIGHT / 2, fitW / aspect / 2);
    const cam = this.camera;
    cam.left = -halfH * aspect;
    cam.right = halfH * aspect;
    cam.top = halfH;
    cam.bottom = -halfH;
    cam.updateProjectionMatrix();
  }

  update(dt) {
    if (this.intro < 1) {
      this.intro = Math.min(1, this.intro + dt / 1.6);
      const e = 1 - Math.pow(1 - this.intro, 3);
      this.camera.zoom = THREE.MathUtils.lerp(0.65, 1, e);
      this.camera.updateProjectionMatrix();
      if (this.intro === 1) this.controls.enabled = true;
    }

    if (this.move) {
      const m = this.move;
      m.t = Math.min(1, m.t + dt / FOCUS_TIME);
      const e = 1 - Math.pow(1 - m.t, 3);
      const next = this._tmp.lerpVectors(m.fromT, m.toT, e);
      this.camera.position.add(next.clone().sub(this.controls.target));
      this.controls.target.copy(next);
      this.camera.zoom = THREE.MathUtils.lerp(m.fromZ, m.toZ, e);
      this.camera.updateProjectionMatrix();
      if (m.t === 1) this.move = null;
    }

    this.controls.update();

    // limita o pan sem "travar": move câmera e alvo juntos
    const target = this.controls.target;
    const clamped = this._tmp.copy(target).clamp(this._min, this._max);
    if (!clamped.equals(target)) {
      const offset = clamped.sub(target);
      target.add(offset);
      this.camera.position.add(offset);
    }
  }
}
