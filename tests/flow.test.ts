// End-to-end checks of the short-supply flow through the real reducer.
// Run: npm run test:unit
import assert from 'node:assert/strict';
import {
  reducer, buildInitialState, orderStatus, shortQty, bookQty, correctionRoute, orderOf, orderCases,
  orderState, dispatchReady, dispatchBlock, substitutesFor, blockingJournal, needsOwnerSignOff,
} from '../src/core.ts';
import { taxLines, creditNoteDeadline } from '../src/lib/tax.ts';
import { voucherXml } from '../src/lib/tally.ts';
import { PARTIES } from '../src/data/seed.ts';
import { findNumber, parseVoice } from '../src/lib/voice.ts';

let passed = 0;
const test = (name: string, fn: () => void) => { fn(); passed++; console.log(`  ✓ ${name}`); };
const run = (s: any, ...actions: any[]) => actions.reduce((acc, a) => reducer(acc, a), s);
const status = (s: any, id: string) => orderStatus(s, orderOf(s, id));
const lastCase = (s: any) => s.cases.at(-1);
const draftsOf = (s: any, id: string) => s.drafts.filter((d: any) => d.orderId === id);
// close every open recount as "matches" so an order can close
const closeRecounts = (s: any) => {
  for (const r of s.recounts.filter((x: any) => x.status === 'open')) {
    s = run(s, { type: 'RECOUNT_DONE', recountId: r.id, counted: bookQty(s, r.item, r.godown, r.shelf) });
    s = run(s, { type: 'RECOUNT_CAUSE', recountId: r.id, cause: 'missed_on_shelf' });
  }
  return s;
};

console.log('StockTrace flow tests');

test('seed: one shipped order waiting for the accountant, one waiting for the owner', () => {
  const s = buildInitialState();
  assert.equal(status(s, 'ORD-1027'), 'AWAITING_APPROVAL');
  assert.ok(orderState(s, 'ORD-1027').dispatchedAt);
  assert.equal(status(s, 'ORD-1029'), 'AWAITING_OWNER');
  const cn = s.drafts.find((d: any) => d.orderId === 'ORD-1027');
  assert.equal(cn.type, 'credit_note', 'invoice 3 days old: past the 24-hour IRN window');
  // demo clock: the e-invoice of ORD-1031 is 29 minutes old, never in the future
  assert.ok(orderOf(s, 'ORD-1031').invoice.irnAt < s.anchor);
});

test('normal picking: no tap per line, one tap per order, no paperwork, then dispatch', () => {
  let s = buildInitialState();
  assert.equal(status(s, 'ORD-1032'), 'PICKING');
  s = run(s, { type: 'ORDER_PICKED', orderId: 'ORD-1032' });
  assert.equal(status(s, 'ORD-1032'), 'READY');
  assert.equal(bookQty(s, 'EL-330', 'Main Godown', 'R3-C'), 20);
  assert.equal(draftsOf(s, 'ORD-1032').length, 0);
  s = run(s, { type: 'DISPATCHED', orderId: 'ORD-1032' });
  assert.equal(status(s, 'ORD-1032'), 'CLOSED');
});

