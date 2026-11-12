// End-to-end checks of the short-supply flow through the real reducer.
// Run: npm run test:unit
import assert from 'node:assert/strict';
import {
  reducer, buildInitialState, orderStatus, shortQty, bookQty, correctionRoute, orderOf, orderCases,
  orderState, dispatchReady, substitutesFor,
} from '../src/core.ts';
import { taxLines, creditNoteDeadline } from '../src/lib/tax.ts';
import { voucherXml } from '../src/lib/tally.ts';
import { PARTIES } from '../src/data/seed.ts';

let passed = 0;
const test = (name: string, fn: () => void) => { fn(); passed++; console.log(`  ✓ ${name}`); };
const run = (s: any, ...actions: any[]) => actions.reduce((acc, a) => reducer(acc, a), s);
const status = (s: any, id: string) => orderStatus(s, orderOf(s, id));
const lastCase = (s: any) => s.cases.at(-1);

console.log('StockTrace flow tests');

test('seed: one order waiting for the accountant, one waiting for the owner', () => {
  const s = buildInitialState();
  assert.equal(status(s, 'ORD-1027'), 'AWAITING_APPROVAL');
  assert.equal(status(s, 'ORD-1029'), 'AWAITING_OWNER');
  const cn = s.drafts.find((d: any) => d.orderId === 'ORD-1027');
  assert.equal(cn.type, 'credit_note', 'invoice 3 days old: past the 24-hour IRN window');
});

test('normal picking: no tap per line, one tap per order, no paperwork', () => {
  let s = buildInitialState();
  assert.equal(status(s, 'ORD-1032'), 'PICKING');
  s = run(s, { type: 'ORDER_PICKED', orderId: 'ORD-1032' });
  assert.equal(status(s, 'ORD-1032'), 'READY');
  assert.equal(bookQty(s, 'EL-330', 'Main Godown', 'R3-C'), 20);
  assert.equal(s.drafts.filter((d: any) => d.orderId === 'ORD-1032').length, 0);
});

test("professor's example: invoiced (e-invoice < 24 h old), 98 of 100 found -> cancel IRN and re-issue, not a credit note", () => {
  let s = buildInitialState();
  const now = orderOf(s, 'ORD-1031').invoice.irnAt + 3600000;
  s = run(s, { type: 'REPORT_SHORT', orderId: 'ORD-1031', lineIdx: 0, found: 98, reason: 'not_found', at: now });
  const c = lastCase(s);
  assert.equal(c.suggestions[0].kind, 'purchase', "today's unshelved purchase is checked first");
  assert.match(c.suggestions[0].source, /PUR-0388/);
  s = run(s, { type: 'SEARCH_RESULT', caseId: c.id, locKey: '__all__', result: 'not_here', at: now + 60000 });
  s = run(s, { type: 'ORDER_PICKED', orderId: 'ORD-1031', at: now + 120000 });
  assert.equal(status(s, 'ORD-1031'), 'AWAITING_OWNER');
  s = run(s, { type: 'DECIDE_ORDER', orderId: 'ORD-1031', lines: { [c.id]: { outcome: 'partial' } }, customerChoice: 'agreed', at: now + 300000 });
  const drafts = s.drafts.filter((d: any) => d.orderId === 'ORD-1031');
  assert.equal(drafts.length, 1);
  assert.equal(drafts[0].type, 'reissue');
  assert.equal(drafts[0].route, 'cancel_irn');
  assert.deepEqual(drafts[0].lines.map((l: any) => [l.item, l.qty]), [['EL-901', 98], ['EL-214', 50]]);
  const msg = orderState(s, 'ORD-1031').message.text;
  assert.match(msg, /sending 98 of 100/);
  assert.match(msg, /corrected invoice in place of INV-2611/);
  assert.equal(dispatchReady(s, orderOf(s, 'ORD-1031')), true);
  assert.equal(status(s, 'ORD-1031'), 'MESSAGE_PENDING');
  s = run(s, { type: 'MESSAGE_SENT', orderId: 'ORD-1031' });
  assert.equal(status(s, 'ORD-1031'), 'AWAITING_APPROVAL');
  s = run(s, { type: 'APPROVE_DRAFTS', draftIds: [drafts[0].id], actor: 'Accountant' });
  assert.equal(s.drafts.find((d: any) => d.id === drafts[0].id).status, 'approved');
  assert.equal(orderOf(s, 'ORD-1031').cancelledInvoice.no, 'INV-2611');
  assert.doesNotMatch(voucherXml(s.drafts.find((d: any) => d.id === drafts[0].id)), /<VOUCHERNUMBER>/, 'Tally numbers the voucher');
  // recount by the in-charge: book 140 - 98 = 42, counted 40 -> 2 missing, cause required
  assert.equal(status(s, 'ORD-1031'), 'AWAITING_RECOUNT');
  const rc = s.recounts.find((r: any) => r.caseId === c.id);
  assert.equal(rc.assignedTo, 'Godown in-charge');
  s = run(s, { type: 'RECOUNT_DONE', recountId: rc.id, counted: 40, actor: 'Godown in-charge' });
  assert.equal(s.drafts.filter((d: any) => d.type === 'physical_stock').length, 0, 'no draft until a cause is given');
  s = run(s, { type: 'RECOUNT_CAUSE', recountId: rc.id, cause: 'return_not_entered' });
  const ps = s.drafts.find((d: any) => d.type === 'physical_stock');
  assert.equal(ps.book, 42); assert.equal(ps.counted, 40);
  assert.match(ps.narration, /Customer return not entered/);
  s = run(s, { type: 'APPROVE_DRAFT', draftId: ps.id });
  assert.equal(bookQty(s, 'EL-901', 'Main Godown', 'R2-B'), 40);
  assert.equal(status(s, 'ORD-1031'), 'CLOSED');
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
  const t = taxLines(cn.lines, PARTIES.sharma);
  assert.equal(t.total, 1534);
});

