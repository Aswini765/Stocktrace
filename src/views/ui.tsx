import React from 'react';
import { STATUS_META } from '../store.tsx';

export type Go = (v: string, opts?: { caseId?: string | null }) => void;

export function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border whitespace-nowrap ${m.cls}`}>{m.label.toUpperCase()}</span>;
}

export function Panel({ eyebrow, title, right, children, className = '' }: { eyebrow: string; title: string; right?: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4 ${className}`}>
      <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{eyebrow}</span>
          <h2 className="text-sm font-bold text-slate-900 mt-0.5">{title}</h2>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

export function Field({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div>
      <span className="text-slate-400 block text-[11px]">{label}</span>
      <span className="font-semibold text-slate-900">{children}</span>
    </div>
  );
}

export function PageHeader({ title, sub, right }: { title: string; sub: string; right?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">{title}</h1>
        <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
      </div>
      {right}
    </div>
  );
}

export function AuditTrail({ audit }: { audit: any[] }) {
  return (
    <div className="space-y-1.5 text-[11px] font-mono">
      {audit.map((a, i) => (
        <div key={i} className="p-1.5 rounded bg-slate-50 border border-slate-100 text-slate-600 space-y-0.5">
          <div className="flex justify-between font-bold text-slate-800">
            <span>{a.type}</span>
            <span className="text-[10px] text-slate-400">{new Date(a.at).toLocaleTimeString('en-IN', { hour12: false })}</span>
          </div>
          <div className="text-[10px] text-slate-500"><span className="font-semibold text-slate-600">{a.actor}:</span> {a.detail}</div>
        </div>
      ))}
    </div>
  );
}
