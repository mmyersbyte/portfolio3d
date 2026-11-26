import { Experience } from './core/Experience.js';
import { createRoom } from './world/Room.js';
import { createFurniture } from './world/Furniture.js';
import { createPostIts } from './world/PostIts.js';
import { TileHighlight, snapToTile } from './world/TileHighlight.js';
import { Wardrobe } from './world/Wardrobe.js';
import { AVATAR_SPOTS, WARDROBE_SPOT } from './world/layout.js';
import { Avatar } from './entities/Avatar.js';
import { Cat } from './entities/Cat.js';
import { WorldLabels } from './ui/WorldLabels.js';
import { t, onLangChange } from './ui/i18n.js';

/**
 * Monta a cena 3D e liga os objetos clicáveis às ações da interface.
 * Fica num módulo separado pra ser carregado via import() dinâmico:
 * o HTML/loader aparece antes do three.js terminar de baixar.
 */
export function startScene({ canvas, labelsEl, tooltipEl, actions, onReady }) {
  const exp = new Experience(canvas);

  createRoom(exp.scene);
  const { laptop, bed, chair } = createFurniture(exp);
  const notes = createPostIts(exp.scene);
  const wardrobe = new Wardrobe(exp);
  const avatar = new Avatar(exp);
  const cat = new Cat(exp);
  cat.avatar = avatar;
  const tiles = new TileHighlight(exp);
  const labels = new WorldLabels(exp, labelsEl);

  // ---------- clicáveis ----------
  const it = exp.interaction;
  it.register(avatar.root, { label: 'label.avatar', onClick: actions.chat });
  it.register(laptop, { label: 'label.laptop', onClick: actions.projects });
  it.register(cat.root, { label: 'label.cat', onClick: () => cat.poke() });
  for (const note of notes) {
    it.register(note.group, { label: `label.${note.id}`, onClick: actions[note.id] });
  }

  // móveis que o boneco usa: clicar de novo faz ele levantar
  const furnitureLabel = (name) => () =>
    avatar.spot === AVATAR_SPOTS[name] ? 'label.getUp' : `label.${name}`;
  const useFurniture = (name) => () => {
    tiles.mark(AVATAR_SPOTS[name].approach);
    avatar.use(name);
  };
  it.register(bed, {
    label: furnitureLabel('bed'),
    onClick: useFurniture('bed'),
    hoverScale: 1.02,
  });
  it.register(chair, { label: furnitureLabel('chair'), onClick: useFurniture('chair') });

  // ---------- guarda-roupa ----------
  it.register(wardrobe.group, {
    label: 'label.wardrobe',
    onClick: actions.wardrobe,
    hoverScale: 1.02,
  });

  let wardrobeTimer = 0;
  /** Boneco vai até o guarda-roupa, abre as portas, vira pra câmera e a câmera aproxima. */
  function visitWardrobe(onReady) {
    clearTimeout(wardrobeTimer);
    tiles.mark(WARDROBE_SPOT);
    avatar.walkTo(WARDROBE_SPOT, () => {
      avatar.heading = WARDROBE_SPOT.heading;
      wardrobe.setOpen(true);
      wardrobeTimer = setTimeout(() => {
        avatar.faceCamera();
        const head = avatar.root.position.clone().setY(1.2);
        // painel embaixo no celular, na direita no desktop: desloca o boneco pro lado livre
        const shift = window.innerWidth < 768 ? { shiftY: 0.22 } : { shiftX: -0.18 };
        exp.rig.focus(head, { zoom: 2.2, ...shift });
        onReady();
      }, 650);
    });
  }

  function closeWardrobe() {
    clearTimeout(wardrobeTimer);
    wardrobe.setOpen(false);
    exp.rig.reset();
  }

  // ---------- andar pelo piso (estilo Habbo) ----------
  const walkableTile = (point) => {
    if (!point) return null;
    const tile = snapToTile(point);
    return avatar.canWalk(tile.x, tile.z) ? tile : null;
  };
  it.onFloorHover = (point) => tiles.show(walkableTile(point));
  it.onFloorClick = (point) => {
    const tile = walkableTile(point);
    if (tile && avatar.walkTo(tile)) {
      tiles.mark(tile);
      actions.onWalk?.();
    }
  };

  it.onHover = (entry, x, y) => {
    tooltipEl.classList.toggle('is-visible', Boolean(entry));
    if (!entry) return;
    tooltipEl.textContent = t(typeof entry.label === 'function' ? entry.label() : entry.label);
    const maxX = window.innerWidth - tooltipEl.offsetWidth - 8;
    tooltipEl.style.transform = `translate(${Math.min(x + 16, maxX)}px, ${y + 18}px)`;
  };

  // ---------- balões ----------
  const avatarBubble = labels.add(avatar.bubbleAnchor, { text: t('bubble.avatar') });
  onLangChange(() => (avatarBubble.text = t('bubble.avatar')));

  cat.onSay = (kind) => {
    const pool = t('bubble.meow');
    const text = kind === 'purr' ? pool[2] : pool[[0, 1, 3][Math.floor(Math.random() * 3)]];
    labels.flash(cat.bubbleAnchor, text);
  };
  let zzz = null;
  cat.onSleepChange = (sleeping) => {
    zzz?.remove();
    zzz = sleeping
      ? labels.add(cat.bubbleAnchor, { text: 'z Z z', className: 'bubble--soft' })
      : null;
  };

  exp.start(onReady);
  return { exp, avatar, cat, avatarBubble, visitWardrobe, closeWardrobe };
}
