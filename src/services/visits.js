/**
 * Contador de visitas: cada navegador conta no máximo 1 visita por dia
 * (recarregar a página não infla o número). Sem backend → null.
 *
 * Também guarda "qual visitante você é" (o total no momento da sua 1ª visita).
 */
const DAY_KEY = 'portfolio3d:visit-day';
const NUMBER_KEY = 'portfolio3d:visitor-number';

const storage = {
  get: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k, v) => {
    try {
      localStorage.setItem(k, v);
      return true;
    } catch {
      return false;
    }
  },
};

/** @returns {Promise<{ count: number, today: number, mine: number|null } | null>} */
export async function loadVisits() {
  const today = new Date().toISOString().slice(0, 10);
  // sem storage não dá pra saber se já contou hoje: só lê, pra não contar a cada recarga
  const canStore = storage.set('portfolio3d:probe', '1');
  const counted = !canStore || storage.get(DAY_KEY) === today;
  try {
    const res = await fetch('/api/visits', { method: counted ? 'GET' : 'POST' });
    if (!res.ok) return null;
    const data = await res.json();
    if (!counted) {
      storage.set(DAY_KEY, today);
      // 1ª visita deste navegador: o total agora é o "número" dele
      if (!storage.get(NUMBER_KEY)) storage.set(NUMBER_KEY, String(data.count));
    }
    const mine = Number(storage.get(NUMBER_KEY)) || null;
    return { count: data.count, today: data.today ?? 0, mine };
  } catch {
    return null;
  }
}
