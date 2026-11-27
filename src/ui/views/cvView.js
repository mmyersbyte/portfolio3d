import { cv } from '../../data/content.js';
import { t, tr } from '../i18n.js';
import { esc } from './escape.js';

export const cvView = {
  title: () => t('modal.cv'),
  render: () => `
    <article class="cv">
      ${cv.placeholder ? `<p class="cv__placeholder">${esc(t('cv.placeholder'))}</p>` : ''}

      <h3>${esc(t('cv.summary'))}</h3>
      <p>${esc(tr(cv.summary))}</p>

      <h3>${esc(t('cv.experience'))}</h3>
      ${cv.experience
        .map(
          (job) => `
        <section class="cv__item">
          <header>
            <strong>${esc(tr(job.role))} · ${esc(job.company)}</strong>
            <small>${esc(tr(job.period))}</small>
          </header>
          ${
            job.bullets
              ? `<ul>${tr(job.bullets)
                  .map((b) => `<li>${esc(b)}</li>`)
                  .join('')}</ul>`
              : ''
          }
        </section>`,
        )
        .join('')}

      <h3>${esc(t('cv.education'))}</h3>
      ${cv.education
        .map(
          (ed) => `
        <section class="cv__item">
          <header>
            <strong>${esc(ed.course ? tr(ed.course) : ed.school)}</strong>
            ${ed.period ? `<small>${esc(ed.period)}</small>` : ''}
          </header>
          ${ed.course ? `<div>${esc(ed.school)}</div>` : ''}
        </section>`,
        )
        .join('')}

      <h3>${esc(t('cv.skills'))}</h3>
      <ul class="tags">${cv.skills.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>

      <h3>${esc(t('cv.languages'))}</h3>
      <ul>${tr(cv.languages)
        .map((l) => `<li>${esc(l)}</li>`)
        .join('')}</ul>
    </article>`,
};
