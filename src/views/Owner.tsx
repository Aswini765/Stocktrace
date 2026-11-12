import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ArrowLeft, Clock, ShieldCheck, MapPin, MessageCircle, Copy, PackageCheck, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Phone } from 'lucide-react';
import {
  useStore, orderStatus, orderCases, orderState, orderDrafts, shortQty, totalFound, item, party, REASONS, OUTCOMES, CUSTOMER_CHOICES,
  DRAFT_LABEL, caseRecount, substitutesFor, billChange, correctionRoute, isFound, ROOT_CAUSES,
} from '../store.tsx';
import { StatusBadge, PageHeader, AuditTrail, type Go } from './ui.tsx';
import { inr, time, dateTime } from '../lib/format.ts';

const NEEDS_OWNER = ['SEARCHING', 'AWAITING_OWNER', 'MESSAGE_PENDING', 'AWAITING_STOCK'];

function useNow(ms = 30000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}
function dueText(dispatchBy: number, now: number) {
  const m = Math.round((dispatchBy - now) / 60000);
  if (m < 0) return { text: `Dispatch time passed ${time(dispatchBy)}`, cls: 'text-rose-700' };
  const h = Math.floor(m / 60);
  return { text: `Truck leaves in ${h ? `${h}h ` : ''}${m % 60}m (${time(dispatchBy)})`, cls: m < 120 ? 'text-amber-700' : 'text-slate-600' };
}

export default function Owner({ go, initialCase }: { go: Go; initialCase: string | null }) {
  const { state } = useStore();
  const initialOrder = initialCase ? (state.cases.find((c: any) => c.id === initialCase)?.orderId || initialCase) : null;
  const [orderId, setOrderId] = useState<string | null>(initialOrder);
  return orderId ? <OrderDetail orderId={orderId} onBack={() => setOrderId(null)} go={go} /> : <OrderQueue onOpen={setOrderId} />;
}

