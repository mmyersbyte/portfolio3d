import * as THREE from 'three';
import { box } from './helpers.js';
import { ROOM, LIGHT_SWITCH } from './layout.js';

const ON_TILT = 0.4;

/**
 * Interruptor de parede ao lado do guarda-roupa.
 * A tecla inclina pra cima/baixo e um LED mostra se a luz está acesa.
 */
export class LightSwitch {
  constructor(scene) {
    const g = (this.group = new THREE.Group());
    g.name = 'light-switch';
    g.position.set(-ROOM.half, LIGHT_SWITCH.y, LIGHT_SWITCH.z);

    // espelho (placa) + tecla
    box(0.025, 0.22, 0.14, '#f4efe6', { x: 0.012, y: -0.11, parent: g });
    this.toggle = new THREE.Group();
    this.toggle.position.x = 0.03;
    box(0.03, 0.09, 0.06, '#e2dccf', { y: -0.045, parent: this.toggle });
    g.add(this.toggle);

    this.led = new THREE.Mesh(
      new THREE.BoxGeometry(0.01, 0.018, 0.018),
      new THREE.MeshBasicMaterial({ color: '#555', toneMapped: false }),
    );
    this.led.position.set(0.028, -0.085, 0);
    g.add(this.led);

    // área de clique maior que o interruptor (dedo no celular é grande)
    const hit = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.45, 0.35),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
    );
    hit.position.x = 0.04;
    g.add(hit);

    scene.add(g);
  }

  set(on) {
    this.toggle.rotation.z = on ? ON_TILT : -ON_TILT;
    this.led.material.color.set(on ? '#7dff9a' : '#555');
  }
}
