import { pet } from '../data/pet.js';
import { t, tr, getLang, onLangChange } from './i18n.js';
import { esc } from './views/escape.js';
import { icon } from './icons.js';

const STATUS_POLL = 500; // ms

/** Idade em anos completos na data de hoje. */
function ageInYears(iso, now = new Date()) {
  const [y, m, d] = iso.split('-').map(Number);
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age--;
  return age;
}

/** Texto com o nome do gato no lugar de {name}. */
export const petLine = (key) => t(key).replaceAll('{name}', pet.name);

/**
 * Painel do gato (mesmo tamanho/lugar do chat): ficha + comandos estilo Habbo.
 * `getActivity` devolve o que o gato está fazendo agora (mostrado no cabeçalho).
 */
export class PetPanel {
  constructor({ onCommand, onOpenChange, getActivity, onResize }) {
    this.el = document.getElementById('pet');
    this.status = document.getElementById('pet-status');
    this.info = document.getElementById('pet-info');
    this.list = document.getElementById('pet-commands');
    this.onCommand = onCommand;
    this.onOpenChange = onOpenChange;
    this.getActivity = getActivity;
    this.onResize = onResize; // painel mudou de tamanho (encolheu/voltou): reenquadra a câmera
    this.timer = 0;

    document.getElementById('pet-name').textContent = pet.name;
    document.getElementById('pet-close').addEventListener('click', () => this.close());
    this.el.addEventListener('keydown', (e) => e.key === 'Escape' && this.close());
    this.list.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-cmd]');
      if (!btn) return;
      this.onCommand(btn.dataset.cmd);
      // um "toque" visual no botão
      btn.classList.remove('is-sent');
      void btn.offsetWidth;
      btn.classList.add('is-sent');
      this.peekOnMobile();
    });

    // encolhido (só celular): tocar no cabeçalho volta pros comandos
    this.el.querySelector('.sheet__header').addEventListener('click', (e) => {
      if (this.isPeeking && !e.target.closest('button')) this.unpeek();
    });
    onLangChange(() => this.render());
    this.render();
  }

  get isOpen() {
    return this.el.classList.contains('is-open');
  }

  get isPeeking() {
    return this.el.classList.contains('is-peek');
  }

  /** No celular o painel tampa o quarto: depois do comando vira uma barrinha. */
  peekOnMobile() {
    if (!matchMedia('(max-width: 767px)').matches || this.isPeeking) return;
    this.el.classList.add('is-peek');
    this.onResize?.();
  }

  unpeek() {
    if (!this.isPeeking) return;
    this.el.classList.remove('is-peek');
    this.onResize?.();
  }

  open() {
    this.el.classList.remove('is-peek');
    if (this.isOpen) return;
    this.el.classList.add('is-open');
    this.el.setAttribute('aria-hidden', 'false');
    this.updateStatus();
    this.timer = setInterval(() => this.updateStatus(), STATUS_POLL);
    this.list.querySelector('button')?.focus({ preventScroll: true });
    this.onOpenChange?.(true);
  }

  close() {
    this.el.classList.remove('is-peek');
    if (!this.isOpen) return;
    clearInterval(this.timer);
    this.el.classList.remove('is-open');
    this.el.setAttribute('aria-hidden', 'true');
    this.onOpenChange?.(false);
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  updateStatus() {
    const activity = this.getActivity?.() ?? 'idle';
    this.status.textContent = t(`pet.status.${activity}`);
  }

  render() {
    const birth = new Date(`${pet.birth}T12:00:00`);
    const date = birth.toLocaleDateString(getLang() === 'pt' ? 'pt-BR' : 'en-US', {
      day: '2-digit',
      month: getLang() === 'pt' ? '2-digit' : 'short',
      year: 'numeric',
    });
    const age = ageInYears(pet.birth);
    this.info.innerHTML = `
      <div><dt>${esc(t('pet.birth'))}</dt><dd>${esc(date)}</dd></div>
      <div><dt>${esc(t('pet.age'))}</dt><dd>${esc(t(age === 1 ? 'pet.year' : 'pet.years').replace('{n}', age))}</dd></div>
      <div><dt>${esc(t('pet.species'))}</dt><dd>${esc(tr(pet.species))}</dd></div>`;

    this.list.innerHTML = pet.commands
      .map(
        (cmd) => `<li><button type="button" class="pet-cmd" data-cmd="${cmd}">
          <span class="pet-cmd__icon">${icon(cmd)}</span>
          <span class="pet-cmd__text"><strong>${esc(t(`pet.cmd.${cmd}`))}</strong>
          <small>“${esc(petLine(`pet.say.${cmd}`))}”</small></span>
        </button></li>`,
      )
      .join('');
    if (this.isOpen) this.updateStatus();
  }
}
