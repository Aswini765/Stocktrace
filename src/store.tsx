import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { COMPANY, ITEMS, PARTIES, STOCK, MOVEMENTS, ORDERS, SCRIPT, DEFAULT_SETTINGS } from './data/seed.ts';
import { citedSuggestions } from './lib/search.ts';
import { taxLines } from './lib/tax.ts';
import { inr } from './lib/format.ts';

const STORAGE_KEY = 'stocktrace-v2-state';
const VERSION = 3;

export const REASONS = {
  not_found: 'Not found',
  fewer: 'Fewer found',
  damaged: 'Damaged',
  wrong_item: 'Wrong item',
};

export const OUTCOMES = {
  found: 'Found during search',
  partial: 'Ship partial, cancel the rest',
  backorder: 'Ship partial, backorder the rest',
  source: 'Source elsewhere, ship in full',
  cancel_line: 'Cancel the whole line',
};

export const DRAFT_LABEL = {
  credit_note: 'Credit Note',
  sales_invoice: 'Sales Invoice',
  stock_journal: 'Stock Journal',
  physical_stock: 'Physical Stock',
};

// ---------- selectors (one calculation, used by every screen: NFR-3) ----------
export const unitLabel = (unit: string, q: number) => (q === 1 ? unit : ({ pc: 'pcs', box: 'boxes', coil: 'coils' } as Record<string, string>)[unit] || unit);
export const totalFound = (c) => c.found + c.extraFound;
export const shortQty = (c) => Math.max(0, c.ordered - totalFound(c));
export const item = (code) => ITEMS[code];
export const party = (id) => PARTIES[id];
export const lineValue = (c) => shortQty(c) * ITEMS[c.item].rate;
export const caseDrafts = (state, caseId) => state.drafts.filter((d) => d.caseId === caseId);
export const caseRecount = (state, c) => state.recounts.find((r) => r.id === c.recountId);

export function caseStatus(state, c) {
  if (!c.outcome) {
    return c.escalatedAt ? 'AWAITING_OWNER' : 'SEARCHING';
  }
  const drafts = caseDrafts(state, c.id);
  if (drafts.some((d) => d.status === 'pending')) return 'AWAITING_APPROVAL';
  if (c.needsMessage && !c.message?.sentAt) return 'MESSAGE_PENDING';
  if (c.outcome.type === 'source' && !c.sourcingReceivedAt) return 'AWAITING_STOCK';
  const rc = caseRecount(state, c);
  if (rc && rc.status === 'open') return 'AWAITING_RECOUNT';
  return 'CLOSED';
}

