import { WARDROBE_TABS, DEFAULT_OUTFIT } from '../data/wardrobe.js';
import { saveOutfit, sanitize } from '../services/outfitStore.js';
import { tr, onLangChange } from './i18n.js';
import { esc } from './views/escape.js';
import { icon } from './icons.js';

/**
 * Painel do guarda-roupa, com abas por categoria (montadas de data/wardrobe.js).
 * Cada opção é um card com miniatura 3D do boneco usando aquilo (via PreviewStudio).
 * Cada mudança é aplicada no boneco na hora (preview);
 * Salvar grava no localStorage, Cancelar/fechar volta pra roupa salva.
 */
export class WardrobePanel {
  constructor({ onPreview, onOpenChange, onSaved }) {
    this.el = document.getElementById('wardrobe');
    this.tabsEl = document.getElementById('wardrobe-tabs');
    this.form = document.getElementById('wardrobe-body');
    this.onPreview = onPreview;
    this.onOpenChange = onOpenChange;
    this.onSaved = onSaved;
    this.saved = null;
    this.draft = null;
    this.tab = WARDROBE_TABS[0].id;
    this.studio = null; // ligado quando o 3D carrega

    this.form.addEventListener('submit', (e) => e.preventDefault());
    this.form.addEventListener('change', (e) => {
      const input = e.target;
      this.draft = sanitize({
        ...this.draft,
        [input.name]: input.type === 'checkbox' ? input.checked : input.value,
      });
      this.onPreview(this.draft);
      this.refreshThumbs();
    });

    this.tabsEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-tab]');
      if (btn) this.selectTab(btn.dataset.tab);
    });
    // setas do teclado trocam de aba (padrão de tablist acessível)
    this.tabsEl.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const i = WARDROBE_TABS.findIndex((tab) => tab.id === this.tab);
      const n = WARDROBE_TABS.length;
      const next = WARDROBE_TABS[(i + (e.key === 'ArrowRight' ? 1 : n - 1)) % n];
      this.selectTab(next.id);
      this.tabsEl.querySelector(`[data-tab="${next.id}"]`).focus();
    });

    document.getElementById('wardrobe-close').addEventListener('click', () => this.cancel());
    document.getElementById('wardrobe-cancel').addEventListener('click', () => this.cancel());
    document.getElementById('wardrobe-save').addEventListener('click', () => this.save());
    document.getElementById('wardrobe-reset').addEventListener('click', () => {
      this.draft = { ...DEFAULT_OUTFIT };
      this.render();
      this.onPreview(this.draft);
    });
    window.addEventListener('resize', () => this.isOpen && this.refreshThumbs());
    this.el.addEventListener('keydown', (e) => e.key === 'Escape' && this.cancel());
    onLangChange(() => this.isOpen && this.render());
  }

  setStudio(studio) {
    this.studio = studio;
  }

  get isOpen() {
    return this.el.classList.contains('is-open');
  }

  open(current) {
    this.saved = { ...current };
    this.draft = { ...current };
    this.el.classList.add('is-open');
    this.el.setAttribute('aria-hidden', 'false');
    this.studio?.setActive(true);
    this.render();
    this.tabsEl.querySelector('[aria-selected="true"]')?.focus({ preventScroll: true });
    this.onOpenChange?.(true);
  }

  /** Fecha descartando o que não foi salvo. */
  cancel() {
    if (!this.isOpen) return;
    this.onPreview(this.saved);
    this.hide();
  }

  save() {
    const ok = saveOutfit(this.draft);
    this.saved = { ...this.draft };
    this.onSaved?.(ok);
    this.hide();
  }

  hide() {
    this.studio?.setActive(false);
    this.el.classList.remove('is-open');
    this.el.setAttribute('aria-hidden', 'true');
    this.onOpenChange?.(false);
  }

  selectTab(id) {
    this.tab = id;
    this.render();
    this.form.scrollTop = 0;
  }

  render() {
    this.tabsEl.innerHTML = WARDROBE_TABS.map((tab) => {
      const on = tab.id === this.tab;
      return `<button type="button" role="tab" class="wr-tab" data-tab="${tab.id}" id="wr-tab-${tab.id}"
        aria-selected="${on}" aria-controls="wardrobe-body" tabindex="${on ? 0 : -1}">
        ${icon(tab.icon)}<span>${esc(tr(tab.name))}</span></button>`;
    }).join('');
    this.form.setAttribute('aria-labelledby', `wr-tab-${this.tab}`);

    const tab = WARDROBE_TABS.find((x) => x.id === this.tab);
    this.form.innerHTML = tab.groups.map((group) => this.renderGroup(group)).join('');
    this.refreshThumbs();
  }

  renderGroup(group) {
    const d = this.draft;
    const options = group.options
      .map((o) => {
        const label = esc(tr(o.name));
        if (group.type === 'swatches') {
          const checked = d[group.key] === o.id ? 'checked' : '';
          return `<label class="swatch" title="${label}" style="--c:${esc(o.id)}">
            <input type="radio" name="${group.key}" value="${esc(o.id)}" ${checked} aria-label="${label}"><span></span></label>`;
        }
        const toggle = group.type === 'toggles';
        const checked = (toggle ? d[o.id] : d[group.key] === o.id) ? 'checked' : '';
        const input = toggle
          ? `<input type="checkbox" name="${o.id}" ${checked}>`
          : `<input type="radio" name="${group.key}" value="${esc(o.id)}" ${checked}>`;
        return `<label class="card">${input}<span class="card__inner">
            <canvas class="card__thumb" width="160" height="160" data-group="${group.key}"
              data-option="${esc(o.id)}" data-toggle="${toggle}" aria-hidden="true"></canvas>
            <span class="card__label">${label}</span>
            ${toggle ? icon('check', 'card__check') : ''}
          </span></label>`;
      })
      .join('');
    const cls = group.type === 'swatches' ? 'wr-options' : 'wr-options wr-options--cards';
    return `<fieldset class="wr-group"><legend>${esc(tr(group.label))}</legend><div class="${cls}">${options}</div></fieldset>`;
  }

  /** Redesenha as miniaturas da aba atual (dependem das cores escolhidas). */
  refreshThumbs() {
    if (!this.studio) return;
    for (const canvas of this.form.querySelectorAll('.card__thumb')) {
      const { group, option, toggle } = canvas.dataset;
      // miniatura mostra o item vestido, mesmo que ainda não esteja marcado
      const outfit =
        toggle === 'true' ? { ...this.draft, [option]: true } : { ...this.draft, [group]: option };
      this.studio.thumbnail(canvas, outfit, toggle === 'true' ? option : group);
    }
    this.studio.setOutfit(this.draft);
  }
}
