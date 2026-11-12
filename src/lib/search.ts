import { date, time } from './format.ts';
import { RETURNS_GODOWNS } from '../data/seed.ts';

// FR-3.1: suggest places to check ONLY from records that exist, each with its source.
// Sources: recent purchases not yet shelved, Tally stock summary, recent stock journals.
// No record -> no suggestion (never invent a location).
//
// Each suggestion carries:
//   source   - the record text in Tally terms (owner / accountant screens)
//   hints    - the same records as structured facts, translated on the picker's phone
//   expected - how many the records say should be there (the default for "how many here?")
export function citedSuggestions(state: any, itemCode: string, pickGodown: string, pickShelf: string, now = Date.now()) {
  const out: any[] = [];
  const pickKey = `${pickGodown} / ${pickShelf}`;
  const add = (key: string, source: string, kind: string, hint: any, expected: number) => {
    if (key === pickKey) return;
    const existing = out.find((o) => o.key === key);
    if (existing) {
      existing.source += ` · ${source}`;
      existing.hints.push(hint);
      existing.expected = Math.max(existing.expected, expected);
      return;
    }
    const [godown, shelf] = key.split(' / ');
    out.push({ key, godown, shelf, source, kind, hints: [hint], expected, returns: RETURNS_GODOWNS.includes(godown), result: null, foundQty: 0 });
  };

  // 1. Goods received in the last 12 hours: the most common place "missing" stock turns up in a small godown
  for (const p of state.purchases || []) {
    if (p.item !== itemCode || p.at > now || now - p.at > 12 * 3600000) continue;
    add(p.to, `Purchase ${p.no} from ${p.supplier}, received ${time(p.at)}: ${p.qty} in ${p.to}, may not be shelved yet`, 'purchase',
      { kind: 'purchase', qty: p.qty, at: p.at, no: p.no }, p.qty);
  }
  // 2. Book stock elsewhere
  for (const s of state.stock) {
    if (s.item !== itemCode || s.qty <= 0 || s.godown === 'Damaged Goods') continue;
    add(`${s.godown} / ${s.shelf}`, `Tally stock summary: ${s.qty} on book at ${s.godown} / ${s.shelf}`, 'stock', { kind: 'stock', qty: s.qty }, s.qty);
  }
  // 3. Recent transfers
  const recent = state.movements
    .filter((m: any) => m.item === itemCode && now - m.at < 14 * 86400000)
    .sort((a: any, b: any) => b.at - a.at);
  for (const m of recent) add(m.to, `Stock journal ${m.no}, ${date(m.at)}: ${m.qty} moved ${m.from} → ${m.to}`, 'movement', { kind: 'movement', qty: m.qty, at: m.at, no: m.no }, m.qty);

  const rank: Record<string, number> = { purchase: 0, movement: 1, stock: 2 };
  // returned goods last: they may need a condition check before they can be sold
  return out.sort((a, b) => Number(a.returns) - Number(b.returns) || rank[a.kind] - rank[b.kind]);
}
