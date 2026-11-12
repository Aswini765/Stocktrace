import type { Go } from './ui.tsx';
import React, { useState } from 'react';
import { CheckCircle2, XCircle, Download, FileText, AlertTriangle, Clock } from 'lucide-react';
import { useStore, item, party, DRAFT_LABEL, orderStatus, orderOf, ROOT_CAUSES, STATUS_META } from '../store.tsx';
import { PageHeader } from './ui.tsx';
import { inr, dateTime, date, time } from '../lib/format.ts';
import { taxLines, creditNoteDeadline, daysLeft } from '../lib/tax.ts';
import { voucherXml, download } from '../lib/tally.ts';

const ROUTE_LABEL: Record<string, string> = {
  invoice_shipped: 'Invoice what is shipped',
  cancel_irn: 'Cancel e-invoice (IRN) and re-issue',
  cancel_reissue: 'Cancel and re-issue invoice',
  credit_note: 'Credit note',
};

// Steps the Tally operator follows, in order, for each kind of draft
function steps(d: any): string[] {
  if (d.type === 'reissue' && d.route === 'cancel_irn') {
    return [
      ...(d.original.ewayBill ? [`Cancel e-way bill ${d.original.ewayBill.no} on the e-way bill portal (an active e-way bill blocks IRN cancellation).`] : []),
      `Cancel the IRN of ${d.original.no} on the e-invoice portal before ${dateTime(d.deadline)} (24-hour limit; full cancellation only).`,
      `Cancel ${d.original.no} in Tally, then import the new invoice below (Tally gives it a fresh number; ${d.original.no} cannot be reused).`,
      'Generate the IRN (and e-way bill, if needed) for the new invoice before dispatch.',
    ];
  }
  if (d.type === 'reissue') return [`Cancel ${d.original.no} in Tally (keep it in the series as cancelled).`, 'Import the new invoice below; Tally numbers it.', 'Confirm this practice with your CA.'];
  if (d.type === 'credit_note') return ['Import the credit note; Tally numbers it and links the original invoice reference.', 'Generate its IRN if e-invoicing applies.', `Declare it in GSTR-1 by the s.34(2) deadline shown.`];
  if (d.type === 'sales_invoice') return ['Import the invoice; Tally numbers it.', 'Generate IRN / e-way bill if they apply, before dispatch.'];
  if (d.type === 'stock_journal') return ['Import the stock journal to move the damaged units out of saleable stock.'];
  return ['Import the physical stock entry to set the shelf to the counted quantity.'];
}

