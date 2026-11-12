// StockTrace core: state, reducer and selectors. No React here, so the same code runs
// in the browser, in the shared-data replay (sync.ts) and in tests.
import { COMPANY, ITEMS, PARTIES, STOCK, DEFAULT_SETTINGS, SUBSTITUTES, makeSeed } from './data/seed.ts';
import { citedSuggestions } from './lib/search.ts';
import { taxLines } from './lib/tax.ts';
import { inr, inrSigned, dateTime, when } from './lib/format.ts';

export const VERSION = 5;
const HOURS_24 = 24 * 3600000;

export const REASONS: Record<string, string> = {
  not_found: 'Not on the shelf',
  fewer: 'Fewer found', // older reports; the picker now chooses "Not on the shelf"
  damaged: 'Damaged',
  wrong_item: 'Wrong item',
};

export const OUTCOMES: Record<string, string> = {
  found: 'Found during search',
  partial: 'Send what we have, cancel the rest',
  backorder: 'Send what we have, rest later',
  substitute: 'Offer a substitute item',
  source: 'Arrange stock, send in full',
  cancel_line: 'Cancel this item',
  no_change: 'Resolved with the customer, no bill change',
};
// After the truck has left only these make sense
export const OUTCOMES_AFTER_DISPATCH = ['partial', 'backorder', 'no_change'];
export const OUTCOMES_BEFORE_DISPATCH = ['partial', 'backorder', 'substitute', 'source', 'cancel_line'];

export const CUSTOMER_CHOICES: Record<string, string> = {
  agreed: 'Called customer: agreed',
  asked_wait: 'Called customer: will wait for full quantity',
  informed: 'Could not reach: informing by message',
};

export const ROOT_CAUSES: Record<string, string> = {
  wrong_shelf: 'Found on another shelf',
  return_not_entered: 'Customer return not entered',
  sample_not_entered: 'Sample / display not entered',
  damaged: 'Damaged, not written off',
  entry_error: 'Tally entry error',
  missed_on_shelf: 'Was on the shelf (missed while picking)',
  unexplained: 'Unexplained',
};

export const DRAFT_LABEL: Record<string, string> = {
  sales_invoice: 'Sales Invoice',
  reissue: 'Cancel & Re-issue Invoice',
  credit_note: 'Credit Note',
  stock_journal: 'Stock Journal',
  physical_stock: 'Physical Stock',
  purchase: 'Purchase Entry',
};
const BILL_TYPES = ['sales_invoice', 'reissue', 'credit_note'];
// a new invoice must exist before goods move
const DISPATCH_BLOCKING = ['sales_invoice', 'reissue'];

export const unitLabel = (unit: string, q: number) => (q === 1 ? unit : ({ pc: 'pcs', box: 'boxes', coil: 'coils' } as Record<string, string>)[unit] || unit);
export const item = (code: string) => ITEMS[code];
export const party = (id: string) => (PARTIES as any)[id];

// ---------- selectors (one calculation, used by every screen: NFR-3) ----------
export const totalFound = (c: any) => c.found + c.extraFound;
export const shortQty = (c: any) => Math.max(0, c.ordered - totalFound(c));
export const orderOf = (state: any, id: string) => state.orders.find((o: any) => o.id === id);
export const orderCases = (state: any, orderId: string) => state.cases.filter((c: any) => c.orderId === orderId);
export const lineCase = (state: any, orderId: string, idx: number) => state.cases.find((c: any) => c.orderId === orderId && c.lineIdx === idx) || null;
export const orderState = (state: any, orderId: string) => state.orderState[orderId] || { picked: false };
export const orderDrafts = (state: any, orderId: string) => state.drafts.filter((d: any) => d.orderId === orderId);
export const caseRecounts = (state: any, c: any) => state.recounts.filter((r: any) => r.caseIds.includes(c.id));
export const caseRecount = (state: any, c: any) => caseRecounts(state, c)[0];
export const isFound = (c: any) => c.outcome?.type === 'found';
export const isDispatched = (state: any, orderId: string) => Boolean(orderState(state, orderId).dispatchedAt);
export const openRecountOnShelf = (state: any, itemCode: string, godown: string, shelf: string) =>
  state.recounts.find((r: any) => r.item === itemCode && r.godown === godown && r.shelf === shelf && r.status !== 'done');

export function bookQty(state: any, itemCode: string, godown: string, shelf: string) {
  const row = state.stock.find((s: any) => s.item === itemCode && s.godown === godown && s.shelf === shelf);
  return row ? row.qty : 0;
}
// Damaged units reported on a shelf that are still on the book there (journal not yet approved).
// They are set aside physically, so a recount of good units must not count them as missing.
export function damagedSetAside(state: any, itemCode: string, godown: string, shelf: string) {
  return state.cases
    .filter((c: any) => c.reason === 'damaged' && c.item === itemCode && c.godown === godown && c.shelf === shelf)
    .filter((c: any) => !state.drafts.some((d: any) => d.type === 'stock_journal' && d.caseId === c.id && d.status === 'approved'))
    .reduce((n: number, c: any) => n + shortQty(c), 0);
}
export const saleableStock = (state: any, itemCode: string) =>
  state.stock.filter((s: any) => s.item === itemCode && s.godown !== 'Damaged Goods').reduce((n: number, s: any) => n + s.qty, 0);
export const substitutesFor = (state: any, itemCode: string) =>
  (SUBSTITUTES[itemCode] || []).map((code) => ({ code, qty: saleableStock(state, code) })).filter((s) => s.qty > 0);

// Why the truck cannot take the order yet (null = it can)
export function dispatchBlock(state: any, order: any): string | null {
  const os = orderState(state, order.id);
  if (os.dispatchedAt) return 'dispatched';
  if (!os.picked) return 'picking';
  const cases = orderCases(state, order.id);
  if (cases.some((c: any) => !c.outcome)) return 'decision';
  if (os.decision?.hasSource && !os.sourcingReceivedAt) return 'stock';
  if ((os.extraPicks || []).some((p: any) => !p.done)) return 'extra_pick';
  if (orderDrafts(state, order.id).some((d: any) => d.status === 'pending' && DISPATCH_BLOCKING.includes(d.type))) return 'invoice';
  return null;
}
export const dispatchReady = (state: any, order: any) => dispatchBlock(state, order) === null;

