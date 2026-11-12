import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ArrowLeft, Clock, MapPin, MessageCircle, Copy, PackageCheck, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Phone, Truck, Scale, RotateCcw } from 'lucide-react';
import {
  useStore, orderStatus, orderCases, orderState, orderDrafts, shortQty, totalFound, item, party, REASONS, OUTCOMES, CUSTOMER_CHOICES,
  DRAFT_LABEL, caseRecounts, substitutesFor, billChange, correctionRoute, isFound, ROOT_CAUSES, isDispatched, dispatchBlock,
  DISPATCH_BLOCK_TEXT, OUTCOMES_AFTER_DISPATCH, OUTCOMES_BEFORE_DISPATCH, needsOwnerSignOff, diffValue, unitLabel,
} from '../store.tsx';
import { StatusBadge, PageHeader, AuditTrail, type Go } from './ui.tsx';
import { inr, inrSigned, time, dateTime, when } from '../lib/format.ts';

const NEEDS_OWNER = ['SEARCHING', 'AWAITING_OWNER', 'MESSAGE_PENDING', 'AWAITING_STOCK'];

function useNow(ms = 30000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}
function dueText(state: any, o: any, now: number) {
  const sent = orderState(state, o.id).dispatchedAt;
  if (sent) return { text: `Dispatched ${when(sent, now)}`, cls: 'text-slate-500' };
  const m = Math.round((o.dispatchBy - now) / 60000);
  if (m < 0) return { text: `Truck was due ${when(o.dispatchBy, now)}`, cls: 'text-rose-700' };
  const h = Math.floor(m / 60);
  return { text: `Truck leaves in ${h ? `${h}h ` : ''}${m % 60}m (${when(o.dispatchBy, now)})`, cls: m < 120 ? 'text-amber-700' : 'text-slate-600' };
}
const signOffs = (state: any) => state.drafts.filter((d: any) => d.status === 'pending' && needsOwnerSignOff(d));

export default function Owner({ go, initialCase }: { go: Go; initialCase: string | null }) {
  const { state } = useStore();
  const initialOrder = initialCase ? (state.cases.find((c: any) => c.id === initialCase)?.orderId || initialCase) : null;
  const [orderId, setOrderId] = useState<string | null>(initialOrder);
  return orderId ? <OrderDetail orderId={orderId} onBack={() => setOrderId(null)} go={go} /> : <OrderQueue onOpen={setOrderId} />;
}

