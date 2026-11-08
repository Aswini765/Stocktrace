import React from 'react';
import { X, BookOpen } from 'lucide-react';

const SOPS: [string, string[]][] = [
  ['SOP 1 · Short at pick', [
    'Tap Short on the pick line. Enter the quantity you actually found and pick one reason.',
    'Carry on with the other lines. The order is held at packing until the short is resolved.',
    'Keep damaged units aside; do not put them back on the shelf.',
  ]],
  ['SOP 2 · Quick search', [
    'Check only the places StockTrace lists. Each one comes from a Tally record (stock summary or stock journal).',
    'If there is no record, do not search the godown by hand: the case goes straight to the owner.',
    'When the search time limit runs out, the case goes to the owner automatically.',
  ]],
  ['SOP 3 · Owner decision and customer message', [
    'Choose one outcome: ship partial, backorder, source elsewhere, or cancel the line. Check the bill impact shown for each.',
    'Edit the drafted message if needed and share it with the customer on WhatsApp before dispatch.',
    'For backorders against an invoice already raised, confirm the billing approach with your CA.',
  ]],
  ['SOP 4 · Paperwork and recount', [
    'The accountant reviews every draft (credit note, invoice, stock journal, physical stock) against its source case before posting.',
    'Credit notes must be declared by 30 November after the financial year of the original invoice, or the annual return date if earlier (CGST s.34(2)).',
    'Every short creates a recount of that shelf. A difference becomes a physical stock draft; a match means the units should still be on the shelf.',
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
