import * as THREE from 'three';
import { CameraRig } from './CameraRig.js';
import { Interaction } from './Interaction.js';

/**
 * Dono do renderer, da cena e do loop. Tudo que precisa ser
 * atualizado por frame se registra com `onUpdate`.
 */
export class Experience {
  constructor(canvas) {
    this.canvas = canvas;
    this.isTouch = matchMedia('(pointer: coarse)').matches;
    this.updaters = new Set();
    this.timer = new THREE.Timer();
    this.timer.connect(document); // pausa o delta quando a aba fica oculta
    this.elapsed = 0;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    // celular com dpr 3 renderiza 9x pixels: limitar segura o FPS
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isTouch ? 1.75 : 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#1d1b2e');

    this.rig = new CameraRig(this);
    this.camera = this.rig.camera;
    this.interaction = new Interaction(this);

    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
    window.visualViewport?.addEventListener('resize', this.resize);
    this.resize();
  }

  onUpdate(fn) {
    this.updaters.add(fn);
    return () => this.updaters.delete(fn);
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.rig.resize(w, h);
  }

  start(onFirstFrame) {
    let first = true;
    this.renderer.setAnimationLoop((time) => {
      this.timer.update(time);
      // clamp: um frame travado não pode fazer o gato "teleportar"
      const dt = Math.min(this.timer.getDelta(), 1 / 20);
      this.elapsed += dt;
      for (const fn of this.updaters) fn(dt, this.elapsed);
      this.rig.update(dt);
      this.renderer.render(this.scene, this.camera);
      if (first) {
        first = false;
        onFirstFrame?.();
      }
    });
  }
}
