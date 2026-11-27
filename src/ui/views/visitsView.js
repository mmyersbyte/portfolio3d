import { t, getLang } from '../i18n.js';
import { esc } from './escape.js';

/** Janela do post-it de visitas. `getData()` → { count, today, mine } ou null. */
export const makeVisitsView = (getData) => ({
  title: () => t('visits.title'),
  render: () => {
    const data = getData();
    if (!data) return `<p class="visits__off">${esc(t('visits.off'))}</p>`;
    const num = (n) => n.toLocaleString(getLang() === 'pt' ? 'pt-BR' : 'en-US');
    return `
      <div class="visits">
        <p class="visits__total"><strong>${num(data.count)}</strong>${esc(t('visits.total'))}</p>
        <div class="visits__stats">
          <div><span>${esc(t('visits.today'))}</span><strong>${num(data.today)}</strong></div>
          ${data.mine ? `<div><span>${esc(t('visits.you'))}</span><strong>nº ${num(data.mine)}</strong></div>` : ''}
        </div>
        <p class="visits__note">${esc(t('visits.note'))}</p>
      </div>`;
  },
});
