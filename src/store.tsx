import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { reducer, buildInitialState } from './core.ts';
import * as sync from './sync.ts';

export * from './core.ts';

type Ctx = {
  state: any;
  dispatch: (action: any) => void;
  sync: { shared: boolean; online: boolean; pending: number; lastSyncAt: number | null; error: string | null };
};
const StoreCtx = createContext<Ctx | null>(null);

const replay = (events: sync.Ev[], from = buildInitialState()) => events.reduce((s, e) => reducer(s, e.action), from);

// The log always begins with a RESET whose time anchors the demo data, so every device replays the same story.
function initialLocal() {
  let evs = sync.localEvents();
  if (!evs.length || evs[0].action.type !== 'RESET') { sync.localClear(); evs = [sync.localAppend({ type: 'RESET', at: Date.now(), actor: 'StockTrace' })]; }
  return replay(evs);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<any>(() => (sync.sharedMode ? buildInitialState() : initialLocal()));
  const lastId = useRef(0);
  const seeded = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [status, setStatus] = useState({ online: typeof navigator === 'undefined' ? true : navigator.onLine, pending: sync.outbox().length, lastSyncAt: null as number | null, error: null as string | null });

  const pull = useCallback(async () => {
    if (!sync.sharedMode) return;
    try {
      await sync.flush();
      const evs = await sync.fetchSince(lastId.current);
      if (!evs.length && lastId.current === 0 && !seeded.current) { seeded.current = true; if (await sync.send({ type: 'RESET', at: Date.now(), actor: 'StockTrace' })) return pull(); }
      if (evs.length) {
        lastId.current = evs.at(-1)!.id;
        setState((s: any) => evs.reduce((acc, e) => reducer(acc, e.action), s));
      }
      setStatus((x) => ({ ...x, pending: sync.outbox().length, lastSyncAt: Date.now(), error: null }));
    } catch (e: any) {
      setStatus((x) => ({ ...x, pending: sync.outbox().length, error: e?.message || 'Could not reach the shared database' }));
    }
  }, []);

  useEffect(() => {
    if (!sync.sharedMode) return;
    pull();
    const unsub = sync.subscribe(() => pull());
    const poll = setInterval(pull, 5000); // fallback if realtime is off
    const on = () => { setStatus((x) => ({ ...x, online: true })); pull(); };
    const off = () => setStatus((x) => ({ ...x, online: false }));
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { unsub(); clearInterval(poll); window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, [pull]);

  const dispatch = useCallback((action: any) => {
    const stamped = { ...action, at: action.at || Date.now() };
    if (sync.sharedMode) {
      setStatus((x) => ({ ...x, pending: x.pending + 1 }));
      sync.send(stamped).then(() => pull());
    } else {
      if (stamped.type === 'RESET') sync.localClear(); // a reset starts a fresh log on this device
      sync.localAppend(stamped);
      setState((s: any) => reducer(s, stamped));
    }
  }, [pull]);

  // Search time limits: any device that notices an expired search records the escalation once.
  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now();
      for (const c of stateRef.current.cases) {
        if (!c.outcome && !c.escalatedAt && now >= c.searchDeadline) dispatch({ type: 'ESCALATE', caseId: c.id, why: 'timeout', actor: 'StockTrace' });
      }
    }, 15000);
    return () => clearInterval(t);
  }, [dispatch]);

  return <StoreCtx.Provider value={{ state, dispatch, sync: { shared: sync.sharedMode, ...status } }}>{children}</StoreCtx.Provider>;
}

export const useStore = () => useContext(StoreCtx)!;
