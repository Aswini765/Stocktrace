import { date, time } from './format.ts';

// FR-3.1: suggest places to check ONLY from records that exist, each with its source.
// Sources: today's purchases not yet shelved, Tally stock summary, recent stock journals.
// No record -> no suggestion (never invent a location).
export function citedSuggestions(state: any, itemCode: string, pickGodown: string, pickShelf: string, now = Date.now()) {
  const out: any[] = [];
  const pickKey = `${pickGodown} / ${pickShelf}`;
  const add = (key: string, source: string, kind: string) => {
    if (key === pickKey) return;
    const existing = out.find((o) => o.key === key);
    if (existing) { existing.source += ` · ${source}`; return; }
    const [godown, shelf] = key.split(' / ');
    out.push({ key, godown, shelf, source, kind, result: null, foundQty: 0 });
  };

  // 1. Goods received today: the most common place "missing" stock turns up in a small godown
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  for (const p of state.purchases || []) {
    if (p.item !== itemCode || p.at < startOfDay.getTime() || p.at > now) continue;
    add(p.to, `Purchase ${p.no} from ${p.supplier}, received today ${time(p.at)}: ${p.qty} in ${p.to}, may not be shelved yet`, 'purchase');
  }
  // 2. Book stock elsewhere
  for (const s of state.stock) {
    if (s.item !== itemCode || s.qty <= 0 || s.godown === 'Damaged Goods') continue;
    add(`${s.godown} / ${s.shelf}`, `Tally stock summary: ${s.qty} on book at ${s.godown} / ${s.shelf}`, 'stock');
  }
  // 3. Recent transfers
  const recent = state.movements
    .filter((m: any) => m.item === itemCode && now - m.at < 14 * 86400000)
    .sort((a: any, b: any) => b.at - a.at);
  for (const m of recent) add(m.to, `Stock journal ${m.no}, ${date(m.at)}: ${m.qty} moved ${m.from} → ${m.to}`, 'movement');

  const rank: Record<string, number> = { purchase: 0, movement: 1, stock: 2 };
  return out.sort((a, b) => rank[a.kind] - rank[b.kind]);
}
