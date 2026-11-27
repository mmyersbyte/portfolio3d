import { cv, profile, links } from '../../data/content.js';
import { t, tr } from '../i18n.js';
import { esc } from './escape.js';

export const cvView = {
  title: () => t('modal.cv'),
  render: () => `
    <article class="cv">
      ${cv.placeholder ? `<p class="cv__placeholder">${esc(t('cv.placeholder'))}</p>` : ''}
      <div class="cv__top">
        ${profile.openToWork ? `<span class="open-to-work">${esc(t('cv.openToWork'))}</span>` : ''}
        <a class="cv__email" href="mailto:${esc(links.email)}">${esc(links.email)}</a>
      </div>

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
            ${ed.period ? `<small>${esc(tr(ed.period))}</small>` : ''}
          </header>
          ${ed.course ? `<div>${esc(ed.school)}</div>` : ''}
        </section>`,
        )
        .join('')}

      <h3>${esc(t('cv.skills'))}</h3>
      <ul class="tags">${cv.skills.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>

      ${
        cv.learning?.length
          ? `<h3>${esc(t('cv.learning'))}</h3>
             <ul class="tags tags--learning">${cv.learning.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`
          : ''
      }

      <h3>${esc(t('cv.languages'))}</h3>
      <ul>${tr(cv.languages)
        .map((l) => `<li>${esc(l)}</li>`)
        .join('')}</ul>
    </article>`,
};