// A stock loss above the owner's limit: the owner signs off or sends it back for another count
function SignOffCard({ d, compact = false }: { d: any; compact?: boolean }) {
  const { state, dispatch } = useStore();
  const [back, setBack] = useState(false);
  const [note, setNote] = useState('');
  const it = item(d.item);
  const diff = d.counted - d.book;
  const rc = state.recounts.find((r: any) => r.id === d.recountId);
  return (
    <div id={`signoff-${d.id}`} className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-2 text-xs">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-bold text-rose-950 flex items-center"><Scale className="w-3.5 h-3.5 mr-1" />Stock loss {inr(-diffValue(d), 0)}: {it.name}</div>
          <div className="text-[11px] text-rose-900 mt-0.5">{d.godown} / {d.shelf}: counted {d.counted}, expected {d.book} ({diff} {unitLabel(it.unit, Math.abs(diff))}) • Cause: {ROOT_CAUSES[d.cause]}{rc?.countedBy ? ` • counted by ${rc.countedBy}, ${time(rc.countedAt)}` : ''}</div>
        </div>
        {!compact && <span className="font-mono text-[10px] text-rose-700">{d.id}</span>}
      </div>
      <p className="text-[11px] text-rose-900">Above your {inr(state.settings.writeOffLimit, 0)} limit, so the accountant cannot write it off until you sign.</p>
      {!back ? (
        <div className="grid grid-cols-2 gap-2">
          <button id={`btn-signoff-${d.id}`} onClick={() => dispatch({ type: 'OWNER_SIGN_OFF', draftId: d.id, actor: 'Owner' })} className="py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold cursor-pointer">Sign off the loss</button>
          <button onClick={() => setBack(true)} className="py-2 bg-white border border-rose-300 text-rose-800 rounded-lg font-bold cursor-pointer flex items-center justify-center"><RotateCcw className="w-3.5 h-3.5 mr-1" />Count again</button>
        </div>
      ) : (
        <div className="space-y-2">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What to check (required), e.g. look in R2-A too" className="w-full p-2 rounded-lg border border-rose-300 bg-white" />
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setBack(false)} className="py-2 bg-white border border-slate-300 rounded-lg font-bold cursor-pointer">Cancel</button>
            <button disabled={!note.trim()} onClick={() => dispatch({ type: 'REJECT_DRAFT', draftId: d.id, note, actor: 'Owner' })} className="py-2 bg-slate-900 disabled:opacity-40 text-white rounded-lg font-bold cursor-pointer">Send for recount</button>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderQueue({ onOpen }: { onOpen: (id: string) => void }) {
  const { state } = useStore();
  const now = useNow();
  const [filter, setFilter] = useState('mine');
  const rows = useMemo(() => state.orders
    .filter((o: any) => orderCases(state, o.id).length)
    .map((o: any) => ({ o, st: orderStatus(state, o), cases: orderCases(state, o.id) })), [state]);
  const losses = signOffs(state);
  const counts = { mine: rows.filter((r: any) => NEEDS_OWNER.includes(r.st)).length, open: rows.filter((r: any) => r.st !== 'CLOSED').length, all: rows.length };
  const shown = rows
    .filter((r: any) => (filter === 'mine' ? NEEDS_OWNER.includes(r.st) : filter === 'open' ? r.st !== 'CLOSED' : true))
    .sort((a: any, b: any) => Number(isDispatched(state, a.o.id)) - Number(isDispatched(state, b.o.id)) || a.o.dispatchBy - b.o.dispatchBy);

  return (
    <div className="space-y-5 max-w-5xl mx-auto w-full">
      <PageHeader title="Owner: short orders" sub="One card per order, most urgent truck first. Decide once for the whole order, tell the customer once, and StockTrace prepares the paperwork." />
      {losses.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Stock losses waiting for your sign-off ({losses.length})</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{losses.map((d: any) => <SignOffCard key={d.id} d={d} />)}</div>
        </div>
      )}
      <div className="inline-flex rounded-lg bg-slate-100 border border-slate-200 p-1 text-xs font-semibold">
        {([['mine', 'Needs me'], ['open', 'All open'], ['all', 'All']] as const).map(([k, label]) => (
          <button key={k} id={`owner-filter-${k}`} onClick={() => setFilter(k)} className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${filter === k ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}>{label} ({counts[k]})</button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {shown.map(({ o, st, cases }: any) => {
          const p = party(o.party);
          const value = cases.reduce((n: number, c: any) => n + shortQty(c) * item(c.item).rate, 0);
          const due = dueText(state, o, now);
          return (
            <div key={o.id} id={`order-card-${o.id}`} className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2"><span className="font-mono text-xs font-bold text-slate-950">{o.id}</span><span className="text-xs text-slate-400">•</span><span className="text-sm font-bold text-slate-900">{p.name}</span></div>
                  <div className={`text-[11px] mt-0.5 flex items-center ${due.cls}`}>{isDispatched(state, o.id) ? <Truck className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}{due.text}</div>
                </div>
                <StatusBadge status={st} />
              </div>
              <div className="space-y-1 text-xs">
                {cases.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between">
                    <span className="text-slate-700 truncate">{item(c.item).name}</span>
                    <span className="font-mono shrink-0 ml-2">{isFound(c) ? <span className="text-emerald-700">found in search</span> : <><span className="text-rose-700 font-bold">{shortQty(c)} short</span><span className="text-slate-400"> of {c.ordered}</span></>}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-500">Short value <span className="font-mono font-bold text-slate-900">{inr(value, 0)}</span> • {o.invoice ? o.invoice.no : 'Not invoiced'}</span>
                <button id={`btn-open-${o.id}`} onClick={() => onOpen(o.id)} className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold inline-flex items-center space-x-1 cursor-pointer shadow-2xs">
                  <span>{st === 'AWAITING_OWNER' ? 'Decide' : st === 'MESSAGE_PENDING' ? 'Send message' : st === 'AWAITING_STOCK' ? 'Mark received' : 'View'}</span><ArrowRight className="w-3 h-3" />
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
  const shipped = isDispatched(state, orderId);
  const allowed = shipped ? OUTCOMES_AFTER_DISPATCH : OUTCOMES_BEFORE_DISPATCH;

  const [lines, setLines] = useState<Record<string, any>>({});
  const [choice, setChoice] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [audit, setAudit] = useState<string | null>(null);

  const setLine = (id: string, patch: any) => setLines((x) => ({ ...x, [id]: { ...x[id], ...patch } }));
  const lineDone = (c: any, d: any) => {
    if (!d?.outcome) return false;
    if (d.outcome === 'source') return Boolean(d.sourcing?.supplier?.trim());
    if (d.outcome === 'substitute') return Boolean(d.substitute?.item) && d.substitute.qty >= 1 && (d.substitute.qty >= shortQty(c) || Boolean(d.substitute.rest));
    return true;
  };
  const complete = open.every((c: any) => lineDone(c, lines[c.id]));
  const preview = complete ? billChange(state, o, lines) : null;
  const route = correctionRoute(state, o, now);
  const drafts = orderDrafts(state, orderId);
  const due = dueText(state, o, now);
  const block = dispatchBlock(state, o);
  const losses = signOffs(state).filter((d: any) => d.orderId === orderId);

  // default details for an option, so its bill impact can be shown before it is chosen
  const optionLine = (c: any, k: string) => {
    if (k === 'substitute') {
      const s = substitutesFor(state, c.item)[0];
      return s ? { outcome: k, substitute: { item: s.code, qty: Math.min(shortQty(c), s.qty) } } : { outcome: k };
    }
    return { outcome: k };
  };
  // impact of this option on its own (other short items left as ordered), so the numbers do not depend on other choices
  const impact = (c: any, k: string) => billChange(state, o, { [c.id]: lines[c.id]?.outcome === k ? lines[c.id] : optionLine(c, k) }).diff;
  const label = (c: any, k: string) => {
    const got = totalFound(c);
    if (shipped && k === 'partial') return 'Customer keeps what was delivered, cancel the rest';
    if (shipped && k === 'backorder') return 'Send the rest in a later delivery';
    if (k === 'backorder' && got === 0) return `Send all ${c.ordered} later`;
    return OUTCOMES[k];
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto w-full pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center space-x-3">
          <button id="owner-back" onClick={onBack} className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer" title="Back to all orders"><ArrowLeft className="w-4 h-4" /></button>
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

      {shipped && !os.decision && open.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-700 flex items-center space-x-2"><Truck className="w-4 h-4 shrink-0" /><span><strong>The goods have already left</strong> ({dateTime(os.dispatchedAt)}). Only options that still make sense are shown.</span></div>
      )}
      {os.returnedNote && !os.decision && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-2 text-xs text-amber-900 flex items-center space-x-2"><AlertTriangle className="w-4 h-4 shrink-0" /><span><strong>Returned by the accountant.</strong> {os.returnedNote}. Decide again.</span></div>
      )}
      {losses.map((d: any) => <SignOffCard key={d.id} d={d} />)}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 space-y-4">
          {cases.map((c: any) => {
            const it = item(c.item);
            const d = lines[c.id] || {};
            const subs = substitutesFor(state, c.item);
            const rcs = caseRecounts(state, c);
            const options = allowed.filter((k) => !(k === 'partial' && totalFound(c) === 0 && !shipped));
            return (
              <div key={c.id} id={`case-${c.id}`} className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold text-slate-900">{it.name}</div>
                    <div className="text-[11px] text-slate-500"><span className="font-mono">{c.id}</span> • {c.godown} / {c.shelf} • {REASONS[c.reason]}</div>
                  </div>
                  <div className="text-right font-mono text-xs shrink-0">
                    <div><span className="text-slate-400">picked</span> {totalFound(c)} of {c.ordered}</div>
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
                    {options.map((k) => {
                      const disabled = k === 'substitute' && !subs.length;
                      const diff = disabled ? 0 : impact(c, k);
                      const subQty = d.substitute?.qty ?? 0;
                      const subMax = Math.min(shortQty(c), subs.find((s: any) => s.code === d.substitute?.item)?.qty ?? 0);
                      return (
                        <label key={k} id={`outcome-${c.id}-${k}`} className={`block p-2 rounded-lg border ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${d.outcome === k ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center space-x-2">
                              <input type="radio" disabled={disabled} name={`o-${c.id}`} checked={d.outcome === k} onChange={() => setLine(c.id, optionLine(c, k))} className="accent-slate-900" />
                              <span className="text-xs font-bold text-slate-900">{label(c, k)}</span>
                              {k === 'substitute' && !subs.length && <span className="text-[11px] text-slate-500">no substitute in stock</span>}
                            </div>
                            {!disabled && <span className={`font-mono text-[11px] shrink-0 ${diff < 0 ? 'text-rose-700' : 'text-slate-500'}`}>{diff === 0 ? 'bill unchanged' : `bill ${inrSigned(diff, 0)}`}</span>}
                          </div>
                          {k === 'substitute' && d.outcome === 'substitute' && (
                            <div className="ml-5 mt-2 space-y-2 text-xs">
                              <div className="flex flex-wrap items-center gap-2">
                                <select value={d.substitute?.item} onChange={(e) => setLine(c.id, { substitute: { ...d.substitute, item: e.target.value } })} className="p-1.5 rounded border border-slate-300 bg-white">
                                  {subs.map((s: any) => <option key={s.code} value={s.code}>{item(s.code).name} ({s.qty} in stock, {inr(item(s.code).rate, 0)} vs {inr(it.rate, 0)})</option>)}
                                </select>
                                <input id={`sub-qty-${c.id}`} type="number" min="1" max={subMax} value={subQty || ''} onChange={(e) => setLine(c.id, { substitute: { ...d.substitute, qty: Math.max(1, Math.min(subMax, Math.floor(Number(e.target.value) || 1))) } })} className="w-16 p-1.5 rounded border border-slate-300 font-mono" />
                                <span className="text-slate-500">of {shortQty(c)} short</span>
                              </div>
                              {subQty > 0 && subQty < shortQty(c) && (
                                <div className="p-2 rounded border border-amber-200 bg-amber-50 space-y-1">
                                  <div className="font-semibold text-amber-900">The other {shortQty(c) - subQty} {unitLabel(it.unit, shortQty(c) - subQty)}:</div>
                                  {([['cancel', 'Cancel them'], ['backorder', 'Send them later']] as const).map(([rk, rl]) => (
                                    <label key={rk} className="inline-flex items-center mr-4"><input type="radio" name={`rest-${c.id}`} checked={d.substitute?.rest === rk} onChange={() => setLine(c.id, { substitute: { ...d.substitute, rest: rk } })} className="accent-slate-900 mr-1" />{rl}</label>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          {k === 'source' && d.outcome === 'source' && (
                            <div className="ml-5 mt-2 space-y-1.5">
                              <div className="grid grid-cols-3 gap-2">
                                <input value={d.sourcing?.supplier || ''} onChange={(e) => setLine(c.id, { sourcing: { ...d.sourcing, supplier: e.target.value } })} placeholder="From whom (required)" className="text-xs p-1.5 rounded border border-slate-300 bg-white" />
                                <input value={d.sourcing?.eta || ''} onChange={(e) => setLine(c.id, { sourcing: { ...d.sourcing, eta: e.target.value } })} placeholder="By when, e.g. 4 pm" className="text-xs p-1.5 rounded border border-slate-300 bg-white" />
                                <input type="number" min="0" value={d.sourcing?.rate ?? ''} onChange={(e) => setLine(c.id, { sourcing: { ...d.sourcing, rate: e.target.value } })} placeholder="Buying ₹/unit" className="text-xs p-1.5 rounded border border-slate-300 bg-white font-mono" />
                              </div>
                              {d.sourcing?.rate !== undefined && d.sourcing.rate !== '' && (
                                <div className={`text-[11px] ${Number(d.sourcing.rate) > it.rate ? 'text-rose-700 font-semibold' : 'text-slate-600'}`}>Selling {inr(it.rate, 0)} • buying {inr(Number(d.sourcing.rate), 0)} → margin {inrSigned(it.rate - Number(d.sourcing.rate), 0)} per {it.unit}, {inrSigned((it.rate - Number(d.sourcing.rate)) * shortQty(c), 0)} on {shortQty(c)}</div>
                              )}
                            </div>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}

                {c.outcome && !isFound(c) && (
                  <div className="text-xs p-2 rounded-lg bg-slate-50 border border-slate-200"><span className="text-slate-500">Decided:</span> <strong>{label(c, c.outcome.type)}</strong>
                    {c.outcome.substitute ? ` — ${c.outcome.substitute.qty} × ${item(c.outcome.substitute.item).name}${shortQty(c) > c.outcome.substitute.qty ? `; other ${shortQty(c) - c.outcome.substitute.qty} ${c.outcome.substitute.rest === 'backorder' ? 'to follow' : 'cancelled'}` : ''}` : ''}
                    {c.outcome.sourcing ? ` — from ${c.outcome.sourcing.supplier}${c.outcome.sourcing.rate != null ? ` at ${inr(c.outcome.sourcing.rate, 0)}` : ''}` : ''}</div>
                )}

                <div className="space-y-1 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  {!rcs.length && <div>Damaged: moved to Damaged Goods by stock journal, no recount</div>}
                  {rcs.map((r: any) => {
                    const loss = r.status === 'done' && r.counted != null && r.book != null ? (r.book - r.counted - (r.foundQty || 0)) * it.rate : 0;
                    return (
                      <div key={r.id} className={loss > state.settings.writeOffLimit ? 'text-rose-700 font-semibold' : ''}>
                        Recount {r.id} {r.godown} / {r.shelf}: {r.status === 'open' ? 'with godown in-charge' : r.status === 'needs_cause' ? `counted ${r.counted} vs ${r.book}, cause pending` : `counted ${r.counted} vs ${r.book} expected • ${ROOT_CAUSES[r.cause]}${r.foundQty ? ` (${r.foundQty} at ${r.foundAt})` : ''}${loss > 0 ? ` • loss ${inr(loss, 0)}` : ''}`}
                      </div>
                    );
                  })}
                  <div className="flex justify-end"><button onClick={() => setAudit(audit === c.id ? null : c.id)} className="underline cursor-pointer flex items-center">History {audit === c.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}</button></div>
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
                    {preview && <div className="font-mono text-[11px] text-slate-800">Bill {inr(preview.before)} → {inr(preview.after)} ({inrSigned(preview.diff)})</div>}
                  </div>
                  <button id="btn-confirm-decision" disabled={!complete || !choice}
                    onClick={() => dispatch({ type: 'DECIDE_ORDER', orderId, lines: Object.fromEntries(open.map((c: any) => [c.id, lines[c.id]])), customerChoice: choice, note, actor: 'Owner' })}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-lg font-bold text-sm cursor-pointer disabled:cursor-not-allowed">Confirm for whole order</button>
                  {!complete && <p className="text-[11px] text-slate-400 text-center">Choose an option for every short item{open.some((c: any) => lines[c.id]?.outcome === 'substitute' && !lineDone(c, lines[c.id])) ? ' (and what happens to the rest of a part substitute)' : ''}.</p>}
                </>
              )}
            </div>
          )}

          {os.decision && os.message && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3 text-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Customer message (one for the order)</div>
              <div className="text-[11px] text-slate-500">{CUSTOMER_CHOICES[os.decision.customerChoice]}{os.decision.note ? ` — "${os.decision.note}"` : ''} • {dateTime(os.decision.at)}</div>
              <textarea id="owner-message" disabled={!!os.message?.sentAt} value={os.message?.text || ''} onChange={(e) => dispatch({ type: 'MESSAGE_EDIT', orderId, text: e.target.value })}
                rows={10} className="w-full text-[11px] leading-relaxed p-2 rounded-lg border border-slate-300 bg-slate-50 disabled:text-slate-500" />
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
            </div>
          )}
          {os.decision && !os.message && <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs text-xs text-slate-600">Decided: no bill change and nothing new to tell the customer.</div>}

          {os.picked && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2 text-xs" id="owner-goods">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Goods</div>
              <div className={`font-semibold flex items-center ${block === null ? 'text-emerald-700' : block === 'dispatched' ? 'text-slate-600' : 'text-amber-800'}`}>
                <Truck className="w-3.5 h-3.5 mr-1" />{block === null ? 'Ready: packer can load and dispatch' : block === 'dispatched' ? `Dispatched ${when(os.dispatchedAt, now)}` : `Held: ${DISPATCH_BLOCK_TEXT[block!].toLowerCase()}`}
              </div>
              {(os.extraPicks || []).map((x: any) => (
                <div key={x.id} className="flex items-center justify-between text-[11px] text-slate-600"><span>{x.kind === 'substitute' ? 'Substitute' : 'Bought-in'}: {x.qty} × {item(x.item).name} from {x.godown} / {x.shelf}</span><span className={x.done ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>{x.done ? 'picked' : 'to pick'}</span></div>
              ))}
              {os.decision?.hasSource && !os.sourcingReceivedAt && (
                <button id="btn-sourced-received" onClick={() => dispatch({ type: 'SOURCED_RECEIVED', orderId, actor: 'Owner' })} className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-1 cursor-pointer"><PackageCheck className="w-3.5 h-3.5" /><span>Arranged units arrived</span></button>
              )}
            </div>
          )}

          {drafts.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2 text-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Paperwork for Tally</div>
              {drafts.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between p-2 rounded border border-slate-200">
                  <span>{DRAFT_LABEL[d.type]} <span className="font-mono text-slate-500">{d.id}</span>{d.deadline && d.status === 'pending' ? <span className="text-amber-700"> • by {when(d.deadline, now)}</span> : ''}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${d.status === 'approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : d.status === 'rejected' ? 'bg-rose-50 text-rose-800 border-rose-200' : needsOwnerSignOff(d) ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-violet-50 text-violet-800 border-violet-200'}`}>{d.status === 'pending' ? (needsOwnerSignOff(d) ? 'NEEDS YOUR SIGN-OFF' : 'WITH ACCOUNTANT') : d.status.toUpperCase()}</span>
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
