import React from 'react';
import { X, Settings2 } from 'lucide-react';
import { useStore, REASONS } from '../store.tsx';
import { LANGS } from '../i18n.ts';

export default function SettingsModal({ onClose }) {
  const { state, dispatch, sync } = useStore();
  const s = state.settings;
  const set = (patch) => dispatch({ type: 'UPDATE_SETTINGS', settings: patch });
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-900"><Settings2 className="w-4 h-4 text-slate-500" /><span>Owner settings</span></div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 cursor-pointer" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
            <div className="flex justify-between text-slate-700 font-semibold"><span>Quick search time limit</span><span className="font-mono font-bold text-slate-900">{s.searchMinutes} min</span></div>
            <input id="setting-search-minutes" type="range" min="1" max="30" step="1" value={s.searchMinutes} onChange={(e) => set({ searchMinutes: Number(e.target.value) })} className="w-full accent-slate-900 cursor-pointer" />
            <div className="text-[10px] text-slate-400">After this, an unresolved search goes to the owner. Applies to new reports.</div>
          </div>
          <label className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between cursor-pointer">
            <div>
              <div className="text-slate-700 font-semibold">E-invoicing applies to this business</div>
              <div className="text-[10px] text-slate-400">Above ₹5 crore turnover. Decides the bill fix: cancel the IRN within 24 hours and re-issue, otherwise a credit note. Off: cancel and re-issue (confirm with your CA).</div>
            </div>
            <input type="checkbox" checked={s.eInvoicing} onChange={(e) => set({ eInvoicing: e.target.checked })} className="accent-slate-900 w-4 h-4" />
          </label>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
            <div className="text-slate-700 font-semibold">Picker languages</div>
            <div className="flex gap-3">
              {Object.entries(LANGS).map(([k, v]) => (
                <label key={k} className="flex items-center space-x-1.5 cursor-pointer">
                  <input type="checkbox" disabled={k === 'en'} checked={s.languages[k]} onChange={(e) => set({ languages: { ...s.languages, [k]: e.target.checked } })} className="accent-slate-900" />
                  <span>{v.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
            <div className="text-slate-700 font-semibold">Short reasons</div>
            <div className="flex flex-wrap gap-1.5">{Object.values(REASONS).map((r) => <span key={r} className="bg-white border border-slate-200 px-2 py-0.5 rounded">{r}</span>)}</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
            <div className="text-slate-700 font-semibold">Shared data</div>
            <div className="text-[11px] text-slate-600">{sync.shared ? `Connected: every phone and laptop sees the same orders.${sync.pending ? ` ${sync.pending} change(s) waiting to sync.` : ''}` : 'Not connected: data stays in this browser. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY at build time to share it.'}</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
            <div className="text-slate-700 font-semibold">Approval rules (fixed)</div>
            <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
              <li>Pickers report shorts and finish the pick; the godown in-charge recounts and records the cause. Neither decides or approves.</li>
              <li>Only the owner decides an order (once for all its short lines) and sends the customer message.</li>
              <li>Only the accountant approves drafts; Tally assigns every voucher number.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
