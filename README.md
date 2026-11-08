# StockTrace v2 — Short-Supply Resolution for SME distributors on Tally

StockTrace helps a small distributor resolve an order that cannot ship in full, end to end: the picker reports the short, a quick search checks only places that have a Tally record behind them, the owner decides what happens to the order, StockTrace drafts the credit note / invoice / stock entries for the accountant to approve, the customer gets a message, and a recount stops the same gap recurring.

v2 follows the requirements doc "StockTrace — Requirements & End-to-End Flow (v2)" and keeps the v1 visual design (same header, cards, picker phone layout, console tables). It uses the same stack as AeroDAG: React 19, TypeScript, Vite, Tailwind CSS 4, and an Express server for Render.

**Trust principle:** StockTrace drafts. People decide and approve. Nothing reaches Tally until the accountant approves it, and no location is ever suggested without a record.

---

## Capabilities & Implementation Status

| Feature | Status | Details |
|---|---|---|
| Picker pick list, Picked / Short per line (FR-1.2, 2.1–2.3) | **Working** | Short = quantity found + one of 4 reasons. Order is held at packing until resolved. |
| English · हिंदी · ಕನ್ನಡ, read-aloud, voice input (FR-2.4) | **Working (prototype)** | Uses the phone's speech engine where available; taps always work. |
| Cited quick search (FR-3.1, 3.2) | **Working** | Suggests only locations from Tally stock summary or recent stock journals, with the record shown. No record → no suggestion. Owner-set time limit, then auto-escalation. |
| Owner decision queue (FR-4.1–4.3) | **Working** | Ship partial, backorder, source elsewhere, cancel line; bill impact shown before confirming. |
| Draft credit note / sales invoice / stock journal / physical stock (FR-5.1–5.3) | **Working** | Credit note references the original invoice; CGST+SGST vs IGST by place of supply; invoice for shipped qty when not invoiced yet. |
| Accountant approval, reject-with-reason (FR-5.4, 8.1) | **Working** | Rejecting returns the case to the owner with the note. |
| s.34(2) deadline warning, e-invoice IRN flag (FR-5.5) | **Working** | Deadline = 30 Nov after the FY of the original invoice (or annual return date, if earlier). |
| Customer message via WhatsApp share (FR-6.1) | **Working** | Drafted per outcome, editable, opened with `wa.me` share link. |
| Recount task per short (FR-7.1, 7.2) | **Working** | Blind count; a difference becomes a Physical Stock draft. |
| Discrepancy log, monthly report, CSV export (FR-7.3, 7.4) | **Working** | Shorts per 1,000 order lines, value, credit notes, write-offs; computed from case data only. |
| Audit trail (FR-8.2) | **Working** | Every report, decision, approval and message, time-stamped with the actor. |
| Tally XML export of posted vouchers | **Draft** | Starting point for Tally import. Ledger names must match your company: test on a sample company first. |
| Live TallyPrime connector (FR-1.1) | **Not built** | Items, stock, orders and invoices are **sample data** in `src/data/seed.ts`. |
| Backend database / multi-user sync | **Not built** | State is kept in the browser (localStorage). Offline banner shows when the phone loses signal. |
| WhatsApp Business API (FR-6.2) | **Not built** | Share link only. |

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

1. **Picker** → ORD-1031 → mark Modular Switch *Picked* → LED Bulb *Short*: found 98 of 100, reason *Not found*.
2. StockTrace lists one place to check, Back Store / BS-1, citing the stock summary and stock journal SJ-0412. Tap *Not here*.
3. **Owner** → CASE-0003 → *Ship partial, cancel the rest*. Bill impact: credit note 2 × ₹650 + GST = ₹1,534.00 against INV-2611. Confirm, then share the drafted WhatsApp message.
4. **Accountant** → review the credit note (CGST ₹117 + SGST ₹117, s.34(2) deadline) → *Approve and post* → download Tally XML.
5. **Picker** → Recounts → count Main Godown / R2-B. A difference creates a Physical Stock draft for the accountant.
6. **Reports** → the case appears in the discrepancy log; export CSV for the CA.

Use *Reset* on the Picker screen to restore the demo data.

## Project structure

```
server.ts                 Express: security headers, /health, static dist with SPA fallback
src/data/seed.ts          Sample Tally data (items, godowns, stock, stock journals, parties, orders)
src/store.tsx             State, reducer (every action of the flow), selectors, persistence
src/lib/search.ts         Cited quick-search suggestions
src/lib/tax.ts            GST split, s.34(2) deadline
src/lib/tally.ts          Tally XML for posted vouchers
src/i18n.ts               Picker strings in English, Hindi, Kannada; voice parser
src/views/                Home, Picker, Owner, Accountant, Reports, SOP and Settings modals
tests/flow.test.ts        10 end-to-end flow tests
```
