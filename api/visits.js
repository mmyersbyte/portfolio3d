import { handleVisits } from './_lib/visits.js';

/** GET /api/visits → { count, today } · POST /api/visits → soma 1 e devolve { count, today } */
export default async function handler(req, res) {
  const { status, body } = await handleVisits({ method: req.method });
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(body);
}
