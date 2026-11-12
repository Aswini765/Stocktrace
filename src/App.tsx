import React, { useState } from 'react';
import { Menu, MapPin, Settings2, BookOpen, X } from 'lucide-react';
import { COMPANY } from './data/seed.ts';
import Home from './views/Home.tsx';
import Picker from './views/Picker.tsx';
import Owner from './views/Owner.tsx';
import { useStore, orderStatus, needsOwnerSignOff } from './store.tsx';
import Accountant from './views/Accountant.tsx';
import Reports from './views/Reports.tsx';
import SopModal from './views/SopModal.tsx';
import SettingsModal from './views/SettingsModal.tsx';
import type { Go } from './views/ui.tsx';

const ROLES = [
  ['home', 'Home'],
  ['picker', 'Picker'],
  ['owner', 'Owner'],
  ['accountant', 'Accountant'],
  ['reports', 'Reports'],
];

function SyncChip() {
  const { sync } = useStore();
  const label = !sync.shared ? 'This device only' : !sync.online ? `Offline • ${sync.pending} waiting` : sync.pending ? `Syncing ${sync.pending}` : 'Shared • live';
  const dot = !sync.shared ? 'bg-slate-400' : !sync.online ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <span id="sync-chip" title={sync.shared ? 'Picker, owner and accountant see the same data' : 'Data is saved in this browser only. Connect Supabase to share across phones.'}
      className="hidden md:inline-flex items-center space-x-1.5 text-slate-600 bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-md">
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span><span>{label}</span>
    </span>
  );
}

// What is waiting for each role, shown on the nav so nobody has to go looking
function useBadges() {
  const { state } = useStore();
  const now = Date.now();
  const owner = state.orders.filter((o: any) => ['AWAITING_OWNER', 'MESSAGE_PENDING', 'AWAITING_STOCK'].includes(orderStatus(state, o))).length
    + state.drafts.filter((d: any) => d.status === 'pending' && needsOwnerSignOff(d)).length;
  const urgent = state.drafts.filter((d: any) => d.status === 'pending' && ((d.deadline && d.deadline - now < 6 * 3600000) || ['sales_invoice', 'reissue'].includes(d.type))).length;
  const pending = state.drafts.filter((d: any) => d.status === 'pending' && !needsOwnerSignOff(d)).length;
  return { owner: owner ? { n: owner, cls: 'bg-amber-500' } : null, accountant: urgent ? { n: urgent, cls: 'bg-rose-600' } : pending ? { n: pending, cls: 'bg-slate-400' } : null } as Record<string, { n: number; cls: string } | null>;
}

export default function App() {
  const [view, setView] = useState('home');
  const [ownerCase, setOwnerCase] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sopOpen, setSopOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [nav, setNav] = useState(0); // a nav click always reopens the role's main screen
  const badges = useBadges();

  const go: Go = (v, opts = {}) => {
    setView(v);
    setOwnerCase(opts.caseId ?? null);
    setNav((n) => n + 1);
    setMobileOpen(false);
  };

  return (
    <div className="flex h-screen w-full max-w-full overflow-hidden bg-slate-50 text-slate-900 font-sans antialiased">
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto overflow-x-hidden">
        <header id="main-topbar" className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 shadow-2xs sticky top-0">
          <div className="flex items-center space-x-3 shrink-0">
            <button id="btn-toggle-mobile-menu" onClick={() => setMobileOpen((o) => !o)} className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 sm:hidden cursor-pointer" aria-label="Open Navigation Menu">
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <div className="cursor-pointer flex items-center space-x-2.5 select-none" onClick={() => go('home')}>
              <div className="w-7 h-7 rounded-md bg-slate-900 text-white font-bold text-xs flex items-center justify-center tracking-tight">ST</div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-slate-950 leading-tight">StockTrace</span>
                <span className="text-[11px] font-medium text-slate-500 leading-none">Short-Supply Resolution</span>
              </div>
            </div>
          </div>
          <nav id="role-switcher-nav" className="hidden sm:flex items-center space-x-1" aria-label="Application Role Switcher">
            {ROLES.map(([id, label]) => (
              <button key={id} id={`role-btn-${id}`} onClick={() => go(id)}
                className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${view === id ? 'text-slate-950 bg-slate-100 font-bold' : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'}`}>
                {label}
                {badges[id] && <span className={`ml-1.5 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[10px] font-bold text-white ${badges[id]!.cls}`}>{badges[id]!.n}</span>}
              </button>
            ))}
          </nav>
          <div className="flex items-center space-x-3 shrink-0 text-xs">
            <div className="hidden lg:flex items-center space-x-1.5 text-slate-600 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-md">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span className="font-medium text-slate-800">{COMPANY.name}, {COMPANY.city}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-normal">Demo Environment</span>
            </div>
            <SyncChip />
            {view !== 'picker' && <button id="btn-open-settings" onClick={() => setSettingsOpen(true)} className="text-slate-600 hover:text-slate-950 font-medium px-2 py-1 rounded hover:bg-slate-100 transition-colors cursor-pointer hidden md:inline-flex items-center space-x-1">
              <Settings2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Settings</span>
            </button>}
            <button id="btn-open-sop-guidance" onClick={() => setSopOpen(true)} className="text-slate-700 hover:text-slate-950 font-medium bg-slate-100 hover:bg-slate-200/80 border border-slate-200 px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center space-x-1.5" title="Standard Operating Procedures (SOP)">
              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              <span>SOP Guidance</span>
            </button>
          </div>
        </header>

        {mobileOpen && (
          <div className="sm:hidden bg-white border-b border-slate-200 px-4 py-2 space-y-1 shadow-xs z-20">
            {ROLES.map(([id, label]) => (
              <button key={id} onClick={() => go(id)} className={`block w-full text-left px-3 py-2 text-xs font-semibold rounded-md cursor-pointer ${view === id ? 'text-slate-950 bg-slate-100 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>{label}{badges[id] && <span className={`ml-1.5 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[10px] font-bold text-white ${badges[id]!.cls}`}>{badges[id]!.n}</span>}</button>
            ))}
            {view !== 'picker' && <button onClick={() => { setSettingsOpen(true); setMobileOpen(false); }} className="block w-full text-left px-3 py-2 text-xs font-semibold rounded-md text-slate-600 hover:bg-slate-50 cursor-pointer">Settings</button>}
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-full overflow-x-hidden">
          {view === 'home' && <Home go={go} />}
          {view === 'picker' && <Picker go={go} key={nav} />}
          {view === 'owner' && <Owner go={go} initialCase={ownerCase} key={`${ownerCase || 'list'}-${nav}`} />}
          {view === 'accountant' && <Accountant go={go} key={nav} />}
          {view === 'reports' && <Reports go={go} />}
        </main>
      </div>
      {sopOpen && <SopModal onClose={() => setSopOpen(false)} />}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