test("professor's example: e-invoice < 24 h old, 98 of 100 -> cancel IRN and re-issue; truck waits for the new invoice", () => {
  let s = buildInitialState();
  const now = orderOf(s, 'ORD-1031').invoice.irnAt + 3600000;
  s = run(s, { type: 'REPORT_SHORT', orderId: 'ORD-1031', lineIdx: 0, found: 98, reason: 'not_found', at: now });
  const c = lastCase(s);
  assert.equal(c.suggestions[0].kind, 'purchase', 'the unshelved purchase is checked first');
  assert.match(c.suggestions[0].source, /PUR-0388/);
  assert.equal(c.suggestions[0].expected, 6, 'default for "how many here" comes from the record');
  s = run(s, { type: 'SEARCH_RESULT', caseId: c.id, locKey: '__all__', result: 'not_here', at: now + 60000 });
  s = run(s, { type: 'ORDER_PICKED', orderId: 'ORD-1031', at: now + 120000 });
  assert.equal(status(s, 'ORD-1031'), 'AWAITING_OWNER');
  s = run(s, { type: 'DECIDE_ORDER', orderId: 'ORD-1031', lines: { [c.id]: { outcome: 'partial' } }, customerChoice: 'agreed', at: now + 300000 });
  const drafts = draftsOf(s, 'ORD-1031');
  assert.equal(drafts.length, 1);
  assert.equal(drafts[0].type, 'reissue');
  assert.equal(drafts[0].route, 'cancel_irn');
  assert.deepEqual(drafts[0].lines.map((l: any) => [l.item, l.qty]), [['EL-901', 98], ['EL-214', 50]]);
  const msg = orderState(s, 'ORD-1031').message.text;
  assert.match(msg, /sending 98 of 100/);
  assert.match(msg, /corrected invoice in place of INV-2611/);
  assert.equal(dispatchBlock(s, orderOf(s, 'ORD-1031')), 'invoice', 'goods must not move on the old invoice');
  assert.equal(run(s, { type: 'DISPATCHED', orderId: 'ORD-1031' }), s, 'dispatch refused');
  assert.equal(status(s, 'ORD-1031'), 'MESSAGE_PENDING');
  s = run(s, { type: 'MESSAGE_SENT', orderId: 'ORD-1031' });
  assert.equal(status(s, 'ORD-1031'), 'AWAITING_INVOICE');
  s = run(s, { type: 'APPROVE_DRAFTS', draftIds: [drafts[0].id], actor: 'Accountant' });
  assert.equal(orderOf(s, 'ORD-1031').cancelledInvoice.no, 'INV-2611');
  assert.doesNotMatch(voucherXml(s.drafts.find((d: any) => d.id === drafts[0].id)), /<VOUCHERNUMBER>/, 'Tally numbers the voucher');
  assert.equal(status(s, 'ORD-1031'), 'READY');
  s = run(s, { type: 'DISPATCHED', orderId: 'ORD-1031' });
  // recount by the in-charge: book 140 - 98 = 42, counted 40 -> 2 missing, cause required
  assert.equal(status(s, 'ORD-1031'), 'AWAITING_RECOUNT');
  const rc = s.recounts.find((r: any) => r.caseId === c.id && r.shelf === 'R2-B');
  assert.equal(rc.assignedTo, 'Godown in-charge');
  s = run(s, { type: 'RECOUNT_DONE', recountId: rc.id, counted: 40, actor: 'Godown in-charge' });
  assert.equal(s.drafts.filter((d: any) => d.type === 'physical_stock').length, 0, 'no draft until a cause is given');
  s = run(s, { type: 'RECOUNT_CAUSE', recountId: rc.id, cause: 'return_not_entered' });
  const ps = s.drafts.find((d: any) => d.type === 'physical_stock');
  assert.equal(ps.book, 42); assert.equal(ps.counted, 40);
  assert.equal(ps.needsOwner, false, '₹1,300 is under the ₹2,000 sign-off limit');
  assert.match(ps.narration, /Customer return not entered/);
  s = run(s, { type: 'APPROVE_DRAFT', draftId: ps.id });
  assert.equal(bookQty(s, 'EL-901', 'Main Godown', 'R2-B'), 40);
  s = closeRecounts(s); // the places the picker checked and found empty were also flagged for a count
  assert.equal(status(s, 'ORD-1031'), 'CLOSED');
});

test('"not here" where the book shows stock -> that shelf gets a recount too', () => {
  let s = buildInitialState();
  s = run(s, { type: 'REPORT_SHORT', orderId: 'ORD-1031', lineIdx: 0, found: 60, reason: 'not_found' });
  const c = lastCase(s);
  s = run(s, { type: 'SEARCH_RESULT', caseId: c.id, locKey: 'Back Store / BS-1', result: 'not_here' });
  assert.ok(s.recounts.some((r: any) => r.shelf === 'BS-1' && r.caseIds.includes(c.id)));
});

