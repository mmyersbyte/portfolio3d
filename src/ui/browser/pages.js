import {
  profile,
  links,
  socials,
  cv,
  instagramPosts,
  instagramProfile,
} from '../../data/content.js';
import { t, tr, getLang } from '../i18n.js';
import { esc } from '../views/escape.js';
import { icon } from '../icons.js';
import { projectsView } from '../views/projectsView.js';
import { DinoGame } from './DinoGame.js';

/**
 * Páginas do navegador do notebook. Cada uma:
 *  { id, icon, url, external?, title(), render(el, nav) → cleanup? }
 * `nav(id)` navega pra outra aba.
 */

const GITHUB_CACHE = 'portfolio3d:gh';
const GITHUB_TTL = 10 * 60 * 1000;

// cores das linguagens mais comuns (as mesmas do GitHub)
const LANG_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Python: '#3572A5',
  Java: '#b07219',
  Shell: '#89e051',
  Vue: '#41b883',
  Go: '#00ADD8',
};

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString(getLang() === 'pt' ? 'pt-BR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

/** Perfil + repositórios públicos (API pública do GitHub, sem token; cache de 10 min). */
async function loadGithub() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(GITHUB_CACHE));
    if (cached && Date.now() - cached.at < GITHUB_TTL) return cached.data;
  } catch {
    /* sem cache */
  }
  const base = `https://api.github.com/users/${socials.github}`;
  const [user, repos] = await Promise.all([
    fetch(base).then((r) => (r.ok ? r.json() : Promise.reject(r.status))),
    fetch(`${base}/repos?sort=updated&per_page=12`).then((r) =>
      r.ok ? r.json() : Promise.reject(r.status),
    ),
  ]);
  const data = { user, repos: repos.filter((r) => !r.fork) };
  try {
    sessionStorage.setItem(GITHUB_CACHE, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* ok */
  }
  return data;
}

const home = {
  id: 'home',
  icon: 'home',
  url: () => 'pedro.dev',
  title: () => t('tab.home'),
  render(el, nav) {
    const tiles = ['projects', 'github', 'instagram', 'linkedin', 'dino'];
    el.innerHTML = `
      <div class="pg-home">
        <h2 class="pg-home__logo">pedro<span>.dev</span></h2>
        <p class="pg-home__hello">${esc(t('home.hello'))}</p>
        <div class="pg-home__tiles">
          ${tiles
            .map(
              (id) => `<button type="button" class="pg-tile pg-tile--${id}" data-go="${id}">
                <span class="pg-tile__icon">${icon(PAGES[id].icon)}</span>
                <span>${esc(PAGES[id].title())}</span>
              </button>`,
            )
            .join('')}
        </div>
      </div>`;
    el.querySelectorAll('[data-go]').forEach((b) =>
      b.addEventListener('click', () => nav(b.dataset.go)),
    );
  },
};

const projects = {
  id: 'projects',
  icon: 'folder',
  url: () => 'pedro.dev/projetos',
  title: () => t('tab.projects'),
  render(el) {
    el.innerHTML = `<div class="pg-projects modal--laptop">${projectsView.render()}</div>`;
  },
};

const github = {
  id: 'github',
  icon: 'github',
  url: () => `github.com/${socials.github}`,
  external: () => links.github,
  title: () => 'GitHub',
  render(el) {
    el.innerHTML = `<div class="pg-gh"><p class="pg-gh__status">${esc(t('gh.loading'))}</p></div>`;
    let alive = true;
    loadGithub()
      .then(({ user, repos }) => {
        if (!alive) return;
        el.innerHTML = `
          <div class="pg-gh">
            <aside class="pg-gh__profile">
              <img src="${esc(user.avatar_url)}&s=240" alt="" width="120" height="120" loading="lazy">
              <h2>${esc(user.name ?? profile.name)}</h2>
              <p class="pg-gh__login">${esc(user.login)}</p>
              ${user.bio ? `<p>${esc(user.bio)}</p>` : ''}
              <p class="pg-gh__stats"><b>${user.followers}</b> ${esc(t('gh.followers'))} · <b>${user.following}</b> ${esc(t('gh.following'))}</p>
            </aside>
            <section class="pg-gh__repos">
              <h3>${esc(t('gh.repos'))} <span>${user.public_repos}</span></h3>
              <div class="pg-gh__grid">
                ${repos
                  .map(
                    (
                      r,
                    ) => `<a class="pg-gh__repo" href="${esc(r.html_url)}" target="_blank" rel="noopener">
                      <strong>${esc(r.name)}</strong>
                      <p>${esc(r.description ?? t('gh.noDesc'))}</p>
                      <footer>
                        ${r.language ? `<span><i style="background:${LANG_COLORS[r.language] ?? '#8b949e'}"></i>${esc(r.language)}</span>` : ''}
                        ${r.stargazers_count ? `<span>${icon('star')}${r.stargazers_count}</span>` : ''}
                        ${r.forks_count ? `<span>${icon('fork')}${r.forks_count}</span>` : ''}
                        <span>${esc(t('gh.updated').replace('{date}', fmtDate(r.pushed_at)))}</span>
                      </footer>
                    </a>`,
                  )
                  .join('')}
              </div>
            </section>
          </div>`;
      })
      .catch(() => {
        if (!alive) return;
        el.innerHTML = `<div class="pg-gh"><p class="pg-gh__status">${esc(t('gh.error'))}
          <a href="${esc(links.github)}" target="_blank" rel="noopener">${esc(t('browser.openSite'))} ↗</a></p></div>`;
      });
    return () => (alive = false);
  },
};

