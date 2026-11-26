import { ROOM, OBSTACLES } from '../world/layout.js';

/**
 * Grade de navegação do piso + A*.
 * Cada personagem tem a sua (o "raio" muda) e pode passar obstáculos
 * dinâmicos por chamada, ex: o gato desviando do boneco onde ele estiver.
 * O quarto é pequeno (16x16 células), então reconstruir a grade a cada busca é barato.
 */
const CELL = 0.5;
const N = Math.round((ROOM.half * 2) / CELL);
const EDGE = ROOM.half - 0.3;

const toWorld = (i) => -ROOM.half + CELL / 2 + i * CELL;
const toCell = (v) => Math.min(N - 1, Math.max(0, Math.floor((v + ROOM.half) / CELL)));

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

export class NavGrid {
  constructor({ margin }) {
    this.margin = margin;
    this.extra = [];
    this.blocked = new Uint8Array(N * N);
    this.rebuild();
  }

  isBlocked(x, z) {
    if (Math.abs(x) > EDGE || Math.abs(z) > EDGE) return true;
    const m = this.margin;
    const hit = (o) => Math.abs(x - o.x) < o.w / 2 + m && Math.abs(z - o.z) < o.d / 2 + m;
    return OBSTACLES.some(hit) || this.extra.some(hit);
  }

  rebuild(extra = []) {
    this.extra = extra;
    this.free = [];
    for (let idx = 0; idx < N * N; idx++) {
      const x = toWorld(idx % N);
      const z = toWorld(Math.floor(idx / N));
      this.blocked[idx] = this.isBlocked(x, z) ? 1 : 0;
      if (!this.blocked[idx]) this.free.push({ x, z });
    }
  }

  randomFree() {
    return this.free[Math.floor(Math.random() * this.free.length)];
  }

  nearestFree(x, z) {
    let best = null;
    let bestD = Infinity;
    for (const c of this.free) {
      const d = (c.x - x) ** 2 + (c.z - z) ** 2;
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    return best;
  }

  lineIsFree(a, b) {
    const steps = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.1);
    for (let s = 1; s < steps; s++) {
      const t = s / steps;
      if (this.isBlocked(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false;
    }
    return true;
  }

  /**
   * Lista de pontos {x, z} até o destino (sem o ponto inicial).
   * Destino bloqueado vira a célula livre mais próxima. Sem caminho: [].
   */
  findPath(from, to, extra = []) {
    this.rebuild(extra);
    if (!this.free.length) return [];
    const start = this.isBlocked(from.x, from.z) ? this.nearestFree(from.x, from.z) : from;
    const goal = this.isBlocked(to.x, to.z) ? this.nearestFree(to.x, to.z) : to;
    const blocked = this.blocked;
    // o ponto pode estar livre mas cair numa célula bloqueada (ex: tile da borda):
    // nesse caso a busca usa a célula livre mais próxima e o caminho termina no ponto exato
    const cellOf = (p) => {
      const idx = toCell(p.x) + toCell(p.z) * N;
      if (!blocked[idx]) return idx;
      const c = this.nearestFree(p.x, p.z);
      return toCell(c.x) + toCell(c.z) * N;
    };
    const si = cellOf(start);
    const gi = cellOf(goal);

    const g = new Float32Array(N * N).fill(Infinity);
    const f = new Float32Array(N * N).fill(Infinity);
    const came = new Int32Array(N * N).fill(-1);
    const closed = new Uint8Array(N * N);
    const open = new Set([si]);
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
    let anchor = start;
    for (let k = 0; k < cells.length; k++) {
      const next = cells[k + 1];
      if (next && this.lineIsFree(anchor, next)) continue;
      smooth.push(cells[k]);
      anchor = cells[k];
    }
    return smooth;
  }
}