test('same order, e-invoice older than 24 h -> credit note against the invoice', () => {
  let s = buildInitialState();
  const late = orderOf(s, 'ORD-1031').invoice.irnAt + 25 * 3600000;
  s = run(s, { type: 'REPORT_SHORT', orderId: 'ORD-1031', lineIdx: 0, found: 98, reason: 'not_found', at: late },
    { type: 'ESCALATE', caseId: 'CASE-0003', why: 'picker', at: late },
    { type: 'ORDER_PICKED', orderId: 'ORD-1031', at: late },
    { type: 'DECIDE_ORDER', orderId: 'ORD-1031', lines: { 'CASE-0003': { outcome: 'partial' } }, customerChoice: 'informed', at: late });
  const cn = s.drafts.find((d: any) => d.orderId === 'ORD-1031');
  assert.equal(cn.type, 'credit_note');
  assert.deepEqual(cn.lines.map((l: any) => [l.item, l.qty]), [['EL-901', 2]]);
  assert.equal(taxLines(cn.lines, PARTIES.sharma).total, 1534);
  assert.equal(dispatchReady(s, orderOf(s, 'ORD-1031')), true, 'a credit note does not hold the truck');
});

test('e-way bill active -> route says cancel the e-way bill first', () => {
  const s = buildInitialState();
  const o = orderOf(s, 'ORD-1033');
  const r: any = correctionRoute(s, o, o.invoice.irnAt + 3600000);
  assert.equal(r.route, 'cancel_irn');
  assert.match(r.why, /Cancel e-way bill/);
});

test('not under e-invoicing: re-issue only if the goods have not left; shipped -> credit note', () => {
  const s = run(buildInitialState(), { type: 'UPDATE_SETTINGS', settings: { eInvoicing: false }, actor: 'Owner' });
  const r: any = correctionRoute(s, orderOf(s, 'ORD-1031'), s.anchor);
  assert.equal(r.route, 'cancel_reissue');
  assert.match(r.why, /CA/);
  assert.equal(correctionRoute(s, orderOf(s, 'ORD-1027')).route, 'credit_note', 'ORD-1027 left two days ago');
  assert.equal(s.settingsLog.at(-1).changes.eInvoicing, false, 'setting changes are logged');
});

test('after dispatch only partial / backorder / no-change are allowed; no-change drafts nothing', () => {
  let s = buildInitialState();
  const cn = s.drafts.find((d: any) => d.orderId === 'ORD-1027' && d.status === 'pending');
  s = run(s, { type: 'REJECT_DRAFT', draftId: cn.id, note: 'Customer got the 10 in the next lot.' });
  assert.equal(status(s, 'ORD-1027'), 'AWAITING_OWNER');
  assert.match(orderState(s, 'ORD-1027').returnedNote, /next lot$/, 'no double full stop');
  const before = s;
  assert.equal(run(s, { type: 'DECIDE_ORDER', orderId: 'ORD-1027', lines: { 'CASE-0001': { outcome: 'source', sourcing: { supplier: 'X' } } }, customerChoice: 'agreed' }), before);
  s = run(s, { type: 'DECIDE_ORDER', orderId: 'ORD-1027', lines: { 'CASE-0001': { outcome: 'no_change' } }, customerChoice: 'agreed' });
  assert.equal(draftsOf(s, 'ORD-1027').filter((d: any) => d.status === 'pending' && d.type !== 'physical_stock').length, 0);
  assert.equal(orderState(s, 'ORD-1027').message, null, 'nothing to tell the customer');
});

