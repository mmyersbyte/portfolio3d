import { cv, profile, links } from '../../data/content.js';
import { t, tr } from '../i18n.js';
import { esc } from './escape.js';

const list = (items) => `<ul>${items.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`;

export const cvView = {
  title: () => t('modal.cv'),
  render: () => `
    <article class="cv">
      ${cv.placeholder ? `<p class="cv__placeholder">${esc(t('cv.placeholder'))}</p>` : ''}
      ${cv.headline ? `<p class="cv__headline">${esc(tr(cv.headline))}</p>` : ''}
      <div class="cv__top">
        ${profile.openToWork ? `<span class="open-to-work">${esc(t('cv.openToWork'))}</span>` : ''}
        <a class="cv__email" href="mailto:${esc(links.email)}">${esc(links.email)}</a>
        <a class="cv__email" href="${esc(links.linkedin)}" target="_blank" rel="noopener">LinkedIn ↗</a>
        <a class="cv__email" href="${esc(links.github)}" target="_blank" rel="noopener">GitHub ↗</a>
      </div>

      <h3>${esc(t('cv.summary'))}</h3>
      <p>${esc(tr(cv.summary))}</p>

      <h3>${esc(t('cv.experience'))}</h3>
      ${cv.experience
        .map(
          (job) => `
        <section class="cv__item">
          <header>
            <strong>${esc(tr(job.role))}${job.company ? ` · ${esc(job.company)}` : ''}</strong>
            <small>${esc(tr(job.period))}</small>
          </header>
          ${job.meta ? `<p class="cv__meta">${esc(tr(job.meta))}</p>` : ''}
          ${job.bullets ? list(tr(job.bullets)) : ''}
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
      ${cv.skills
        .map(
          (group) => `
        <div class="cv__skills">
          <span class="cv__skills-label">${esc(tr(group.label))}</span>
          <ul class="tags">${group.items.map((s) => `<li>${esc(tr(s))}</li>`).join('')}</ul>
        </div>`,
        )
        .join('')}

      ${
        cv.learning?.length
          ? `<h3>${esc(t('cv.learning'))}</h3>
             <ul class="tags tags--learning">${cv.learning.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`
          : ''
      }

      ${
        cv.courses?.length
          ? `<h3>${esc(t('cv.courses'))}</h3>
             <ul class="cv__courses">${cv.courses
               .map(
                 (c) =>
                   `<li><strong>${esc(c.name)}</strong>${c.hours ? ` <span>(${c.hours}h)</span>` : ''} — ${esc(c.school)}</li>`,
               )
               .join('')}</ul>`
          : ''
      }

      <h3>${esc(t('cv.languages'))}</h3>
      ${list(tr(cv.languages))}
    </article>`,
};
