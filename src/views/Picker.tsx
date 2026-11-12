import type { Go } from './ui.tsx';
import React, { useEffect, useMemo, useState } from 'react';
import { Volume2, ArrowRight, ChevronLeft, Check, Mic, MapPin, WifiOff, Minus, Plus, AlertTriangle, PackageCheck, ClipboardList, Truck, Undo2, ChevronDown, ChevronUp, PackagePlus } from 'lucide-react';
import {
  useStore, item, party, shortQty, totalFound, lineCase, orderState, dispatchBlock, openRecountOnShelf, shippedLines, orderCases,
} from '../store.tsx';
import { LOCATIONS } from '../data/seed.ts';
import { t, LANGS, parseVoice, unitWord, fill } from '../i18n.ts';
import { mins, time, date } from '../lib/format.ts';

function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(id); }, [ms]);
  return now;
}

function speak(text: string, lang: string) {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = (LANGS as any)[lang].speech;
    window.speechSynthesis.speak(u);
  } catch { /* speech not available: taps always work */ }
}

// "today 17:00" / "tomorrow 11:00" in the picker's language
function whenL(ms: number, lang: string, now = Date.now()) {
  const d0 = new Date(now); d0.setHours(0, 0, 0, 0);
  const days = Math.floor((ms - d0.getTime()) / 86400000);
  const day = days === 0 ? t('today', lang) : days === 1 ? t('tomorrow', lang) : date(ms);
  return `${day} ${time(ms)}`;
}
const qtyU = (q: number, code: string, lang: string) => `${q} ${unitWord(item(code).unit, q, lang)}`;

function Bubble({ children, tone = 'bot' }: { children: React.ReactNode; tone?: string }) {
  if (tone === 'bot') {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-1.5 shadow-2xs">
        <div className="flex items-center space-x-2 text-xs font-bold text-emerald-900">
          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">✓</div>
          <span>StockTrace</span>
        </div>
        <p className="text-sm font-semibold text-slate-900 leading-relaxed">{children}</p>
      </div>
    );
  }
  const cls = tone === 'warn' ? 'bg-amber-50 border-amber-200 text-amber-950' : tone === 'stop' ? 'bg-rose-50 border-rose-200 text-rose-950' : tone === 'go' ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-800';
  return <div className={`rounded-2xl p-3.5 text-xs font-semibold leading-relaxed border shadow-2xs ${cls}`}>{children}</div>;
}

const BADGE: Record<string, [string, string]> = {
  PICKING: ['picking', 'bg-slate-100 text-slate-700 border-slate-200'],
  HELD: ['held', 'bg-amber-50 text-amber-800 border-amber-200'],
  ADD: ['addToOrder', 'bg-sky-50 text-sky-800 border-sky-200'],
  READY: ['ready', 'bg-emerald-50 text-emerald-800 border-emerald-200'],
  DONE: ['dispatched', 'bg-slate-100 text-slate-500 border-slate-200'],
};
function pickerBadge(state: any, o: any) {
  const b = dispatchBlock(state, o);
  if (b === 'dispatched') return 'DONE';
  if (b === 'picking') return 'PICKING';
  if (b === 'extra_pick') return 'ADD';
  return b ? 'HELD' : 'READY';
}

const savedLang = () => { try { return localStorage.getItem('stocktrace-lang') || 'en'; } catch { return 'en'; } };