test('not invoiced yet -> invoice for shipped quantity, and the truck waits for it', () => {
  let s = buildInitialState();
  s = run(s, { type: 'REPORT_SHORT', orderId: 'ORD-1032', lineIdx: 0, found: 15, reason: 'not_found' });
  const c = lastCase(s);
  s = run(s, { type: 'SEARCH_RESULT', caseId: c.id, locKey: '__all__', result: 'not_here' },
    { type: 'ORDER_PICKED', orderId: 'ORD-1032' },
    { type: 'DECIDE_ORDER', orderId: 'ORD-1032', lines: { [c.id]: { outcome: 'backorder' } }, customerChoice: 'agreed' });
  const inv = s.drafts.find((d: any) => d.orderId === 'ORD-1032');
  assert.equal(inv.type, 'sales_invoice');
  assert.deepEqual(inv.lines.map((l: any) => [l.item, l.qty]), [['EL-330', 15], ['EL-512', 6]]);
  assert.equal(s.backorders.length, 1);
  assert.equal(s.backorders[0].qty, 5);
  assert.equal(dispatchBlock(s, orderOf(s, 'ORD-1032')), 'invoice');
  assert.match(voucherXml(inv), /<GODOWNNAME>Main Godown<\/GODOWNNAME>/, 'Tally gets the godown');
});

test('substitute: picker gets a task to add it; remaining short must be decided; price shown to customer', () => {
  let s = buildInitialState();
  const late = orderOf(s, 'ORD-1031').invoice.irnAt + 30 * 3600000;
  s = run(s, { type: 'REPORT_SHORT', orderId: 'ORD-1031', lineIdx: 0, found: 66, reason: 'not_found', at: late },
    { type: 'ESCALATE', caseId: 'CASE-0003', why: 'picker', at: late },
    { type: 'ORDER_PICKED', orderId: 'ORD-1031', at: late });
  assert.deepEqual(substitutesFor(s, 'EL-901').map((x: any) => x.code), ['EL-902']);
  const before = s;
  // 30 in stock, 34 short: refusing to say what happens to the other 4
  assert.equal(run(s, { type: 'DECIDE_ORDER', orderId: 'ORD-1031', lines: { 'CASE-0003': { outcome: 'substitute', substitute: { item: 'EL-902', qty: 30 } } }, customerChoice: 'agreed', at: late }), before);
  s = run(s, { type: 'DECIDE_ORDER', orderId: 'ORD-1031', lines: { 'CASE-0003': { outcome: 'substitute', substitute: { item: 'EL-902', qty: 30, rest: 'backorder' } } }, customerChoice: 'agreed', at: late });
  const d = draftsOf(s, 'ORD-1031');
  assert.deepEqual(d.map((x: any) => x.type).sort(), ['credit_note', 'sales_invoice']);
  assert.equal(bookQty(s, 'EL-902', 'Main Godown', 'R2-C'), 0);
  const msg = orderState(s, 'ORD-1031').message.text;
  assert.match(msg, /30 boxes of LED Bulb 10W/); assert.match(msg, /₹690 each/); assert.match(msg, /remaining 4 will follow/);
  assert.equal(s.backorders.find((b: any) => b.caseId === 'CASE-0003').qty, 4);
  const picks = orderState(s, 'ORD-1031').extraPicks;
  assert.equal(picks.length, 1); assert.equal(picks[0].shelf, 'R2-C');
  s = run(s, { type: 'MESSAGE_SENT', orderId: 'ORD-1031' });
  assert.equal(status(s, 'ORD-1031'), 'EXTRA_PICK');
  assert.equal(dispatchBlock(s, orderOf(s, 'ORD-1031')), 'extra_pick');
  s = run(s, { type: 'EXTRA_PICKED', orderId: 'ORD-1031', pickId: picks[0].id, actor: 'Picker' });
  assert.equal(dispatchBlock(s, orderOf(s, 'ORD-1031')), 'invoice', 'the separate invoice for the substitute holds the truck');
});

