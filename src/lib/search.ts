import { date } from './format.ts';

// FR-3.1: suggest places to check ONLY from records that exist, each with its source.
// No record -> no suggestion (never invent a location).
export function citedSuggestions(state, itemCode, pickGodown, pickShelf, now = Date.now()) {
  const out = [];
  const seen = new Set();
  const pickKey = `${pickGodown} / ${pickShelf}`;

  for (const s of state.stock) {
    if (s.item !== itemCode || s.qty <= 0) continue;
    const key = `${s.godown} / ${s.shelf}`;
    if (key === pickKey || seen.has(key)) continue;
    seen.add(key);
    out.push({
      key,
      godown: s.godown,
      shelf: s.shelf,
      source: `Tally stock summary: ${s.qty} on book at ${key}`,
      kind: 'stock',
      result: null,
      foundQty: 0,
    });
  }

  const recent = state.movements
    .filter((m) => m.item === itemCode && now - m.at < 14 * 86400000)
    .sort((a, b) => b.at - a.at);
  for (const m of recent) {
    const src = `Stock journal ${m.no}, ${date(m.at)}: ${m.qty} moved ${m.from} → ${m.to}`;
    const existing = out.find((o) => o.key === m.to);
    if (existing) { existing.source += ` · ${src}`; continue; }
    if (m.to === pickKey) continue;
    const [godown, shelf] = m.to.split(' / ');
    out.push({ key: m.to, godown, shelf, source: src, kind: 'movement', result: null, foundQty: 0 });
  }
  return out;
}
