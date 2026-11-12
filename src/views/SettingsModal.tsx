import React, { useState } from 'react';
import { X, Settings2, RotateCcw } from 'lucide-react';
import { inr, dateTime } from '../lib/format.ts';
import { useStore, REASONS } from '../store.tsx';
import { LANGS } from '../i18n.ts';

export default function SettingsModal({ onClose }) {
  const { state, dispatch, sync } = useStore();
  const s = state.settings;
  const set = (patch) => dispatch({ type: 'UPDATE_SETTINGS', settings: patch, actor: 'Owner' });
  const [limit, setLimit] = useState(String(s.writeOffLimit));
  const [resetting, setResetting] = useState(false);
  const log = (state.settingsLog || []).slice(-3).reverse();
  const fmt = (k, v) => (k === 'eInvoicing' ? `e-invoicing ${v ? 'on' : 'off'}` : k === 'searchMinutes' ? `search limit ${v} min` : k === 'writeOffLimit' ? `sign-off limit ${inr(v, 0)}` : k === 'languages' ? 'picker languages' : k);
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
            <div className="flex justify-between items-center text-slate-700 font-semibold"><span>Stock loss you sign off personally</span>
              <span className="flex items-center gap-1">above ₹<input id="setting-writeoff" type="number" min="0" step="500" value={limit} onChange={(e) => setLimit(e.target.value)} onBlur={() => Number(limit) >= 0 && set({ writeOffLimit: Math.floor(Number(limit)) })} className="w-20 p-1 rounded border border-slate-300 font-mono text-right" /></span>
            </div>
            <div className="text-[10px] text-slate-400">Recount losses above this value wait for your sign-off before the accountant can write them off.</div>
          </div>
          <label className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between cursor-pointer">
            <div>
              <div className="text-slate-700 font-semibold">E-invoicing applies to this business</div>
              <div className="text-[10px] text-slate-400">Above ₹5 crore turnover. Decides the bill fix for new decisions: cancel the IRN within 24 hours and re-issue, otherwise a credit note. Drafts already made keep their route.</div>
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
              <li>Only the accountant approves drafts; Tally assigns every voucher number. Losses above your limit need your sign-off first.</li>
              <li>The truck waits for a new invoice; stock journals are imported before counts of the same shelf.</li>
            </ul>
          </div>
          {log.length > 0 && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <div className="text-slate-700 font-semibold">Recent changes</div>
              {log.map((l, i) => <div key={i} className="text-[11px] text-slate-600">{dateTime(l.at)} • {l.actor}: {Object.entries(l.changes).map(([k, v]) => fmt(k, v)).join(', ')}</div>)}
            </div>
          )}
          <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 space-y-2">
            {!resetting ? (
              <button id="btn-reset-demo" onClick={() => setResetting(true)} className="text-rose-800 font-semibold flex items-center cursor-pointer"><RotateCcw className="w-3.5 h-3.5 mr-1" />Reset demo data</button>
            ) : (
              <div className="space-y-2">
                <div className="text-rose-900 font-semibold">Erase every order, decision and draft{sync.shared ? ' for everyone using this workspace' : ' on this device'} and start the demo again?</div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setResetting(false)} className="py-2 bg-white border border-slate-300 rounded-lg font-bold cursor-pointer">Keep data</button>
                  <button id="btn-reset-confirm" onClick={() => { dispatch({ type: 'RESET', actor: 'Owner' }); setResetting(false); onClose(); }} className="py-2 bg-rose-700 text-white rounded-lg font-bold cursor-pointer">Yes, reset</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
