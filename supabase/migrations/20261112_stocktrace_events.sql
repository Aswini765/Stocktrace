-- StockTrace shared data: one append-only event log per workspace.
-- Every device replays these events through the same reducer, so all phones and laptops agree.
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.

create table if not exists public.stocktrace_events (
  id bigint generated always as identity primary key,
  workspace text not null default 'demo',
  action jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists stocktrace_events_ws_id on public.stocktrace_events (workspace, id);

alter table public.stocktrace_events enable row level security;

-- DEMO POLICY: anyone with the site's public (anon) key can read and add events for the demo workspace.
-- Events can never be edited or deleted from the app. Before real customer data goes in,
-- replace this with sign-in (Supabase Auth) and a policy per business.
drop policy if exists "demo read" on public.stocktrace_events;
create policy "demo read" on public.stocktrace_events
  for select to anon using (workspace = 'demo');

drop policy if exists "demo insert" on public.stocktrace_events;
create policy "demo insert" on public.stocktrace_events
  for insert to anon with check (workspace = 'demo' and pg_column_size(action) < 20000);

-- Live updates to every open device
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'stocktrace_events'
  ) then
    alter publication supabase_realtime add table public.stocktrace_events;
  end if;
end $$;
