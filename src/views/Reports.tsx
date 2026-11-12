import React from 'react';
import { Download } from 'lucide-react';
import { useStore, orderStatus, shortQty, totalFound, item, party, REASONS, OUTCOMES, caseRecount, STATUS_META, ROOT_CAUSES } from '../store.tsx';
import { PageHeader , type Go } from './ui.tsx';
import { inr, date, median } from '../lib/format.ts';
import { taxLines } from '../lib/tax.ts';
import { download } from '../lib/tally.ts';

// One calculation for every number on this page (NFR-3). Everything is computed from
// the cases, drafts and recounts in this demo; nothing here is an assumption or estimate.
export function computeReport(state) {
  const lines = state.orders.reduce((n, o) => n + o.lines.length, 0);
  const cases = state.cases;
  const shortValue = cases.reduce((s, c) => s + shortQty(c) * item(c.item).rate, 0);
  const posted = state.drafts.filter((d) => d.status === 'approved');
  const cns = posted.filter((d) => d.type === 'credit_note');
  const cnValue = cns.reduce((s, d) => s + taxLines(d.lines, party(d.party)).total, 0);
  const writeOffs = posted.filter((d) => d.type === 'stock_journal' || (d.type === 'physical_stock' && d.counted < d.book));
  const writeOffValue = writeOffs.reduce((s, d) => s + (d.type === 'stock_journal' ? d.qty : d.book - d.counted) * item(d.item).rate, 0);
  const decideMins = cases.filter((c) => c.outcome?.at && c.outcome.type !== 'found').map((c) => (c.outcome.at - c.reportedAt) / 60000);
  const foundInSearch = cases.filter((c) => c.outcome?.type === 'found').length;
  const reissues = posted.filter((d) => d.type === 'reissue').length;
  const causes: Record<string, number> = {};
  state.recounts.filter((x) => x.status === 'done' && x.cause).forEach((x) => { causes[x.cause] = (causes[x.cause] || 0) + 1; });
  const backorders = state.backorders.filter((b) => b.status === 'open');
  const byItem: Record<string, number> = {}, byLoc: Record<string, number> = {};
  cases.forEach((c) => {
    byItem[c.item] = (byItem[c.item] || 0) + 1;
    const k = `${c.godown} / ${c.shelf}`;
    byLoc[k] = (byLoc[k] || 0) + 1;
  });
  return {
    lines, cases: cases.length, per1000: lines ? (cases.length / lines) * 1000 : 0, shortValue,
    cnCount: cns.length, cnValue, writeOffValue, medianDecide: median(decideMins), foundInSearch,
    pending: state.drafts.filter((d) => d.status === 'pending').length,
    reissues, backorders, causes: Object.entries(causes).sort((a, b) => b[1] - a[1]),
    topItems: Object.entries(byItem).sort((a, b) => b[1] - a[1]).slice(0, 5),
    topLocs: Object.entries(byLoc).sort((a, b) => b[1] - a[1]).slice(0, 5),
  };
}

function logRows(state) {
  return state.cases.map((c) => {
    const o = state.orders.find((x) => x.id === c.orderId);
    const rc = caseRecount(state, c);
    const approvers = [...new Set(state.drafts.filter((d) => (d.orderId === c.orderId || d.caseId === c.id) && d.status === 'approved').map((d) => d.approvedBy))];
    return {
      case: c.id, date: date(c.reportedAt), order: o.id, customer: party(o.party).name, item: item(c.item).code,
      location: `${c.godown} / ${c.shelf}`, reason: REASONS[c.reason], ordered: c.ordered, found: totalFound(c), short: shortQty(c),
      value: shortQty(c) * item(c.item).rate, outcome: c.outcome ? OUTCOMES[c.outcome.type] : '—',
      recount: rc ? (rc.status === 'open' ? 'Open' : `Counted ${rc.counted} vs book ${rc.book}`) : 'n/a (damaged)',
      approver: approvers.join(', ') || '—', status: STATUS_META[orderStatus(state, o)].label,
    };
  });
}

function Kpi({ label, value, note }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1">
      <div className="text-xs text-slate-500 font-medium">{label}</div>
      <div className="text-2xl font-black font-mono text-slate-900">{value}</div>
      <p className="text-[11px] text-slate-500">{note}</p>
    </div>
  );
}