let igScript = null;
/** Embed oficial do Instagram (só carrega se houver posts configurados). */
function loadInstagramEmbeds() {
  if (window.instgrm) return window.instgrm.Embeds.process();
  if (igScript) return;
  igScript = document.createElement('script');
  igScript.async = true;
  igScript.src = 'https://www.instagram.com/embed.js';
  document.body.append(igScript);
}

const instagram = {
  id: 'instagram',
  icon: 'instagram',
  url: () => `instagram.com/${socials.instagram}`,
  external: () => links.instagram,
  title: () => 'Instagram',
  render(el) {
    const posts = instagramPosts.length
      ? `<div class="pg-ig__embeds">${instagramPosts
          .map(
            (url) =>
              `<blockquote class="instagram-media" data-instgrm-permalink="${esc(url)}" data-instgrm-version="14">
                <a class="pg-ig__fallback" href="${esc(url)}" target="_blank" rel="noopener">${icon('instagram')}<span>${esc(t('ig.viewPost'))} ↗</span></a>
              </blockquote>`,
          )
          .join('')}</div>`
      : `<div class="pg-ig__grid" aria-hidden="true">${Array.from({ length: 6 }, () => `<span>${icon('camera')}</span>`).join('')}</div>
         <p class="pg-note">${esc(t('ig.note'))}</p>`;
    const ig = instagramProfile;
    const num = (n) => n.toLocaleString(getLang() === 'pt' ? 'pt-BR' : 'en-US');
    el.innerHTML = `
      <div class="pg-ig">
        <header class="pg-ig__head">
          <a class="pg-ig__avatar" href="${esc(links.instagram)}" target="_blank" rel="noopener">
            <img src="${esc(profile.photo)}" alt="${esc(ig.name)}" width="150" height="150">
          </a>
          <div class="pg-ig__info">
            <div class="pg-ig__top">
              <h2>${esc(socials.instagram)}</h2>
              <a class="pg-btn pg-btn--ig" href="${esc(links.instagram)}" target="_blank" rel="noopener">${esc(t('ig.open'))} ↗</a>
            </div>
            <ul class="pg-ig__stats">
              <li><b>${num(ig.posts)}</b> ${esc(t('ig.postsCount'))}</li>
              <li><b>${num(ig.followers)}</b> ${esc(t('gh.followers'))}</li>
              <li><b>${num(ig.following)}</b> ${esc(t('gh.following'))}</li>
            </ul>
            <p class="pg-ig__name">${esc(ig.name)} <span>${esc(tr(ig.pronouns))}</span></p>
            <p class="pg-ig__bio">${esc(ig.bio)}</p>
          </div>
        </header>
        <h3 class="pg-ig__tab">${icon('camera')} ${esc(t('ig.posts'))}</h3>
        ${posts}
      </div>`;
    if (instagramPosts.length) loadInstagramEmbeds();
  },
};

const linkedin = {
  id: 'linkedin',
  icon: 'linkedin',
  url: () => `linkedin.com/in/${socials.linkedin ?? '…'}`,
  external: () => links.linkedin,
  title: () => 'LinkedIn',
  render(el) {
    el.innerHTML = `
      <div class="pg-li">
        <div class="pg-li__card">
          <div class="pg-li__cover"></div>
          <img class="pg-li__avatar" src="${esc(profile.photo)}" alt="${esc(profile.name)}" width="110" height="110">
          <h2>${esc(profile.name)}</h2>
          <p class="pg-li__role">${esc(tr(profile.role))}</p>
          <a class="pg-btn pg-btn--li" href="${esc(links.linkedin)}" target="_blank" rel="noopener">${esc(t('li.connect'))} ↗</a>
          ${socials.linkedin ? '' : `<p class="pg-note">${esc(t('li.pending'))}</p>`}
        </div>
        <section class="pg-li__card pg-li__section">
          <h3>${esc(t('li.about'))}</h3>
          <p>${esc(tr(cv.summary))}</p>
        </section>
        <section class="pg-li__card pg-li__section">
          <h3>${esc(t('li.experience'))}</h3>
          ${cv.experience
            .map(
              (job) => `<div class="pg-li__job">
                <strong>${esc(tr(job.role))}</strong>
                <span>${esc(job.company)} · ${esc(tr(job.period))}</span>
              </div>`,
            )
            .join('')}
        </section>
      </div>`;
  },
};

const dino = {
  id: 'dino',
  icon: 'dino',
  url: () => 'pedro.dev/dino',
  title: () => 'Dino',
  render(el) {
    el.innerHTML = `
      <div class="pg-dino">
        <div class="pg-dino__stage"></div>
        <p class="pg-dino__help">${esc(t('dino.help'))}</p>
        <div class="pg-dino__touch">
          <button type="button" data-act="jump">${esc(t('dino.jump'))}</button>
          <button type="button" data-act="duck">${esc(t('dino.duck'))}</button>
        </div>
      </div>`;
    const game = new DinoGame(el.querySelector('.pg-dino__stage'), t);
    // botões grandes pra quem está no celular
    const jump = el.querySelector('[data-act="jump"]');
    const duck = el.querySelector('[data-act="duck"]');
    jump.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      game.press();
    });
    duck.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      game.duck(true);
    });
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) {
      duck.addEventListener(ev, () => game.duck(false));
    }
    return () => game.destroy();
  },
};

export const PAGES = { home, projects, github, instagram, linkedin, dino };
export const TAB_ORDER = ['home', 'projects', 'github', 'instagram', 'linkedin', 'dino'];