test('arrange stock: purchase entry for the supplier and a pick task from receiving', () => {
  let s = buildInitialState();
  const c = s.cases.find((x: any) => x.orderId === 'ORD-1029');
  s = run(s, { type: 'DECIDE_ORDER', orderId: 'ORD-1029', lines: { [c.id]: { outcome: 'source', sourcing: { supplier: 'Gupta Distributors', eta: '3 pm', rate: '240' } } }, customerChoice: 'informed' });
  assert.equal(status(s, 'ORD-1029'), 'MESSAGE_PENDING');
  assert.match(orderState(s, 'ORD-1029').message.text, /dispatch your full order together/);
  s = run(s, { type: 'MESSAGE_SENT', orderId: 'ORD-1029' }, { type: 'SOURCED_RECEIVED', orderId: 'ORD-1029' });
  const p = s.drafts.find((d: any) => d.type === 'purchase');
  assert.equal(p.supplier, 'Gupta Distributors'); assert.equal(p.qty, 4); assert.equal(p.rate, 240);
  assert.equal(orderState(s, 'ORD-1029').extraPicks[0].godown, 'Receiving Area');
  assert.equal(status(s, 'ORD-1029'), 'EXTRA_PICK');
});

test('one decision and one message for an order with two short lines', () => {
  let s = buildInitialState();
  s = run(s, { type: 'REPORT_SHORT', orderId: 'ORD-1033', lineIdx: 0, found: 7, reason: 'not_found' },
    { type: 'REPORT_SHORT', orderId: 'ORD-1033', lineIdx: 1, found: 10, reason: 'damaged' });
  const [a, b] = orderCases(s, 'ORD-1033');
  s = run(s, { type: 'ESCALATE', caseId: a.id, why: 'picker' }, { type: 'ORDER_PICKED', orderId: 'ORD-1033' });
  const before = s;
  s = run(s, { type: 'DECIDE_ORDER', orderId: 'ORD-1033', lines: { [a.id]: { outcome: 'partial' } }, customerChoice: 'agreed' });
  assert.equal(s, before, 'a decision that leaves one line undecided is refused');
  s = run(s, { type: 'DECIDE_ORDER', orderId: 'ORD-1033', lines: { [a.id]: { outcome: 'partial' }, [b.id]: { outcome: 'cancel_line' } }, customerChoice: 'agreed' });
  const msg = orderState(s, 'ORD-1033').message.text;
  assert.match(msg, /Ceiling Fan Regulator/); assert.match(msg, /Extension Board/);
  const bill = draftsOf(s, 'ORD-1033').filter((d: any) => ['reissue', 'credit_note', 'sales_invoice'].includes(d.type));
  assert.equal(bill.length, 1, 'one bill correction for the whole order');
  assert.ok(s.drafts.some((d: any) => d.type === 'stock_journal' && d.caseId === b.id));
});

test('damaged units set aside are not counted as missing; the journal must be imported before the count', () => {
  let s = buildInitialState();
  // ORD-1029: 4 damaged at R1-D (book 30 - 8 picked = 22 on book, 4 of them damaged and set aside)
  const c = s.cases.find((x: any) => x.orderId === 'ORD-1029');
  s = run(s, { type: 'DECIDE_ORDER', orderId: 'ORD-1029', lines: { [c.id]: { outcome: 'partial' } }, customerChoice: 'agreed' });
  s = run(s, { type: 'REPORT_SHORT', orderId: 'ORD-1033', lineIdx: 1, found: 2, reason: 'not_found' });
  const c2 = lastCase(s);
  s = run(s, { type: 'ESCALATE', caseId: c2.id, why: 'picker' }, { type: 'ORDER_PICKED', orderId: 'ORD-1033' });
  const rc = s.recounts.find((r: any) => r.shelf === 'R1-D' && r.status === 'open');
  s = run(s, { type: 'RECOUNT_DONE', recountId: rc.id, counted: 15 });
  const r = s.recounts.find((x: any) => x.id === rc.id);
  assert.equal(r.aside, 4); assert.equal(r.book, 16, '22 - 2 picked = 20 on book, minus 4 damaged = 16 good expected');
  s = run(s, { type: 'RECOUNT_CAUSE', recountId: rc.id, cause: 'entry_error' });
  const ps = s.drafts.find((d: any) => d.type === 'physical_stock');
  const sj = s.drafts.find((d: any) => d.type === 'stock_journal' && d.kind === 'damaged');
  assert.equal(blockingJournal(s, ps).id, sj.id);
  const blocked = run(s, { type: 'APPROVE_DRAFT', draftId: ps.id });
  assert.equal(blocked.drafts.find((d: any) => d.id === ps.id).status, 'pending', 'count waits for the journal');
  s = run(s, { type: 'APPROVE_DRAFTS', draftIds: [ps.id, sj.id] }); // batch: journal first, then the count
  assert.equal(bookQty(s, 'EL-118', 'Main Godown', 'R1-D'), 15);
  assert.equal(bookQty(s, 'EL-118', 'Damaged Goods', '—'), 4);
});