test('e-way bill active -> route says cancel the e-way bill first', () => {
  const s = buildInitialState();
  const o = orderOf(s, 'ORD-1033');
  const r: any = correctionRoute(s, o, o.invoice.irnAt + 3600000);
  assert.equal(r.route, 'cancel_irn');
  assert.match(r.why, /Cancel e-way bill/);
});

test('not under e-invoicing -> cancel and re-issue before dispatch (confirm with CA)', () => {
  let s = run(buildInitialState(), { type: 'UPDATE_SETTINGS', settings: { eInvoicing: false } });
  const r: any = correctionRoute(s, orderOf(s, 'ORD-1027'));
  assert.equal(r.route, 'cancel_reissue');
  assert.match(r.why, /CA/);
});

test('not invoiced yet -> invoice for shipped quantity', () => {
  let s = buildInitialState();
  s = run(s, { type: 'REPORT_SHORT', orderId: 'ORD-1032', lineIdx: 0, found: 15, reason: 'fewer' });
  const c = lastCase(s);
  s = run(s, { type: 'SEARCH_RESULT', caseId: c.id, locKey: '__all__', result: 'not_here' },
    { type: 'ORDER_PICKED', orderId: 'ORD-1032' },
    { type: 'DECIDE_ORDER', orderId: 'ORD-1032', lines: { [c.id]: { outcome: 'backorder' } }, customerChoice: 'agreed' });
  const inv = s.drafts.find((d: any) => d.orderId === 'ORD-1032');
  assert.equal(inv.type, 'sales_invoice');
  assert.deepEqual(inv.lines.map((l: any) => [l.item, l.qty]), [['EL-330', 15], ['EL-512', 6]]);
  assert.equal(s.backorders.length, 1);
  assert.equal(s.backorders[0].qty, 5);
});

test('substitute item: 9W short, owner sends 10W instead (credit note route adds a separate invoice)', () => {
  let s = buildInitialState();
  const late = orderOf(s, 'ORD-1031').invoice.irnAt + 30 * 3600000;
  s = run(s, { type: 'REPORT_SHORT', orderId: 'ORD-1031', lineIdx: 0, found: 98, reason: 'not_found', at: late },
    { type: 'ESCALATE', caseId: 'CASE-0003', why: 'picker', at: late },
    { type: 'ORDER_PICKED', orderId: 'ORD-1031', at: late });
  assert.deepEqual(substitutesFor(s, 'EL-901').map((x: any) => x.code), ['EL-902']);
  s = run(s, { type: 'DECIDE_ORDER', orderId: 'ORD-1031', lines: { 'CASE-0003': { outcome: 'substitute', substitute: { item: 'EL-902', qty: 2 } } }, customerChoice: 'agreed', at: late });
  const d = s.drafts.filter((x: any) => x.orderId === 'ORD-1031');
  assert.deepEqual(d.map((x: any) => x.type).sort(), ['credit_note', 'sales_invoice']);
  assert.equal(bookQty(s, 'EL-902', 'Main Godown', 'R2-C'), 28);
  assert.match(orderState(s, 'ORD-1031').message.text, /2 boxes of LED Bulb 10W/);
});