export default function Picker(_props: { go: Go }) {
  const { state, sync } = useStore();
  const [lang, setLangState] = useState(savedLang);
  const setLang = (l: string) => { setLangState(l); try { localStorage.setItem('stocktrace-lang', l); } catch { /* ignore */ } };
  const [role, setRole] = useState<'picker' | 'incharge'>('picker');
  const [screen, setScreen] = useState<{ name: string; orderId?: string; lineIdx?: number; caseId?: string }>({ name: 'orders' });
  const now = useNow();

  const enabledLangs = Object.keys(LANGS).filter((l) => state.settings.languages[l]);
  useEffect(() => { if (!state.settings.languages[lang]) setLang('en'); }, [state.settings.languages, lang]);

  // today's work: anything not yet dispatched, plus what left in the last 12 hours
  const orders = state.orders
    .filter((o: any) => { const d = orderState(state, o.id).dispatchedAt; return !d || now - d < 12 * 3600000; })
    .sort((a: any, b: any) => Number(Boolean(orderState(state, a.id).dispatchedAt)) - Number(Boolean(orderState(state, b.id).dispatchedAt)) || a.dispatchBy - b.dispatchBy);
  const openRecounts = state.recounts.filter((r: any) => r.status !== 'done');

  const prompt = useMemo(() => {
    if (role === 'incharge') return t('countGood', lang);
    if (screen.name === 'short') return `${t('howMany', lang)} ${t('what', lang)}`;
    if (screen.name === 'search') return t('checkThese', lang);
    return t('defaultPicked', lang);
  }, [role, screen.name, lang]);

  const subtitle = role === 'incharge' ? t('recounts', lang) : screen.orderId || t('orders', lang);

  return (
    <div className="w-full flex flex-col items-center justify-start pb-12 px-2 sm:px-4">
      <div id="picker-mobile-container" className="w-full max-w-[420px] bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden flex flex-col min-h-[560px]">
        <div className="bg-emerald-800 text-white px-4 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-600 border border-emerald-400/40 flex items-center justify-center font-bold text-xs text-white">ST</div>
            <div>
              <div className="text-xs font-bold text-white tracking-wide">StockTrace Assistant</div>
              <div className="text-[11px] text-emerald-200">{subtitle}</div>
            </div>
          </div>
          <button id="picker-btn-play-voice" onClick={() => speak(prompt, lang)} className="p-2 rounded-full transition-colors cursor-pointer bg-emerald-700/60 hover:bg-emerald-700 text-emerald-100" title="Read aloud" aria-label="Read aloud">
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
        <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between text-xs gap-2">
          <div className="inline-flex rounded-lg bg-white border border-slate-200 p-0.5 shadow-2xs">
            {([['picker', t('rolePicker', lang)], ['incharge', `${t('roleIncharge', lang)}${openRecounts.length ? ` (${openRecounts.length})` : ''}`]] as const).map(([id, label]) => (
              <button key={id} id={`picker-role-${id}`} onClick={() => { setRole(id); setScreen({ name: 'orders' }); }}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${role === id ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}>{label}</button>
            ))}
          </div>
          <div className="inline-flex rounded-lg bg-white border border-slate-200 p-0.5 shadow-2xs">
            {enabledLangs.map((l) => (
              <button key={l} id={`picker-lang-${l}`} onClick={() => setLang(l)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${lang === l ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}>{(LANGS as any)[l].label}</button>
            ))}
          </div>
        </div>

        {(!sync.online || sync.pending > 0) && (
          <div className="bg-slate-800 text-white text-[11px] font-medium px-3 py-1.5 flex items-center space-x-1.5">
            <WifiOff className="w-3.5 h-3.5" /><span>{t('offline', lang)}{sync.pending ? ` (${sync.pending})` : ''}</span>
          </div>
        )}

        <div className="p-4 sm:p-5 space-y-4 bg-white flex-1 flex flex-col">
          {role === 'incharge' && <Recounts lang={lang} />}
          {role === 'picker' && screen.name === 'orders' && <OrderList lang={lang} orders={orders} now={now} onOpen={(id) => setScreen({ name: 'order', orderId: id })} />}
          {role === 'picker' && screen.name === 'order' && (
            <OrderDetail lang={lang} orderId={screen.orderId!} now={now}
              onBack={() => setScreen({ name: 'orders' })}
              onShort={(lineIdx) => setScreen({ name: 'short', orderId: screen.orderId, lineIdx })}
              onSearch={(caseId) => setScreen({ name: 'search', orderId: screen.orderId, caseId })} />
          )}
          {role === 'picker' && screen.name === 'short' && (
            <ShortForm lang={lang} orderId={screen.orderId!} lineIdx={screen.lineIdx!}
              onCancel={() => setScreen({ name: 'order', orderId: screen.orderId })}
              onSent={() => setScreen({ name: 'search', orderId: screen.orderId, lineIdx: screen.lineIdx })} />
          )}
          {role === 'picker' && screen.name === 'search' && (
            <Search lang={lang} orderId={screen.orderId!} lineIdx={screen.lineIdx} caseId={screen.caseId} now={now}
              onBack={() => setScreen({ name: 'order', orderId: screen.orderId })} />
          )}
          <div className="text-center pt-2 mt-auto">
            <span className="text-[11px] text-slate-400">{sync.shared ? 'Shared with owner and accountant' : 'Demo: data on this device only'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderList({ lang, orders, now, onOpen }: { lang: string; orders: any[]; now: number; onOpen: (id: string) => void }) {
  const { state } = useStore();
  return (
    <div className="space-y-3">
      <Bubble>{t('defaultPicked', lang)}</Bubble>
      <div className="space-y-2">
        {orders.map((o) => {
          const b = pickerBadge(state, o);
          const shorts = orderCases(state, o.id).filter((c: any) => shortQty(c) > 0).length;
          return (
            <button key={o.id} id={`picker-order-${o.id}`} onClick={() => onOpen(o.id)}
              className={`w-full text-left bg-white hover:bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-2xs cursor-pointer transition-colors flex items-center justify-between ${b === 'DONE' ? 'opacity-60' : ''}`}>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-slate-900">{o.id}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${BADGE[b][1]}`}>{t(BADGE[b][0], lang)}</span>
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">{party(o.party).name} • {o.lines.length} {t('lines', lang)}{shorts ? ` • ${shorts} ${t('wasShort', lang).toLowerCase()}` : ''}</div>
                <div className={`text-[11px] mt-0.5 font-semibold ${o.dispatchBy - now < 2 * 3600000 && b !== 'DONE' ? 'text-amber-700' : 'text-slate-500'}`}><Truck className="w-3 h-3 inline mr-1" />{whenL(o.dispatchBy, lang, now)}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OrderDetail({ lang, orderId, now, onBack, onShort, onSearch }: { lang: string; orderId: string; now: number; onBack: () => void; onShort: (i: number) => void; onSearch: (id: string) => void }) {
  const { state, dispatch } = useStore();
  const [confirming, setConfirming] = useState(false);
  const o = state.orders.find((x: any) => x.id === orderId);
  const os = orderState(state, o.id);
  const b = pickerBadge(state, o);
  const block = dispatchBlock(state, o);
  const shortLines = o.lines.filter((_: any, i: number) => lineCase(state, o.id, i)).length;
  const pending = (os.extraPicks || []).filter((p: any) => !p.done);
  // what goes in the box: shipped quantities after the owner's decision, plus substitutes / bought-in units
  const packList = os.picked && (block === null || block === 'dispatched' || block === 'invoice' || block === 'extra_pick')
    ? Object.entries(shippedLines(state, o, os.decision?.lines || {})).filter(([, q]) => q > 0) : [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center cursor-pointer"><ChevronLeft className="w-3.5 h-3.5" />{t('back', lang)}</button>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${BADGE[b][1]}`}>{t(BADGE[b][0], lang)}</span>
      </div>
      <div className="text-xs text-slate-600"><span className="font-bold text-slate-900">{party(o.party).name}</span> • <Truck className="w-3 h-3 inline" /> {whenL(o.dispatchBy, lang, now)}</div>
      {o.lines.map((l: any, i: number) => {
        const it = item(l.item);
        const c = lineCase(state, o.id, i);
        const flag = !c && !os.picked && openRecountOnShelf(state, l.item, l.godown, l.shelf);
        const canUndo = c && !os.picked && !c.outcome && c.extraFound === 0;
        return (
          <div key={i} id={`picker-line-${o.id}-${i}`} className="border border-slate-200 rounded-xl p-3 space-y-2.5 shadow-2xs">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-bold text-slate-900">{it.name}</div>
                <div className="text-[11px] text-slate-500 flex items-center mt-0.5"><MapPin className="w-3 h-3 mr-1" />{l.godown} • {t('shelf', lang)} <span className="font-mono font-bold text-slate-800 ml-1">{l.shelf}</span></div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400">{t('ordered', lang)}</div>
                <div className="text-lg font-black font-mono text-slate-900 leading-tight">{l.qty}</div>
                <div className="text-[10px] text-slate-500">{unitWord(it.unit, l.qty, lang)}</div>
              </div>
            </div>
            {flag && <div className="text-[11px] font-semibold text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 flex items-center"><AlertTriangle className="w-3.5 h-3.5 mr-1" />{t('countPending', lang)}</div>}
            {!c && !os.picked && (
              <button id={`picker-btn-short-${i}`} onClick={() => onShort(i)} className="w-full py-2.5 bg-white border-2 border-rose-500 text-rose-700 hover:bg-rose-50 rounded-xl font-black text-sm flex items-center justify-center space-x-1.5 active:scale-[0.99] transition-all cursor-pointer"><AlertTriangle className="w-4 h-4" /><span>{t('short', lang)}</span></button>
            )}
            {!c && os.picked && <div className="text-xs font-bold text-emerald-700 flex items-center"><Check className="w-4 h-4 mr-1" />{t('picked', lang)}: {qtyU(l.qty, l.item, lang)}</div>}
            {c && (
              <div className="flex items-stretch gap-2">
                <button onClick={() => onSearch(c.id)} className={`flex-1 text-left rounded-lg p-2 text-[11px] font-semibold flex items-center justify-between cursor-pointer border ${shortQty(c) === 0 ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-900' : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-950'}`}>
                  <span>{shortQty(c) === 0
                    ? <><Check className="w-3.5 h-3.5 inline mr-1" />{t('found', lang)}: {totalFound(c)}/{c.ordered}</>
                    : c.outcome ? <>{t('wasShort', lang)}: {totalFound(c)} {t('pickedOf', lang)} / {c.ordered} • <Check className="w-3.5 h-3.5 inline" /> {t('decided', lang)}</> : <>{t('wasShort', lang)}: {totalFound(c)} {t('pickedOf', lang)} / {c.ordered} • {t('searchStill', lang)} {shortQty(c)}</>}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                {canUndo && (
                  <button id={`picker-btn-undo-${i}`} onClick={() => dispatch({ type: 'UNDO_SHORT', caseId: c.id, actor: 'Picker' })} className="px-2.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-[11px] font-bold cursor-pointer flex items-center"><Undo2 className="w-3.5 h-3.5 mr-1" />{t('undo', lang)}</button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {!os.picked && !confirming && (
        <button id="picker-btn-order-picked" onClick={() => setConfirming(true)}
          className="w-full min-h-[52px] rounded-xl text-sm font-bold flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-all active:scale-[0.99] bg-emerald-600 hover:bg-emerald-700 text-white">
          <PackageCheck className="w-5 h-5" /><span>{t('donePicking', lang)}</span>
        </button>
      )}
      {!os.picked && confirming && (
        <div className="rounded-xl border-2 border-emerald-600 p-3 space-y-2.5">
          <div className="text-sm font-bold text-slate-900">{o.lines.length - shortLines} {t('full', lang)} • {shortLines} {t('wasShort', lang).toLowerCase()}</div>
          <p className="text-[11px] text-slate-600">{t('confirmPicked', lang)}</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setConfirming(false)} className="py-2.5 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 bg-white cursor-pointer">{t('goBack', lang)}</button>
            <button id="picker-btn-confirm-picked" onClick={() => { dispatch({ type: 'ORDER_PICKED', orderId: o.id, actor: 'Picker' }); setConfirming(false); }} className="py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer">{t('yesPicked', lang)}</button>
          </div>
        </div>
      )}

      {os.picked && block === 'decision' && <Bubble tone="stop">{t('blockDecision', lang)}</Bubble>}
      {os.picked && block === 'stock' && <Bubble tone="stop">{t('blockStock', lang)}</Bubble>}
      {os.picked && block === 'invoice' && <Bubble tone="stop">{t('blockInvoice', lang)}</Bubble>}
      {os.picked && pending.length > 0 && (
        <div className="space-y-2">
          <Bubble tone="warn">{t('blockExtra', lang)}</Bubble>
          {pending.map((p: any) => {
            const c = state.cases.find((x: any) => x.id === p.caseId);
            return (
              <div key={p.id} id={`extra-${p.id}`} className="border-2 border-sky-300 bg-sky-50 rounded-xl p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-900 flex items-center"><PackagePlus className="w-4 h-4 mr-1 text-sky-700" />{item(p.item).name}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5"><MapPin className="w-3 h-3 inline mr-1" />{p.godown} • {t('shelf', lang)} <span className="font-mono font-bold">{p.shelf}</span></div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{p.kind === 'substitute' ? `${t('substituteFor', lang)} ${item(c.item).name}` : t('arrived', lang)}</div>
                  </div>
                  <div className="text-right"><div className="text-lg font-black font-mono">{p.qty}</div><div className="text-[10px] text-slate-500">{unitWord(item(p.item).unit, p.qty, lang)}</div></div>
                </div>
                <button id={`btn-extra-picked-${p.id}`} onClick={() => dispatch({ type: 'EXTRA_PICKED', orderId: o.id, pickId: p.id, actor: 'Picker' })} className="w-full py-2.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center"><Check className="w-4 h-4 mr-1" />{t('pickedBtn', lang)}</button>
              </div>
            );
          })}
        </div>
      )}

      {packList.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5" id="pack-list">
          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-700">{t('packList', lang)}</div>
          {packList.map(([code, q]) => (
            <div key={code} className="flex items-center justify-between text-xs"><span className="text-slate-800">{item(code).name}</span><span className="font-mono font-bold">{qtyU(q as number, code, lang)}</span></div>
          ))}
        </div>
      )}

      {os.picked && block === null && (
        <>
          <Bubble tone="go">{t('readyLoad', lang)}</Bubble>
          <button id="picker-btn-dispatched" onClick={() => dispatch({ type: 'DISPATCHED', orderId: o.id, actor: 'Packer' })} className="w-full min-h-[52px] rounded-xl text-sm font-bold flex items-center justify-center space-x-2 shadow-md cursor-pointer bg-slate-900 hover:bg-slate-800 text-white"><Truck className="w-5 h-5" /><span>{t('markDispatched', lang)}</span></button>
        </>
      )}
      {block === 'dispatched' && <Bubble tone="info"><Truck className="w-4 h-4 inline mr-1" />{t('dispatched', lang)} {whenL(os.dispatchedAt, lang, now)}</Bubble>}
    </div>
  );
}

const REASON_BTN: Record<string, string> = {
  not_found: 'bg-rose-600 hover:bg-rose-700',
  damaged: 'bg-amber-600 hover:bg-amber-700',
  wrong_item: 'bg-slate-700 hover:bg-slate-800',
};

function ShortForm({ lang, orderId, lineIdx, onCancel, onSent }: { lang: string; orderId: string; lineIdx: number; onCancel: () => void; onSent: () => void }) {
  const { state, dispatch } = useStore();
  const o = state.orders.find((x: any) => x.id === orderId);
  const l = o.lines[lineIdx];
  const it = item(l.item);
  const [found, setFound] = useState(0);
  const [reason, setReason] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const SR = typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const listen = () => {
    if (!SR) return;
    try {
      const r = new SR();
      r.lang = (LANGS as any)[lang].speech;
      r.onresult = (e: any) => {
        const { qty, reason: rs } = parseVoice(e.results[0][0].transcript);
        if (qty != null && qty < l.qty) setFound(qty);
        if (rs) setReason(rs);
      };
      r.onend = () => setListening(false);
      setListening(true);
      r.start();
    } catch { setListening(false); }
  };

  return (
    <div className="space-y-4">
      <Bubble>{it.name} • {t('shelf', lang)} {l.shelf} • {t('ordered', lang)} {qtyU(l.qty, l.item, lang)}</Bubble>
      <div className="space-y-2">
        <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wide text-center">{t('howMany', lang)}</div>
        <div className="flex items-center justify-center space-x-3">
          <button aria-label="minus" onClick={() => setFound((f) => Math.max(0, f - 1))} className="w-12 h-12 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center cursor-pointer"><Minus className="w-5 h-5" /></button>
          <input id="picker-found-input" type="number" inputMode="numeric" min="0" max={l.qty - 1} value={found}
            onChange={(e) => setFound(Math.max(0, Math.min(l.qty - 1, Math.floor(Number(e.target.value) || 0))))}
            className="w-24 text-center text-2xl font-black font-mono p-2 rounded-xl border border-slate-300 bg-slate-50 outline-none focus:border-slate-900" />
          <button aria-label="plus" onClick={() => setFound((f) => Math.min(l.qty - 1, f + 1))} className="w-12 h-12 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center cursor-pointer"><Plus className="w-5 h-5" /></button>
        </div>
        <div className="text-center text-[11px] text-slate-500">/ {qtyU(l.qty, l.item, lang)} • {t('searchStill', lang)} {l.qty - found}</div>
      </div>
      <div className="space-y-2">
        <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wide text-center">{t('what', lang)}</div>
        <div className="grid grid-cols-3 gap-2">
          {Object.keys(REASON_BTN).map((r) => (
            <button key={r} id={`picker-reason-${r}`} onClick={() => setReason(r)}
              className={`py-3 px-1.5 text-white rounded-xl font-bold text-xs flex items-center justify-center text-center shadow-xs active:scale-[0.99] transition-all cursor-pointer ${REASON_BTN[r]} ${reason === r ? 'ring-4 ring-offset-1 ring-slate-900' : reason ? 'opacity-50' : ''}`}>
              {t(r, lang)}
            </button>
          ))}
        </div>
      </div>
      {SR && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between text-xs text-emerald-950 shadow-2xs">
          <span className="text-[11px] font-medium">{t('speakHint', lang)}</span>
          <button onClick={listen} className="ml-2 px-3 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer shrink-0 bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100 shadow-2xs">
            <Mic className="w-3.5 h-3.5" /><span>{listening ? t('listening', lang) : t('speak', lang)}</span>
          </button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={onCancel} className="py-3 rounded-xl text-sm font-bold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer">{t('cancel', lang)}</button>
        <button id="picker-btn-send-short" disabled={!reason} onClick={() => { dispatch({ type: 'REPORT_SHORT', orderId, lineIdx, found, reason, actor: 'Picker' }); onSent(); }}
          className="py-3 rounded-xl text-sm font-bold bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white cursor-pointer disabled:cursor-not-allowed">{t('send', lang)}</button>
      </div>
    </div>
  );
}

function hintText(h: any, code: string, lang: string) {
  const q = qtyU(h.qty, code, lang);
  if (h.kind === 'purchase') return fill(t('hintPurchase', lang), { qty: q, time: time(h.at) });
  if (h.kind === 'movement') return fill(t('hintMovement', lang), { qty: q, date: date(h.at) });
  return fill(t('hintStock', lang), { qty: q });
}

function Search({ lang, orderId, lineIdx, caseId, now, onBack }: { lang: string; orderId: string; lineIdx?: number; caseId?: string; now: number; onBack: () => void }) {
  const { state, dispatch } = useStore();
  const c = caseId ? state.cases.find((x: any) => x.id === caseId) : lineCase(state, orderId, lineIdx!);
  const [asking, setAsking] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [record, setRecord] = useState<string | null>(null);
  if (!c) return <Bubble tone="info">…</Bubble>;
  const it = item(c.item);
  const remaining = Math.min(c.searchDeadline - now, c.searchDeadline - c.reportedAt);
  const searching = !c.outcome && !c.escalatedAt;

  let status;
  if (c.outcome?.type === 'found') status = <Bubble>{t('allFound', lang)} ({totalFound(c)}/{c.ordered})</Bubble>;
  else if (c.escalation === 'damaged') status = <Bubble tone="warn">{t('damagedSent', lang)}</Bubble>;
  else if (c.escalation === 'no_records') status = <Bubble tone="warn">{t('noRecords', lang)}</Bubble>;
  else if (c.escalatedAt || c.outcome) status = <Bubble tone="warn">{t('sentToOwner', lang)} ({t('searchStill', lang)} {qtyU(shortQty(c), c.item, lang)})</Bubble>;

  return (
    <div className="space-y-3">
      <button onClick={onBack} className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center cursor-pointer"><ChevronLeft className="w-3.5 h-3.5" />{t('back', lang)}</button>
      <div className="text-xs text-slate-600"><span className="font-bold text-slate-900">{it.name}</span> • {totalFound(c)}/{c.ordered} • <span className="font-bold text-rose-700">{t('searchStill', lang)} {qtyU(shortQty(c), c.item, lang)}</span></div>
      {c.suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">{t('checkThese', lang)}</div>
            {searching && <div className="text-[11px] font-mono text-slate-500">{t('timeLeft', lang)}: <strong className="text-slate-900">{mins(remaining)}</strong></div>}
          </div>
          {c.suggestions.map((s: any) => (
            <div key={s.key} className="border border-slate-200 rounded-xl p-3 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-slate-900 flex items-center"><MapPin className="w-3.5 h-3.5 mr-1 text-teal-700" />{s.godown} • <span className="font-mono ml-1">{s.shelf}</span></div>
                {s.result === 'found' && <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 rounded">+{s.foundQty}</span>}
                {s.result === 'not_here' && <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 rounded">{t('notHere', lang)}</span>}
              </div>
              <ul className="text-[12px] text-slate-700 space-y-0.5">{(s.hints || []).map((h: any, i: number) => <li key={i}>• {hintText(h, c.item, lang)}</li>)}</ul>
              {s.returns && <div className="text-[11px] font-semibold text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 flex items-center"><AlertTriangle className="w-3.5 h-3.5 mr-1 shrink-0" />{t('returnsWarn', lang)}</div>}
              <button onClick={() => setRecord(record === s.key ? null : s.key)} className="text-[10px] text-slate-400 underline cursor-pointer flex items-center">{t('showRecord', lang)}{record === s.key ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}</button>
              {record === s.key && <div className="text-[10px] text-slate-500 leading-relaxed">{s.source}</div>}
              {!s.result && !c.outcome && (asking === s.key ? (
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-semibold text-slate-700">{t('howManyHere', lang)}</span>
                  <input id="picker-found-here-input" type="number" min="1" max={shortQty(c)} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(shortQty(c), Math.floor(Number(e.target.value) || 1))))} className="w-16 text-center font-mono font-bold p-1.5 rounded-lg border border-slate-300" />
                  <span className="text-[11px] text-slate-500">{unitWord(it.unit, qty, lang)}</span>
                  <button onClick={() => { dispatch({ type: 'SEARCH_RESULT', caseId: c.id, locKey: s.key, result: 'found', qty, actor: 'Picker' }); setAsking(null); }} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer">{t('ok', lang)}</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setAsking(s.key); setQty(Math.max(1, Math.min(shortQty(c), s.expected || 1))); }} className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs">{t('foundHere', lang)}</button>
                  <button onClick={() => dispatch({ type: 'SEARCH_RESULT', caseId: c.id, locKey: s.key, result: 'not_here', actor: 'Picker' })} className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs">{t('notHere', lang)}</button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      {status}
      {searching && <button onClick={() => dispatch({ type: 'ESCALATE', caseId: c.id, why: 'picker', actor: 'Picker' })} className="w-full py-2.5 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer">{t('sendNow', lang)}</button>}
      <button onClick={onBack} className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white cursor-pointer">{t('back', lang)}: {c.orderId}</button>
    </div>
  );
}

function Recounts({ lang }: { lang: string }) {
  const { state, dispatch } = useStore();
  const list = state.recounts.filter((r: any) => r.status !== 'done');
  const [vals, setVals] = useState<Record<string, string>>({});
  const [moving, setMoving] = useState<Record<string, { at: string; qty: string }>>({});
  return (
    <div className="space-y-3">
      <Bubble>{list.length ? t('countGood', lang) : t('noTasks', lang)}</Bubble>
      {list.map((r: any) => {
        const it = item(r.item);
        const c = state.cases.find((x: any) => x.id === r.caseId);
        const ready = !c || orderState(state, c.orderId).picked;
        const here = `${r.godown} / ${r.shelf}`;
        const mv = moving[r.id];
        return (
          <div key={r.id} id={`recount-${r.id}`} className="border border-slate-200 rounded-xl p-3 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-slate-900">{it.name}</div>
              <span className="font-mono text-[10px] text-slate-500">{r.id}</span>
            </div>
            <div className="text-[11px] text-slate-600 flex items-center"><ClipboardList className="w-3 h-3 mr-1" />{r.godown} • {t('shelf', lang)} <span className="font-mono font-bold text-slate-900 ml-1">{r.shelf}</span></div>
            {r.status === 'open' && !ready && <div className="text-[11px] text-slate-500">{t('afterPicking', lang)} ({c.orderId})</div>}
            {r.status === 'open' && ready && (
              <div className="flex items-center space-x-2">
                <input type="number" min="0" inputMode="numeric" placeholder={unitWord(it.unit, 2, lang)} value={vals[r.id] ?? ''} onChange={(e) => setVals({ ...vals, [r.id]: e.target.value })}
                  className="flex-1 min-w-0 text-center text-lg font-black font-mono p-2 rounded-xl border border-slate-300 bg-slate-50 outline-none focus:border-slate-900 placeholder:text-xs placeholder:font-normal" />
                <button disabled={vals[r.id] === undefined || vals[r.id] === ''} onClick={() => dispatch({ type: 'RECOUNT_DONE', recountId: r.id, counted: Math.floor(Number(vals[r.id])), actor: 'Godown in-charge' })}
                  className="h-12 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold cursor-pointer">{t('saveCount', lang)}</button>
              </div>
            )}
            {r.status === 'needs_cause' && (
              <div className="space-y-2">
                <div className={`text-xs font-bold ${r.diff === 0 ? 'text-emerald-700' : 'text-amber-800'}`}>
                  {r.diff === 0 ? t('matchesBook', lang) : fill(t(r.diff < 0 ? 'missingN' : 'extraN', lang), { n: qtyU(Math.abs(r.diff), r.item, lang) })}
                </div>
                <div className="text-[11px] font-bold text-slate-700">{t('whyDifferent', lang)}</div>
                {!mv && (
                  <div className="grid grid-cols-1 gap-1.5">
                    {['wrong_shelf', 'return_not_entered', 'sample_not_entered', 'damaged', 'entry_error', 'missed_on_shelf', 'unexplained']
                      .filter((k) => (r.diff === 0 ? ['missed_on_shelf', 'unexplained'].includes(k) : k !== 'missed_on_shelf'))
                      .filter((k) => k !== 'wrong_shelf' || r.diff < 0)
                      .map((k) => (
                        <button key={k} id={`cause-${r.id}-${k}`}
                          onClick={() => (k === 'wrong_shelf' ? setMoving({ ...moving, [r.id]: { at: '', qty: String(-r.diff) } }) : dispatch({ type: 'RECOUNT_CAUSE', recountId: r.id, cause: k, actor: 'Godown in-charge' }))}
                          className="text-left text-[12px] font-semibold px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">{t(`cause_${k}`, lang)}</button>
                      ))}
                  </div>
                )}
                {mv && (
                  <div className="space-y-2 rounded-lg border border-slate-300 p-2.5">
                    <label className="block text-[11px] font-bold text-slate-700">{t('whereFound', lang)}
                      <select id={`move-at-${r.id}`} value={mv.at} onChange={(e) => setMoving({ ...moving, [r.id]: { ...mv, at: e.target.value } })} className="mt-1 w-full p-2 rounded-lg border border-slate-300 bg-white text-xs">
                        <option value="">—</option>
                        {LOCATIONS.filter((x) => x !== here).map((x) => <option key={x} value={x}>{x}</option>)}
                      </select>
                    </label>
                    <label className="block text-[11px] font-bold text-slate-700">{t('howManyThere', lang)}
                      <input id={`move-qty-${r.id}`} type="number" min="1" max={-r.diff} value={mv.qty} onChange={(e) => setMoving({ ...moving, [r.id]: { ...mv, qty: e.target.value } })} className="mt-1 w-full p-2 rounded-lg border border-slate-300 font-mono" />
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => { const m = { ...moving }; delete m[r.id]; setMoving(m); }} className="py-2 rounded-lg border border-slate-300 text-xs font-bold cursor-pointer">{t('goBack', lang)}</button>
                      <button id={`move-save-${r.id}`} disabled={!mv.at || !(Number(mv.qty) >= 1 && Number(mv.qty) <= -r.diff)}
                        onClick={() => dispatch({ type: 'RECOUNT_CAUSE', recountId: r.id, cause: 'wrong_shelf', foundAt: mv.at, foundQty: Math.floor(Number(mv.qty)), actor: 'Godown in-charge' })}
                        className="py-2 rounded-lg bg-slate-900 disabled:opacity-40 text-white text-xs font-bold cursor-pointer">{t('save', lang)}</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
