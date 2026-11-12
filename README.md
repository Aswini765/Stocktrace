# StockTrace v2.1 — Short-Supply Resolution for SME distributors on Tally

StockTrace helps a small distributor resolve an order that cannot ship in full, end to end: the picker reports the short, a quick search checks only places that have a Tally record behind them, the owner decides what happens to the order, StockTrace drafts the credit note / invoice / stock entries for the accountant to approve, the customer gets a message, and a recount stops the same gap recurring.

v2 follows the requirements doc "StockTrace — Requirements & End-to-End Flow (v2)" and keeps the v1 visual design (same header, cards, picker phone layout, console tables). It uses the same stack as AeroDAG: React 19, TypeScript, Vite, Tailwind CSS 4, and an Express server for Render.

**Trust principle:** StockTrace drafts. People decide and approve. Nothing reaches Tally until the accountant approves it, and no location is ever suggested without a record.

---

## Capabilities & Implementation Status

v2.1 reworks the flow around how each role actually works: the picker is on a phone, the owner decides per order, the accountant works in a daily batch, and Tally owns voucher numbering.

| Feature | Status | Details |
|---|---|---|
| Picker on the phone: report shorts only, then "Order picked" | **Working** | Lines not marked short count as fully picked; stock is deducted at "Order picked" (SAP EWM-style pick denial, not per-line confirmation). |
| English · हिंदी · ಕನ್ನಡ, read-aloud, voice input | **Working (prototype)** | Uses the phone's speech engine where available; taps always work. |
| Cited quick search | **Working** | Only places with a record: today's purchase receipts (goods not yet shelved), Tally stock summary, stock journals in the last 14 days. No record → straight to the owner. Time limit, then auto-escalation. |
| Owner: one decision per order | **Working** | All short lines decided together: partial, backorder, substitute (from a mapped alternative with stock), source elsewhere, cancel line. Records what the customer agreed to. One customer message per order. |
| Correct bill fix (GST) | **Working** | No invoice yet → invoice what ships. E-invoice under 24 h → cancel IRN and re-issue (cancel e-way bill first). Over 24 h → credit note. Not on e-invoicing → cancel and re-issue (confirm with CA). |
| Accountant daily batch | **Working** | Select and approve together; time-bound IRN cancellations first; step list per draft; s.34(2) deadline; reject with reason returns the order to the owner and reverses substitute stock. |
| Tally XML | **Draft** | No voucher numbers in the XML: Tally assigns them on import. Ledger names must match your company: test on a sample company first. |
| Recount by the godown in-charge | **Working** | Starts after the order is picked; one recount per shelf even with several shorts; root cause required; a difference becomes a Physical Stock draft. |
| Reports | **Working** | Shorts per 1,000 lines, value, credit notes vs re-issues, write-offs, recount causes, open backorders, CSV log. |
| Shared data across phones (Supabase) | **Working, needs setup** | Append-only event log, replayed the same way on every device; offline outbox; live updates. Without setup, data stays in one browser (header shows "This device only"). |
| Live TallyPrime connector | **Not built** | Items, stock, orders and invoices are **sample data** in `src/data/seed.ts`. |
| WhatsApp Business API | **Not built** | Share link only. |

### Turning on shared data

1. In Supabase → SQL editor, run `supabase/migrations/20261112_stocktrace_events.sql`.
2. In Render → the StockTrace static site → Environment, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Project Settings → API). Optionally `VITE_STOCKTRACE_WORKSPACE`.
3. Redeploy (Vite reads these at build time). The header chip changes to "Shared • live".

The included row-level-security policy lets anyone with the anon key read and append to the `demo` workspace. That is fine for a demo, not for real customer data: add Supabase Auth and per-company policies first.

All company names, GSTINs, item rates and GST rates are fictional demo values.

---

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000 (Vite dev server)
npm run test:unit    # end-to-end flow tests through the real reducer
npm run lint         # TypeScript type check
```

Production mode (what Render runs):

```bash
npm run build
npm start            # Express serves dist/ on $PORT, health check at /health
```

`npm run build:single` produces `dist-single/index.html`, one self-contained file for sharing a preview.

## Deploy on Render

`render.yaml` is included. Either use it as a Blueprint, or create a **Web Service** with:

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Health check path: `/health`
- Node 22.12 or later

To replace the current `stocktrace-i150` service, point that service at this repository and use the same commands.

## Demo walkthrough (the professor's example)

1. **Picker** (phone) → ORD-1031 → LED Bulb *Short*: found 2 of 100, reason *Not found*.
2. StockTrace lists places with a record: Receiving Area (purchase PUR-0388 received today, not yet shelved) and Back Store (stock summary + stock journal). Check them, or *Send to owner now*. Back to the order → *Order picked: send to packing*.
3. **Owner** → ORD-1031 → *Ship partial*, customer *agreed* → confirm. Because INV-2611's e-invoice is under 24 hours old, the fix is: cancel the IRN and re-issue for what ships, no credit note. Share the WhatsApp message.
4. **Accountant** → the re-issue draft is at the top with its deadline and steps → *Approve selected* → download Tally XML.
5. **Picker → Godown in-charge** → recount Main Godown / R2-B, then record why the book was wrong. A difference becomes a Physical Stock draft.
6. **Reports** → the case appears in the log with its order status and cause; export CSV for the CA.

Use *Reset* on the Picker screen to restore the demo data.

## Project structure

```
server.ts                 Express: security headers, /health, static dist with SPA fallback
src/data/seed.ts          Sample Tally data (items, godowns, stock, stock journals, parties, orders)
src/core.ts               Reducer (every action of the flow), selectors, correction route
src/store.tsx             React provider: event replay, dispatch, escalation timer
src/sync.ts               Supabase event log + offline outbox (or this-device storage)
supabase/migrations/      Event table, demo RLS policy, realtime
src/lib/search.ts         Cited quick-search suggestions
src/lib/tax.ts            GST split, s.34(2) deadline
src/lib/tally.ts          Tally XML for approved drafts (no voucher numbers)
src/i18n.ts               Picker strings in English, Hindi, Kannada; voice parser
src/views/                Home, Picker, Owner, Accountant, Reports, SOP and Settings modals
tests/flow.test.ts        17 end-to-end flow tests
```
