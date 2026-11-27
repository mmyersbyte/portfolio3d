import { projects, links } from '../../data/content.js';
import { t, tr } from '../i18n.js';
import { esc } from './escape.js';

/** Abre como se fosse a tela do notebook. */
export const projectsView = {
  variant: 'laptop',
  title: () => t('modal.projects'),
  render: () => `
    <div class="term">
      <p class="term__prompt"><b>pedro@quarto</b>:~$ ls ./projetos</p>
      <div class="projects">
        ${projects
          .map(
            (p) => `
          <article class="project">
            <h3>${esc(p.title)}</h3>
            ${
              p.highlights?.length
                ? `<ul class="highlights">${p.highlights
                    .map((h) => `<li class="hl hl--${esc(h.tone)}">${esc(tr(h.label))}</li>`)
                    .join('')}</ul>`
                : ''
            }
            <p>${esc(tr(p.description))}</p>
            <ul class="tags">${p.tags.map((tag) => `<li>${esc(tag)}</li>`).join('')}</ul>
            <div class="project__links">
              ${p.repo ? `<a href="${esc(p.repo)}" target="_blank" rel="noopener">${esc(t('projects.repo'))} ↗</a>` : ''}
              ${p.demo ? `<a href="${esc(p.demo)}" target="_blank" rel="noopener">${esc(t('projects.demo'))} ↗</a>` : ''}
            </div>
          </article>`,
          )
          .join('')}
      </div>
      <p class="term__prompt term__more">
        <a href="${esc(links.github)}" target="_blank" rel="noopener">${esc(t('projects.more'))} ↗</a>
      </p>
    </div>`,
};
