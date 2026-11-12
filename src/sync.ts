// Shared data across phones and laptops.
//
// Every user action is an event appended to one Supabase table. Each device replays the events,
// in table order, through the same reducer, so the picker's phone, the owner's phone and the
// accountant's laptop all compute the same state. If Supabase is not configured, the app runs in
// "this device only" mode and keeps its events in localStorage.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const WORKSPACE = (import.meta.env.VITE_STOCKTRACE_WORKSPACE as string | undefined) || 'demo';
const TABLE = 'stocktrace_events';
// v5: the event log starts with a RESET that anchors the demo's clock (older logs are ignored)
const LOCAL_KEY = `stocktrace-v5-events-${WORKSPACE}`;
const OUTBOX_KEY = `stocktrace-outbox-${WORKSPACE}`;

export const sharedMode = Boolean(URL && KEY);
let client: SupabaseClient | null = null;
if (sharedMode) client = createClient(URL!, KEY!, { auth: { persistSession: false } });

export type Ev = { id: number; action: any };

const read = (k: string) => { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch { return []; } };
const write = (k: string, v: any) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };

// ----- this-device-only mode -----
export function localEvents(): Ev[] { return read(LOCAL_KEY); }
export function localClear() { write(LOCAL_KEY, []); }
export function localAppend(action: any): Ev {
  const evs = localEvents();
  const ev = { id: (evs.at(-1)?.id || 0) + 1, action };
  write(LOCAL_KEY, [...evs, ev]);
  return ev;
}

// ----- shared mode -----
export async function fetchSince(lastId: number): Promise<Ev[]> {
  if (!client) return [];
  const { data, error } = await client.from(TABLE).select('id, action').eq('workspace', WORKSPACE).gt('id', lastId).order('id', { ascending: true }).limit(1000);
  if (error) throw error;
  return data as Ev[];
}

export function outbox(): any[] { return read(OUTBOX_KEY); }

// Queue first (so nothing is lost if the godown has no signal), then try to send.
export async function send(action: any): Promise<boolean> {
  write(OUTBOX_KEY, [...outbox(), action]);
  return flush();
}

let flushing = false;
export async function flush(): Promise<boolean> {
  if (!client || flushing) return false;
  flushing = true;
  try {
    let box = outbox();
    while (box.length) {
      const { error } = await client.from(TABLE).insert({ workspace: WORKSPACE, action: box[0] });
      if (error) return false;
      box = box.slice(1);
      write(OUTBOX_KEY, box);
    }
    return true;
  } catch {
    return false;
  } finally {
    flushing = false;
  }
}

export function subscribe(onInsert: () => void) {
  if (!client) return () => {};
  const ch = client
    .channel(`stocktrace-${WORKSPACE}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: TABLE, filter: `workspace=eq.${WORKSPACE}` }, onInsert)
    .subscribe();
  return () => { client!.removeChannel(ch); };
}