test('stock found on another shelf becomes a transfer, not a loss; a big loss needs the owner', () => {
  let s = buildInitialState();
  s = run(s, { type: 'REPORT_SHORT', orderId: 'ORD-1031', lineIdx: 0, found: 60, reason: 'not_found' });
  const c = lastCase(s);
  s = run(s, { type: 'ESCALATE', caseId: c.id, why: 'picker' }, { type: 'ORDER_PICKED', orderId: 'ORD-1031' });
  const rc = s.recounts.find((r: any) => r.shelf === 'R2-B');
  s = run(s, { type: 'RECOUNT_DONE', recountId: rc.id, counted: 0 }); // book 80
  const bad = run(s, { type: 'RECOUNT_CAUSE', recountId: rc.id, cause: 'wrong_shelf' });
  assert.equal(bad, s, 'wrong shelf needs where and how many');
  s = run(s, { type: 'RECOUNT_CAUSE', recountId: rc.id, cause: 'wrong_shelf', foundAt: 'Main Godown / R2-A', foundQty: 70 });
  const tj = s.drafts.find((d: any) => d.type === 'stock_journal' && d.kind === 'transfer');
  assert.equal(tj.qty, 70); assert.equal(tj.to, 'Main Godown / R2-A');
  const ps = s.drafts.find((d: any) => d.type === 'physical_stock');
  assert.equal(ps.book, 10); assert.equal(ps.counted, 0);
  assert.equal(ps.needsOwner, true, '10 boxes × ₹650 = ₹6,500 is above the ₹2,000 limit');
  s = run(s, { type: 'APPROVE_DRAFT', draftId: tj.id });
  assert.equal(bookQty(s, 'EL-901', 'Main Godown', 'R2-A'), 70);
  const waiting = run(s, { type: 'APPROVE_DRAFT', draftId: ps.id, actor: 'Accountant' });
  assert.equal(waiting.drafts.find((d: any) => d.id === ps.id).status, 'pending', 'accountant cannot approve before the owner signs off');
  s = run(s, { type: 'OWNER_SIGN_OFF', draftId: ps.id, actor: 'Owner' });
  assert.equal(needsOwnerSignOff(s.drafts.find((d: any) => d.id === ps.id)), false);
  s = run(s, { type: 'APPROVE_DRAFT', draftId: ps.id, actor: 'Accountant' });
  assert.equal(bookQty(s, 'EL-901', 'Main Godown', 'R2-B'), 0);
});

