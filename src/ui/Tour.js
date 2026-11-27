import { t } from './i18n.js';
import { esc } from './views/escape.js';

const SEEN_KEY = 'portfolio3d:tour-seen';
const PAD = 10; // folga do holofote em volta do alvo (px)

/**
 * Passos do tutorial. `target`:
 *  - { dom: '.seletor' }      → elemento da interface
 *  - { world: 'chave' }       → objetos 3D de scene.tourTargets (acompanha se mexer, ex: o gato)
 *  - sem target               → card centralizado
 * Passos de objetos 3D somem sozinhos se o 3D não carregou (sem WebGL).
 */
const STEPS = [
  { id: 'welcome' },
  { id: 'avatar', target: { world: 'avatar' } },
  {
    id: 'walk',
    target: { world: 'floor' },
    enter: (scene) => scene.demoTile({ x: 1.5, z: 0.5 }), // tile livre do lado do boneco
    leave: (scene) => scene.demoTile(null),
  },
  { id: 'laptop', target: { world: 'laptop' } },
  { id: 'postits', target: { world: 'postits' } },
  { id: 'cat', target: { world: 'cat' } },
  { id: 'wardrobe', target: { world: 'wardrobe' } },
  { id: 'sofa', target: { world: 'sofa' } },
  { id: 'dock', target: { dom: '.dock' } },
  { id: 'actions', target: { dom: '.topbar__actions' } },
  { id: 'done' },
];

export class Tour {
  /**
   * @param getScene () => cena 3D (ou null se não carregou)
   * @param beforeStart () => void — fecha painéis abertos antes de começar
   */
  constructor({ getScene, beforeStart }) {
    this.getScene = getScene;
    this.beforeStart = beforeStart;
    this.btn = document.getElementById('tour-btn');
    this.root = document.getElementById('tour');
    this.spot = document.getElementById('tour-spot');
    this.card = document.getElementById('tour-card');
    this.index = 0;
    this.raf = 0;

    this.btn.addEventListener('click', () => this.start());
    this.card.addEventListener('click', (e) => {
      const act = e.target.closest('[data-tour]')?.dataset.tour;
      if (act === 'next') this.go(this.index + 1);
      if (act === 'back') this.go(this.index - 1);
      if (act === 'skip') this.stop();
    });
    document.addEventListener('keydown', (e) => {
      if (!this.active) return;
      if (e.key === 'Escape') this.stop();
      if (e.key === 'ArrowRight') this.go(this.index + 1);
      if (e.key === 'ArrowLeft') this.go(this.index - 1);
    });

    // primeira visita: o botão pulsa pra chamar atenção (não abre sozinho)
    try {
      if (!localStorage.getItem(SEEN_KEY)) this.btn.classList.add('is-new');
    } catch {
      /* ok */
    }
  }

  get active() {
    return !this.root.hidden;
  }

  /** Passos disponíveis (sem 3D, pula os que apontam pra objetos do quarto). */
  get steps() {
    const scene = this.getScene();
    return STEPS.filter((s) => !s.target?.world || scene?.tourTargets?.[s.target.world]);
  }

  start() {
    this.beforeStart?.();
    this.btn.classList.remove('is-new');
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* ok */
    }
    this.root.hidden = false;
    this.index = -1;
    this.go(0);
    this.loop();
  }

  stop() {
    this.steps[this.index]?.leave?.(this.getScene());
    cancelAnimationFrame(this.raf);
    this.root.hidden = true;
    this.btn.focus({ preventScroll: true });
  }

  go(i) {
    const steps = this.steps;
    if (i >= steps.length) return this.stop();
    if (i < 0 || i === this.index) return;
    const scene = this.getScene();
    steps[this.index]?.leave?.(scene);
    this.index = i;
    steps[i].enter?.(scene);
    this.renderCard();
    this.place();
  }

  renderCard() {
    const steps = this.steps;
    const step = steps[this.index];
    const last = this.index === steps.length - 1;
    this.card.innerHTML = `
      <p class="tour__count">${this.index + 1} / ${steps.length}</p>
      <h2 class="tour__title" id="tour-title">${esc(t(`tour.${step.id}.title`))}</h2>
      <p class="tour__text">${esc(t(`tour.${step.id}.text`))}</p>
      <div class="tour__dots" aria-hidden="true">${steps
        .map((_, i) => `<i class="${i === this.index ? 'is-on' : ''}"></i>`)
        .join('')}</div>
      <div class="tour__actions">
        ${last ? '' : `<button type="button" class="btn btn--ghost" data-tour="skip">${esc(t('tour.skip'))}</button>`}
        <span class="spacer"></span>
        ${this.index > 0 ? `<button type="button" class="btn" data-tour="back">${esc(t('tour.back'))}</button>` : ''}
        <button type="button" class="btn btn--primary" data-tour="next">${esc(t(last ? 'tour.finish' : 'tour.next'))}</button>
      </div>`;
    this.card.querySelector('[data-tour="next"]').focus({ preventScroll: true });
  }

  /** Retângulo na tela do alvo do passo atual (ou null = sem alvo). */
  targetRect() {
    const target = this.steps[this.index]?.target;
    if (!target) return null;
    if (target.dom) {
      const el = document.querySelector(target.dom);
      return el ? el.getBoundingClientRect() : null;
    }
    // objetos 3D: a cena projeta na tela (assim o three.js não entra no pacote da interface)
    return this.getScene()?.tourRect(target.world) ?? null;
  }

  place() {
    const r = this.targetRect();
    const W = innerWidth;
    const H = innerHeight;
    const card = this.card;

    if (!r) {
      // sem alvo: tudo escuro e o card no meio
      Object.assign(this.spot.style, {
        left: `${W / 2}px`,
        top: `${H / 2}px`,
        width: '0px',
        height: '0px',
      });
      card.style.left = `${Math.max(12, (W - card.offsetWidth) / 2)}px`;
      card.style.top = `${Math.max(12, (H - card.offsetHeight) / 2)}px`;
      return;
    }

    const left = r.left - PAD;
    const top = r.top - PAD;
    Object.assign(this.spot.style, {
      left: `${left}px`,
      top: `${top}px`,
      width: `${r.width + PAD * 2}px`,
      height: `${r.height + PAD * 2}px`,
    });

    // card embaixo do alvo; se não couber, em cima; senão no canto de baixo
    const cw = card.offsetWidth;
    const ch = card.offsetHeight;
    const gap = 14;
    let y;
    if (r.bottom + PAD + gap + ch < H - 8) y = r.bottom + PAD + gap;
    else if (r.top - PAD - gap - ch > 8) y = r.top - PAD - gap - ch;
    else y = H - ch - 12;
    const x = Math.min(W - cw - 12, Math.max(12, r.left + r.width / 2 - cw / 2));
    card.style.left = `${x}px`;
    card.style.top = `${y}px`;
  }

  /** Reposiciona a cada frame: o gato anda, a câmera pode mexer, a tela pode girar. */
  loop() {
    this.place();
    this.raf = requestAnimationFrame(() => this.loop());
  }
}
