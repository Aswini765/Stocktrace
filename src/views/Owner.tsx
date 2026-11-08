import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ArrowLeft, Clock, Search, ShieldCheck, MapPin, MessageCircle, Copy, PackageCheck, AlertTriangle, CheckCircle2, ClipboardList } from 'lucide-react';
import { useStore, caseStatus, shortQty, totalFound, item, party, REASONS, OUTCOMES, DRAFT_LABEL, caseDrafts, caseRecount, unitLabel } from '../store.tsx';
import { StatusBadge, Panel, Field, PageHeader, AuditTrail , type Go } from './ui.tsx';
import { inr, time, dateTime, mins } from '../lib/format.ts';
import { taxLines } from '../lib/tax.ts';

const OPEN = ['SEARCHING', 'AWAITING_OWNER', 'MESSAGE_PENDING', 'AWAITING_APPROVAL', 'AWAITING_STOCK', 'AWAITING_RECOUNT'];

export default function Owner({ go, initialCase }: { go: Go; initialCase: string | null }) {
  const [caseId, setCaseId] = useState(initialCase);
  return caseId
    ? <CaseDetail caseId={caseId} onBack={() => setCaseId(null)} go={go} />
    : <CaseList onOpen={setCaseId} />;
}

function CaseList({ onOpen }) {
  const { state } = useStore();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('open');
  const rows = useMemo(() => state.cases.map((c) => {
    const o = state.orders.find((x) => x.id === c.orderId);
    return { c, o, st: caseStatus(state, c), it: item(c.item), p: party(o.party) };
  }), [state]);
  const openCount = rows.filter((r) => OPEN.includes(r.st)).length;
  const shown = rows
    .filter((r) => filter === 'all' || (filter === 'open' ? OPEN.includes(r.st) : r.st === filter))
    .filter((r) => !q || `${r.c.id} ${r.o.id} ${r.it.code} ${r.it.name} ${r.p.name} ${r.c.shelf}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (a.st === 'AWAITING_OWNER' ? -1 : 0) - (b.st === 'AWAITING_OWNER' ? -1 : 0) || a.o.dispatchBy - b.o.dispatchBy);

  return (
    <div className="space-y-5 max-w-6xl mx-auto w-full">
      <PageHeader title="Owner Decision Queue" sub="Every short order with its value and dispatch deadline. Choose what happens to the order; StockTrace drafts the paperwork." />
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[200px] max-w-xs flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search case, order, item, customer, shelf..." className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-400" />
          </div>
          <select id="owner-status-filter" value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 cursor-pointer focus:outline-none">
            <option value="open">Status: Open ({openCount})</option>
            <option value="all">Status: All ({rows.length})</option>
            <option value="AWAITING_OWNER">Owner to decide</option>
            <option value="MESSAGE_PENDING">Message to send</option>
            <option value="AWAITING_APPROVAL">Accountant to approve</option>
            <option value="AWAITING_RECOUNT">Recount pending</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
        <div className="text-slate-500 text-[11px] font-mono shrink-0">Showing <strong>{shown.length}</strong> of {rows.length} cases</div>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3.5">Case ID</th><th className="py-2.5 px-3.5">Order & Customer</th><th className="py-2.5 px-3.5">Item</th>
                <th className="py-2.5 px-3.5">Short</th><th className="py-2.5 px-3.5">Short value</th><th className="py-2.5 px-3.5">Reason</th>
                <th className="py-2.5 px-3.5">Dispatch by</th><th className="py-2.5 px-3.5">Status</th><th className="py-2.5 px-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {shown.map(({ c, o, st, it, p }) => (
                <tr key={c.id} id={`case-row-${c.id}`} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3.5 font-mono text-[11px]">
                    <div className="font-bold text-slate-900">{c.id}</div>
                    <div className="text-slate-400 text-[10px] flex items-center space-x-1 mt-0.5"><Clock className="w-3 h-3" /><span>{time(c.reportedAt)}</span></div>
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="font-mono font-bold text-slate-950">{o.id}</div>
                    <div className="font-medium text-slate-800">{p.name}</div>
                    <div className="text-[11px] text-slate-400">{o.invoice ? o.invoice.no : 'Not invoiced'}</div>
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="font-mono font-bold text-slate-950">{it.code}</div>
                    <div className="font-medium text-slate-800 truncate max-w-[180px]">{it.name}</div>
                    <div className="text-[11px] text-slate-400">{c.godown} / {c.shelf}</div>
                  </td>
                  <td className="py-3 px-3.5 font-mono"><span className="bg-rose-50 text-rose-800 font-bold px-2 py-0.5 rounded border border-rose-200/80">{shortQty(c)}</span><span className="text-slate-400"> / {c.ordered}</span></td>
                  <td className="py-3 px-3.5 font-mono font-semibold text-slate-900">{inr(shortQty(c) * it.rate, 0)}</td>
                  <td className="py-3 px-3.5"><span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">{REASONS[c.reason]}</span></td>
                  <td className="py-3 px-3.5 font-mono text-[11px]">{time(o.dispatchBy)}</td>
                  <td className="py-3 px-3.5"><StatusBadge status={st} /></td>
                  <td className="py-3 px-3.5 text-right">
                    <button id={`btn-open-${c.id}`} onClick={() => onOpen(c.id)} className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold inline-flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs">
                      <span>{st === 'AWAITING_OWNER' ? 'Decide' : st === 'MESSAGE_PENDING' ? 'Message' : 'View'}</span><ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
              {!shown.length && <tr><td colSpan={9} className="py-8 text-center text-slate-400 text-xs">No cases match this filter.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function billImpact(c, order, outcome) {
  const it = item(c.item);
  const p = party(order.party);
  const sq = shortQty(c);
  const tax = (q) => taxLines([{ qty: q, rate: it.rate, gst: it.gst }], p).total;
  if (outcome === 'source') return 'No change to the bill. Order ships in full once the sourced units arrive.';
  const q = outcome === 'cancel_line' ? c.ordered : sq;
  if (order.invoice) {
    const extra = outcome === 'backorder' ? ' Invoice the balance when it ships (confirm the approach with your CA).' : '';
    return `Credit note for ${q} × ${inr(it.rate, 0)} + GST = ${inr(tax(q))} against ${order.invoice.no}.${extra}`;
  }
  return `Not invoiced yet: the invoice will be drafted for the quantity shipped, ${inr(tax(q))} less than ordered.`;
}

function CaseDetail({ caseId, onBack, go }) {
  const { state, dispatch } = useStore();
  const c = state.cases.find((x) => x.id === caseId);
  const [choice, setChoice] = useState(null);
  const [supplier, setSupplier] = useState('');
  const [eta, setEta] = useState('');
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  if (!c) return null;
  const st = caseStatus(state, c);
  const o = state.orders.find((x) => x.id === c.orderId);
  const it = item(c.item);
  const p = party(o.party);
  const drafts = caseDrafts(state, c.id).concat(state.drafts.filter((d) => d.caseIds?.includes(c.id) && d.caseId !== c.id));
  const rc = caseRecount(state, c);
  const choices = ['partial', 'backorder', 'source', 'cancel_line'];
  const canConfirm = choice && (choice !== 'source' || supplier.trim());

  const waLink = c.message ? `https://wa.me/?text=${encodeURIComponent(c.message.text)}` : '#';

  return (
    <div className="space-y-5 max-w-6xl mx-auto w-full pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center space-x-3">
          <button onClick={onBack} className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer" title="Return to queue"><ArrowLeft className="w-4 h-4" /></button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-slate-950 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{c.id}</span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-sm font-bold text-slate-900">{it.name}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Reported {dateTime(c.reportedAt)} by the picker • Order {o.id} for {p.name}</p>
          </div>
        </div>
        <StatusBadge status={st} />
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 flex items-center space-x-2 text-xs text-slate-700">
        <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
        <span><strong>Operating principle:</strong> StockTrace drafts. The owner decides, and nothing reaches Tally until the accountant approves it.</span>
      </div>

      {c.returnedNote && !c.outcome && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-2 text-xs text-amber-900 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /><span><strong>Returned by accountant.</strong> {c.returnedNote}. Choose the outcome again.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <Panel eyebrow="Case summary" title={`${it.code} • ${c.godown} / ${c.shelf}`} className="lg:col-span-3">
          <div className="space-y-2.5 text-xs">
            <Field label="Customer">{p.name}, {p.city}</Field>
            <Field label="Invoice">{o.invoice ? `${o.invoice.no} (${new Date(o.invoice.date).toLocaleDateString('en-IN')})` : 'Not invoiced yet'}</Field>
            <Field label="Ordered / found / short"><span className="font-mono">{c.ordered} / {totalFound(c)} / <span className="text-rose-700">{shortQty(c)}</span></span></Field>
            <Field label="Reason">{REASONS[c.reason]}</Field>
            <Field label="Unit rate (excl. GST)"><span className="font-mono">{inr(it.rate)}</span></Field>
            <Field label="Short value (excl. GST)"><span className="font-mono">{inr(shortQty(c) * it.rate)}</span></Field>
            <Field label="Dispatch by">{dateTime(o.dispatchBy)}</Field>
          </div>
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="text-slate-700 text-xs font-bold">Audit trail ({c.audit.length} events)</div>
            <AuditTrail audit={c.audit} />
          </div>
        </Panel>

        <Panel eyebrow="Quick search" title="Places checked, from Tally records" right={<span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">Cited records only</span>} className="lg:col-span-5">
          {c.reason === 'damaged' ? (
            <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-700">Damaged stock is in hand, so no search was needed. A stock journal moving it to Damaged Goods is drafted when you decide.</div>
          ) : c.suggestions.length === 0 ? (
            <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-xs space-y-1">
              <div className="font-bold text-slate-800">No other location on record</div>
              <p className="text-slate-700 text-[11px] leading-relaxed">No Tally stock summary or recent stock journal shows {it.code} anywhere except {c.godown} / {c.shelf}. StockTrace did not suggest a place to look.</p>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden text-[11px]">
              {c.suggestions.map((s) => (
                <div key={s.key} className="p-2.5 border-b border-slate-200 last:border-b-0 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 flex items-center"><MapPin className="w-3 h-3 mr-1 text-teal-700" />{s.key}</span>
                    <span className={`font-mono font-bold ${s.result === 'found' ? 'text-emerald-700' : s.result ? 'text-slate-500' : 'text-sky-700'}`}>{s.result === 'found' ? `Found ${s.foundQty}` : s.result ? 'Not here' : 'Not checked'}</span>
                  </div>
                  <div className="text-slate-500 font-mono text-[10px]">{s.source}</div>
                </div>
              ))}
            </div>
          )}
          {st === 'SEARCHING' && (
            <div className="text-xs text-slate-600 flex items-center justify-between">
              <span>Picker is searching. Time left: <strong className="font-mono">{mins(Math.min(c.searchDeadline - now, c.searchDeadline - c.reportedAt))}</strong></span>
              <button onClick={() => dispatch({ type: 'ESCALATE', caseId: c.id, why: 'owner' })} className="text-slate-700 underline cursor-pointer">Stop search and decide</button>
            </div>
          )}
          <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex items-center space-x-1.5 font-bold text-slate-700"><ClipboardList className="w-3.5 h-3.5" /><span>Recount</span></div>
            {!rc ? <p className="text-[11px] text-slate-500">No recount for damaged stock.</p> : rc.status === 'open' ? (
              <p className="text-[11px] text-slate-600">Task <span className="font-mono">{rc.id}</span> open: picker to count {c.godown} / {c.shelf}.</p>
            ) : (
              <p className="text-[11px] text-slate-600">Counted <strong className="font-mono">{rc.counted}</strong> vs book <strong className="font-mono">{rc.book}</strong>{rc.diff ? `: ${rc.diff < 0 ? `${-rc.diff} confirmed missing` : `${rc.diff} more than book`}, physical stock draft sent to the accountant.` : ': matches book.'}</p>
            )}
            {c.recountNote && <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900">{c.recountNote}</div>}
          </div>
        </Panel>

        <Panel eyebrow="Resolution" title={c.outcome ? 'Decision and follow-up' : 'Choose what happens to this order'} className="lg:col-span-4">
          {!c.outcome && st === 'AWAITING_OWNER' && (
            <div className="space-y-2">
              {choices.map((k) => (
                <label key={k} id={`outcome-${k}`} className={`block p-2.5 rounded-lg border cursor-pointer transition-colors ${choice === k ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <div className="flex items-center space-x-2">
                    <input type="radio" name="outcome" checked={choice === k} onChange={() => setChoice(k)} className="accent-slate-900" />
                    <span className="text-xs font-bold text-slate-900">{OUTCOMES[k]}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 ml-5 leading-relaxed">{billImpact(c, o, k)}</p>
                  {k === 'source' && choice === 'source' && (
                    <div className="ml-5 mt-2 grid grid-cols-2 gap-2">
                      <input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Supplier (required)" className="text-xs p-1.5 rounded border border-slate-300 bg-white" />
                      <input value={eta} onChange={(e) => setEta(e.target.value)} placeholder="Expected, e.g. today 4 pm" className="text-xs p-1.5 rounded border border-slate-300 bg-white" />
                    </div>
                  )}
                </label>
              ))}
              {c.reason === 'damaged' && <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">Also drafted: stock journal moving {shortQty(c)} damaged {unitLabel(it.unit, shortQty(c))} to Damaged Goods.</p>}
              <button id="btn-confirm-outcome" disabled={!canConfirm} onClick={() => dispatch({ type: 'DECIDE', caseId: c.id, outcome: choice, sourcing: choice === 'source' ? { supplier: supplier.trim(), eta: eta.trim() } : null, actor: 'Owner' })}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-lg font-bold text-xs cursor-pointer disabled:cursor-not-allowed">Confirm decision</button>
            </div>
          )}
          {st === 'SEARCHING' && <p className="text-xs text-slate-500">Waiting for the picker's quick search. You can stop it and decide now.</p>}

          {c.outcome && (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] text-slate-500 block">Outcome</span>
                <div className="font-bold text-slate-900">{OUTCOMES[c.outcome.type]}</div>
                <div className="text-[11px] text-slate-500">{c.outcome.actor} • {dateTime(c.outcome.at)}{c.outcome.sourcing ? ` • ${c.outcome.sourcing.supplier}` : ''}</div>
              </div>

              {drafts.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 block">Paperwork for Tally</span>
                  {drafts.map((d) => (
                    <div key={d.id} className="flex items-center justify-between p-2 rounded border border-slate-200 bg-white">
                      <span>{DRAFT_LABEL[d.type]} <span className="font-mono text-slate-500">{d.voucherNo || d.id}</span></span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${d.status === 'posted' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : d.status === 'rejected' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-violet-50 text-violet-800 border-violet-200'}`}>{d.status === 'pending' ? 'WITH ACCOUNTANT' : d.status.toUpperCase()}</span>
                    </div>
                  ))}
                  {drafts.some((d) => d.status === 'pending') && <button onClick={() => go('accountant')} className="text-[11px] text-slate-600 underline cursor-pointer">Open accountant view</button>}
                </div>
              )}

              {c.needsMessage && c.message && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 block">Customer message</span>
                  <textarea id="owner-message" disabled={!!c.message.sentAt} value={c.message.text} onChange={(e) => dispatch({ type: 'MESSAGE_EDIT', caseId: c.id, text: e.target.value })}
                    rows={7} className="w-full text-[11px] leading-relaxed p-2 rounded-lg border border-slate-300 bg-slate-50 disabled:text-slate-500" />
                  {c.message.sentAt ? (
                    <div className="text-[11px] text-emerald-700 font-bold flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Shared on WhatsApp at {time(c.message.sentAt)}</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <a id="btn-share-whatsapp" href={waLink} target="_blank" rel="noreferrer" onClick={() => dispatch({ type: 'MESSAGE_SENT', caseId: c.id, actor: 'Owner' })}
                        className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-1 cursor-pointer shadow-2xs"><MessageCircle className="w-3.5 h-3.5" /><span>Share on WhatsApp</span></a>
                      <button onClick={() => { try { navigator.clipboard.writeText(c.message.text); setCopied(true); } catch { /* ignore */ } }}
                        className="py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-bold text-xs flex items-center justify-center space-x-1 cursor-pointer"><Copy className="w-3.5 h-3.5" /><span>{copied ? 'Copied' : 'Copy text'}</span></button>
                    </div>
                  )}
                </div>
              )}

              {c.outcome.type === 'source' && !c.sourcingReceivedAt && (
                <button onClick={() => dispatch({ type: 'SOURCED_RECEIVED', caseId: c.id, actor: 'Owner' })} className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-1 cursor-pointer"><PackageCheck className="w-3.5 h-3.5" /><span>Mark sourced units received</span></button>
              )}
              {st === 'CLOSED' && <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-semibold">Case closed. It stays in the discrepancy log as a read-only record.</div>}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
