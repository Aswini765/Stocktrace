// StockTrace core: state, reducer and selectors. No React here, so the same code runs
// in the browser, in the shared-data replay (sync.ts) and in tests.
import { COMPANY, ITEMS, PARTIES, STOCK, MOVEMENTS, PURCHASES, ORDERS, SCRIPT, DEFAULT_SETTINGS, SUBSTITUTES } from './data/seed.ts';
import { citedSuggestions } from './lib/search.ts';
import { taxLines } from './lib/tax.ts';
import { inr, time } from './lib/format.ts';

export const VERSION = 4;
const HOURS_24 = 24 * 3600000;

export const REASONS: Record<string, string> = {
  not_found: 'Not found',
  fewer: 'Fewer found',
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
};

export const CUSTOMER_CHOICES: Record<string, string> = {
  agreed: 'Called customer: agreed',
  asked_wait: 'Called customer: will wait for full quantity',
  informed: 'Could not reach: informing by message',
};

export const ROOT_CAUSES: Record<string, string> = {
  wrong_shelf: 'Kept on the wrong shelf',
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
};

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
export const caseRecount = (state: any, c: any) => state.recounts.find((r: any) => r.id === c.recountId);
export const isFound = (c: any) => c.outcome?.type === 'found';
export const openRecountOnShelf = (state: any, itemCode: string, godown: string, shelf: string) =>
  state.recounts.find((r: any) => r.item === itemCode && r.godown === godown && r.shelf === shelf && r.status !== 'done');

export function bookQty(state: any, itemCode: string, godown: string, shelf: string) {
  const row = state.stock.find((s: any) => s.item === itemCode && s.godown === godown && s.shelf === shelf);
  return row ? row.qty : 0;
}
export const saleableStock = (state: any, itemCode: string) =>
  state.stock.filter((s: any) => s.item === itemCode && s.godown !== 'Damaged Goods').reduce((n: number, s: any) => n + s.qty, 0);
export const substitutesFor = (state: any, itemCode: string) =>
  (SUBSTITUTES[itemCode] || []).map((code) => ({ code, qty: saleableStock(state, code) })).filter((s) => s.qty > 0);

export function orderStatus(state: any, order: any) {
  const os = orderState(state, order.id);
  const cases = orderCases(state, order.id);
  if (!os.picked) return 'PICKING';
  if (!cases.length) return 'READY';
  if (cases.some((c: any) => !c.outcome && !c.escalatedAt)) return 'SEARCHING';
  if (cases.some((c: any) => !c.outcome)) return 'AWAITING_OWNER';
  if (os.decision?.needsMessage && !os.message?.sentAt) return 'MESSAGE_PENDING';
  if (os.decision?.hasSource && !os.sourcingReceivedAt) return 'AWAITING_STOCK';
  if (orderDrafts(state, order.id).some((d: any) => d.status === 'pending')) return 'AWAITING_APPROVAL';
  if (cases.some((c: any) => caseRecount(state, c) && caseRecount(state, c).status !== 'done')) return 'AWAITING_RECOUNT';
  return 'CLOSED';
}

// Can the truck take it? (independent of paperwork and recounts)
export function dispatchReady(state: any, order: any) {
  const os = orderState(state, order.id);
  if (!os.picked) return false;
  const cases = orderCases(state, order.id);
  if (cases.some((c: any) => !c.outcome)) return false;
  if (os.decision?.hasSource && !os.sourcingReceivedAt) return false;
  return true;
}

