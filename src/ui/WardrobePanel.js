import { WARDROBE, DEFAULT_OUTFIT } from '../data/wardrobe.js';
import { saveOutfit, sanitize } from '../services/outfitStore.js';
import { t, tr, onLangChange } from './i18n.js';
import { esc } from './views/escape.js';

/**
 * Painel do guarda-roupa. Cada mudança é aplicada no boneco na hora (preview);
 * Salvar grava no localStorage, Cancelar/fechar volta pra roupa salva.
 */
export class WardrobePanel {
  constructor({ onPreview, onOpenChange, onSaved }) {
    this.el = document.getElementById('wardrobe');
    this.form = document.getElementById('wardrobe-body');
    this.onPreview = onPreview;
    this.onOpenChange = onOpenChange;
    this.onSaved = onSaved;
    this.saved = null;
    this.draft = null;

    this.form.addEventListener('submit', (e) => e.preventDefault());
    this.form.addEventListener('change', (e) => {
      const input = e.target;
      this.draft = sanitize({
        ...this.draft,
        [input.name]: input.type === 'checkbox' ? input.checked : input.value,
      });
      this.onPreview(this.draft);
    });
    document.getElementById('wardrobe-close').addEventListener('click', () => this.cancel());
    document.getElementById('wardrobe-cancel').addEventListener('click', () => this.cancel());
    document.getElementById('wardrobe-save').addEventListener('click', () => this.save());
    document.getElementById('wardrobe-reset').addEventListener('click', () => {
      this.draft = { ...DEFAULT_OUTFIT };
      this.render();
      this.onPreview(this.draft);
    });
    this.el.addEventListener('keydown', (e) => e.key === 'Escape' && this.cancel());
    onLangChange(() => this.isOpen && this.render());
  }

  get isOpen() {
    return this.el.classList.contains('is-open');
  }

  open(current) {
    this.saved = { ...current };
    this.draft = { ...current };
    this.render();
    this.el.classList.add('is-open');
    this.el.setAttribute('aria-hidden', 'false');
    this.el.querySelector('input:checked')?.focus({ preventScroll: true });
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
    this.el.classList.remove('is-open');
    this.el.setAttribute('aria-hidden', 'true');
    this.onOpenChange?.(false);
  }

  render() {
    const d = this.draft;
    const radios = (name, options, kind) =>
      options
        .map((o) => {
          const label = esc(tr(o.name));
          const checked = d[name] === o.id ? 'checked' : '';
          const input = `<input type="radio" name="${name}" value="${esc(o.id)}" ${checked} aria-label="${label}">`;
          return kind === 'swatch'
            ? `<label class="swatch" title="${label}" style="--c:${esc(o.id)}">${input}<span></span></label>`
            : `<label class="pill">${input}<span>${label}</span></label>`;
        })
        .join('');

    const group = (title, body) =>
      `<fieldset class="wr-group"><legend>${esc(t(title))}</legend><div class="wr-options">${body}</div></fieldset>`;

    this.form.innerHTML = [
      group('wardrobe.style', radios('style', WARDROBE.styles, 'pill')),
      group('wardrobe.top', radios('top', WARDROBE.top, 'swatch')),
      group('wardrobe.pants', radios('pants', WARDROBE.pants, 'swatch')),
      group('wardrobe.shoes', radios('shoes', WARDROBE.shoes, 'swatch')),
      group(
        'wardrobe.extras',
        `<label class="pill"><input type="checkbox" name="glasses" ${d.glasses ? 'checked' : ''}><span>🤓 ${esc(t('wardrobe.glasses'))}</span></label>`,
      ),
    ].join('');
  }
}
