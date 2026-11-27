import { PAGES, TAB_ORDER } from './pages.js';
import { onLangChange } from '../i18n.js';
import { esc } from '../views/escape.js';
import { icon } from '../icons.js';

/**
 * Janela de navegador "de mentirinha" que abre quando clica no notebook.
 * Abas fixas (Início, Projetos, GitHub, Instagram, LinkedIn, Dino), barra de
 * endereço, voltar/avançar/recarregar e botão pra abrir o site de verdade.
 */
export class Browser {
  constructor() {
    this.root = document.getElementById('browser');
    this.tabsEl = document.getElementById('browser-tabs');
    this.urlEl = document.getElementById('browser-url');
    this.pageEl = document.getElementById('browser-page');
    this.extEl = document.getElementById('browser-external');
    this.backBtn = document.getElementById('browser-back');
    this.fwdBtn = document.getElementById('browser-forward');
    this.history = [];
    this.index = -1;
    this.cleanup = null;
    this.lastFocus = null;

    this.backBtn.innerHTML = icon('back');
    this.fwdBtn.innerHTML = icon('forward');
    document.getElementById('browser-reload').innerHTML = icon('reload');
    document.getElementById('browser-lock').innerHTML = icon('lock');

    this.root.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) this.close();
    });
    this.tabsEl.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-tab]');
      if (tab) this.go(tab.dataset.tab);
    });
    this.backBtn.addEventListener('click', () => this.step(-1));
    this.fwdBtn.addEventListener('click', () => this.step(1));
    document.getElementById('browser-reload').addEventListener('click', () => this.show());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });
    onLangChange(() => this.isOpen && this.show());
  }

  get isOpen() {
    return !this.root.hidden;
  }

  get current() {
    return this.history[this.index];
  }

  open(pageId = 'home') {
    if (!this.isOpen) {
      this.lastFocus = document.activeElement;
      this.root.hidden = false;
      this.history = [];
      this.index = -1;
    }
    this.go(pageId);
    this.root.querySelector('[data-close].icon-btn')?.focus({ preventScroll: true });
  }

  close() {
    if (!this.isOpen) return;
    this.cleanup?.();
    this.cleanup = null;
    this.pageEl.innerHTML = '';
    this.root.hidden = true;
    this.lastFocus?.focus?.();
  }

  /** Navega pra uma página (entra no histórico, como num navegador). */
  go(pageId) {
    if (!PAGES[pageId]) return;
    if (this.current === pageId) return this.show();
    this.history = this.history.slice(0, this.index + 1);
    this.history.push(pageId);
    this.index = this.history.length - 1;
    this.show();
  }

  step(dir) {
    const next = this.index + dir;
    if (next < 0 || next >= this.history.length) return;
    this.index = next;
    this.show();
  }

  show() {
    const page = PAGES[this.current];
    this.cleanup?.();
    this.cleanup = null;

    this.tabsEl.innerHTML = TAB_ORDER.map((id) => {
      const p = PAGES[id];
      const on = id === page.id;
      return `<button type="button" role="tab" class="browser__tab" data-tab="${id}" aria-selected="${on}">
        ${icon(p.icon)}<span>${esc(p.title())}</span></button>`;
    }).join('');

    this.urlEl.textContent = page.url();
    const external = page.external?.();
    this.extEl.hidden = !external;
    if (external) this.extEl.href = external;
    this.backBtn.disabled = this.index <= 0;
    this.fwdBtn.disabled = this.index >= this.history.length - 1;

    this.pageEl.innerHTML = '';
    this.pageEl.scrollTop = 0;
    this.pageEl.dataset.page = page.id;
    this.cleanup = page.render(this.pageEl, (id) => this.go(id)) ?? null;
    this.tabsEl
      .querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}
