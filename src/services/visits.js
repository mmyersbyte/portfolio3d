/**
 * Contador de visitas: cada navegador conta no máximo 1 visita por dia
 * (recarregar a página não infla o número). Sem backend → null.
 */
const KEY = 'portfolio3d:visit-day';

export async function loadVisits() {
  const today = new Date().toISOString().slice(0, 10);
  let counted;
  try {
    counted = localStorage.getItem(KEY) === today;
  } catch {
    counted = true; // sem storage: só lê, pra não contar a cada recarga
  }
  try {
    const res = await fetch('/api/visits', { method: counted ? 'GET' : 'POST' });
    if (!res.ok) return null;
    const { count } = await res.json();
    if (!counted) {
      try {
        localStorage.setItem(KEY, today);
      } catch {
        /* ok */
      }
    }
    return count;
  } catch {
    return null;
  }
}
