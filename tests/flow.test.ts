// End-to-end checks of the short-supply flow through the real reducer.
// Run: npm run test:unit
import assert from 'node:assert/strict';
import { reducer, buildInitialState, caseStatus, shortQty, orderStatus, bookQty } from '../src/store.tsx';
import { taxLines, creditNoteDeadline } from '../src/lib/tax.ts';
import { voucherXml } from '../src/lib/tally.ts';
import { PARTIES } from '../src/data/seed.ts';

let passed = 0;
const test = (name: string, fn: () => void) => { fn(); passed++; console.log(`  ✓ ${name}`); };
const run = (s: any, ...actions: any[]) => actions.reduce((acc, a) => reducer(acc, a), s);

console.log('StockTrace v2 flow tests');

test('seed: sample cases are in owner and accountant queues', () => {
  const s = buildInitialState();
  assert.equal(s.cases.length, 2);
  assert.equal(caseStatus(s, s.cases[0]), 'AWAITING_APPROVAL'); // credit note pending
  assert.equal(caseStatus(s, s.cases[1]), 'AWAITING_OWNER'); // damaged, waiting for decision
});

test("professor's example: invoiced for 100, 98 found -> credit note for 2 against the invoice", () => {
  let s = buildInitialState();
  s = run(s, { type: 'PICK_LINE', orderId: 'ORD-1031', lineIdx: 1 });
  s = run(s, { type: 'REPORT_SHORT', orderId: 'ORD-1031', lineIdx: 0, found: 98, reason: 'not_found' });
  const c = s.cases.at(-1);
  assert.equal(c.id, 'CASE-0003');
  assert.equal(shortQty(c), 2);
  assert.equal(orderStatus(s, s.orders.find((o: any) => o.id === 'ORD-1031')), 'HELD');
  // cited suggestion: Back Store BS-1 from stock summary + stock journal SJ-0412
  assert.equal(c.suggestions.length, 1);
  assert.match(c.suggestions[0].source, /Tally stock summary/);
  assert.match(c.suggestions[0].source, /SJ-0412/);
  s = run(s, { type: 'SEARCH_RESULT', caseId: c.id, locKey: 'Back Store / BS-1', result: 'not_here' });
  assert.equal(caseStatus(s, s.cases.at(-1)), 'AWAITING_OWNER');
  s = run(s, { type: 'DECIDE', caseId: c.id, outcome: 'partial' });
  const cn = s.drafts.find((d: any) => d.caseId === c.id && d.type === 'credit_note');
  assert.ok(cn);
  assert.equal(cn.original.no, 'INV-2611');
  assert.equal(cn.lines[0].qty, 2);
  const t = taxLines(cn.lines, PARTIES.sharma);
  assert.equal(t.taxable, 1300); assert.equal(t.cgst, 117); assert.equal(t.sgst, 117); assert.equal(t.total, 1534);
  assert.match(s.cases.at(-1).message.text, /98 of 100/);
  assert.match(s.cases.at(-1).message.text, /₹1,534\.00 against INV-2611/);
  assert.equal(orderStatus(s, s.orders.find((o: any) => o.id === 'ORD-1031')), 'READY');
  assert.equal(caseStatus(s, s.cases.at(-1)), 'AWAITING_APPROVAL');
  s = run(s, { type: 'APPROVE_DRAFT', draftId: cn.id });
  assert.match(s.drafts.find((d: any) => d.id === cn.id).voucherNo, /^CN\/\d\d-\d\d\/0012$/);
  assert.equal(caseStatus(s, s.cases.at(-1)), 'MESSAGE_PENDING');
  s = run(s, { type: 'MESSAGE_SENT', caseId: c.id });
  assert.equal(caseStatus(s, s.cases.at(-1)), 'AWAITING_RECOUNT');
  // recount: book at R2-B is 140 - 98 = 42; picker counts 40 -> 2 confirmed missing
  assert.equal(bookQty(s, 'EL-901', 'Main Godown', 'R2-B'), 42);
  const rc = s.recounts.find((r: any) => r.caseId === c.id);
  s = run(s, { type: 'RECOUNT_DONE', recountId: rc.id, counted: 40 });
  const ps = s.drafts.find((d: any) => d.type === 'physical_stock' && d.caseId === c.id);
  assert.equal(ps.book, 42); assert.equal(ps.counted, 40);
  s = run(s, { type: 'APPROVE_DRAFT', draftId: ps.id });
  assert.equal(bookQty(s, 'EL-901', 'Main Godown', 'R2-B'), 40);
  assert.equal(caseStatus(s, s.cases.at(-1)), 'CLOSED');
  assert.match(voucherXml(s.drafts.find((d: any) => d.id === cn.id)), /<REFERENCE>INV-2611<\/REFERENCE>/);
});

