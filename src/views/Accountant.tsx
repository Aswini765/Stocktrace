import React, { useState } from 'react';
import { CheckCircle2, XCircle, Download, FileText, AlertTriangle } from 'lucide-react';
import { useStore, item, party, DRAFT_LABEL, caseStatus } from '../store.tsx';
import { PageHeader , type Go } from './ui.tsx';
import { inr, dateTime, date } from '../lib/format.ts';
import { taxLines, creditNoteDeadline, daysLeft } from '../lib/tax.ts';
import { voucherXml, download } from '../lib/tally.ts';

export default function Accountant({ go }: { go: Go }) {
  const { state } = useStore();
  const [tab, setTab] = useState('pending');
  const counts = { pending: 0, posted: 0, rejected: 0 };
  state.drafts.forEach((d) => { counts[d.status]++; });
  const list = state.drafts.filter((d) => d.status === tab).sort((a, b) => b.createdAt - a.createdAt);
  const posted = state.drafts.filter((d) => d.status === 'posted');

  const exportAll = () => {
    const xml = posted.map((d) => voucherXml(d)).join('\n');
    download(`stocktrace-tally-vouchers-${Date.now()}.xml`, xml);
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto w-full pb-12">
      <PageHeader title="Accountant Review" sub="Draft vouchers with their source documents. Nothing reaches Tally until you approve it."
        right={posted.length > 0 && (
          <button onClick={exportAll} className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md font-semibold text-xs cursor-pointer shadow-2xs transition-colors flex items-center space-x-1.5">
            <Download className="w-3.5 h-3.5" /><span>Export posted vouchers (Tally XML)</span>
          </button>
        )} />

      <div className="bg-slate-50 border-l-4 border-slate-700 p-3.5 rounded-r-lg text-xs text-slate-600 space-y-1">
        <div className="text-slate-900 font-bold">TALLY POSTING POLICY</div>
        <p className="leading-relaxed">In this demo, "Approve and post" records the voucher in StockTrace and makes Tally XML available for import. Ledger names in the XML (Sales, Output CGST/SGST/IGST) must match your company's ledgers: import into a test company first. Item rates and GST rates are demo values.</p>
      </div>

      <div className="inline-flex rounded-lg bg-slate-100 border border-slate-200 p-1 text-xs font-semibold">
        {['pending', 'posted', 'rejected'].map((k) => (
          <button key={k} id={`acct-tab-${k}`} onClick={() => setTab(k)} className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${tab === k ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}>
            {k === 'pending' ? 'To approve' : k[0].toUpperCase() + k.slice(1)} ({counts[k]})
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {list.map((d) => <DraftCard key={d.id} d={d} go={go} />)}
        {!list.length && <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400">Nothing here.</div>}
      </div>
    </div>
  );
}

function DraftCard({ d, go }) {
  const { state, dispatch } = useStore();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState('');
  const c = state.cases.find((x) => x.id === d.caseId);
  const isBill = d.type === 'credit_note' || d.type === 'sales_invoice';
  const p = isBill ? party(d.party) : null;
  const t = isBill ? taxLines(d.lines, p) : null;
  const deadline = d.type === 'credit_note' ? creditNoteDeadline(d.original.date) : null;
  const dl = deadline ? daysLeft(deadline) : null;

  return (
    <div id={`draft-${d.id}`} className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-bold text-slate-900">{DRAFT_LABEL[d.type]}</span>
          <span className="font-mono text-[11px] bg-slate-100 border border-slate-200 px-1.5 rounded text-slate-700">{d.voucherNo || d.id}</span>
          {d.status === 'posted' && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-emerald-50 text-emerald-800 border-emerald-200">POSTED</span>}
          {d.status === 'rejected' && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-rose-50 text-rose-800 border-rose-200">REJECTED</span>}
        </div>
        <div className="text-[11px] text-slate-500">
          Source: <button onClick={() => go('owner', { caseId: d.caseId })} className="font-mono underline cursor-pointer">{(d.caseIds || [d.caseId]).join(', ')}</button>
          {d.orderId && <> • Order <span className="font-mono">{d.orderId}</span></>}
          {d.recountId && <> • Recount <span className="font-mono">{d.recountId}</span></>}
          {' '}• Drafted {dateTime(d.createdAt)}
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
                {d.type === 'credit_note'
                  ? <div><span className="text-slate-400 block text-[11px]">Against invoice</span><span className="font-mono font-semibold text-slate-900">{d.original.no}, {date(d.original.date)}</span></div>
                  : <div><span className="text-slate-400 block text-[11px]">Basis</span><span className="font-semibold text-slate-900">Quantity shipped</span></div>}
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead><tr className="bg-slate-50 text-slate-500 uppercase tracking-wider"><th className="py-1.5 px-2.5">Item</th><th className="py-1.5 px-2.5">HSN</th><th className="py-1.5 px-2.5 text-right">Qty</th><th className="py-1.5 px-2.5 text-right">Rate</th><th className="py-1.5 px-2.5 text-right">Taxable</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {t.rows.map((r, i) => {
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
              {d.type === 'credit_note' && <div className="text-[11px] text-slate-600">Reason: <strong>{d.reasonCode}</strong> (CGST s.34)</div>}
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
              <div><span className="text-slate-400 block text-[11px]">Item</span><span className="font-semibold text-slate-900">{item(d.item).name}</span></div>
              <div><span className="text-slate-400 block text-[11px]">Location</span><span className="font-semibold text-slate-900">{d.godown} / {d.shelf}</span></div>
              <div><span className="text-slate-400 block text-[11px]">Book / counted</span><span className="font-mono font-semibold text-slate-900">{d.book} / {d.counted}</span></div>
              <div><span className="text-slate-400 block text-[11px]">Difference</span><span className={`font-mono font-bold ${d.counted < d.book ? 'text-rose-700' : 'text-emerald-700'}`}>{d.counted - d.book > 0 ? '+' : ''}{d.counted - d.book} ({inr((d.counted - d.book) * item(d.item).rate)})</span></div>
            </div>
          )}
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700"><span className="font-bold">Narration:</span> {d.narration}</div>
          {d.rejectNote && <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-900"><span className="font-bold">Rejected:</span> {d.rejectNote}</div>}
        </div>

        <div className="lg:col-span-4 space-y-3">
          {deadline && (
            <div className={`p-2.5 rounded-lg border text-[11px] ${dl < 60 ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
              <div className="font-bold flex items-center">{dl < 60 && <AlertTriangle className="w-3.5 h-3.5 mr-1" />}s.34(2) deadline: {date(deadline)}</div>
              <div>{dl} days left, or the annual return date if earlier.</div>
            </div>
          )}
          {isBill && state.settings.eInvoicing && (
            <div className="p-2.5 rounded-lg border bg-sky-50 border-sky-200 text-sky-900 text-[11px]">E-invoicing is on: generate the IRN for this {DRAFT_LABEL[d.type].toLowerCase()} after posting (Rule 48(4)).</div>
          )}
          {c && <div className="text-[11px] text-slate-500">Case status: <span className="font-semibold text-slate-700">{caseStatus(state, c).replaceAll('_', ' ').toLowerCase()}</span></div>}

          {d.status === 'pending' && !rejecting && (
            <div className="grid grid-cols-2 gap-2">
              <button id={`btn-approve-${d.id}`} onClick={() => dispatch({ type: 'APPROVE_DRAFT', draftId: d.id, actor: 'Accountant' })} className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-1 cursor-pointer shadow-2xs"><CheckCircle2 className="w-3.5 h-3.5" /><span>Approve and post</span></button>
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
          {d.status === 'posted' && (
            <div className="space-y-2">
              <div className="text-[11px] text-emerald-800">Posted as <span className="font-mono font-bold">{d.voucherNo}</span> by {d.approvedBy}, {dateTime(d.postedAt)}</div>
              <button onClick={() => download(`${d.voucherNo.replaceAll('/', '-')}.xml`, voucherXml(d))} className="w-full py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-bold text-xs flex items-center justify-center space-x-1 cursor-pointer"><Download className="w-3.5 h-3.5" /><span>Download Tally XML</span></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