function OrderQueue({ onOpen }: { onOpen: (id: string) => void }) {
  const { state } = useStore();
  const now = useNow();
  const [filter, setFilter] = useState('mine');
  const rows = useMemo(() => state.orders
    .filter((o: any) => orderCases(state, o.id).length)
    .map((o: any) => ({ o, st: orderStatus(state, o), cases: orderCases(state, o.id) })), [state]);
  const counts = { mine: rows.filter((r: any) => NEEDS_OWNER.includes(r.st)).length, open: rows.filter((r: any) => r.st !== 'CLOSED').length, all: rows.length };
  const shown = rows
    .filter((r: any) => (filter === 'mine' ? NEEDS_OWNER.includes(r.st) : filter === 'open' ? r.st !== 'CLOSED' : true))
    .sort((a: any, b: any) => a.o.dispatchBy - b.o.dispatchBy);

  return (
    <div className="space-y-5 max-w-5xl mx-auto w-full">
      <PageHeader title="Owner: short orders" sub="One card per order. Decide once for the whole order, tell the customer once, and StockTrace prepares the paperwork." />
      <div className="inline-flex rounded-lg bg-slate-100 border border-slate-200 p-1 text-xs font-semibold">
        {([['mine', 'Needs me'], ['open', 'All open'], ['all', 'All']] as const).map(([k, label]) => (
          <button key={k} id={`owner-filter-${k}`} onClick={() => setFilter(k)} className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${filter === k ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}>{label} ({counts[k]})</button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {shown.map(({ o, st, cases }: any) => {
          const p = party(o.party);
          const value = cases.reduce((n: number, c: any) => n + shortQty(c) * item(c.item).rate, 0);
          const due = dueText(o.dispatchBy, now);
          return (
            <div key={o.id} id={`order-card-${o.id}`} className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2"><span className="font-mono text-xs font-bold text-slate-950">{o.id}</span><span className="text-xs text-slate-400">•</span><span className="text-sm font-bold text-slate-900">{p.name}</span></div>
                  <div className={`text-[11px] mt-0.5 flex items-center ${due.cls}`}><Clock className="w-3 h-3 mr-1" />{due.text}</div>
                </div>
                <StatusBadge status={st} />
              </div>
              <div className="space-y-1 text-xs">
                {cases.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between">
                    <span className="text-slate-700 truncate">{item(c.item).name}</span>
                    <span className="font-mono shrink-0 ml-2">{isFound(c) ? <span className="text-emerald-700">found</span> : <><span className="text-rose-700 font-bold">{shortQty(c)}</span><span className="text-slate-400"> / {c.ordered} short</span></>}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-500">Short value <span className="font-mono font-bold text-slate-900">{inr(value, 0)}</span> • {o.invoice ? o.invoice.no : 'Not invoiced'}</span>
                <button id={`btn-open-${o.id}`} onClick={() => onOpen(o.id)} className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold inline-flex items-center space-x-1 cursor-pointer shadow-2xs">
                  <span>{st === 'AWAITING_OWNER' ? 'Decide' : st === 'MESSAGE_PENDING' ? 'Send message' : 'View'}</span><ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
        {!shown.length && <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400">Nothing needs you right now.</div>}
      </div>
    </div>
  );
}

function OrderDetail({ orderId, onBack, go }: { orderId: string; onBack: () => void; go: Go }) {
  const { state, dispatch } = useStore();
  const now = useNow(1000);
  const o = state.orders.find((x: any) => x.id === orderId);
  const os = orderState(state, orderId);
  const cases = orderCases(state, orderId);
  const st = orderStatus(state, o);
  const p = party(o.party);
  const open = cases.filter((c: any) => !c.outcome);
  const canDecide = os.picked && open.length > 0 && open.every((c: any) => c.escalatedAt);

  const [lines, setLines] = useState<Record<string, any>>({});
  const [choice, setChoice] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [audit, setAudit] = useState<string | null>(null);

  const setLine = (id: string, patch: any) => setLines((x) => ({ ...x, [id]: { ...x[id], ...patch } }));
  const complete = open.every((c: any) => {
    const d = lines[c.id];
    if (!d?.outcome) return false;
    if (d.outcome === 'source') return Boolean(d.sourcing?.supplier?.trim());
    if (d.outcome === 'substitute') return Boolean(d.substitute?.item) && d.substitute.qty >= 1;
    return true;
  });
  const preview = complete ? billChange(state, o, lines) : null;
  const route = correctionRoute(state, o, now);
  const drafts = orderDrafts(state, orderId);
  const due = dueText(o.dispatchBy, now);

  return (
    <div className="space-y-5 max-w-6xl mx-auto w-full pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center space-x-3">
          <button onClick={onBack} className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer" title="Back"><ArrowLeft className="w-4 h-4" /></button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-slate-950 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{o.id}</span>
              <span className="text-sm font-bold text-slate-900">{p.name}, {p.city}</span>
            </div>
            <p className={`text-[11px] mt-0.5 ${due.cls}`}>{due.text} • {o.invoice ? `Invoice ${o.invoice.no}` : 'Not invoiced yet'}</p>
          </div>
        </div>
        <StatusBadge status={st} />
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 flex items-center space-x-2 text-xs text-slate-700">
        <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
        <span><strong>You decide, once for the whole order.</strong> StockTrace drafts the message and the bill correction; the accountant approves before anything goes into Tally.</span>
      </div>
      {os.returnedNote && !os.decision && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-2 text-xs text-amber-900 flex items-center space-x-2"><AlertTriangle className="w-4 h-4 shrink-0" /><span><strong>Returned by accountant.</strong> {os.returnedNote}. Decide again.</span></div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 space-y-4">
          {cases.map((c: any) => {
            const it = item(c.item);
            const d = lines[c.id] || {};
            const subs = substitutesFor(state, c.item);
            const rc = caseRecount(state, c);
            return (
              <div key={c.id} id={`case-${c.id}`} className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold text-slate-900">{it.name}</div>
                    <div className="text-[11px] text-slate-500"><span className="font-mono">{c.id}</span> • {c.godown} / {c.shelf} • {REASONS[c.reason]}</div>
                  </div>
                  <div className="text-right font-mono text-xs shrink-0">
                    <div><span className="text-slate-400">found</span> {totalFound(c)}/{c.ordered}</div>
                    {!isFound(c) && <div className="text-rose-700 font-bold">{shortQty(c)} short • {inr(shortQty(c) * it.rate, 0)}</div>}
                  </div>
                </div>

                {c.suggestions.length > 0 && (
                  <div className="bg-slate-50 rounded-lg border border-slate-200 text-[11px] divide-y divide-slate-200">
                    {c.suggestions.map((s: any) => (
                      <div key={s.key} className="p-2 flex items-start justify-between gap-2">
                        <span className="text-slate-600"><MapPin className="w-3 h-3 inline mr-1 text-teal-700" /><strong className="text-slate-900">{s.key}</strong> — {s.source}</span>
                        <span className={`font-mono font-bold shrink-0 ${s.result === 'found' ? 'text-emerald-700' : s.result ? 'text-slate-500' : 'text-sky-700'}`}>{s.result === 'found' ? `+${s.foundQty}` : s.result ? 'not here' : 'checking'}</span>
                      </div>
                    ))}
                  </div>
                )}
                {c.escalation === 'no_records' && <p className="text-[11px] text-slate-500">No Tally record shows this item anywhere else, so no place was suggested.</p>}

                {!c.outcome && !c.escalatedAt && (
                  <div className="text-xs text-sky-800 bg-sky-50 border border-sky-200 rounded-lg p-2 flex items-center justify-between">
                    <span>Picker is checking ({Math.max(0, Math.ceil((c.searchDeadline - now) / 60000))} min left)</span>
                    <button onClick={() => dispatch({ type: 'ESCALATE', caseId: c.id, why: 'owner', actor: 'Owner' })} className="underline cursor-pointer">Stop search</button>
                  </div>
                )}

                {isFound(c) && <div className="text-xs font-semibold text-emerald-700 flex items-center"><CheckCircle2 className="w-4 h-4 mr-1" />Found during the search. Nothing to decide.</div>}

                {!c.outcome && c.escalatedAt && (
                  <div className="space-y-1.5">
                    {['partial', 'backorder', 'substitute', 'source', 'cancel_line'].map((k) => {
                      const disabled = k === 'substitute' && !subs.length;
                      return (
                        <label key={k} id={`outcome-${c.id}-${k}`} className={`block p-2 rounded-lg border ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${d.outcome === k ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                          <div className="flex items-center space-x-2">
                            <input type="radio" disabled={disabled} name={`o-${c.id}`} checked={d.outcome === k} onChange={() => setLine(c.id, { outcome: k, ...(k === 'substitute' && subs[0] ? { substitute: { item: subs[0].code, qty: Math.min(shortQty(c), subs[0].qty) } } : {}) })} className="accent-slate-900" />
                            <span className="text-xs font-bold text-slate-900">{OUTCOMES[k]}</span>
                            {k === 'partial' && <span className="text-[11px] text-slate-500">send {totalFound(c)}</span>}
                            {k === 'substitute' && !subs.length && <span className="text-[11px] text-slate-500">no substitute in stock</span>}
                          </div>
                          {k === 'substitute' && d.outcome === 'substitute' && (
                            <div className="ml-5 mt-2 flex flex-wrap items-center gap-2 text-xs">
                              <select value={d.substitute?.item} onChange={(e) => setLine(c.id, { substitute: { ...d.substitute, item: e.target.value } })} className="p-1.5 rounded border border-slate-300 bg-white">
                                {subs.map((s: any) => <option key={s.code} value={s.code}>{item(s.code).name} ({s.qty} in stock, {inr(item(s.code).rate, 0)})</option>)}
                              </select>
                              <input type="number" min="1" max={subs.find((s: any) => s.code === d.substitute?.item)?.qty} value={d.substitute?.qty ?? ''} onChange={(e) => setLine(c.id, { substitute: { ...d.substitute, qty: Math.max(1, Math.floor(Number(e.target.value) || 1)) } })} className="w-16 p-1.5 rounded border border-slate-300 font-mono" />
                            </div>
                          )}
                          {k === 'source' && d.outcome === 'source' && (
                            <div className="ml-5 mt-2 grid grid-cols-2 gap-2">
                              <input value={d.sourcing?.supplier || ''} onChange={(e) => setLine(c.id, { sourcing: { ...d.sourcing, supplier: e.target.value } })} placeholder="From (required)" className="text-xs p-1.5 rounded border border-slate-300 bg-white" />
                              <input value={d.sourcing?.eta || ''} onChange={(e) => setLine(c.id, { sourcing: { ...d.sourcing, eta: e.target.value } })} placeholder="By when, e.g. 4 pm" className="text-xs p-1.5 rounded border border-slate-300 bg-white" />
                            </div>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}

                {c.outcome && !isFound(c) && (
                  <div className="text-xs p-2 rounded-lg bg-slate-50 border border-slate-200"><span className="text-slate-500">Decided:</span> <strong>{OUTCOMES[c.outcome.type]}</strong>{c.outcome.substitute ? ` — ${c.outcome.substitute.qty} × ${item(c.outcome.substitute.item).name}` : ''}{c.outcome.sourcing ? ` — from ${c.outcome.sourcing.supplier}` : ''}</div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <span>{rc ? (rc.status === 'done' ? `Recount: counted ${rc.counted} vs book ${rc.book}${rc.cause ? ` • ${ROOT_CAUSES[rc.cause]}` : ''}` : `Recount ${rc.id} with godown in-charge`) : 'Damaged: written off, no recount'}</span>
                  <button onClick={() => setAudit(audit === c.id ? null : c.id)} className="underline cursor-pointer flex items-center">History {audit === c.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}</button>
                </div>
                {audit === c.id && <AuditTrail audit={c.audit} />}
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-5 space-y-4">
          {!os.decision && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Customer and bill</div>
              {!os.picked && <p className="text-xs text-slate-600">Waiting for the picker to finish this order. You can decide once it reaches packing.</p>}
              {os.picked && !canDecide && open.length > 0 && <p className="text-xs text-slate-600">Waiting for the quick search to finish (or stop it on the item).</p>}
              {canDecide && (
                <>
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-slate-900 flex items-center"><Phone className="w-3.5 h-3.5 mr-1" />Did you speak to {p.name}?</div>
                    {Object.entries(CUSTOMER_CHOICES).map(([k, v]) => (
                      <label key={k} id={`choice-${k}`} className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer text-xs ${choice === k ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                        <input type="radio" name="choice" checked={choice === k} onChange={() => setChoice(k)} className="accent-slate-900" /><span>{v}</span>
                      </label>
                    ))}
                    <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional), e.g. Ravi OK with 98 today" className="w-full text-xs p-2 rounded-lg border border-slate-300" />
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="font-bold text-slate-900">How the bill gets fixed</div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{route.why}</p>
                    {preview && <div className="font-mono text-[11px] text-slate-800">Bill {inr(preview.before)} → {inr(preview.after)} ({preview.diff >= 0 ? '+' : ''}{inr(preview.diff)})</div>}
                  </div>
                  <button id="btn-confirm-decision" disabled={!complete || !choice}
                    onClick={() => dispatch({ type: 'DECIDE_ORDER', orderId, lines: Object.fromEntries(open.map((c: any) => [c.id, lines[c.id]])), customerChoice: choice, note, actor: 'Owner' })}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-lg font-bold text-sm cursor-pointer disabled:cursor-not-allowed">Confirm for whole order</button>
                </>
              )}
            </div>
          )}

          {os.decision && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3 text-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Customer message (one for the order)</div>
              <div className="text-[11px] text-slate-500">{CUSTOMER_CHOICES[os.decision.customerChoice]}{os.decision.note ? ` — "${os.decision.note}"` : ''} • {dateTime(os.decision.at)}</div>
              <textarea id="owner-message" disabled={!!os.message?.sentAt} value={os.message?.text || ''} onChange={(e) => dispatch({ type: 'MESSAGE_EDIT', orderId, text: e.target.value })}
                rows={9} className="w-full text-[11px] leading-relaxed p-2 rounded-lg border border-slate-300 bg-slate-50 disabled:text-slate-500" />
              {os.message?.sentAt ? (
                <div className="text-[11px] text-emerald-700 font-bold flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Shared on WhatsApp at {time(os.message.sentAt)}</div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <a id="btn-share-whatsapp" href={`https://wa.me/?text=${encodeURIComponent(os.message?.text || '')}`} target="_blank" rel="noreferrer" onClick={() => dispatch({ type: 'MESSAGE_SENT', orderId, actor: 'Owner' })}
                    className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-1 cursor-pointer shadow-2xs"><MessageCircle className="w-3.5 h-3.5" /><span>Share on WhatsApp</span></a>
                  <button onClick={() => { try { navigator.clipboard.writeText(os.message?.text || ''); setCopied(true); } catch { /* ignore */ } }}
                    className="py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-bold text-xs flex items-center justify-center space-x-1 cursor-pointer"><Copy className="w-3.5 h-3.5" /><span>{copied ? 'Copied' : 'Copy text'}</span></button>
                </div>
              )}
              {os.decision.hasSource && !os.sourcingReceivedAt && (
                <button onClick={() => dispatch({ type: 'SOURCED_RECEIVED', orderId, actor: 'Owner' })} className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-1 cursor-pointer"><PackageCheck className="w-3.5 h-3.5" /><span>Arranged units received</span></button>
              )}
            </div>
          )}

          {drafts.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2 text-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Paperwork for Tally</div>
              {drafts.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between p-2 rounded border border-slate-200">
                  <span>{DRAFT_LABEL[d.type]} <span className="font-mono text-slate-500">{d.id}</span></span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${d.status === 'approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : d.status === 'rejected' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-violet-50 text-violet-800 border-violet-200'}`}>{d.status === 'pending' ? 'WITH ACCOUNTANT' : d.status.toUpperCase()}</span>
                </div>
              ))}
              {drafts.some((d: any) => d.status === 'pending') && <button onClick={() => go('accountant')} className="text-[11px] text-slate-600 underline cursor-pointer">Open accountant view</button>}
            </div>
          )}
          {st === 'CLOSED' && <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-semibold">Order closed. It stays in the discrepancy log as a read-only record.</div>}
        </div>
      </div>
    </div>
  );
}