export const DISPATCH_BLOCK_TEXT: Record<string, string> = {
  dispatched: 'Dispatched',
  picking: 'Still being picked',
  decision: 'Waiting for the owner to decide the short items',
  stock: 'Waiting for the arranged stock to arrive',
  extra_pick: 'Substitute / arranged items still to be picked',
  invoice: 'Waiting for the accountant to approve the new invoice',
};

export function orderStatus(state: any, order: any) {
  const os = orderState(state, order.id);
  const cases = orderCases(state, order.id);
  if (!os.picked) return 'PICKING';
  if (cases.some((c: any) => !c.outcome && !c.escalatedAt)) return 'SEARCHING';
  if (cases.some((c: any) => !c.outcome)) return 'AWAITING_OWNER';
  if (os.decision?.needsMessage && !os.message?.sentAt) return 'MESSAGE_PENDING';
  if (os.decision?.hasSource && !os.sourcingReceivedAt) return 'AWAITING_STOCK';
  if ((os.extraPicks || []).some((p: any) => !p.done)) return 'EXTRA_PICK';
  if (!os.dispatchedAt) return dispatchBlock(state, order) === 'invoice' ? 'AWAITING_INVOICE' : 'READY';
  if (orderDrafts(state, order.id).some((d: any) => d.status === 'pending')) return 'AWAITING_APPROVAL';
  if (cases.some((c: any) => caseRecounts(state, c).some((r: any) => r.status !== 'done'))) return 'AWAITING_RECOUNT';
  return 'CLOSED';
}

