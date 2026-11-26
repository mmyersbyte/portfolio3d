import { ROOM, OBSTACLES } from '../world/layout.js';

/**
 * Grade de navegação do piso + A*. O quarto é pequeno (16x16 células),
 * então uma open list simples é mais que suficiente.
 */
const CELL = 0.5;
const N = Math.round((ROOM.half * 2) / CELL);
const MARGIN = 0.22; // "raio" do gato
const EDGE = ROOM.half - 0.3;

export function isBlocked(x, z) {
  if (Math.abs(x) > EDGE || Math.abs(z) > EDGE) return true;
  return OBSTACLES.some(
    (o) => Math.abs(x - o.x) < o.w / 2 + MARGIN && Math.abs(z - o.z) < o.d / 2 + MARGIN,
  );
}

const toWorld = (i) => -ROOM.half + CELL / 2 + i * CELL;
const toCell = (v) => Math.min(N - 1, Math.max(0, Math.floor((v + ROOM.half) / CELL)));

const blocked = new Uint8Array(N * N);
for (let i = 0; i < N; i++) {
  for (let j = 0; j < N; j++) blocked[j * N + i] = isBlocked(toWorld(i), toWorld(j)) ? 1 : 0;
}

export const freeCells = [];
for (let idx = 0; idx < N * N; idx++) {
  if (!blocked[idx]) freeCells.push({ x: toWorld(idx % N), z: toWorld(Math.floor(idx / N)) });
}

function nearestFree(x, z) {
  let best = null;
  let bestD = Infinity;
  for (const c of freeCells) {
    const d = (c.x - x) ** 2 + (c.z - z) ** 2;
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

function lineIsFree(a, b) {
  const dist = Math.hypot(b.x - a.x, b.z - a.z);
  const steps = Math.ceil(dist / 0.1);
  for (let s = 1; s < steps; s++) {
    const t = s / steps;
    if (isBlocked(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false;
  }
  return true;
}

const DIRS = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [-1, -1, Math.SQRT2],
];

/** Retorna uma lista de pontos {x, z} do início até o destino (sem o ponto inicial). */
export function findPath(from, to) {
  const start = isBlocked(from.x, from.z) ? nearestFree(from.x, from.z) : from;
  const goal = isBlocked(to.x, to.z) ? nearestFree(to.x, to.z) : to;
  const si = toCell(start.x) + toCell(start.z) * N;
  const gi = toCell(goal.x) + toCell(goal.z) * N;

  const g = new Float32Array(N * N).fill(Infinity);
  const came = new Int32Array(N * N).fill(-1);
  const closed = new Uint8Array(N * N);
  const open = new Set([si]);
  const f = new Float32Array(N * N).fill(Infinity);
  const h = (idx) => {
    const dx = Math.abs((idx % N) - (gi % N));
    const dz = Math.abs(Math.floor(idx / N) - Math.floor(gi / N));
    return Math.max(dx, dz) + (Math.SQRT2 - 1) * Math.min(dx, dz);
  };
  g[si] = 0;
  f[si] = h(si);

  while (open.size) {
    let cur = -1;
    for (const idx of open) if (cur < 0 || f[idx] < f[cur]) cur = idx;
    if (cur === gi) break;
    open.delete(cur);
    closed[cur] = 1;
    const ci = cur % N;
    const cj = Math.floor(cur / N);
    for (const [di, dj, cost] of DIRS) {
      const ni = ci + di;
      const nj = cj + dj;
      if (ni < 0 || nj < 0 || ni >= N || nj >= N) continue;
      const nIdx = nj * N + ni;
      if (blocked[nIdx] || closed[nIdx]) continue;
      // sem cortar quina de móvel na diagonal
      if (di && dj && (blocked[cj * N + ni] || blocked[nj * N + ci])) continue;
      const ng = g[cur] + cost;
      if (ng < g[nIdx]) {
        g[nIdx] = ng;
        f[nIdx] = ng + h(nIdx);
        came[nIdx] = cur;
        open.add(nIdx);
      }
    }
  }

  if (si !== gi && came[gi] < 0) return [];

  const cells = [];
  for (let idx = gi; idx !== si && idx >= 0; idx = came[idx]) {
    cells.unshift({ x: toWorld(idx % N), z: toWorld(Math.floor(idx / N)) });
  }
  if (cells.length) cells[cells.length - 1] = { x: goal.x, z: goal.z };
  else cells.push({ x: goal.x, z: goal.z });

  // suaviza: pula pontos intermediários quando dá pra ir em linha reta
  const smooth = [];
  let anchor = from;
  for (let k = 0; k < cells.length; k++) {
    const next = cells[k + 1];
    if (next && lineIsFree(anchor, next)) continue;
    smooth.push(cells[k]);
    anchor = cells[k];
  }
  return smooth;
}
