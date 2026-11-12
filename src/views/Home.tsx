import type { Go } from './ui.tsx';
import React from 'react';
import { Smartphone, Scale, FileCheck2, ArrowRight } from 'lucide-react';
import { useStore, orderStatus, needsOwnerSignOff, dispatchBlock } from '../store.tsx';
import { COMPANY } from '../data/seed.ts';

function RoleCard({ id, tag, tagCls, hover, icon: Icon, title, body, chips, cta, onClick }) {
  return (
    <div id={`role-card-${id}`} onClick={onClick} className={`group bg-white rounded-xl border border-slate-200 ${hover} p-5 shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-4`}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${tagCls}`}>{tag}</span>
          <Icon className="w-4 h-4 text-slate-400 group-hover:text-slate-800 transition-colors" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 transition-colors">{title}</h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{body}</p>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-medium text-slate-600">
          {chips.map((c) => <span key={c} className="bg-slate-100 px-2 py-0.5 rounded">{c}</span>)}
        </div>
      </div>
      <button className={`w-full py-2 px-3 bg-slate-900 ${id === 'picker' ? 'group-hover:bg-teal-700' : 'group-hover:bg-slate-800'} text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer`}>
        <span>{cta}</span><ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function Stat({ label, value, note, tone = 'text-slate-950' }) {
  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={`text-2xl font-bold font-mono mt-1 ${tone}`}>{value}</div>
      <div className="text-[11px] text-slate-400 mt-0.5">{note}</div>
    </div>
  );
}

export default function Home({ go }: { go: Go }) {
  const { state } = useStore();
  const statuses = state.orders.filter((o: any) => state.cases.some((c: any) => c.orderId === o.id)).map((o: any) => orderStatus(state, o));
  const open = statuses.filter((s: string) => s !== 'CLOSED').length;
  const owner = statuses.filter((s: string) => ['AWAITING_OWNER', 'MESSAGE_PENDING', 'AWAITING_STOCK'].includes(s)).length + state.drafts.filter((d: any) => d.status === 'pending' && needsOwnerSignOff(d)).length;
  const held = state.orders.filter((o: any) => { const b = dispatchBlock(state, o); return b && b !== 'dispatched' && b !== 'picking'; }).length;
  const drafts = state.drafts.filter((d) => d.status === 'pending').length;
  const recounts = state.recounts.filter((r: any) => r.status !== 'done').length;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      <div className="space-y-2 pt-2 border-b border-slate-200/80 pb-6">
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
          <span>Short-Supply Resolution for Tally users</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">Resolve short dispatches, from the godown to Tally.</h1>
        <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
          When an order can't go out in full: a quick search from your own Tally records, one decision from the owner, ready-to-approve credit notes and stock entries, a customer message, and a recount so it doesn't happen again.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Choose your workflow</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RoleCard id="picker" tag="Picker" tagCls="text-teal-800 bg-teal-50 border border-teal-200/60" hover="hover:border-teal-600" icon={Smartphone}
            title="“Tell me where to look.”" body="Pick orders on the phone. Report a short in two taps or by voice, check only places with a record behind them, and do recounts."
            chips={['Voice + tap', 'English · हिंदी · ಕನ್ನಡ', 'Recounts']} cta="Open Picker" onClick={() => go('picker')} />
          <RoleCard id="owner" tag="Owner" tagCls="text-slate-700 bg-slate-100" hover="hover:border-slate-800" icon={Scale}
            title="“What do I do with this order?”" body="See every short order with its value and deadline. Choose partial, backorder, source elsewhere or cancel, and message the customer."
            chips={['Decision queue', 'Bill impact', 'WhatsApp']} cta="Open Owner" onClick={() => go('owner')} />
          <RoleCard id="accountant" tag="Accountant" tagCls="text-slate-700 bg-slate-100" hover="hover:border-slate-800" icon={FileCheck2}
            title="“Are the books right?”" body="Review draft credit notes, invoices and stock entries with their source documents. Nothing reaches Tally until you approve it."
            chips={['Credit notes', 'Stock entries', 'Tally XML']} cta="Open Accountant" onClick={() => go('accountant')} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Right now</h2>
          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">LIVE · DEMO DATA</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Orders with a short" value={open} note={`still open • ${held} held at packing`} />
          <Stat label="Waiting for owner" value={owner} note="Decide, message or sign off a loss" tone={owner ? 'text-amber-700' : 'text-slate-950'} />
          <Stat label="Drafts to approve" value={drafts} note="Accountant review before Tally" tone={drafts ? 'text-violet-700' : 'text-slate-950'} />
          <Stat label="Recounts open" value={recounts} note="Shelves to count" />
        </div>
      </div>

      <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="font-semibold text-slate-700">Trust Principle: “StockTrace drafts. People decide and approve.”</div>
        <div className="text-slate-400 text-[11px]">{COMPANY.name}, {COMPANY.city} • Demo environment • Simulated Tally data</div>
      </div>
    </div>
  );
}