test('owner can send a loss back for a recount', () => {
  let s = buildInitialState();
  s = run(s, { type: 'REPORT_SHORT', orderId: 'ORD-1031', lineIdx: 0, found: 60, reason: 'not_found' });
  const c = lastCase(s);
  s = run(s, { type: 'ESCALATE', caseId: c.id, why: 'picker' }, { type: 'ORDER_PICKED', orderId: 'ORD-1031' });
  const rc = s.recounts.find((r: any) => r.shelf === 'R2-B');
  s = run(s, { type: 'RECOUNT_DONE', recountId: rc.id, counted: 0 }, { type: 'RECOUNT_CAUSE', recountId: rc.id, cause: 'unexplained' });
  const ps = s.drafts.find((d: any) => d.type === 'physical_stock');
  s = run(s, { type: 'REJECT_DRAFT', draftId: ps.id, note: 'Count again with Ramesh', actor: 'Owner' });
  assert.equal(s.recounts.find((r: any) => r.id === rc.id).status, 'open');
});

test('found during quick search -> no owner decision for that item', () => {
  let s = buildInitialState();
  s = run(s, { type: 'REPORT_SHORT', orderId: 'ORD-1033', lineIdx: 1, found: 6, reason: 'not_found' });
  const c = lastCase(s);
  assert.equal(c.suggestions[0].key, 'Back Store / BS-3');
  s = run(s, { type: 'SEARCH_RESULT', caseId: c.id, locKey: 'Back Store / BS-3', result: 'found', qty: 6 }, { type: 'ORDER_PICKED', orderId: 'ORD-1033' });
  assert.equal(lastCase(s).outcome.type, 'found');
  assert.equal(shortQty(lastCase(s)), 0);
  assert.equal(dispatchReady(s, orderOf(s, 'ORD-1033')), true);
  assert.equal(draftsOf(s, 'ORD-1033').length, 0);
});

test('returned goods are suggested last and flagged for a condition check', () => {
  const s = run(buildInitialState(), { type: 'REPORT_SHORT', orderId: 'ORD-1032', lineIdx: 0, found: 12, reason: 'not_found' });
  const sug = lastCase(s).suggestions;
  assert.equal(sug.at(-1).godown, 'Returns Area');
  assert.equal(sug.at(-1).returns, true);
});

test('no record anywhere -> no suggestion, straight to owner (never invents a location)', () => {
  const s = run(buildInitialState(), { type: 'REPORT_SHORT', orderId: 'ORD-1032', lineIdx: 1, found: 4, reason: 'not_found' });
  assert.equal(lastCase(s).suggestions.length, 0);
  assert.equal(lastCase(s).escalation, 'no_records');
});

test('picker can undo a mistaken short before anything is found or decided', () => {
  let s = buildInitialState();
  const n = s.cases.length, r = s.recounts.length;
  s = run(s, { type: 'REPORT_SHORT', orderId: 'ORD-1032', lineIdx: 0, found: 12, reason: 'not_found' });
  s = run(s, { type: 'UNDO_SHORT', caseId: lastCase(s).id });
  assert.equal(s.cases.length, n); assert.equal(s.recounts.length, r);
});

test('NFR-2: invalid, duplicate or after-picking reports never create a case', () => {
  let s = buildInitialState();
  const n = s.cases.length;
  s = run(s,
    { type: 'REPORT_SHORT', orderId: 'ORD-1031', lineIdx: 0, found: 100, reason: 'not_found' },
    { type: 'REPORT_SHORT', orderId: 'ORD-1031', lineIdx: 0, found: -1, reason: 'not_found' },
    { type: 'REPORT_SHORT', orderId: 'ORD-1031', lineIdx: 0, found: 5, reason: 'bogus' },
    { type: 'REPORT_SHORT', orderId: 'ORD-9999', lineIdx: 0, found: 5, reason: 'not_found' });
  assert.equal(s.cases.length, n);
  s = run(s, { type: 'REPORT_SHORT', orderId: 'ORD-1031', lineIdx: 0, found: 5, reason: 'not_found' },
    { type: 'REPORT_SHORT', orderId: 'ORD-1031', lineIdx: 0, found: 5, reason: 'not_found' });
  assert.equal(s.cases.length, n + 1);
  s = run(s, { type: 'ORDER_PICKED', orderId: 'ORD-1032' }, { type: 'REPORT_SHORT', orderId: 'ORD-1032', lineIdx: 0, found: 5, reason: 'not_found' });
  assert.equal(s.cases.length, n + 1);
});