export const STATUS_META: Record<string, { label: string; cls: string }> = {
  PICKING: { label: 'Picking', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  SEARCHING: { label: 'Quick search', cls: 'bg-sky-50 text-sky-800 border-sky-200' },
  AWAITING_OWNER: { label: 'Owner to decide', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  MESSAGE_PENDING: { label: 'Message to send', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  AWAITING_STOCK: { label: 'Waiting for arranged stock', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  EXTRA_PICK: { label: 'Substitute to pick', cls: 'bg-sky-50 text-sky-800 border-sky-200' },
  AWAITING_INVOICE: { label: 'New invoice to approve', cls: 'bg-violet-50 text-violet-800 border-violet-200' },
  READY: { label: 'Ready to dispatch', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  AWAITING_APPROVAL: { label: 'Accountant to approve', cls: 'bg-violet-50 text-violet-800 border-violet-200' },
  AWAITING_RECOUNT: { label: 'Recount pending', cls: 'bg-teal-50 text-teal-800 border-teal-200' },
  CLOSED: { label: 'Closed', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
};

// ---------- the correction route (how the bill is fixed) ----------
// Depends on whether there is an invoice, whether the goods have left, whether e-invoicing applies,
// and how long ago the IRN was generated.
export function correctionRoute(state: any, order: any, at = Date.now()) {
  if (!order.invoice) return { route: 'invoice_shipped', why: 'Not invoiced yet: invoice only what is shipped. No credit note needed. The truck waits for this invoice.' };
  const inv = order.invoice;
  const os = orderState(state, order.id);
  if (os.dispatchedAt) {
    return { route: 'credit_note', why: `The goods left on ${dateTime(os.dispatchedAt)} with ${inv.no}, so it cannot be cancelled: issue a credit note against it.` };
  }
  if (state.settings.eInvoicing) {
    const deadline = inv.irnAt + HOURS_24;
    if (at < deadline) {
      const ewb = inv.ewayBill ? ` Cancel e-way bill ${inv.ewayBill.no} first (an active e-way bill blocks IRN cancellation).` : '';
      return { route: 'cancel_irn', deadline, why: `E-invoice ${inv.no} is under 24 hours old: cancel its IRN by ${when(deadline, at)} and issue a fresh invoice for what is shipped.${ewb} No credit note needed. The truck waits for the new invoice.` };
    }
    return { route: 'credit_note', why: `E-invoice ${inv.no} is over 24 hours old, so it cannot be cancelled: issue a credit note against it.` };
  }
  const sameMonth = new Date(inv.date).getMonth() === new Date(at).getMonth() && new Date(inv.date).getFullYear() === new Date(at).getFullYear();
  if (!sameMonth) {
    return { route: 'credit_note', why: `${inv.no} is from an earlier month and may already be in a filed GSTR-1: issue a credit note instead of cancelling it.` };
  }
  return { route: 'cancel_reissue', why: `Not under e-invoicing, the goods have not left and ${inv.no} is from this month: cancel it and issue a fresh invoice for what is shipped (confirm this practice with your CA). The truck waits for the new invoice.` };
}

// Quantities that actually leave on the truck, by item
export function shippedLines(state: any, order: any, lines: Record<string, any>) {
  const map: Record<string, number> = {};
  order.lines.forEach((l: any, idx: number) => {
    const c = lineCase(state, order.id, idx);
    let q = l.qty;
    if (c) {
      const d = isFound(c) ? { outcome: 'found' } : lines[c.id] || {};
      const t = d.outcome;
      if (t === 'partial' || t === 'backorder' || t === 'substitute') q = totalFound(c);
      if (t === 'cancel_line') q = 0;
      if (t === 'substitute' && d.substitute) map[d.substitute.item] = (map[d.substitute.item] || 0) + d.substitute.qty;
    }
    map[l.item] = (map[l.item] || 0) + q;
  });
  return map;
}
const orderedLines = (order: any) => order.lines.reduce((m: any, l: any) => ({ ...m, [l.item]: (m[l.item] || 0) + l.qty }), {});
const toLines = (map: Record<string, number>) => Object.entries(map).filter(([, q]) => q > 0).map(([code, qty]) => ({ item: code, qty, rate: ITEMS[code].rate, gst: ITEMS[code].gst }));

export function billChange(state: any, order: any, lines: Record<string, any>) {
  const p = party(order.party);
  const before = taxLines(toLines(orderedLines(order)), p).total;
  const after = taxLines(toLines(shippedLines(state, order, lines)), p).total;
  return { before, after, diff: Math.round((after - before) * 100) / 100 };
}

// Value of a stock difference (negative = loss)
export const diffValue = (d: any) => (d.counted - d.book) * ITEMS[d.item].rate;

// ---------- helpers ----------
const pad = (n: number, w = 4) => String(n).padStart(w, '0');
const splitKey = (key: string) => { const [godown, shelf = '—'] = key.split(' / '); return [godown, shelf]; };

function adjustStock(stock: any[], itemCode: string, godown: string, shelf: string, delta: number) {
  const idx = stock.findIndex((s) => s.item === itemCode && s.godown === godown && s.shelf === shelf);
  if (idx === -1) return delta > 0 ? [...stock, { item: itemCode, godown, shelf, qty: delta }] : stock;
  const next = [...stock];
  next[idx] = { ...next[idx], qty: Math.max(0, next[idx].qty + delta) };
  return next;
}
// Take qty of an item from saleable stock, largest book quantity first; returns where it came from
function allocate(stock: any[], itemCode: string, qty: number) {
  let left = qty, next = stock;
  const alloc: any[] = [];
  const rows = stock.filter((s) => s.item === itemCode && s.godown !== 'Damaged Goods' && s.qty > 0).sort((a, b) => b.qty - a.qty);
  for (const r of rows) {
    if (!left) break;
    const q = Math.min(left, r.qty);
    next = adjustStock(next, itemCode, r.godown, r.shelf, -q);
    alloc.push({ godown: r.godown, shelf: r.shelf, qty: q });
    left -= q;
  }
  return { stock: next, alloc };
}
const addAudit = (c: any, at: number, actor: string, type: string, detail: string) => ({ ...c, audit: [...c.audit, { at, actor, type, detail }] });
const updateCase = (state: any, id: string, fn: (c: any) => any) => ({ ...state, cases: state.cases.map((c: any) => (c.id === id ? fn(c) : c)) });
const setOrderState = (state: any, orderId: string, patch: any) => ({ ...state, orderState: { ...state.orderState, [orderId]: { ...orderState(state, orderId), ...patch } } });
const auditOrder = (state: any, orderId: string, at: number, actor: string, type: string, detail: string) => {
  let next = state;
  for (const c of orderCases(state, orderId)) next = updateCase(next, c.id, (x) => addAudit(x, at, actor, type, detail));
  return next;
};
const auditCases = (state: any, ids: string[], at: number, actor: string, type: string, detail: string) =>
  ids.reduce((s, id) => updateCase(s, id, (x) => addAudit(x, at, actor, type, detail)), state);
function newDraft(state: any, d: any): [any, any] {
  const id = `D-${pad(state.counters.draft + 1)}`;
  const draft = { ...d, id };
  return [draft, { ...state, drafts: [...state.drafts, draft], counters: { ...state.counters, draft: state.counters.draft + 1 } }];
}
function newRecount(state: any, caseId: string, itemCode: string, godown: string, shelf: string, at: number, why: string): [string, any] {
  const existing = openRecountOnShelf(state, itemCode, godown, shelf);
  if (existing) {
    if (existing.caseIds.includes(caseId)) return [existing.id, state];
    return [existing.id, { ...state, recounts: state.recounts.map((r: any) => (r.id === existing.id ? { ...r, caseIds: [...r.caseIds, caseId] } : r)) }];
  }
  const id = `RC-${pad(state.counters.recount + 1)}`;
  return [id, {
    ...state,
    counters: { ...state.counters, recount: state.counters.recount + 1 },
    recounts: [...state.recounts, { id, caseId, caseIds: [caseId], item: itemCode, godown, shelf, why, status: 'open', assignedTo: 'Godown in-charge', createdAt: at }],
  }];
}

export function customerMessage(state: any, order: any, decision: any) {
  const p = party(order.party);
  const parts: string[] = [];
  for (const c of orderCases(state, order.id)) {
    const it = ITEMS[c.item];
    const d = isFound(c) ? { outcome: 'found' } : decision.lines[c.id];
    const got = totalFound(c), sq = shortQty(c), u = unitLabel(it.unit, 2);
    if (d.outcome === 'partial') parts.push(got ? `${it.name}: sending ${got} of ${c.ordered} ${u}; ${sq} cancelled.` : `${it.name}: not available this time, removed from the order.`);
    if (d.outcome === 'backorder') parts.push(got ? `${it.name}: sending ${got} of ${c.ordered} ${u} now; ${sq} will follow separately.` : `${it.name}: all ${c.ordered} ${u} will follow separately.`);
    if (d.outcome === 'cancel_line') parts.push(`${it.name}: not available this time, removed from the order.`);
    if (d.outcome === 'source') parts.push(`${it.name}: ${sq} ${u} being arranged${d.sourcing?.eta ? `, expected by ${d.sourcing.eta}` : ''}.`);
    if (d.outcome === 'substitute') {
      const s = ITEMS[d.substitute.item];
      const rest = sq - d.substitute.qty;
      const price = s.rate !== it.rate ? ` at ${inr(s.rate, 0)} each (instead of ${inr(it.rate, 0)})` : ' at the same price';
      let line = `${it.name}: sending ${got} of ${c.ordered} ${u}, plus ${d.substitute.qty} ${unitLabel(s.unit, d.substitute.qty)} of ${s.name}${price} in place of ${d.substitute.qty}.`;
      if (rest > 0) line += ` The remaining ${rest} ${d.substitute.rest === 'backorder' ? 'will follow separately' : 'are cancelled'}.`;
      parts.push(line);
    }
  }
  const bc = billChange(state, order, decision.lines);
  const r = correctionRoute(state, order, decision.at);
  let bill = 'No change to your bill.';
  if (bc.diff !== 0) {
    if (r.route === 'credit_note') bill = `We will issue a credit note against ${order.invoice.no} for ${inr(-bc.diff)}.`;
    else if (order.invoice) bill = `We will send a corrected invoice in place of ${order.invoice.no}; new total ${inr(bc.after)}.`;
    else bill = `Your invoice will show only what we send: total ${inr(bc.after)}.`;
  }
  const ending = isDispatched(state, order.id) ? 'Sorry for the trouble.'
    : decision.hasSource ? 'We will dispatch your full order together once it arrives. Sorry for the delay.'
    : 'The rest of your order is being dispatched today. Sorry for the trouble.';
  return `Dear ${p.name},\n\nAbout order ${order.id}:\n- ${parts.join('\n- ')}\n\n${bill} ${ending}\n\n— ${COMPANY.name}, ${COMPANY.city}`;
}

// Where each billed item leaves from, for Tally godown allocation
function godownsFor(state: any, order: any) {
  const g: Record<string, string> = {};
  for (const l of order.lines) g[l.item] ||= l.godown;
  for (const c of orderCases(state, order.id)) {
    const sub = c.outcome?.substitute;
    if (sub?.alloc?.length) g[sub.item] ||= sub.alloc[0].godown;
  }
  return g;
}

// Draft the bill correction for an order once its decision is final and arranged stock (if any) has arrived.
function createCorrections(state: any, orderId: string, at: number) {
  const order = orderOf(state, orderId);
  const os = orderState(state, orderId);
  if (!os.decision) return state;
  if (state.drafts.some((d: any) => d.orderId === orderId && BILL_TYPES.includes(d.type) && d.status !== 'rejected')) return state;
  const shipped = shippedLines(state, order, os.decision.lines);
  const ordered = orderedLines(order);
  const keys = new Set([...Object.keys(shipped), ...Object.keys(ordered)]);
  const changed = [...keys].some((k) => (shipped[k] || 0) !== (ordered[k] || 0));
  if (!changed) return auditOrder(state, orderId, at, 'StockTrace', 'NO_BILL_CHANGE', 'Shipped quantities match the order: no bill correction needed.');
  const r = correctionRoute(state, order, os.decision.at);
  const caseIds = orderCases(state, orderId).map((c: any) => c.id);
  const base = { status: 'pending', createdAt: at, orderId, caseId: caseIds[0], caseIds, party: order.party, route: r.route, why: r.why, godowns: godownsFor(state, order) };
  let next = state;
  if (r.route === 'invoice_shipped') {
    [, next] = newDraft(next, { ...base, type: 'sales_invoice', lines: toLines(shipped), narration: `Order ${orderId}: invoiced for quantity shipped after short supply (${caseIds.join(', ')}).` });
  } else if (r.route === 'cancel_irn' || r.route === 'cancel_reissue') {
    [, next] = newDraft(next, {
      ...base, type: 'reissue', original: { ...order.invoice }, deadline: (r as any).deadline || null, lines: toLines(shipped),
      narration: `Order ${orderId}: replaces ${order.invoice.no} after short supply (${caseIds.join(', ')}).`,
    });
  } else {
    const less: Record<string, number> = {}, more: Record<string, number> = {};
    for (const k of keys) {
      const diff = (shipped[k] || 0) - (ordered[k] || 0);
      if (diff < 0) less[k] = -diff;
      if (diff > 0) more[k] = diff;
    }
    if (Object.keys(less).length) {
      [, next] = newDraft(next, { ...base, type: 'credit_note', original: { ...order.invoice }, reasonCode: 'Short supply', lines: toLines(less), narration: `Order ${orderId}: short supply against ${order.invoice.no} (${caseIds.join(', ')}).` });
    }
    if (Object.keys(more).length) {
      [, next] = newDraft(next, { ...base, type: 'sales_invoice', lines: toLines(more), narration: `Order ${orderId}: substitute items sent in place of short items on ${order.invoice.no}.` });
    }
  }
  return auditOrder(next, orderId, at, 'StockTrace', 'CORRECTION_DRAFTED', `${r.why} Draft(s) sent to the accountant.`);
}

// A physical stock draft records a counted quantity. If a stock journal moving stock off the same shelf is
// still pending, it must be imported first, or Tally ends up with the journal applied twice.
export function blockingJournal(state: any, d: any) {
  if (d.type !== 'physical_stock') return null;
  return state.drafts.find((x: any) => x.type === 'stock_journal' && x.status === 'pending' && x.item === d.item && x.from === `${d.godown} / ${d.shelf}`) || null;
}
export const needsOwnerSignOff = (d: any) => d.type === 'physical_stock' && d.needsOwner && !d.ownerApprovedAt;

const TYPE_ORDER: Record<string, number> = { stock_journal: 0, purchase: 1, sales_invoice: 2, reissue: 2, credit_note: 2, physical_stock: 3 };
export const importOrder = (a: any, b: any) => (TYPE_ORDER[a.type] - TYPE_ORDER[b.type]) || (a.createdAt - b.createdAt);

// ---------- reducer ----------
export function reducer(state: any, action: any): any {
  const at = action.at || Date.now();
  const actor = action.actor || 'Owner';
  switch (action.type) {
    case 'RESET':
      return buildInitialState(at);

    case 'UPDATE_SETTINGS': {
      const changes = Object.entries(action.settings).filter(([k, v]) => JSON.stringify(state.settings[k]) !== JSON.stringify(v));
      if (!changes.length) return state;
      return { ...state, settings: { ...state.settings, ...action.settings }, settingsLog: [...(state.settingsLog || []), { at, actor, changes: Object.fromEntries(changes) }] };
    }

    case 'REPORT_SHORT': {
      // NFR-2: a case exists only for a real, valid report on a line of an order still being picked.
      const order = orderOf(state, action.orderId);
      if (!order || orderState(state, order.id).picked || lineCase(state, order.id, action.lineIdx)) return state;
      const l = order.lines[action.lineIdx];
      if (!l) return state;
      const found = Number(action.found);
      if (!Number.isInteger(found) || found < 0 || found >= l.qty || !REASONS[action.reason]) return state;

      const caseNo = state.counters.case + 1;
      const id = `CASE-${pad(caseNo)}`;
      const suggestions = action.reason === 'damaged' ? [] : citedSuggestions(state, l.item, l.godown, l.shelf, at);
      let next = { ...state, counters: { ...state.counters, case: caseNo } };
      let recountId = null;
      if (action.reason !== 'damaged') [recountId, next] = newRecount(next, id, l.item, l.godown, l.shelf, at, 'Short at pick');
      let c: any = {
        id, orderId: order.id, lineIdx: action.lineIdx, item: l.item, ordered: l.qty, found, extraFound: 0,
        reason: action.reason, godown: l.godown, shelf: l.shelf, reportedAt: at,
        searchDeadline: at + state.settings.searchMinutes * 60000,
        suggestions, escalatedAt: null, escalation: null, outcome: null, recountId, audit: [],
      };
      c = addAudit(c, at, 'Picker', 'SHORT_REPORTED', `${REASONS[action.reason]}: found ${found} of ${l.qty} at ${l.godown} / ${l.shelf}. Order ${order.id} held at packing.`);
      if (recountId) c = addAudit(c, at, 'StockTrace', 'RECOUNT_CREATED', `Recount ${recountId} of ${l.godown} / ${l.shelf} assigned to the godown in-charge; shelf flagged "count pending".`);
      if (action.reason === 'damaged') {
        c = addAudit({ ...c, escalatedAt: at, escalation: 'damaged' }, at, 'StockTrace', 'SENT_TO_OWNER', 'Damaged stock: no search needed. Sent to owner.');
      } else if (suggestions.length) {
        c = addAudit(c, at, 'StockTrace', 'SEARCH_SUGGESTED', `${suggestions.length} place(s) to check, each from a Tally record: ${suggestions.map((s: any) => s.key).join('; ')}.`);
      } else {
        c = addAudit({ ...c, escalatedAt: at, escalation: 'no_records' }, at, 'StockTrace', 'NO_SUGGESTION', 'No Tally record shows this item anywhere else. No location suggested. Sent to owner.');
      }
      return { ...next, cases: [...next.cases, c] };
    }

    case 'UNDO_SHORT': {
      // The picker made a mistake: allowed only before the order is picked and before anything was found or decided.
      const c = state.cases.find((x: any) => x.id === action.caseId);
      if (!c || c.outcome || c.extraFound > 0 || orderState(state, c.orderId).picked) return state;
      const recounts = state.recounts
        .map((r: any) => (r.caseIds.includes(c.id) ? { ...r, caseIds: r.caseIds.filter((x: string) => x !== c.id), caseId: r.caseId === c.id ? r.caseIds.find((x: string) => x !== c.id) : r.caseId } : r))
        .filter((r: any) => r.caseIds.length || r.status !== 'open');
      return { ...state, recounts, cases: state.cases.filter((x: any) => x.id !== c.id) };
    }

    case 'SEARCH_RESULT': {
      const c0 = state.cases.find((c: any) => c.id === action.caseId);
      if (!c0 || c0.outcome) return state;
      let next = state;
      let stock = state.stock;
      let c = { ...c0, suggestions: c0.suggestions.map((s: any) => ({ ...s })) };
      const targets = action.locKey === '__all__' ? c.suggestions.filter((s: any) => !s.result) : c.suggestions.filter((s: any) => s.key === action.locKey && !s.result);
      for (const s of targets) {
        if (action.result === 'found') {
          const q = Math.min(Math.max(1, Number(action.qty) || 1), shortQty(c));
          s.result = 'found'; s.foundQty = q;
          c.extraFound += q;
          stock = adjustStock(stock, c.item, s.godown, s.shelf, -q);
          c = addAudit(c, at, 'Picker', 'FOUND_IN_SEARCH', `Found ${q} at ${s.key} (${s.source.split(' · ')[0]}).`);
        } else {
          s.result = 'not_here';
          c = addAudit(c, at, 'Picker', 'NOT_AT_LOCATION', `Not at ${s.key}.`);
          // The book says stock should be here and it is not: that shelf needs counting too.
          if (bookQty(next, c.item, s.godown, s.shelf) > 0) {
            let rid;
            [rid, next] = newRecount(next, c.id, c.item, s.godown, s.shelf, at, `Not found where the book shows stock (${c.id})`);
            c = addAudit(c, at, 'StockTrace', 'RECOUNT_CREATED', `Book shows stock at ${s.key} but the picker found none: recount ${rid} assigned to the godown in-charge.`);
          }
        }
      }
      if (shortQty(c) === 0) {
        c = addAudit({ ...c, outcome: { type: 'found', at, actor: 'StockTrace' } }, at, 'StockTrace', 'RESOLVED_FOUND', 'Full quantity found during search. No owner decision needed for this item.');
      } else if (!c.escalatedAt && c.suggestions.every((s: any) => s.result)) {
        c = addAudit({ ...c, escalatedAt: at, escalation: 'search_exhausted' }, at, 'StockTrace', 'SENT_TO_OWNER', `All suggested places checked; ${shortQty(c)} still short. Sent to owner.`);
      }
      return { ...next, stock, cases: next.cases.map((x: any) => (x.id === c.id ? c : x)) };
    }

    case 'ESCALATE':
      return updateCase(state, action.caseId, (c) => {
        if (c.escalatedAt || c.outcome) return c;
        const why = action.why === 'timeout' ? `Search time limit (${state.settings.searchMinutes} min) reached.` : action.why === 'owner' ? 'Owner stopped the search.' : 'Picker sent it to the owner.';
        return addAudit({ ...c, escalatedAt: at, escalation: action.why }, at, action.why === 'timeout' ? 'StockTrace' : actor, 'SENT_TO_OWNER', why);
      });

    case 'TICK': {
      let next = state;
      for (const c of state.cases.filter((x: any) => !x.outcome && !x.escalatedAt && at >= x.searchDeadline)) {
        next = reducer(next, { type: 'ESCALATE', caseId: c.id, why: 'timeout', at });
      }
      return next;
    }

    case 'ORDER_PICKED': {
      const order = orderOf(state, action.orderId);
      if (!order || orderState(state, order.id).picked) return state;
      // every line not reported short is taken off the shelf in full
      let stock = state.stock;
      order.lines.forEach((l: any, idx: number) => {
        const c = lineCase(state, order.id, idx);
        stock = adjustStock(stock, l.item, l.godown, l.shelf, -(c ? c.found : l.qty));
      });
      const next = setOrderState({ ...state, stock }, order.id, { picked: true, pickedAt: at });
      return auditOrder(next, order.id, at, 'Picker', 'ORDER_PICKED', `Order ${order.id} picked and handed to packing.`);
    }

    case 'DECIDE_ORDER': {
      const order = orderOf(state, action.orderId);
      if (!order || !orderState(state, order.id).picked) return state;
      const cases = orderCases(state, order.id);
      const open = cases.filter((c: any) => !c.outcome);
      if (!open.length || open.some((c: any) => !c.escalatedAt)) return state;
      const allowed = isDispatched(state, order.id) ? OUTCOMES_AFTER_DISPATCH : OUTCOMES_BEFORE_DISPATCH;
      const lines = action.lines || {};
      for (const c of open) {
        const d = lines[c.id];
        if (!d || !allowed.includes(d.outcome)) return state;
        if (d.outcome === 'source' && !d.sourcing?.supplier?.trim()) return state;
        if (d.outcome === 'source' && d.sourcing.rate != null && d.sourcing.rate !== '' && !(Number(d.sourcing.rate) >= 0)) return state;
        if (d.outcome === 'substitute') {
          const s = d.substitute;
          if (!s || !(SUBSTITUTES[c.item] || []).includes(s.item) || !Number.isInteger(s.qty) || s.qty < 1 || s.qty > saleableStock(state, s.item) || s.qty > shortQty(c)) return state;
          if (s.qty < shortQty(c) && !['cancel', 'backorder'].includes(s.rest)) return state;
        }
      }
      if (!CUSTOMER_CHOICES[action.customerChoice]) return state;

      let next = state;
      const hasSource = open.some((c: any) => lines[c.id].outcome === 'source');
      const needsMessage = open.some((c: any) => lines[c.id].outcome !== 'no_change');
      const decided: Record<string, any> = {};
      const extraPicks: any[] = [];
      for (const c of open) {
        let d = { ...lines[c.id] };
        if (d.outcome === 'substitute') {
          const r = allocate(next.stock, d.substitute.item, d.substitute.qty);
          next = { ...next, stock: r.stock };
          d = { ...d, substitute: { ...d.substitute, alloc: r.alloc } };
          r.alloc.forEach((a: any) => extraPicks.push({ id: `${c.id}-S${extraPicks.length + 1}`, kind: 'substitute', caseId: c.id, item: d.substitute.item, qty: a.qty, godown: a.godown, shelf: a.shelf, done: false }));
          const rest = shortQty(c) - d.substitute.qty;
          if (rest > 0 && d.substitute.rest === 'backorder') next = { ...next, backorders: [...next.backorders, { orderId: order.id, caseId: c.id, item: c.item, qty: rest, at, status: 'open' }] };
        }
        if (d.outcome === 'source' && d.sourcing.rate != null && d.sourcing.rate !== '') d = { ...d, sourcing: { ...d.sourcing, rate: Number(d.sourcing.rate) } };
        decided[c.id] = d;
        next = updateCase(next, c.id, (x) => addAudit({ ...x, outcome: { type: d.outcome, at, actor, ...d } }, at, actor, 'OUTCOME_CHOSEN',
          `${OUTCOMES[d.outcome]}${d.substitute ? `: ${d.substitute.qty} × ${d.substitute.item}${shortQty(c) > d.substitute.qty ? `, remaining ${shortQty(c) - d.substitute.qty} ${d.substitute.rest === 'backorder' ? 'to follow' : 'cancelled'}` : ''}` : ''}${d.sourcing ? ` (from ${d.sourcing.supplier}${d.sourcing.eta ? `, expected ${d.sourcing.eta}` : ''})` : ''}. ${CUSTOMER_CHOICES[action.customerChoice]}${action.note ? ` — "${action.note}"` : ''}.`));
        if (d.outcome === 'backorder') next = { ...next, backorders: [...next.backorders, { orderId: order.id, caseId: c.id, item: c.item, qty: shortQty(c), at, status: 'open' }] };
        if (c.reason === 'damaged' && !next.drafts.some((x: any) => x.type === 'stock_journal' && x.caseId === c.id && x.status !== 'rejected')) {
          let dj: any;
          [dj, next] = newDraft(next, {
            type: 'stock_journal', kind: 'damaged', status: 'pending', createdAt: at, orderId: order.id, caseId: c.id, caseIds: [c.id], item: c.item, qty: shortQty(c),
            from: `${c.godown} / ${c.shelf}`, to: 'Damaged Goods',
            narration: `${c.id}: ${shortQty(c)} ${unitLabel(ITEMS[c.item].unit, shortQty(c))} of ${ITEMS[c.item].name} found damaged at ${c.godown} / ${c.shelf} while picking ${order.id}.`,
          });
          next = updateCase(next, c.id, (x) => addAudit(x, at, 'StockTrace', 'DRAFT_CREATED', `Stock journal draft ${dj.id}: damaged units to Damaged Goods.`));
        }
      }
      const decision = { at, actor, lines: decided, customerChoice: action.customerChoice, note: action.note || '', needsMessage, hasSource };
      next = setOrderState(next, order.id, { decision, returnedNote: null, extraPicks, message: needsMessage ? { text: customerMessage(next, order, decision), sentAt: null } : null });
      if (extraPicks.length) next = auditOrder(next, order.id, at, 'StockTrace', 'EXTRA_PICK', `Picker asked to add ${extraPicks.map((p) => `${p.qty} × ${p.item} from ${p.godown} / ${p.shelf}`).join(', ')} to the order.`);
      return hasSource ? next : createCorrections(next, order.id, at);
    }

    case 'EXTRA_PICKED': {
      const os = orderState(state, action.orderId);
      const p = (os.extraPicks || []).find((x: any) => x.id === action.pickId);
      if (!p || p.done) return state;
      const next = setOrderState(state, action.orderId, { extraPicks: os.extraPicks.map((x: any) => (x.id === p.id ? { ...x, done: true, doneAt: at } : x)) });
      return updateCase(next, p.caseId, (c) => addAudit(c, at, actor, 'EXTRA_PICKED', `${p.qty} × ${p.item} picked from ${p.godown} / ${p.shelf} and added to the order.`));
    }

    case 'DISPATCHED': {
      const order = orderOf(state, action.orderId);
      if (!order || !dispatchReady(state, order)) return state;
      const next = setOrderState(state, order.id, { dispatchedAt: at });
      return auditOrder(next, order.id, at, actor, 'DISPATCHED', `Order ${order.id} loaded and dispatched${order.invoice ? ` with ${order.invoice.no}` : ''}.`);
    }

    case 'MESSAGE_EDIT': {
      const os = orderState(state, action.orderId);
      if (!os.message || os.message.sentAt) return state;
      return setOrderState(state, action.orderId, { message: { ...os.message, text: action.text } });
    }

    case 'MESSAGE_SENT': {
      const os = orderState(state, action.orderId);
      if (!os.message || os.message.sentAt) return state;
      const next = setOrderState(state, action.orderId, { message: { ...os.message, sentAt: at } });
      return auditOrder(next, action.orderId, at, actor, 'CUSTOMER_MESSAGED', 'One message for the whole order shared on WhatsApp.');
    }

    case 'SOURCED_RECEIVED': {
      const os = orderState(state, action.orderId);
      if (!os.decision?.hasSource || os.sourcingReceivedAt) return state;
      let next = setOrderState(state, action.orderId, { sourcingReceivedAt: at });
      const extra = [...(os.extraPicks || [])];
      for (const c of orderCases(state, action.orderId).filter((x: any) => os.decision.lines[x.id]?.outcome === 'source')) {
        const src = os.decision.lines[c.id].sourcing;
        const qty = shortQty(c);
        // The bought-in units arrive in the receiving area; the picker adds them to the order from there.
        extra.push({ id: `${c.id}-P${extra.length + 1}`, kind: 'sourced', caseId: c.id, item: c.item, qty, godown: 'Receiving Area', shelf: 'RCV', done: false });
        let dp: any;
        [dp, next] = newDraft(next, {
          type: 'purchase', status: 'pending', createdAt: at, orderId: action.orderId, caseId: c.id, caseIds: [c.id], supplier: src.supplier, item: c.item, qty,
          rate: src.rate ?? null, godown: 'Receiving Area',
          narration: `${c.id}: ${qty} ${unitLabel(ITEMS[c.item].unit, qty)} of ${ITEMS[c.item].name} bought from ${src.supplier} for order ${action.orderId}. Enter from the supplier's bill.`,
        });
        next = updateCase(next, c.id, (x) => addAudit(x, at, 'StockTrace', 'DRAFT_CREATED', `Purchase entry ${dp.id} for ${src.supplier} sent to the accountant.`));
      }
      next = setOrderState(next, action.orderId, { extraPicks: extra });
      next = auditOrder(next, action.orderId, at, actor, 'SOURCED_STOCK_RECEIVED', 'Arranged units received in the receiving area; picker asked to add them to the order.');
      return createCorrections(next, action.orderId, at);
    }

    case 'OWNER_SIGN_OFF': {
      const d = state.drafts.find((x: any) => x.id === action.draftId);
      if (!d || d.status !== 'pending' || !needsOwnerSignOff(d)) return state;
      const next = { ...state, drafts: state.drafts.map((x: any) => (x.id === d.id ? { ...x, ownerApprovedAt: at, ownerApprovedBy: actor } : x)) };
      return auditCases(next, d.caseIds, at, actor, 'WRITE_OFF_SIGNED', `Owner signed off the stock loss in ${d.id} (${inr(-diffValue(d), 0)}).`);
    }

    case 'APPROVE_DRAFT':
    case 'APPROVE_DRAFTS': {
      const ids: string[] = action.type === 'APPROVE_DRAFT' ? [action.draftId] : action.draftIds || [];
      // journals before counts, so a batch approval respects the import order
      const ordered = ids.map((id) => state.drafts.find((x: any) => x.id === id)).filter(Boolean).sort(importOrder).map((d: any) => d.id);
      let next = state;
      for (const id of ordered) {
        const d = next.drafts.find((x: any) => x.id === id);
        if (!d || d.status !== 'pending' || needsOwnerSignOff(d) || blockingJournal(next, d)) continue;
        let stock = next.stock, orders = next.orders;
        if (d.type === 'sales_invoice' && !orderOf(next, d.orderId).invoice) {
          orders = orders.map((o: any) => (o.id === d.orderId ? { ...o, invoice: { no: action.tallyNo || 'New invoice (Tally no.)', date: at, irnAt: at, ewayBill: null, fromDraft: d.id } } : o));
        }
        if (d.type === 'reissue') {
          orders = orders.map((o: any) => (o.id === d.orderId ? { ...o, invoice: { no: action.tallyNo || `Re-issue of ${d.original.no}`, date: at, irnAt: at, ewayBill: null, fromDraft: d.id }, cancelledInvoice: d.original } : o));
        }
        if (d.type === 'stock_journal') {
          const [g, s] = splitKey(d.from);
          const [tg, ts] = splitKey(d.to);
          stock = adjustStock(adjustStock(stock, d.item, g, s, -d.qty), d.item, tg, ts, d.qty);
        }
        if (d.type === 'physical_stock') stock = adjustStock(stock, d.item, d.godown, d.shelf, d.counted - bookQty({ stock }, d.item, d.godown, d.shelf));
        const done = { ...d, status: 'approved', approvedAt: at, approvedBy: actor, tallyNo: action.tallyNo || null };
        next = { ...next, stock, orders, drafts: next.drafts.map((x: any) => (x.id === d.id ? done : x)) };
        next = auditCases(next, d.caseIds || [d.caseId], at, actor, 'DRAFT_APPROVED', d.type === 'purchase'
          ? `Purchase entry ${d.id} marked as entered in Tally.`
          : `${DRAFT_LABEL[d.type]} ${d.id} approved for import into Tally (Tally assigns the voucher number).`);
      }
      return next;
    }

    case 'REJECT_DRAFT': {
      const d = state.drafts.find((x: any) => x.id === action.draftId);
      if (!d || d.status !== 'pending') return state;
      const note = (action.note?.trim() || 'No reason given').replace(/\.+$/, '');
      let next = { ...state, drafts: state.drafts.map((x: any) => (x.id === d.id ? { ...x, status: 'rejected', rejectNote: note, rejectedAt: at, rejectedBy: actor } : x)) };
      if (d.type === 'physical_stock' || (d.type === 'stock_journal' && d.kind === 'transfer')) {
        // a count or a transfer is questioned: count the shelf again (with its linked drafts withdrawn)
        next = { ...next, drafts: next.drafts.map((x: any) => (x.recountId && x.recountId === d.recountId && x.status === 'pending' ? { ...x, status: 'rejected', rejectNote: `Withdrawn with ${d.id}`, rejectedAt: at } : x)) };
        next = { ...next, recounts: next.recounts.map((r: any) => (r.id === d.recountId ? { ...r, status: 'open', counted: null, cause: null, book: null, diff: null } : r)) };
        return auditCases(next, d.caseIds || [d.caseId], at, actor, 'DRAFT_REJECTED', `${DRAFT_LABEL[d.type]} ${d.id} sent back by ${actor}: ${note}. Recount reopened.`);
      }
      if (d.type === 'stock_journal' || d.type === 'purchase') {
        return auditCases(next, d.caseIds || [d.caseId], at, actor, 'DRAFT_REJECTED', `${DRAFT_LABEL[d.type]} ${d.id} rejected: ${note}.`);
      }
      // A rejected bill correction sends the whole order back to the owner; its other pending order drafts are withdrawn.
      next = { ...next, drafts: next.drafts.map((x: any) => (x.orderId === d.orderId && x.status === 'pending' && [...BILL_TYPES, 'purchase'].includes(x.type) ? { ...x, status: 'rejected', rejectNote: `Withdrawn with ${d.id}`, rejectedAt: at } : x)) };
      // undo stock taken for substitutes and open backorders
      let stock = next.stock;
      for (const c of orderCases(next, d.orderId)) {
        for (const a of c.outcome?.substitute?.alloc || []) stock = adjustStock(stock, c.outcome.substitute.item, a.godown, a.shelf, a.qty);
      }
      next = { ...next, stock, backorders: next.backorders.filter((b: any) => b.orderId !== d.orderId) };
      for (const c of orderCases(next, d.orderId)) {
        if (!isFound(c)) next = updateCase(next, c.id, (x) => ({ ...x, outcome: null }));
      }
      next = setOrderState(next, d.orderId, { decision: null, message: null, sourcingReceivedAt: null, extraPicks: [], returnedNote: `${DRAFT_LABEL[d.type]} ${d.id} rejected by the accountant: ${note}` });
      return auditOrder(next, d.orderId, at, actor, 'DRAFT_REJECTED', `${DRAFT_LABEL[d.type]} ${d.id} rejected: ${note}. Order returned to owner.`);
    }

    case 'RECOUNT_DONE': {
      const r = state.recounts.find((x: any) => x.id === action.recountId);
      const counted = Number(action.counted);
      if (!r || r.status !== 'open' || !Number.isInteger(counted) || counted < 0) return state;
      const rc = state.cases.find((c: any) => c.id === r.caseId);
      if (rc && !orderState(state, rc.orderId).picked) return state; // count after picking, so the book reflects what left the shelf
      // expected good units = book minus damaged units already set aside on this shelf
      const aside = damagedSetAside(state, r.item, r.godown, r.shelf);
      const book = bookQty(state, r.item, r.godown, r.shelf) - aside;
      const next = { ...state, recounts: state.recounts.map((x: any) => (x.id === r.id ? { ...x, status: 'needs_cause', counted, book, aside, diff: counted - book, countedAt: at, countedBy: actor } : x)) };
      return auditCases(next, r.caseIds, at, actor, 'RECOUNT_DONE', `Counted ${counted} good units vs ${book} expected at ${r.godown} / ${r.shelf}${aside ? ` (book ${book + aside}, ${aside} damaged set aside)` : ''}${counted === book ? ': matches.' : `: ${counted < book ? `${book - counted} missing` : `${counted - book} more than expected`}.`}`);
    }

    case 'RECOUNT_CAUSE': {
      const r = state.recounts.find((x: any) => x.id === action.recountId);
      if (!r || r.status !== 'needs_cause' || !ROOT_CAUSES[action.cause]) return state;
      const it = ITEMS[r.item];
      const orderId = state.cases.find((c: any) => c.id === r.caseId)?.orderId;
      const here = `${r.godown} / ${r.shelf}`;
      let next: any = state;
      let found = 0;
      if (action.cause === 'wrong_shelf') {
        // The missing units are on another shelf: that is a transfer in Tally, not a loss.
        found = Number(action.foundQty);
        if (r.diff >= 0 || !action.foundAt || action.foundAt === here || !Number.isInteger(found) || found < 1 || found > -r.diff) return state;
        let dt: any;
        [dt, next] = newDraft(next, {
          type: 'stock_journal', kind: 'transfer', status: 'pending', createdAt: at, orderId, caseId: r.caseId, caseIds: r.caseIds, recountId: r.id, item: r.item, qty: found,
          from: here, to: action.foundAt,
          narration: `Recount ${r.id}: ${found} ${unitLabel(it.unit, found)} of ${it.name} booked at ${here} found at ${action.foundAt}.`,
        });
        next = auditCases(next, r.caseIds, at, actor, 'DRAFT_CREATED', `Stock journal ${dt.id}: ${found} moved ${here} → ${action.foundAt} (found on the wrong shelf).`);
      }
      next = { ...next, recounts: next.recounts.map((x: any) => (x.id === r.id ? { ...x, status: 'done', cause: action.cause, foundAt: action.foundAt || null, foundQty: found || null, doneAt: at } : x)) };
      const book = r.book - found;
      if (r.counted !== book) {
        const loss = (book - r.counted) * it.rate;
        const needsOwner = loss > (state.settings.writeOffLimit ?? DEFAULT_SETTINGS.writeOffLimit);
        const cause = found ? 'unexplained' : action.cause;
        [, next] = newDraft(next, {
          type: 'physical_stock', status: 'pending', createdAt: at, orderId, caseId: r.caseId, caseIds: r.caseIds, recountId: r.id,
          item: r.item, godown: r.godown, shelf: r.shelf, book, counted: r.counted, cause, needsOwner, ownerApprovedAt: null,
          narration: `Recount ${r.id}: counted ${r.counted}, expected ${book} at ${here} (${r.counted - book > 0 ? '+' : ''}${r.counted - book} ${unitLabel(it.unit, Math.abs(r.counted - book))}). Cause: ${ROOT_CAUSES[cause]}${found ? ` (after ${found} found on another shelf)` : ''}.`,
        });
      }
      return auditCases(next, r.caseIds, at, actor, 'ROOT_CAUSE', `Cause recorded: ${ROOT_CAUSES[action.cause]}.${r.counted !== book ? ' Physical stock draft sent to the accountant.' : ''}`);
    }

    default:
      return state;
  }
}

export function buildInitialState(anchor = Date.now()): any {
  const seed = makeSeed(anchor);
  let s: any = {
    version: VERSION,
    anchor,
    settings: { ...DEFAULT_SETTINGS },
    settingsLog: [],
    stock: STOCK.map((x) => ({ ...x })),
    movements: seed.MOVEMENTS,
    purchases: seed.PURCHASES,
    orders: seed.ORDERS.map((o) => ({ ...o })),
    orderState: {},
    cases: [],
    drafts: [],
    recounts: [],
    backorders: [],
    counters: { case: 0, draft: 0, recount: 0 },
  };
  for (const a of seed.SCRIPT) s = reducer(s, a);
  return s;
}

// For reports
export { inrSigned };
