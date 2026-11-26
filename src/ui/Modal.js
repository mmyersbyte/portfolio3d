import { onLangChange } from './i18n.js';

/**
 * Modal único e reutilizável. `open({ title, render, variant })`:
 * render() devolve HTML e é chamado de novo se o idioma mudar com o modal aberto.
 */
export class Modal {
  constructor(root) {
    this.root = root;
    this.titleEl = root.querySelector('#modal-title');
    this.bodyEl = root.querySelector('#modal-body');
    this.current = null;
    this.lastFocus = null;

    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) this.close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });
    onLangChange(() => this.isOpen && this.render());
  }

  get isOpen() {
    return !this.root.hidden;
  }

  open(view) {
    this.current = view;
    this.lastFocus = document.activeElement;
    this.root.className = `modal ${view.variant ? `modal--${view.variant}` : ''}`;
    this.render();
    this.root.hidden = false;
    this.bodyEl.scrollTop = 0;
    this.root.querySelector('.modal__header .icon-btn').focus();
  }

  render() {
    this.titleEl.textContent = this.current.title();
    this.bodyEl.innerHTML = this.current.render();
  }

  close() {
    this.root.hidden = true;
    this.current = null;
    this.lastFocus?.focus?.();
  }
}