test('recount waits until the order is picked; two shorts on one shelf share one recount', () => {
  let s = buildInitialState();
  s = run(s, { type: 'REPORT_SHORT', orderId: 'ORD-1032', lineIdx: 0, found: 15, reason: 'not_found' });
  const rc = s.recounts.at(-1);
  const blocked = run(s, { type: 'RECOUNT_DONE', recountId: rc.id, counted: 20 });
  assert.equal(blocked.recounts.at(-1).status, 'open');
  s = run(s, { type: 'REPORT_SHORT', orderId: 'ORD-1031', lineIdx: 1, found: 40, reason: 'not_found' });
  const r1a = s.recounts.filter((r: any) => r.shelf === 'R1-A');
  assert.equal(r1a.length, 1);
  assert.equal(r1a[0].caseIds.length, 2);
});

test('search time limit escalates automatically', () => {
  let s = buildInitialState();
  const at = Date.now();
  s = run(s, { type: 'REPORT_SHORT', orderId: 'ORD-1031', lineIdx: 0, found: 90, reason: 'not_found', at }, { type: 'TICK', at: at + 11 * 60000 });
  assert.equal(lastCase(s).escalation, 'timeout');
});

test('s.34(2) deadline: 30 Nov after the financial year of the invoice', () => {
  assert.equal(new Date(creditNoteDeadline(new Date(2026, 10, 7).getTime())).toDateString(), new Date(2027, 10, 30).toDateString());
  assert.equal(new Date(creditNoteDeadline(new Date(2027, 1, 10).getTime())).toDateString(), new Date(2027, 10, 30).toDateString());
});

test('replaying the same events gives the same state on every device', () => {
  const A = 1_794_450_000_000;
  const events = [
    { type: 'RESET', at: A },
    { type: 'REPORT_SHORT', orderId: 'ORD-1031', lineIdx: 0, found: 98, reason: 'not_found', at: A + 1 },
    { type: 'ESCALATE', caseId: 'CASE-0003', why: 'picker', at: A + 2 },
    { type: 'ORDER_PICKED', orderId: 'ORD-1031', at: A + 3 },
  ];
  const a = events.reduce(reducer, buildInitialState());
  const b = events.reduce(reducer, buildInitialState(A + 999999));
  assert.deepEqual(a, b);
});

test('voice: numbers in digits of any script or as words, in English, Hindi and Kannada', () => {
  assert.equal(findNumber('60'), 60);
  assert.equal(findNumber('साठ'), 60);
  assert.equal(findNumber('६०'), 60);
  assert.equal(findNumber('೬೦'), 60);
  assert.equal(findNumber('forty two found'), 42);
  assert.equal(findNumber('बयालीस मिले'), 42);
  assert.equal(findNumber('ನಲವತ್ತು ಎರಡು'), 42);
  assert.equal(findNumber('ಇಪ್ಪತ್ತೈದು ಸಿಕ್ಕಿತು'), 25);
  assert.equal(findNumber('not here'), null);
});

test('voice: commands for the short form, the search and the recount', () => {
  const a = parseVoice('45 damaged'); assert.equal(a.qty, 45); assert.equal(a.reason, 'damaged');
  assert.equal(parseVoice('60 कम है').reason, 'not_found');
  assert.equal(parseVoice('भेजो').send, true);
  const b = parseVoice('found 6'); assert.equal(b.found, true); assert.equal(b.qty, 6);
  assert.equal(parseVoice('यहाँ नहीं है').notHere, true);
  assert.equal(parseVoice('यहाँ नहीं है').found, false);
  assert.equal(parseVoice('ಇಲ್ಲಿ ಇಲ್ಲ').notHere, true);
  assert.equal(parseVoice('send to owner').owner, true);
  assert.equal(parseVoice('save 42').send, true);
});

console.log(`\n${passed} tests passed`);