export default function Accountant({ go }: { go: Go }) {
  const { state, dispatch } = useStore();
  const [tab, setTab] = useState('pending');
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const counts: Record<string, number> = { pending: 0, approved: 0, rejected: 0 };
  state.drafts.forEach((d: any) => { counts[d.status]++; });
  const list = state.drafts.filter((d: any) => d.status === tab).sort((a: any, b: any) => (a.deadline || Infinity) - (b.deadline || Infinity) || a.createdAt - b.createdAt);
  const selected = list.filter((d: any) => picked[d.id]).map((d: any) => d.id);
  const approved = state.drafts.filter((d: any) => d.status === 'approved');
  const urgent = state.drafts.filter((d: any) => d.status === 'pending' && d.deadline && d.deadline - Date.now() < 6 * 3600000);

  return (
    <div className="space-y-5 max-w-6xl mx-auto w-full pb-12">
      <PageHeader title="Accountant: today's batch" sub="Review once a day, approve together, import into Tally. Tally assigns every voucher number."
        right={approved.length > 0 && (
          <button onClick={() => download(`stocktrace-tally-import-${new Date().toISOString().slice(0, 10)}.xml`, approved.map((d: any) => voucherXml(d)).join('\n'))} className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md font-semibold text-xs cursor-pointer shadow-2xs flex items-center space-x-1.5">
            <Download className="w-3.5 h-3.5" /><span>Download approved for Tally import (XML)</span>
          </button>
        )} />

      {urgent.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-2 text-xs text-amber-900 flex items-center space-x-2">
          <Clock className="w-4 h-4 shrink-0" /><span><strong>Time-bound:</strong> {urgent.length} e-invoice cancellation(s) must be done within hours, or they become credit notes. They are at the top.</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-lg bg-slate-100 border border-slate-200 p-1 text-xs font-semibold">
          {['pending', 'approved', 'rejected'].map((k) => (
            <button key={k} id={`acct-tab-${k}`} onClick={() => setTab(k)} className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${tab === k ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}>
              {k === 'pending' ? 'To approve' : k[0].toUpperCase() + k.slice(1)} ({counts[k]})
            </button>
          ))}
        </div>
        {tab === 'pending' && list.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <button onClick={() => setPicked(Object.fromEntries(list.map((d: any) => [d.id, true])))} className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer font-semibold">Select all</button>
            <button id="btn-approve-selected" disabled={!selected.length} onClick={() => { dispatch({ type: 'APPROVE_DRAFTS', draftIds: selected, actor: 'Accountant' }); setPicked({}); }}
              className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold cursor-pointer flex items-center space-x-1"><CheckCircle2 className="w-3.5 h-3.5" /><span>Approve selected ({selected.length})</span></button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {list.map((d: any) => <DraftCard key={d.id} d={d} go={go} checked={!!picked[d.id]} onCheck={(v) => setPicked({ ...picked, [d.id]: v })} />)}
        {!list.length && <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400">Nothing here.</div>}
      </div>
      <p className="text-[11px] text-slate-400">XML ledger names (Sales, Output CGST/SGST/IGST) must match your company's ledgers: import into a test company first. Item and GST rates in this demo are sample values.</p>
    </div>
  );
}

function DraftCard({ d, go, checked, onCheck }: { d: any; go: Go; checked: boolean; onCheck: (v: boolean) => void }) {
  const { state, dispatch } = useStore();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState('');
  const isBill = ['credit_note', 'sales_invoice', 'reissue'].includes(d.type);
  const p = isBill ? party(d.party) : null;
  const t = isBill ? taxLines(d.lines, p) : null;
  const cnDeadline = d.type === 'credit_note' ? creditNoteDeadline(d.original.date) : null;
  const o = orderOf(state, d.orderId);

  return (
    <div id={`draft-${d.id}`} className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          {d.status === 'pending' && <input type="checkbox" checked={checked} onChange={(e) => onCheck(e.target.checked)} className="w-4 h-4 accent-emerald-600" aria-label={`Select ${d.id}`} />}
          <FileText className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-bold text-slate-900">{DRAFT_LABEL[d.type]}</span>
          <span className="font-mono text-[11px] bg-slate-100 border border-slate-200 px-1.5 rounded text-slate-700">{d.id}</span>
          {d.route && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-slate-50 text-slate-700 border-slate-200">{ROUTE_LABEL[d.route]}</span>}
          {d.deadline && d.status === 'pending' && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-amber-50 text-amber-800 border-amber-200">BY {time(d.deadline)}</span>}
        </div>
        <div className="text-[11px] text-slate-500">
          Order <button onClick={() => go('owner', { caseId: d.orderId })} className="font-mono underline cursor-pointer">{d.orderId}</button>
          {o && <> ({STATUS_META[orderStatus(state, o)].label.toLowerCase()})</>} • Drafted {dateTime(d.createdAt)}
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
        <div className="lg:col-span-8 space-y-3">
          {isBill && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div><span className="text-slate-400 block text-[11px]">Party</span><span className="font-semibold text-slate-900">{p.name}</span></div>
                <div><span className="text-slate-400 block text-[11px]">GSTIN</span><span className="font-mono text-slate-900">{p.gstin}</span></div>
                <div><span className="text-slate-400 block text-[11px]">Place of supply</span><span className="font-semibold text-slate-900">{p.state} ({t.intra ? 'CGST + SGST' : 'IGST'})</span></div>
                <div><span className="text-slate-400 block text-[11px]">{d.original ? (d.type === 'credit_note' ? 'Against invoice' : 'Replaces invoice') : 'Basis'}</span><span className="font-mono font-semibold text-slate-900">{d.original ? `${d.original.no}, ${date(d.original.date)}` : 'Quantity shipped'}</span></div>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead><tr className="bg-slate-50 text-slate-500 uppercase tracking-wider"><th className="py-1.5 px-2.5">Item</th><th className="py-1.5 px-2.5">HSN</th><th className="py-1.5 px-2.5 text-right">Qty</th><th className="py-1.5 px-2.5 text-right">Rate</th><th className="py-1.5 px-2.5 text-right">Taxable</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {t.rows.map((r: any, i: number) => {
                      const it = item(r.item);
                      return <tr key={i}><td className="py-1.5 px-2.5 font-medium text-slate-800">{it.name}</td><td className="py-1.5 px-2.5 font-mono">{it.hsn}</td><td className="py-1.5 px-2.5 text-right font-mono">{r.qty} {it.unit}</td><td className="py-1.5 px-2.5 text-right font-mono">{inr(r.rate)}</td><td className="py-1.5 px-2.5 text-right font-mono">{inr(r.value)}</td></tr>;
                    })}
                  </tbody>
                </table>
                <div className="bg-slate-50 border-t border-slate-200 px-2.5 py-2 font-mono text-[11px] space-y-0.5 text-right">
                  <div>Taxable: {inr(t.taxable)}</div>
                  {t.intra ? <><div>CGST: {inr(t.cgst)}</div><div>SGST: {inr(t.sgst)}</div></> : <div>IGST: {inr(t.igst)}</div>}
                  <div className="font-bold text-slate-900 text-xs">Total: {inr(t.total)}</div>
                </div>
              </div>
            </>
          )}
          {d.type === 'stock_journal' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><span className="text-slate-400 block text-[11px]">Item</span><span className="font-semibold text-slate-900">{item(d.item).name}</span></div>
              <div><span className="text-slate-400 block text-[11px]">Quantity</span><span className="font-mono font-semibold text-slate-900">{d.qty} {item(d.item).unit}</span></div>
              <div><span className="text-slate-400 block text-[11px]">From</span><span className="font-semibold text-slate-900">{d.from}</span></div>
              <div><span className="text-slate-400 block text-[11px]">To</span><span className="font-semibold text-slate-900">{d.to}</span></div>
            </div>
          )}
          {d.type === 'physical_stock' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><span className="text-slate-400 block text-[11px]">Item / shelf</span><span className="font-semibold text-slate-900">{item(d.item).name}, {d.godown} / {d.shelf}</span></div>
              <div><span className="text-slate-400 block text-[11px]">Book / counted</span><span className="font-mono font-semibold text-slate-900">{d.book} / {d.counted}</span></div>
              <div><span className="text-slate-400 block text-[11px]">Difference</span><span className={`font-mono font-bold ${d.counted < d.book ? 'text-rose-700' : 'text-emerald-700'}`}>{d.counted - d.book > 0 ? '+' : ''}{d.counted - d.book} ({inr((d.counted - d.book) * item(d.item).rate)})</span></div>
              <div><span className="text-slate-400 block text-[11px]">Cause (in-charge)</span><span className="font-semibold text-slate-900">{ROOT_CAUSES[d.cause]}</span></div>
            </div>
          )}
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700"><span className="font-bold">Narration:</span> {d.narration}</div>
          {d.rejectNote && <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-900"><span className="font-bold">Rejected:</span> {d.rejectNote}</div>}
        </div>

        <div className="lg:col-span-4 space-y-3">
          {d.why && <div className="p-2.5 rounded-lg border bg-slate-50 border-slate-200 text-[11px] text-slate-700"><span className="font-bold">Why this route:</span> {d.why}</div>}
          <div className="p-2.5 rounded-lg border bg-white border-slate-200 text-[11px] text-slate-700">
            <div className="font-bold mb-1">Steps</div>
            <ol className="list-decimal list-inside space-y-0.5">{steps(d).map((s) => <li key={s}>{s}</li>)}</ol>
          </div>
          {cnDeadline && (
            <div className={`p-2.5 rounded-lg border text-[11px] ${daysLeft(cnDeadline) < 60 ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
              <div className="font-bold flex items-center">{daysLeft(cnDeadline) < 60 && <AlertTriangle className="w-3.5 h-3.5 mr-1" />}s.34(2) deadline: {date(cnDeadline)}</div>
              <div>{daysLeft(cnDeadline)} days left, or the annual return date if earlier.</div>
            </div>
          )}

          {d.status === 'pending' && !rejecting && (
            <div className="grid grid-cols-2 gap-2">
              <button id={`btn-approve-${d.id}`} onClick={() => dispatch({ type: 'APPROVE_DRAFT', draftId: d.id, actor: 'Accountant' })} className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-1 cursor-pointer shadow-2xs"><CheckCircle2 className="w-3.5 h-3.5" /><span>Approve</span></button>
              <button id={`btn-reject-${d.id}`} onClick={() => setRejecting(true)} className="py-2.5 bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg font-bold text-xs flex items-center justify-center space-x-1 cursor-pointer"><XCircle className="w-3.5 h-3.5" /><span>Reject</span></button>
            </div>
          )}
          {d.status === 'pending' && rejecting && (
            <div className="space-y-2">
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Why? (required, the owner will see this)" className="w-full text-[11px] p-2 rounded-lg border border-slate-300" />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setRejecting(false)} className="py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold cursor-pointer">Cancel</button>
                <button disabled={!note.trim()} onClick={() => dispatch({ type: 'REJECT_DRAFT', draftId: d.id, note, actor: 'Accountant' })} className="py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold cursor-pointer">Confirm reject</button>
              </div>
            </div>
          )}
          {d.status === 'approved' && (
            <div className="space-y-2">
              <div className="text-[11px] text-emerald-800">Approved by {d.approvedBy}, {dateTime(d.approvedAt)}. Import into Tally; Tally assigns the number.</div>
              <button onClick={() => download(`${d.id}-${d.type}.xml`, voucherXml(d))} className="w-full py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-bold text-xs flex items-center justify-center space-x-1 cursor-pointer"><Download className="w-3.5 h-3.5" /><span>Download Tally XML</span></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