export const STATUS_META = {
  SEARCHING: { label: 'Quick search', cls: 'bg-sky-50 text-sky-800 border-sky-200' },
  AWAITING_OWNER: { label: 'Owner to decide', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  MESSAGE_PENDING: { label: 'Message to send', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  AWAITING_APPROVAL: { label: 'Accountant to approve', cls: 'bg-violet-50 text-violet-800 border-violet-200' },
  AWAITING_STOCK: { label: 'Waiting for sourced stock', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  AWAITING_RECOUNT: { label: 'Recount pending', cls: 'bg-teal-50 text-teal-800 border-teal-200' },
  CLOSED: { label: 'Closed', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
};

export function lineState(state, orderId, idx) {
  return state.lineStates[`${orderId}#${idx}`] || { status: 'open' };
}

export function orderStatus(state, order) {
  const states = order.lines.map((_, i) => lineState(state, order.id, i));
  if (states.some((s) => s.status === 'open')) return 'PICKING';
  const cases = states.filter((s) => s.caseId).map((s) => state.cases.find((c) => c.id === s.caseId));
  const blocked = cases.some((c) => {
    if (!c.outcome) return true;
    if (c.outcome.type === 'source' && !c.sourcingReceivedAt) return true;
    return false;
  });
  return blocked ? 'HELD' : 'READY';
}

export function bookQty(state, itemCode, godown, shelf) {
  const row = state.stock.find((s) => s.item === itemCode && s.godown === godown && s.shelf === shelf);
  return row ? row.qty : 0;
}

// ---------- helpers ----------
const pad = (n, w = 4) => String(n).padStart(w, '0');
const fyLabel = (ms) => {
  const d = new Date(ms);
  const start = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `${String(start).slice(2)}-${String(start + 1).slice(2)}`;
};

function adjustStock(stock, itemCode, godown, shelf, delta) {
  const idx = stock.findIndex((s) => s.item === itemCode && s.godown === godown && s.shelf === shelf);
  if (idx === -1) {
    if (delta > 0) return [...stock, { item: itemCode, godown, shelf, qty: delta }];
    return stock;
  }
  const next = [...stock];
  next[idx] = { ...next[idx], qty: Math.max(0, next[idx].qty + delta) };
  return next;
}

function addAudit(c, at, actor, type, detail) {
  return { ...c, audit: [...c.audit, { at, actor, type, detail }] };
}

function updateCase(state, caseId, fn) {
  return { ...state, cases: state.cases.map((c) => (c.id === caseId ? fn(c) : c)) };
}

export function customerMessage(state, c) {
  const order = state.orders.find((o) => o.id === c.orderId);
  const p = PARTIES[order.party];
  const it = ITEMS[c.item];
  const sq = shortQty(c);
  const got = totalFound(c);
  const unit = unitLabel(it.unit, 2);
  const inv = order.invoice ? ` (invoice ${order.invoice.no})` : '';
  const sign = `\n\n— ${COMPANY.name}, ${COMPANY.city}`;
  const t = c.outcome?.type;
  const cnLine = (q) => {
    const tl = taxLines([{ qty: q, rate: it.rate, gst: it.gst }], p);
    return order.invoice
      ? ` We will issue a credit note of ${inr(tl.total)} against ${order.invoice.no}.`
      : ' Your invoice will show only the quantity we send.';
  };
  if (t === 'partial') {
    return `Dear ${p.name},\n\nFor order ${order.id}${inv}: we are sending ${got} of ${c.ordered} ${unit} of ${it.name} today. ${sq} are short and will not be sent.${cnLine(sq)} Sorry for the trouble.${sign}`;
  }
  if (t === 'backorder') {
    return `Dear ${p.name},\n\nFor order ${order.id}${inv}: we are sending ${got} of ${c.ordered} ${unit} of ${it.name} today. The remaining ${sq} will follow as a separate dispatch.${cnLine(sq)} Sorry for the delay.${sign}`;
  }
  if (t === 'cancel_line') {
    return `Dear ${p.name},\n\nFor order ${order.id}${inv}: we cannot supply ${it.name} this time, so we have removed this line (${c.ordered} ${unit}).${cnLine(c.ordered)} The rest of your order is on its way. Sorry for the trouble.${sign}`;
  }
  if (t === 'source') {
    const eta = c.outcome.sourcing?.eta ? ` by ${c.outcome.sourcing.eta}` : '';
    return `Dear ${p.name},\n\nFor order ${order.id}${inv}: ${sq} ${unit} of ${it.name} are being arranged, so your full order will be dispatched${eta}. No change to your bill. Thank you for your patience.${sign}`;
  }
  return '';
}

// When every line of an order with a shortage is settled and the order has no invoice yet,
// draft the sales invoice for the quantity actually shipped (FR-5.1).
function maybeDraftInvoice(state, orderId, at) {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order || order.invoice) return state;
  if (state.drafts.some((d) => d.type === 'sales_invoice' && d.orderId === orderId && d.status !== 'rejected')) return state;
  const states = order.lines.map((_, i) => lineState(state, orderId, i));
  if (!states.some((s) => s.caseId)) return state; // only orders that had a shortage
  const lines = [];
  for (let i = 0; i < order.lines.length; i++) {
    const s = states[i];
    const l = order.lines[i];
    const it = ITEMS[l.item];
    if (s.status === 'open') return state;
    if (s.status === 'picked') { lines.push({ item: l.item, qty: l.qty, rate: it.rate, gst: it.gst }); continue; }
    const c = state.cases.find((x) => x.id === s.caseId);
    if (!c.outcome) return state;
    const t = c.outcome.type;
    if (t === 'source' && !c.sourcingReceivedAt) return state;
    const shipped = t === 'cancel_line' ? 0 : t === 'source' || t === 'found' ? c.ordered : totalFound(c);
    if (shipped > 0) lines.push({ item: l.item, qty: shipped, rate: it.rate, gst: it.gst });
  }
  if (!lines.length) return state;
  const caseIds = states.filter((s) => s.caseId).map((s) => s.caseId);
  const id = `D-${pad(state.counters.draft + 1)}`;
  const draft = {
    id, type: 'sales_invoice', status: 'pending', createdAt: at, orderId, caseId: caseIds[0], caseIds,
    party: order.party, lines,
    narration: `Order ${orderId}: invoiced for quantity shipped after short supply (${caseIds.join(', ')}).`,
  };
  let next = { ...state, drafts: [...state.drafts, draft], counters: { ...state.counters, draft: state.counters.draft + 1 } };
  for (const cid of caseIds) {
    next = updateCase(next, cid, (c) => addAudit(c, at, 'StockTrace', 'DRAFT_CREATED', `Sales invoice draft ${id} for ${orderId} (shipped quantities).`));
  }
  return next;
}

function newDraft(state, d) {
  const id = `D-${pad(state.counters.draft + 1)}`;
  return [{ ...d, id }, { ...state, counters: { ...state.counters, draft: state.counters.draft + 1 } }];
}

// ---------- reducer ----------
export function reducer(state, action) {
  const at = action.at || Date.now();
  const actor = action.actor;
  switch (action.type) {
    case 'RESET':
      return buildInitialState();

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } };

    case 'PICK_LINE': {
      const key = `${action.orderId}#${action.lineIdx}`;
      const ls = lineState(state, action.orderId, action.lineIdx);
      if (ls.status !== 'open') return state;
      const order = state.orders.find((o) => o.id === action.orderId);
      const l = order.lines[action.lineIdx];
      let next = {
        ...state,
        lineStates: { ...state.lineStates, [key]: { status: 'picked', at } },
        stock: adjustStock(state.stock, l.item, l.godown, l.shelf, -l.qty),
      };
      return maybeDraftInvoice(next, action.orderId, at);
    }

    case 'REPORT_SHORT': {
      // NFR-2: a case exists only for a real, valid report on an open line.
      const key = `${action.orderId}#${action.lineIdx}`;
      const ls = lineState(state, action.orderId, action.lineIdx);
      const order = state.orders.find((o) => o.id === action.orderId);
      if (!order || ls.status !== 'open') return state;
      const l = order.lines[action.lineIdx];
      const found = Number(action.found);
      if (!Number.isInteger(found) || found < 0 || found >= l.qty) return state;
      if (!REASONS[action.reason]) return state;

      const caseNo = state.counters.case + 1;
      const id = `CASE-${pad(caseNo)}`;
      const suggestions = action.reason === 'damaged' ? [] : citedSuggestions(state, l.item, l.godown, l.shelf, at);
      let stock = adjustStock(state.stock, l.item, l.godown, l.shelf, -found);

      // FR-7.1: every short creates a recount task (damaged stock is in hand, so it is written off instead)
      let recounts = state.recounts;
      let recountId = null;
      let counters = { ...state.counters, case: caseNo };
      if (action.reason !== 'damaged') {
        recountId = `RC-${pad(counters.recount + 1)}`;
        counters = { ...counters, recount: counters.recount + 1 };
        recounts = [...recounts, { id: recountId, caseId: id, item: l.item, godown: l.godown, shelf: l.shelf, status: 'open', createdAt: at }];
      }

      let c = {
        id, orderId: order.id, lineIdx: action.lineIdx, item: l.item, ordered: l.qty, found, extraFound: 0,
        reason: action.reason, godown: l.godown, shelf: l.shelf, reportedAt: at,
        searchDeadline: at + state.settings.searchMinutes * 60000,
        suggestions, escalatedAt: null, escalation: null, outcome: null, decidedAt: null,
        needsMessage: false, message: null, sourcingReceivedAt: null, recountId, recountNote: null,
        returnedNote: null, audit: [],
      };
      c = addAudit(c, at, 'Picker', 'SHORT_REPORTED', `${REASONS[action.reason]}: found ${found} of ${l.qty} at ${l.godown} / ${l.shelf}. Order ${order.id} held at packing.`);
      if (recountId) c = addAudit(c, at, 'StockTrace', 'RECOUNT_CREATED', `Recount task ${recountId} for ${l.item} at ${l.godown} / ${l.shelf}.`);
      if (action.reason === 'damaged') {
        c = { ...c, escalatedAt: at, escalation: 'damaged' };
        c = addAudit(c, at, 'StockTrace', 'SENT_TO_OWNER', 'Damaged stock: no search needed. Sent to owner.');
      } else if (suggestions.length) {
        c = addAudit(c, at, 'StockTrace', 'SEARCH_SUGGESTED', `${suggestions.length} place(s) to check, each from a Tally record: ${suggestions.map((s) => s.key).join('; ')}.`);
      } else {
        c = { ...c, escalatedAt: at, escalation: 'no_records' };
        c = addAudit(c, at, 'StockTrace', 'NO_SUGGESTION', 'No Tally record shows this item anywhere else. No location suggested. Sent to owner.');
      }
      return {
        ...state, stock, recounts, counters,
        cases: [...state.cases, c],
        lineStates: { ...state.lineStates, [key]: { status: 'short', caseId: id, at } },
      };
    }

    case 'SEARCH_RESULT': {
      const c0 = state.cases.find((c) => c.id === action.caseId);
      if (!c0 || c0.outcome) return state;
      let stock = state.stock;
      let c = { ...c0, suggestions: c0.suggestions.map((s) => ({ ...s })) };
      const targets = action.locKey === '__all__' ? c.suggestions.filter((s) => !s.result) : c.suggestions.filter((s) => s.key === action.locKey && !s.result);
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
        c = { ...c, outcome: { type: 'found', at, actor: 'StockTrace' }, decidedAt: at };
        c = addAudit(c, at, 'StockTrace', 'RESOLVED_FOUND', 'Full quantity found during search. Order released for packing.');
      } else if (!c.escalatedAt && c.suggestions.every((s) => s.result)) {
        c = { ...c, escalatedAt: at, escalation: 'search_exhausted' };
        c = addAudit(c, at, 'StockTrace', 'SENT_TO_OWNER', `All suggested places checked; ${shortQty(c)} still short. Sent to owner.`);
      }
      let next = { ...state, stock, cases: state.cases.map((x) => (x.id === c.id ? c : x)) };
      return maybeDraftInvoice(next, c.orderId, at);
    }

    case 'ESCALATE':
      return updateCase(state, action.caseId, (c) => {
        if (c.escalatedAt || c.outcome) return c;
        const why = action.why === 'timeout' ? `Search time limit (${state.settings.searchMinutes} min) reached.` : 'Picker sent it to the owner.';
        return addAudit({ ...c, escalatedAt: at, escalation: action.why }, at, action.why === 'timeout' ? 'StockTrace' : 'Picker', 'SENT_TO_OWNER', why);
      });

    case 'TICK': {
      const due = state.cases.filter((c) => !c.outcome && !c.escalatedAt && at >= c.searchDeadline);
      if (!due.length) return state;
      let next = state;
      for (const c of due) next = reducer(next, { type: 'ESCALATE', caseId: c.id, why: 'timeout', at });
      return next;
    }

    case 'DECIDE': {
      const c0 = state.cases.find((c) => c.id === action.caseId);
      if (!c0 || c0.outcome || !c0.escalatedAt) return state;
      if (!['partial', 'backorder', 'source', 'cancel_line'].includes(action.outcome)) return state;
      if (action.outcome === 'source' && !action.sourcing?.supplier) return state;
      const order = state.orders.find((o) => o.id === c0.orderId);
      const it = ITEMS[c0.item];
      let next = state;
      let c = { ...c0, outcome: { type: action.outcome, at, actor: actor || 'Owner', sourcing: action.sourcing || null }, decidedAt: at, needsMessage: true, returnedNote: null };
      c = addAudit(c, at, actor || 'Owner', 'OUTCOME_CHOSEN', `${OUTCOMES[action.outcome]}${action.sourcing ? ` (supplier: ${action.sourcing.supplier}${action.sourcing.eta ? `, expected ${action.sourcing.eta}` : ''})` : ''}.`);

      // FR-5.2: invoice already raised -> credit note against it
      if (order.invoice && action.outcome !== 'source') {
        const q = action.outcome === 'cancel_line' ? c0.ordered : shortQty(c0);
        let d;
        [d, next] = newDraft(next, {
          type: 'credit_note', status: 'pending', createdAt: at, caseId: c.id, orderId: order.id, party: order.party,
          original: { ...order.invoice }, lines: [{ item: c0.item, qty: q, rate: it.rate, gst: it.gst }],
          reasonCode: 'Short supply',
          narration: `${c.id}: ${OUTCOMES[action.outcome].toLowerCase()}; ${q} ${unitLabel(it.unit, q)} of ${it.name} not supplied against ${order.invoice.no}.`,
        });
        next = { ...next, drafts: [...next.drafts, d] };
        c = addAudit(c, at, 'StockTrace', 'DRAFT_CREATED', `Credit note draft ${d.id} for ${q} × ${it.code} against ${order.invoice.no}.`);
      }
      // FR-5.3: damaged stock -> stock journal moving it out of saleable stock
      if (c0.reason === 'damaged') {
        const q = shortQty(c0);
        let d;
        [d, next] = newDraft(next, {
          type: 'stock_journal', status: 'pending', createdAt: at, caseId: c.id, item: c0.item, qty: q,
          from: `${c0.godown} / ${c0.shelf}`, to: 'Damaged Goods',
          narration: `${c.id}: ${q} ${unitLabel(it.unit, q)} of ${it.name} found damaged at ${c0.godown} / ${c0.shelf} while picking ${order.id}.`,
        });
        next = { ...next, drafts: [...next.drafts, d] };
        c = addAudit(c, at, 'StockTrace', 'DRAFT_CREATED', `Stock journal draft ${d.id}: ${q} damaged to Damaged Goods.`);
      }
      c = { ...c, message: { text: customerMessage({ ...next, cases: next.cases.map((x) => (x.id === c.id ? c : x)) }, c), sentAt: null } };
      next = { ...next, cases: next.cases.map((x) => (x.id === c.id ? c : x)) };
      return maybeDraftInvoice(next, c.orderId, at);
    }

    case 'MESSAGE_EDIT':
      return updateCase(state, action.caseId, (c) => ({ ...c, message: { ...c.message, text: action.text } }));

    case 'MESSAGE_SENT':
      return updateCase(state, action.caseId, (c) => {
        if (!c.message || c.message.sentAt) return c;
        return addAudit({ ...c, message: { ...c.message, sentAt: at } }, at, actor || 'Owner', 'CUSTOMER_MESSAGED', 'Customer message shared on WhatsApp.');
      });

    case 'SOURCED_RECEIVED': {
      const next = updateCase(state, action.caseId, (c) => {
        if (c.outcome?.type !== 'source' || c.sourcingReceivedAt) return c;
        return addAudit({ ...c, sourcingReceivedAt: at }, at, actor || 'Owner', 'SOURCED_STOCK_RECEIVED', `Sourced units received from ${c.outcome.sourcing.supplier}; order released for packing.`);
      });
      const c = next.cases.find((x) => x.id === action.caseId);
      return maybeDraftInvoice(next, c.orderId, at);
    }

    case 'APPROVE_DRAFT': {
      const d = state.drafts.find((x) => x.id === action.draftId);
      if (!d || d.status !== 'pending') return state;
      const c = state.counters;
      let voucherNo, counters = { ...c }, stock = state.stock, orders = state.orders;
      if (d.type === 'credit_note') { voucherNo = `CN/${fyLabel(at)}/${pad(c.cn + 1)}`; counters.cn++; }
      if (d.type === 'sales_invoice') {
        voucherNo = `INV-${c.inv + 1}`; counters.inv++;
        orders = orders.map((o) => (o.id === d.orderId ? { ...o, invoice: { no: voucherNo, date: at, fromDraft: d.id } } : o));
      }
      if (d.type === 'stock_journal') {
        voucherNo = `SJ-${pad(c.sj + 1)}`; counters.sj++;
        const [g, s] = d.from.split(' / ');
        stock = adjustStock(stock, d.item, g, s, -d.qty);
        stock = adjustStock(stock, d.item, 'Damaged Goods', '—', d.qty);
      }
      if (d.type === 'physical_stock') {
        voucherNo = `PS-${pad(c.ps + 1)}`; counters.ps++;
        stock = adjustStock(stock, d.item, d.godown, d.shelf, d.counted - bookQty(state, d.item, d.godown, d.shelf));
      }
      const posted = { ...d, status: 'posted', voucherNo, postedAt: at, approvedBy: actor || 'Accountant' };
      let next = { ...state, counters, stock, orders, drafts: state.drafts.map((x) => (x.id === d.id ? posted : x)) };
      for (const cid of d.caseIds || [d.caseId]) {
        next = updateCase(next, cid, (cc) => addAudit(cc, at, actor || 'Accountant', 'DRAFT_APPROVED', `${DRAFT_LABEL[d.type]} ${d.id} approved and posted to Tally as ${voucherNo}.`));
      }
      return next;
    }

    case 'REJECT_DRAFT': {
      const d = state.drafts.find((x) => x.id === action.draftId);
      if (!d || d.status !== 'pending') return state;
      const note = action.note?.trim() || 'No reason given';
      let next = { ...state, drafts: state.drafts.map((x) => (x.id === d.id ? { ...x, status: 'rejected', rejectNote: note, rejectedAt: at } : x)) };
      if (d.type === 'physical_stock') {
        next = { ...next, recounts: next.recounts.map((r) => (r.id === d.recountId ? { ...r, status: 'open', counted: null, doneAt: null } : r)) };
        return updateCase(next, d.caseId, (c) => addAudit(c, at, actor || 'Accountant', 'DRAFT_REJECTED', `Physical stock draft ${d.id} rejected: ${note}. Recount reopened.`));
      }
      // A rejected bill or journal sends the case back to the owner; its other pending drafts are withdrawn.
      const ids = d.caseIds || [d.caseId];
      next = { ...next, drafts: next.drafts.map((x) => (ids.includes(x.caseId) && x.status === 'pending' && x.type !== 'physical_stock' ? { ...x, status: 'rejected', rejectNote: `Withdrawn with ${d.id}`, rejectedAt: at } : x)) };
      for (const cid of ids) {
        next = updateCase(next, cid, (c) => addAudit(
          { ...c, outcome: null, decidedAt: null, needsMessage: false, message: null, returnedNote: `${DRAFT_LABEL[d.type]} ${d.id} rejected by accountant: ${note}` },
          at, actor || 'Accountant', 'DRAFT_REJECTED', `${DRAFT_LABEL[d.type]} ${d.id} rejected: ${note}. Case returned to owner.`));
      }
      return next;
    }

    case 'RECOUNT_DONE': {
      const r = state.recounts.find((x) => x.id === action.recountId);
      const counted = Number(action.counted);
      if (!r || r.status !== 'open' || !Number.isInteger(counted) || counted < 0) return state;
      const book = bookQty(state, r.item, r.godown, r.shelf);
      const diff = counted - book;
      let next = { ...state, recounts: state.recounts.map((x) => (x.id === r.id ? { ...x, status: 'done', counted, book, diff, doneAt: at } : x)) };
      const it = ITEMS[r.item];
      if (diff !== 0) {
        let d;
        [d, next] = newDraft(next, {
          type: 'physical_stock', status: 'pending', createdAt: at, caseId: r.caseId, recountId: r.id,
          item: r.item, godown: r.godown, shelf: r.shelf, book, counted,
          narration: `${r.caseId} recount ${r.id}: counted ${counted}, book ${book} at ${r.godown} / ${r.shelf} (${diff > 0 ? '+' : ''}${diff} ${unitLabel(it.unit, Math.abs(diff))}).`,
        });
        next = { ...next, drafts: [...next.drafts, d] };
        return updateCase(next, r.caseId, (c) => addAudit(c, at, 'Picker', 'RECOUNT_DONE', `Counted ${counted} vs book ${book} at ${r.godown} / ${r.shelf}: ${diff < 0 ? `${-diff} confirmed missing` : `${diff} more than book`}. Physical stock draft ${d.id} created.`));
      }
      return updateCase(next, r.caseId, (c) => addAudit(
        { ...c, recountNote: shortQty(c) > 0 ? `Shelf matches book (${counted}). The ${shortQty(c)} short unit(s) should be on this shelf: check before writing anything off.` : null },
        at, 'Picker', 'RECOUNT_DONE', `Counted ${counted}, matches book at ${r.godown} / ${r.shelf}. No adjustment needed.`));
    }

    default:
      return state;
  }
}

// ---------- initial state ----------
export function buildInitialState() {
  let s = {
    version: VERSION,
    settings: { ...DEFAULT_SETTINGS },
    stock: STOCK.map((x) => ({ ...x })),
    movements: MOVEMENTS,
    orders: ORDERS.map((o) => ({ ...o })),
    lineStates: {},
    cases: [],
    drafts: [],
    recounts: [],
    counters: { case: 0, draft: 0, recount: 0, cn: 11, inv: 2612, sj: 421, ps: 0 },
  };
  for (const a of SCRIPT) s = reducer(s, a);
  return s;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.version === VERSION) return parsed;
    }
  } catch { /* storage unavailable: fall back to fresh demo data */ }
  return buildInitialState();
}

const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);
  useEffect(() => {
    const t = setInterval(() => dispatch({ type: 'TICK' }), 15000);
    return () => clearInterval(t);
  }, []);
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