export default function Reports(_props: { go?: Go }) {
  const { state } = useStore();
  const r = computeReport(state);
  const rows = logRows(state);

  const exportCsv = () => {
    const cols = Object.keys(rows[0] || { case: '' });
    const esc = (v) => `"${String(v).replaceAll('"', '""')}"`;
    const csv = [cols.join(','), ...rows.map((row) => cols.map((k) => esc(row[k])).join(','))].join('\n');
    download(`stocktrace-discrepancy-log-${Date.now()}.csv`, csv, 'text/csv');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 w-full">
      <PageHeader title="Discrepancy Log & Monthly Report" sub="For the owner and the CA: how often orders go short, where, why, and what it cost. Computed from the cases in this demo, not estimated."
        right={<button onClick={exportCsv} className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-semibold text-xs cursor-pointer shadow-2xs transition-colors flex items-center space-x-1.5"><Download className="w-3.5 h-3.5" /><span>Export log (CSV)</span></button>} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Shorts per 1,000 order lines" value={r.per1000.toFixed(0)} note={`${r.cases} shorts across ${r.lines} order lines`} />
        <Kpi label="Value of short lines" value={inr(r.shortValue, 0)} note={`Excl. GST • ${r.foundInSearch} resolved by quick search`} />
        <Kpi label="Credit notes approved" value={inr(r.cnValue, 0)} note={`${r.cnCount} credit note(s) incl. GST • ${r.reissues} invoice(s) re-issued instead • ${r.pending} pending`} />
        <Kpi label="Stock written off" value={inr(r.writeOffValue, 0)} note={`Median report → decision: ${r.medianDecide == null ? '—' : `${Math.round(r.medianDecide)} min`}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {([['Items short most often', r.topItems, (k: string) => `${k} • ${item(k).name}`], ['Locations short most often', r.topLocs, (k: string) => k]] as [string, [string, number][], (k: string) => string][]).map(([title, data, fmt]) => (
          <div key={title} className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">{title}</div>
            {data.map(([k, n]) => (
              <div key={k} className="flex items-center space-x-3 text-xs">
                <span className="w-56 truncate text-slate-700">{fmt(k)}</span>
                <div className="flex-1 bg-slate-100 rounded h-2"><div className="bg-slate-700 h-2 rounded" style={{ width: `${(n / data[0][1]) * 100}%` }} /></div>
                <span className="font-mono font-bold w-6 text-right">{n}</span>
              </div>
            ))}
            {!data.length && <p className="text-xs text-slate-400">No cases yet.</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Why the book was wrong (recount causes)</div>
          {r.causes.map(([k, n]) => (
            <div key={k} className="flex items-center justify-between text-xs"><span className="text-slate-700">{ROOT_CAUSES[k]}</span><span className="font-mono font-bold">{n}</span></div>
          ))}
          {!r.causes.length && <p className="text-xs text-slate-400">No recounts closed yet. Causes come from the godown in-charge after each recount.</p>}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Open backorders ({r.backorders.length})</div>
          {r.backorders.map((b) => (
            <div key={b.caseId} className="flex items-center justify-between text-xs"><span className="text-slate-700"><span className="font-mono">{b.orderId}</span> • {item(b.item).name}</span><span className="font-mono font-bold">{b.qty} {item(b.item).unit}</span></div>
          ))}
          {!r.backorders.length && <p className="text-xs text-slate-400">No units owed to customers.</p>}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 text-xs font-bold text-slate-900 uppercase tracking-wider">Discrepancy log ({rows.length})</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                {['Case', 'Date', 'Order', 'Item', 'Location', 'Reason', 'Ord / found / short', 'Value', 'Outcome', 'Recount', 'Approved by', 'Order status'].map((h) => <th key={h} className="py-2 px-3 whitespace-nowrap">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {rows.map((x) => (
                <tr key={x.case}>
                  <td className="py-2 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">{x.case}</td><td className="py-2 px-3 whitespace-nowrap">{x.date}</td>
                  <td className="py-2 px-3 font-mono whitespace-nowrap">{x.order}</td><td className="py-2 px-3 font-mono whitespace-nowrap">{x.item}</td><td className="py-2 px-3 whitespace-nowrap">{x.location}</td>
                  <td className="py-2 px-3">{x.reason}</td><td className="py-2 px-3 font-mono whitespace-nowrap">{x.ordered} / {x.found} / {x.short}</td><td className="py-2 px-3 font-mono">{inr(x.value, 0)}</td>
                  <td className="py-2 px-3">{x.outcome}</td><td className="py-2 px-3">{x.recount}</td><td className="py-2 px-3">{x.approver}</td><td className="py-2 px-3 whitespace-nowrap">{x.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
