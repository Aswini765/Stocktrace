import React from 'react';
import { X, BookOpen } from 'lucide-react';

const SOPS: [string, string[]][] = [
  ['SOP 1 · Picking on the phone', [
    'Pick the whole order. Tap Short only on a line you cannot fill; enter what you found and one reason.',
    'When done, tap "Order picked: send to packing". Lines not marked short count as fully picked, and stock is deducted then.',
    'Keep damaged units aside; do not put them back on the shelf.',
  ]],
  ['SOP 2 · Quick search', [
    'Check only the places StockTrace lists. Each one comes from a record: today\'s purchase receipts, the stock summary, or a recent stock journal.',
    'If there is no record, do not search the godown by hand: the order goes straight to the owner.',
    'When the search time limit runs out, it goes to the owner automatically.',
  ]],
  ['SOP 3 · Owner: one decision per order', [
    'Decide every short line together: partial, backorder, substitute, source elsewhere or cancel. Record what the customer agreed to.',
    'Check the bill fix shown: invoice what ships (no invoice yet), cancel the e-invoice within 24 hours and re-issue, or a credit note.',
    'Share the drafted message on WhatsApp before dispatch. One message per order.',
  ]],
  ['SOP 4 · Accountant: daily batch', [
    'Review drafts once a day and approve in a batch. Time-bound e-invoice cancellations are listed first.',
    'To cancel an IRN: cancel any active e-way bill first, then the IRN within 24 hours (full cancellation only), then import the new invoice.',
    'Credit notes must be declared by 30 November after the financial year of the invoice, or the annual return date if earlier (CGST s.34(2)).',
    'Tally assigns voucher numbers on import. Rejecting a bill draft returns the order to the owner.',
  ]],
  ['SOP 5 · Godown in-charge: recount', [
    'Recount the shelf after the order is picked, so the count is not mixed up with goods in transit.',
    'Record why the book was wrong. A difference becomes a physical stock draft for the accountant.',
  ]],
];

export default function SopModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-900"><BookOpen className="w-4 h-4 text-amber-600" /><span>Standard Operating Procedures</span></div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 cursor-pointer" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          {SOPS.map(([title, steps]) => (
            <div key={title} className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
              <div className="text-xs font-bold text-slate-900">{title}</div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-700 leading-relaxed">
                {steps.map((s) => <li key={s}>{s}</li>)}
              </ol>
            </div>
          ))}
          <p className="text-[11px] text-slate-400">Demo SOPs. Replace with your own approved procedures.</p>
        </div>
      </div>
    </div>
  );
}