test('not invoiced yet -> sales invoice drafted for shipped quantity, no credit note', () => {
  let s = buildInitialState();
  s = run(s, { type: 'REPORT_SHORT', orderId: 'ORD-1032', lineIdx: 0, found: 15, reason: 'fewer' });
  const c = s.cases.at(-1);
  s = run(s, { type: 'SEARCH_RESULT', caseId: c.id, locKey: '__all__', result: 'not_here' });
  s = run(s, { type: 'DECIDE', caseId: c.id, outcome: 'backorder' });
  assert.equal(s.drafts.filter((d: any) => d.caseId === c.id).length, 0, 'no invoice until all lines settled');
  s = run(s, { type: 'PICK_LINE', orderId: 'ORD-1032', lineIdx: 1 });
  const inv = s.drafts.find((d: any) => d.type === 'sales_invoice' && d.orderId === 'ORD-1032');
  assert.ok(inv);
  assert.deepEqual(inv.lines.map((l: any) => [l.item, l.qty]), [['EL-330', 15], ['EL-512', 6]]);
  assert.ok(!s.drafts.some((d: any) => d.type === 'credit_note' && d.orderId === 'ORD-1032'));
  s = run(s, { type: 'APPROVE_DRAFT', draftId: inv.id });
  assert.equal(s.orders.find((o: any) => o.id === 'ORD-1032').invoice.no, 'INV-2613');
});

test('found during quick search -> resolved without the owner, no paperwork', () => {
  let s = buildInitialState();
  s = run(s, { type: 'REPORT_SHORT', orderId: 'ORD-1033', lineIdx: 1, found: 6, reason: 'not_found' });
  const c = s.cases.at(-1);
  assert.equal(c.suggestions[0].key, 'Back Store / BS-3');
  s = run(s, { type: 'SEARCH_RESULT', caseId: c.id, locKey: 'Back Store / BS-3', result: 'found', qty: 6 });
  const c2 = s.cases.at(-1);
  assert.equal(c2.outcome.type, 'found');
  assert.equal(shortQty(c2), 0);
  assert.equal(s.drafts.filter((d: any) => d.caseId === c.id).length, 0);
  assert.equal(caseStatus(s, c2), 'AWAITING_RECOUNT');
});

test('no record anywhere -> no suggestion, straight to owner (never invents a location)', () => {
  let s = buildInitialState();
  s = run(s, { type: 'REPORT_SHORT', orderId: 'ORD-1031', lineIdx: 1, found: 40, reason: 'not_found' });
  const c = s.cases.at(-1);
  assert.equal(c.suggestions.length, 0);
  assert.equal(c.escalation, 'no_records');
  assert.equal(caseStatus(s, c), 'AWAITING_OWNER');
});

test('NFR-2: invalid or duplicate reports never create a case', () => {
  let s = buildInitialState();
  const n = s.cases.length;
  s = run(s,
    { type: 'REPORT_SHORT', orderId: 'ORD-1031', lineIdx: 0, found: 100, reason: 'not_found' }, // not short
    { type: 'REPORT_SHORT', orderId: 'ORD-1031', lineIdx: 0, found: -1, reason: 'not_found' },
    { type: 'REPORT_SHORT', orderId: 'ORD-1031', lineIdx: 0, found: 5, reason: 'bogus' },
    { type: 'REPORT_SHORT', orderId: 'ORD-9999', lineIdx: 0, found: 5, reason: 'not_found' });
  assert.equal(s.cases.length, n);
  s = run(s, { type: 'REPORT_SHORT', orderId: 'ORD-1031', lineIdx: 0, found: 5, reason: 'not_found' });
  s = run(s, { type: 'REPORT_SHORT', orderId: 'ORD-1031', lineIdx: 0, found: 5, reason: 'not_found' });
  assert.equal(s.cases.length, n + 1);
});

test('accountant rejection returns the case to the owner with the reason', () => {
  let s = buildInitialState();
  const cn = s.drafts.find((d: any) => d.status === 'pending' && d.type === 'credit_note');
  s = run(s, { type: 'REJECT_DRAFT', draftId: cn.id, note: 'Customer agreed to backorder instead' });
  const c = s.cases.find((x: any) => x.id === cn.caseId);
  assert.equal(c.outcome, null);
  assert.match(c.returnedNote, /backorder instead/);
  assert.equal(caseStatus(s, c), 'AWAITING_OWNER');
});

test('damaged stock -> stock journal to Damaged Goods; inter-state credit note uses IGST', () => {
  let s = buildInitialState();
  s = run(s, { type: 'DECIDE', caseId: 'CASE-0002', outcome: 'partial' });
  const sj = s.drafts.find((d: any) => d.caseId === 'CASE-0002' && d.type === 'stock_journal');
  assert.equal(sj.qty, 4); assert.equal(sj.to, 'Damaged Goods');
  const cn1 = s.drafts.find((d: any) => d.caseId === 'CASE-0001' && d.type === 'credit_note');
  const t = taxLines(cn1.lines, PARTIES.coastal);
  assert.equal(t.intra, false); assert.equal(t.igst, 68.4); assert.equal(t.total, 448.4);
});

test('search time limit escalates automatically', () => {
  let s = buildInitialState();
  const at = Date.now();
  s = run(s, { type: 'REPORT_SHORT', orderId: 'ORD-1031', lineIdx: 0, found: 90, reason: 'not_found', at });
  s = run(s, { type: 'TICK', at: at + 11 * 60000 });
  assert.equal(s.cases.at(-1).escalation, 'timeout');
});

test('s.34(2) deadline: 30 Nov after the financial year of the invoice', () => {
  assert.equal(new Date(creditNoteDeadline(new Date(2026, 10, 7).getTime())).toDateString(), new Date(2027, 10, 30).toDateString());
  assert.equal(new Date(creditNoteDeadline(new Date(2027, 1, 10).getTime())).toDateString(), new Date(2027, 10, 30).toDateString());
});

console.log(`\n${passed} tests passed`);