export const STATUS_META: Record<string, { label: string; cls: string }> = {
  PICKING: { label: 'Picking', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  READY: { label: 'Ready to pack', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  SEARCHING: { label: 'Quick search', cls: 'bg-sky-50 text-sky-800 border-sky-200' },
  AWAITING_OWNER: { label: 'Owner to decide', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  MESSAGE_PENDING: { label: 'Message to send', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  AWAITING_STOCK: { label: 'Waiting for arranged stock', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  AWAITING_APPROVAL: { label: 'Accountant to approve', cls: 'bg-violet-50 text-violet-800 border-violet-200' },
  AWAITING_RECOUNT: { label: 'Recount pending', cls: 'bg-teal-50 text-teal-800 border-teal-200' },
  CLOSED: { label: 'Closed', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
};

// ---------- the correction route (how the bill is fixed) ----------
// Depends on whether there is an invoice, whether e-invoicing applies, and how long ago the IRN was generated.
export function correctionRoute(state: any, order: any, at = Date.now()) {
  if (!order.invoice) return { route: 'invoice_shipped', why: 'Not invoiced yet: invoice only what is shipped. No credit note needed.' };
  const inv = order.invoice;
  if (state.settings.eInvoicing) {
    const deadline = inv.irnAt + HOURS_24;
    if (at < deadline) {
      const ewb = inv.ewayBill ? ` Cancel e-way bill ${inv.ewayBill.no} first (an active e-way bill blocks IRN cancellation).` : '';
      return { route: 'cancel_irn', deadline, why: `E-invoice ${inv.no} is under 24 hours old: cancel its IRN by ${time(deadline)} and issue a fresh invoice for what is shipped.${ewb} No credit note needed.` };
    }
    return { route: 'credit_note', why: `E-invoice ${inv.no} is over 24 hours old, so it cannot be cancelled: issue a credit note against it.` };
  }
  return { route: 'cancel_reissue', why: `Not under e-invoicing and the goods have not left: cancel ${inv.no} and issue a fresh invoice for what is shipped (confirm this practice with your CA).` };
}

// Quantities that actually leave on the truck, by item
export function shippedLines(state: any, order: any, lines: Record<string, any>) {
  const map: Record<string, number> = {};
  order.lines.forEach((l: any, idx: number) => {
    const c = lineCase(state, order.id, idx);
    let q = l.qty;
    if (c) {
      const t = isFound(c) ? 'found' : lines[c.id]?.outcome;
      if (t === 'partial' || t === 'backorder' || t === 'substitute') q = totalFound(c);
      if (t === 'cancel_line') q = 0;
      if (t === 'substitute') map[lines[c.id].substitute.item] = (map[lines[c.id].substitute.item] || 0) + lines[c.id].substitute.qty;
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

// ---------- helpers ----------
const pad = (n: number, w = 4) => String(n).padStart(w, '0');

function adjustStock(stock: any[], itemCode: string, godown: string, shelf: string, delta: number) {
  const idx = stock.findIndex((s) => s.item === itemCode && s.godown === godown && s.shelf === shelf);
  if (idx === -1) return delta > 0 ? [...stock, { item: itemCode, godown, shelf, qty: delta }] : stock;
  const next = [...stock];
  next[idx] = { ...next[idx], qty: Math.max(0, next[idx].qty + delta) };
  return next;
}
// Take qty of an item from saleable stock, largest book quantity first
function takeStock(stock: any[], itemCode: string, qty: number) {
  let left = qty, next = stock;
  const rows = stock.filter((s) => s.item === itemCode && s.godown !== 'Damaged Goods' && s.qty > 0).sort((a, b) => b.qty - a.qty);
  for (const r of rows) {
    if (!left) break;
    const q = Math.min(left, r.qty);
    next = adjustStock(next, itemCode, r.godown, r.shelf, -q);
    left -= q;
  }
  return next;
}
const addAudit = (c: any, at: number, actor: string, type: string, detail: string) => ({ ...c, audit: [...c.audit, { at, actor, type, detail }] });
const updateCase = (state: any, id: string, fn: (c: any) => any) => ({ ...state, cases: state.cases.map((c: any) => (c.id === id ? fn(c) : c)) });
const setOrderState = (state: any, orderId: string, patch: any) => ({ ...state, orderState: { ...state.orderState, [orderId]: { ...orderState(state, orderId), ...patch } } });
const auditOrder = (state: any, orderId: string, at: number, actor: string, type: string, detail: string) => {
  let next = state;
  for (const c of orderCases(state, orderId)) next = updateCase(next, c.id, (x) => addAudit(x, at, actor, type, detail));
  return next;
};
function newDraft(state: any, d: any) {
  const id = `D-${pad(state.counters.draft + 1)}`;
  return [{ ...d, id }, { ...state, counters: { ...state.counters, draft: state.counters.draft + 1 } }];
}

export function customerMessage(state: any, order: any, decision: any) {
  const p = party(order.party);
  const parts: string[] = [];
  for (const c of orderCases(state, order.id)) {
    const it = ITEMS[c.item];
    const d = isFound(c) ? { outcome: 'found' } : decision.lines[c.id];
    const got = totalFound(c), sq = shortQty(c), u = unitLabel(it.unit, 2);
    if (d.outcome === 'partial') parts.push(`${it.name}: sending ${got} of ${c.ordered} ${u}; ${sq} cancelled.`);
    if (d.outcome === 'backorder') parts.push(`${it.name}: sending ${got} of ${c.ordered} ${u} now; ${sq} will follow separately.`);
    if (d.outcome === 'cancel_line') parts.push(`${it.name}: not available this time, removed from the order.`);
    if (d.outcome === 'source') parts.push(`${it.name}: ${sq} ${u} being arranged; full quantity will be sent${d.sourcing?.eta ? ` by ${d.sourcing.eta}` : ''}.`);
    if (d.outcome === 'substitute') {
      const s = ITEMS[d.substitute.item];
      parts.push(`${it.name}: sending ${got} of ${c.ordered} ${u}, plus ${d.substitute.qty} ${unitLabel(s.unit, d.substitute.qty)} of ${s.name} in place of the rest.`);
    }
  }
  const bc = billChange(state, order, decision.lines);
  const r = correctionRoute(state, order, decision.at);
  let bill = 'No change to your bill.';
  if (bc.diff !== 0) {
    if (r.route === 'credit_note') bill = `We will issue a credit note against ${order.invoice.no}; your bill changes by ${inr(bc.diff)}.`;
    else if (order.invoice) bill = `We will send a corrected invoice in place of ${order.invoice.no}; new total ${inr(bc.after)}.`;
    else bill = `Your invoice will show only what we send: total ${inr(bc.after)}.`;
  }
  return `Dear ${p.name},\n\nAbout order ${order.id}:\n- ${parts.join('\n- ')}\n\n${bill} The rest of your order is being dispatched. Sorry for the trouble.\n\n— ${COMPANY.name}, ${COMPANY.city}`;
}

// Draft the bill correction for an order once its decision is final and arranged stock (if any) has arrived.
function createCorrections(state: any, orderId: string, at: number) {
  const order = orderOf(state, orderId);
  const os = orderState(state, orderId);
  if (!os.decision) return state;
  if (state.drafts.some((d: any) => d.orderId === orderId && ['sales_invoice', 'reissue', 'credit_note'].includes(d.type) && d.status !== 'rejected')) return state;
  const shipped = shippedLines(state, order, os.decision.lines);
  const ordered = orderedLines(order);
  const keys = new Set([...Object.keys(shipped), ...Object.keys(ordered)]);
  const changed = [...keys].some((k) => (shipped[k] || 0) !== (ordered[k] || 0));
  if (!changed) return auditOrder(state, orderId, at, 'StockTrace', 'NO_BILL_CHANGE', 'Shipped quantities match the order: no bill correction needed.');
  const r = correctionRoute(state, order, os.decision.at);
  const caseIds = orderCases(state, orderId).map((c: any) => c.id);
  const base = { status: 'pending', createdAt: at, orderId, caseId: caseIds[0], caseIds, party: order.party, route: r.route, why: r.why };
  let next = state, d: any;
  if (r.route === 'invoice_shipped') {
    [d, next] = newDraft(next, { ...base, type: 'sales_invoice', lines: toLines(shipped), narration: `Order ${orderId}: invoiced for quantity shipped after short supply (${caseIds.join(', ')}).` });
    next = { ...next, drafts: [...next.drafts, d] };
  } else if (r.route === 'cancel_irn' || r.route === 'cancel_reissue') {
    [d, next] = newDraft(next, {
      ...base, type: 'reissue', original: { ...order.invoice }, deadline: (r as any).deadline || null, lines: toLines(shipped),
      narration: `Order ${orderId}: replaces ${order.invoice.no} after short supply (${caseIds.join(', ')}).`,
    });
    next = { ...next, drafts: [...next.drafts, d] };
  } else {
    const less: Record<string, number> = {}, more: Record<string, number> = {};
    for (const k of keys) {
      const diff = (shipped[k] || 0) - (ordered[k] || 0);
      if (diff < 0) less[k] = -diff;
      if (diff > 0) more[k] = diff;
    }
    if (Object.keys(less).length) {
      [d, next] = newDraft(next, { ...base, type: 'credit_note', original: { ...order.invoice }, reasonCode: 'Short supply', lines: toLines(less), narration: `Order ${orderId}: short supply against ${order.invoice.no} (${caseIds.join(', ')}).` });
      next = { ...next, drafts: [...next.drafts, d] };
    }
    if (Object.keys(more).length) {
      [d, next] = newDraft(next, { ...base, type: 'sales_invoice', lines: toLines(more), narration: `Order ${orderId}: substitute items sent in place of short items on ${order.invoice.no}.` });
      next = { ...next, drafts: [...next.drafts, d] };
    }
  }
  return auditOrder(next, orderId, at, 'StockTrace', 'CORRECTION_DRAFTED', `${r.why} Draft(s) sent to the accountant.`);
}

// ---------- reducer ----------
export function reducer(state: any, action: any): any {
  const at = action.at || Date.now();
  const actor = action.actor || 'Owner';
  switch (action.type) {
    case 'RESET':
      return buildInitialState();

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } };

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
      let counters = { ...state.counters, case: caseNo };
      let recounts = state.recounts, recountId = null;
      if (action.reason !== 'damaged' && !openRecountOnShelf(state, l.item, l.godown, l.shelf)) {
        recountId = `RC-${pad(counters.recount + 1)}`;
        counters = { ...counters, recount: counters.recount + 1 };
        recounts = [...recounts, { id: recountId, caseId: id, item: l.item, godown: l.godown, shelf: l.shelf, status: 'open', assignedTo: 'Godown in-charge', createdAt: at }];
      } else if (action.reason !== 'damaged') {
        recountId = openRecountOnShelf(state, l.item, l.godown, l.shelf).id; // one count per shelf covers both cases
      }
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
      return { ...state, recounts, counters, cases: [...state.cases, c] };
    }

    case 'SEARCH_RESULT': {
      const c0 = state.cases.find((c: any) => c.id === action.caseId);
      if (!c0 || c0.outcome) return state;
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
        }
      }
      if (shortQty(c) === 0) {
        c = addAudit({ ...c, outcome: { type: 'found', at, actor: 'StockTrace' } }, at, 'StockTrace', 'RESOLVED_FOUND', 'Full quantity found during search. No owner decision needed for this item.');
      } else if (!c.escalatedAt && c.suggestions.every((s: any) => s.result)) {
        c = addAudit({ ...c, escalatedAt: at, escalation: 'search_exhausted' }, at, 'StockTrace', 'SENT_TO_OWNER', `All suggested places checked; ${shortQty(c)} still short. Sent to owner.`);
      }
      return { ...state, stock, cases: state.cases.map((x: any) => (x.id === c.id ? c : x)) };
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
      let next = setOrderState({ ...state, stock }, order.id, { picked: true, pickedAt: at });
      return auditOrder(next, order.id, at, 'Picker', 'ORDER_PICKED', `Order ${order.id} picked and handed to packing.`);
    }

    case 'DECIDE_ORDER': {
      const order = orderOf(state, action.orderId);
      if (!order || !orderState(state, order.id).picked) return state;
      const cases = orderCases(state, order.id);
      const open = cases.filter((c: any) => !c.outcome);
      if (!open.length || open.some((c: any) => !c.escalatedAt)) return state;
      const lines = action.lines || {};
      for (const c of open) {
        const d = lines[c.id];
        if (!d || !['partial', 'backorder', 'source', 'substitute', 'cancel_line'].includes(d.outcome)) return state;
        if (d.outcome === 'source' && !d.sourcing?.supplier?.trim()) return state;
        if (d.outcome === 'substitute') {
          const s = d.substitute;
          if (!s || !(SUBSTITUTES[c.item] || []).includes(s.item) || !Number.isInteger(s.qty) || s.qty < 1 || s.qty > saleableStock(state, s.item)) return state;
        }
      }
      if (!CUSTOMER_CHOICES[action.customerChoice]) return state;

      let next = state;
      const hasSource = open.some((c: any) => lines[c.id].outcome === 'source');
      const decision = { at, actor, lines, customerChoice: action.customerChoice, note: action.note || '', needsMessage: true, hasSource };
      for (const c of open) {
        const d = lines[c.id];
        next = updateCase(next, c.id, (x) => addAudit({ ...x, outcome: { type: d.outcome, at, actor, ...d } }, at, actor, 'OUTCOME_CHOSEN',
          `${OUTCOMES[d.outcome]}${d.substitute ? `: ${d.substitute.qty} × ${d.substitute.item}` : ''}${d.sourcing ? ` (from ${d.sourcing.supplier}${d.sourcing.eta ? `, expected ${d.sourcing.eta}` : ''})` : ''}. ${CUSTOMER_CHOICES[action.customerChoice]}${action.note ? ` — "${action.note}"` : ''}.`));
        if (d.outcome === 'substitute') next = { ...next, stock: takeStock(next.stock, d.substitute.item, d.substitute.qty) };
        if (d.outcome === 'backorder') next = { ...next, backorders: [...next.backorders, { orderId: order.id, caseId: c.id, item: c.item, qty: shortQty(c), at, status: 'open' }] };
        if (c.reason === 'damaged') {
          let dj: any;
          [dj, next] = newDraft(next, {
            type: 'stock_journal', status: 'pending', createdAt: at, orderId: order.id, caseId: c.id, item: c.item, qty: shortQty(c),
            from: `${c.godown} / ${c.shelf}`, to: 'Damaged Goods',
            narration: `${c.id}: ${shortQty(c)} ${unitLabel(ITEMS[c.item].unit, shortQty(c))} of ${ITEMS[c.item].name} found damaged at ${c.godown} / ${c.shelf} while picking ${order.id}.`,
          });
          next = { ...next, drafts: [...next.drafts, dj] };
          next = updateCase(next, c.id, (x) => addAudit(x, at, 'StockTrace', 'DRAFT_CREATED', `Stock journal draft ${dj.id}: damaged units to Damaged Goods.`));
        }
      }
      next = setOrderState(next, order.id, { decision, returnedNote: null, message: { text: customerMessage(next, order, decision), sentAt: null } });
      return hasSource ? next : createCorrections(next, order.id, at);
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
      next = auditOrder(next, action.orderId, at, actor, 'SOURCED_STOCK_RECEIVED', 'Arranged units received; order released for packing.');
      return createCorrections(next, action.orderId, at);
    }

    case 'APPROVE_DRAFT':
    case 'APPROVE_DRAFTS': {
      const ids: string[] = action.type === 'APPROVE_DRAFT' ? [action.draftId] : action.draftIds || [];
      let next = state;
      for (const id of ids) {
        const d = next.drafts.find((x: any) => x.id === id);
        if (!d || d.status !== 'pending') continue;
        let stock = next.stock, orders = next.orders;
        if (d.type === 'sales_invoice' && !orderOf(next, d.orderId).invoice) {
          orders = orders.map((o: any) => (o.id === d.orderId ? { ...o, invoice: { no: action.tallyNo || 'New invoice (Tally no.)', date: at, irnAt: at, ewayBill: null, fromDraft: d.id } } : o));
        }
        if (d.type === 'reissue') {
          orders = orders.map((o: any) => (o.id === d.orderId ? { ...o, invoice: { no: action.tallyNo || `Re-issue of ${d.original.no}`, date: at, irnAt: at, ewayBill: null, fromDraft: d.id }, cancelledInvoice: d.original } : o));
        }
        if (d.type === 'stock_journal') {
          const [g, s] = d.from.split(' / ');
          stock = adjustStock(adjustStock(stock, d.item, g, s, -d.qty), d.item, 'Damaged Goods', '—', d.qty);
        }
        if (d.type === 'physical_stock') stock = adjustStock(stock, d.item, d.godown, d.shelf, d.counted - bookQty(next, d.item, d.godown, d.shelf));
        const done = { ...d, status: 'approved', approvedAt: at, approvedBy: actor, tallyNo: action.tallyNo || null };
        next = { ...next, stock, orders, drafts: next.drafts.map((x: any) => (x.id === d.id ? done : x)) };
        for (const cid of d.caseIds || [d.caseId]) {
          next = updateCase(next, cid, (cc) => addAudit(cc, at, actor, 'DRAFT_APPROVED', `${DRAFT_LABEL[d.type]} ${d.id} approved for import into Tally (Tally assigns the voucher number).`));
        }
      }
      return next;
    }

    case 'REJECT_DRAFT': {
      const d = state.drafts.find((x: any) => x.id === action.draftId);
      if (!d || d.status !== 'pending') return state;
      const note = action.note?.trim() || 'No reason given';
      let next = { ...state, drafts: state.drafts.map((x: any) => (x.id === d.id ? { ...x, status: 'rejected', rejectNote: note, rejectedAt: at } : x)) };
      if (d.type === 'physical_stock') {
        next = { ...next, recounts: next.recounts.map((r: any) => (r.id === d.recountId ? { ...r, status: 'open', counted: null, cause: null } : r)) };
        return updateCase(next, d.caseId, (c) => addAudit(c, at, actor, 'DRAFT_REJECTED', `Physical stock draft ${d.id} rejected: ${note}. Recount reopened.`));
      }
      // A rejected bill correction sends the whole order back to the owner; its other pending drafts are withdrawn.
      next = { ...next, drafts: next.drafts.map((x: any) => (x.orderId === d.orderId && x.status === 'pending' && x.type !== 'physical_stock' ? { ...x, status: 'rejected', rejectNote: `Withdrawn with ${d.id}`, rejectedAt: at } : x)) };
      // undo stock taken for substitutes and open backorders
      let stock = next.stock;
      for (const c of orderCases(next, d.orderId)) {
        if (c.outcome?.type === 'substitute') {
          const sub = c.outcome.substitute;
          const home = stock.filter((x: any) => x.item === sub.item && x.godown !== 'Damaged Goods').sort((x: any, y: any) => y.qty - x.qty)[0];
          if (home) stock = adjustStock(stock, sub.item, home.godown, home.shelf, sub.qty);
        }
      }
      next = { ...next, stock, backorders: next.backorders.filter((b: any) => b.orderId !== d.orderId) };
      for (const c of orderCases(next, d.orderId)) {
        if (!isFound(c)) next = updateCase(next, c.id, (x) => ({ ...x, outcome: null }));
      }
      next = setOrderState(next, d.orderId, { decision: null, message: null, sourcingReceivedAt: null, returnedNote: `${DRAFT_LABEL[d.type]} ${d.id} rejected by accountant: ${note}` });
      return auditOrder(next, d.orderId, at, actor, 'DRAFT_REJECTED', `${DRAFT_LABEL[d.type]} ${d.id} rejected: ${note}. Order returned to owner.`);
    }

    case 'RECOUNT_DONE': {
      const r = state.recounts.find((x: any) => x.id === action.recountId);
      const counted = Number(action.counted);
      if (!r || r.status !== 'open' || !Number.isInteger(counted) || counted < 0) return state;
      const rc = state.cases.find((c: any) => c.id === r.caseId);
      if (!orderState(state, rc.orderId).picked) return state; // count after picking, so the book reflects what left the shelf
      const book = bookQty(state, r.item, r.godown, r.shelf);
      const next = { ...state, recounts: state.recounts.map((x: any) => (x.id === r.id ? { ...x, status: 'needs_cause', counted, book, diff: counted - book, countedAt: at, countedBy: actor } : x)) };
      return updateCase(next, r.caseId, (c) => addAudit(c, at, actor, 'RECOUNT_DONE', `Counted ${counted} vs book ${book} at ${r.godown} / ${r.shelf}${counted === book ? ': matches book.' : `: ${counted < book ? `${book - counted} missing` : `${counted - book} more than book`}.`}`));
    }

    case 'RECOUNT_CAUSE': {
      const r = state.recounts.find((x: any) => x.id === action.recountId);
      if (!r || r.status !== 'needs_cause' || !ROOT_CAUSES[action.cause]) return state;
      let next = { ...state, recounts: state.recounts.map((x: any) => (x.id === r.id ? { ...x, status: 'done', cause: action.cause, doneAt: at } : x)) };
      const it = ITEMS[r.item];
      if (r.diff !== 0) {
        let d: any;
        [d, next] = newDraft(next, {
          type: 'physical_stock', status: 'pending', createdAt: at, orderId: orderOf(state, state.cases.find((c: any) => c.id === r.caseId).orderId).id,
          caseId: r.caseId, recountId: r.id, item: r.item, godown: r.godown, shelf: r.shelf, book: r.book, counted: r.counted, cause: action.cause,
          narration: `${r.caseId} recount ${r.id}: counted ${r.counted}, book ${r.book} at ${r.godown} / ${r.shelf} (${r.diff > 0 ? '+' : ''}${r.diff} ${unitLabel(it.unit, Math.abs(r.diff))}). Cause: ${ROOT_CAUSES[action.cause]}.`,
        });
        next = { ...next, drafts: [...next.drafts, d] };
      }
      return updateCase(next, r.caseId, (c) => addAudit(c, at, actor, 'ROOT_CAUSE', `Cause recorded: ${ROOT_CAUSES[action.cause]}.${r.diff !== 0 ? ' Physical stock draft sent to the accountant.' : ''}`));
    }

    default:
      return state;
  }
}

export function buildInitialState(): any {
  let s: any = {
    version: VERSION,
    settings: { ...DEFAULT_SETTINGS },
    stock: STOCK.map((x) => ({ ...x })),
    movements: MOVEMENTS,
    purchases: PURCHASES,
    orders: ORDERS.map((o) => ({ ...o })),
    orderState: {},
    cases: [],
    drafts: [],
    recounts: [],
    backorders: [],
    counters: { case: 0, draft: 0, recount: 0 },
  };
  for (const a of SCRIPT) s = reducer(s, a);
  return s;
}
