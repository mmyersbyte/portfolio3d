import * as THREE from 'three';
import { box, mat } from './helpers.js';
import { ROOM, WALL_CLOCK } from './layout.js';
import { brasiliaHour } from './Environment.js';

const R = 0.3; // raio do mostrador

/**
 * Relógio analógico na parede do fundo. Mostra SEMPRE a hora real de Brasília
 * (os comandos :dia/:noite mudam o céu, não o relógio). O ponteiro de segundos
 * anda em "tiques", como relógio de parede de verdade.
 */
export class WallClock {
  constructor(exp) {
    const g = (this.group = new THREE.Group());
    g.name = 'wall-clock';
    g.position.set(WALL_CLOCK.x, WALL_CLOCK.y, -ROOM.half + 0.02);

    // aro + mostrador (cilindro deitado virado pra +z)
    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(R + 0.04, R + 0.04, 0.06, 32),
      mat('#2b2d35'),
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.z = 0.03;
    rim.castShadow = true;
    g.add(rim);
    const face = new THREE.Mesh(
      new THREE.CylinderGeometry(R, R, 0.02, 32),
      new THREE.MeshStandardMaterial({ color: '#fbf7ee', roughness: 0.7 }),
    );
    face.rotation.x = Math.PI / 2;
    face.position.z = 0.055;
    g.add(face);

    // marcações: 12 tracinhos, os de 3 em 3 horas maiores
    for (let i = 0; i < 12; i++) {
      const big = i % 3 === 0;
      const tick = box(big ? 0.035 : 0.02, big ? 0.07 : 0.045, 0.01, '#2b2d35', { shadow: false });
      const a = (i / 12) * Math.PI * 2;
      const dist = R - (big ? 0.06 : 0.045);
      tick.position.set(Math.sin(a) * dist, Math.cos(a) * dist, 0.068);
      tick.rotation.z = -a;
      g.add(tick);
    }

    // ponteiros: grupo-pivô no centro, peça estendida pra cima (12h)
    const hand = (w, len, color, z) => {
      const pivot = new THREE.Group();
      pivot.position.z = z;
      box(w, len, 0.008, color, { y: -0.03, parent: pivot, shadow: false });
      g.add(pivot);
      return pivot;
    };
    this.hourHand = hand(0.03, 0.19, '#1d1b2e', 0.072);
    this.minuteHand = hand(0.02, 0.27, '#1d1b2e', 0.078);
    this.secondHand = hand(0.008, 0.29, '#e63946', 0.084);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.02, 12), mat('#e63946'));
    cap.rotation.x = Math.PI / 2;
    cap.position.z = 0.09;
    g.add(cap);

    exp.scene.add(g);
    this.acc = 1;
    exp.onUpdate((dt) => {
      this.acc += dt;
      if (this.acc >= 0.25) {
        this.acc = 0;
        this.tick();
      }
    });
  }

  /** Hora real de Brasília agora (14.5 = 14:30). */
  get hour() {
    return brasiliaHour();
  }

  /** "21:47" */
  get text() {
    const h = this.hour;
    return `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.floor((h % 1) * 60)).padStart(2, '0')}`;
  }

  tick() {
    const h = this.hour;
    const minutes = (h % 1) * 60;
    const seconds = Math.floor((minutes % 1) * 60 + 1e-6);
    const turn = -Math.PI * 2; // sentido horário visto de frente
    this.hourHand.rotation.z = turn * ((h % 12) / 12);
    this.minuteHand.rotation.z = turn * (minutes / 60);
    this.secondHand.rotation.z = turn * (seconds / 60);
  }
}