test('one decision and one message for an order with two short lines', () => {
  let s = buildInitialState();
  s = run(s, { type: 'REPORT_SHORT', orderId: 'ORD-1033', lineIdx: 0, found: 7, reason: 'fewer' },
    { type: 'REPORT_SHORT', orderId: 'ORD-1033', lineIdx: 1, found: 10, reason: 'damaged' });
  const [a, b] = orderCases(s, 'ORD-1033');
  s = run(s, { type: 'ESCALATE', caseId: a.id, why: 'picker' }, { type: 'ORDER_PICKED', orderId: 'ORD-1033' });
  // a decision that leaves one line undecided is refused
  const before = s;
  s = run(s, { type: 'DECIDE_ORDER', orderId: 'ORD-1033', lines: { [a.id]: { outcome: 'partial' } }, customerChoice: 'agreed' });
  assert.equal(s, before);
  s = run(s, { type: 'DECIDE_ORDER', orderId: 'ORD-1033', lines: { [a.id]: { outcome: 'partial' }, [b.id]: { outcome: 'cancel_line' } }, customerChoice: 'agreed' });
  const msg = orderState(s, 'ORD-1033').message.text;
  assert.match(msg, /Ceiling Fan Regulator/); assert.match(msg, /Extension Board/);
  const bill = s.drafts.filter((d: any) => d.orderId === 'ORD-1033' && ['reissue', 'credit_note', 'sales_invoice'].includes(d.type));
  assert.equal(bill.length, 1, 'one bill correction for the whole order');
  assert.ok(s.drafts.some((d: any) => d.type === 'stock_journal' && d.caseId === b.id));
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
  assert.equal(s.drafts.filter((d: any) => d.orderId === 'ORD-1033').length, 0);
});

test('no record anywhere -> no suggestion, straight to owner (never invents a location)', () => {
  let s = buildInitialState();
  s = run(s, { type: 'REPORT_SHORT', orderId: 'ORD-1032', lineIdx: 1, found: 4, reason: 'not_found' });
  assert.equal(lastCase(s).suggestions.length, 0);
  assert.equal(lastCase(s).escalation, 'no_records');
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

test('accountant rejection returns the whole order to the owner', () => {
  let s = buildInitialState();
  const cn = s.drafts.find((d: any) => d.orderId === 'ORD-1027' && d.status === 'pending');
  s = run(s, { type: 'REJECT_DRAFT', draftId: cn.id, note: 'Customer wants the 10 as a backorder instead' });
  assert.equal(status(s, 'ORD-1027'), 'AWAITING_OWNER');
  assert.match(orderState(s, 'ORD-1027').returnedNote, /backorder instead/);
});

test('recount waits until the order is picked; two shorts on one shelf share one recount', () => {
  let s = buildInitialState();
  s = run(s, { type: 'REPORT_SHORT', orderId: 'ORD-1032', lineIdx: 0, found: 15, reason: 'not_found' });
  const rc = s.recounts.at(-1);
  const blocked = run(s, { type: 'RECOUNT_DONE', recountId: rc.id, counted: 20 });
  assert.equal(blocked.recounts.at(-1).status, 'open');
  // ORD-1027's open recount was already on R1-A, so a short there reuses it
  s = run(s, { type: 'REPORT_SHORT', orderId: 'ORD-1031', lineIdx: 1, found: 40, reason: 'not_found' });
  assert.equal(s.recounts.filter((r: any) => r.shelf === 'R1-A').length, 1);
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
  const events = [
    { type: 'REPORT_SHORT', orderId: 'ORD-1031', lineIdx: 0, found: 98, reason: 'not_found', at: 1 },
    { type: 'ESCALATE', caseId: 'CASE-0003', why: 'picker', at: 2 },
    { type: 'ORDER_PICKED', orderId: 'ORD-1031', at: 3 },
  ];
  const a = events.reduce(reducer, buildInitialState());
  const b = events.reduce(reducer, buildInitialState());
  assert.deepEqual(a, b);
});

console.log(`\n${passed} tests passed`);
