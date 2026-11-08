# STOCKTRACE — MASTER BUILD SPECIFICATION

**Version:** V2.0  
**Status:** Existing prototype → Antigravity development handoff  
**Product:** StockTrace — Inventory Movement & Location Intelligence

## 1. Product
StockTrace is a standalone warehouse exception-resolution application.

**Core promise:** When inventory cannot be found where the system says it is, StockTrace uses available transaction and visual evidence to help the worker decide where to look next, explains why, and records human verification.

StockTrace is **not a replacement WMS**. It works above WMS/ERP/Excel/CSV inventory records, scanner transactions, camera evidence, and approved SOPs.

## 2. Existing State
A working initial StockTrace prototype already exists in Google AI Studio.

Existing capabilities include:
- React + TypeScript + Vite + Tailwind
- Open Cases
- Failed-pick investigation
- Scanner evidence
- Camera evidence and simulated camera video
- Candidate/recommendation experience
- Human verification
- Completed Cases
- Dashboard
- Investigation Logs
- Discrepancies
- Connected Systems
- Synthetic/mock data

**Important:** Work on the existing StockTrace code. Do not rebuild it or create a generic chatbot/harness.

## 3. Users
**Primary:** warehouse picker/floor associate.  
**Secondary:** warehouse inventory supervisor/operations lead.

The picker experience must require minimal/zero training. Technical concepts belong in supervisor/audit views, not picker screens.

## 4. Core Problem
The warehouse system may say an SKU is available at a location, but the picker cannot find it. Investigation then becomes manual: rechecking the location, reviewing scanner activity, asking a supervisor, reviewing camera footage, searching nearby locations, physically verifying, and recording the discrepancy.

**Hypothesis:** Combining transaction and relevant visual evidence after a failed pick can reduce failed-pick resolution time compared with manual investigation.

## 5. Core Workflow
```text
FAILED PICK
→ Expected SKU / Location
→ Automatic StockTrace investigation
→ Scanner Evidence + Camera Evidence
→ Evidence Fusion
→ Candidate Locations
→ Rank Next Location
→ Evidence + Explanation
→ Worker Physical Verification
→ FOUND / NOT FOUND / PARTIALLY FOUND / WRONG QUANTITY / DAMAGED / ESCALATE
→ Resolution / Discrepancy
```

**Trust principle:** StockTrace recommends. Humans verify.

Never claim physical presence until a worker confirms it.

## 6. Picker UX
The picker enters StockTrace after a failed pick. Do not add Start Pick or manual expected-location entry.

Keep the simple flow:
1. **Open Cases**
2. **Finding Your Item** — automatic investigation
3. **What We Found / Try Location**
   - Scanner Evidence
   - Camera Evidence
   - TRY B07
   - View Video
4. **Verification**
   - Found
   - Not Found
   - and, where supported, Partially Found / Wrong Quantity / Damaged / Escalate

Use short, actionable language. Do not expose raw IDs, technical logs, embeddings, RAG terminology, or raw confidence percentages to pickers.

## 7. Camera Evidence
Camera evidence is part of V1, but production-grade live computer vision is out of scope.

The prototype may use controlled/pre-recorded footage or simulated camera events.

Example:
```text
14:32 — SKU-1042 detected leaving A12
14:34 — movement observed toward B07
14:35 — movement observed near B07
```

Use wording such as **“Camera evidence suggests movement toward B07.”**

Never state “SKU-1042 is definitely in B07.”

If authorized identity data exists, say **“Movement visually associated with Worker ID 184.”** Never accuse a worker.

Camera viewer should include:
- realistic warehouse CCTV appearance
- racks/bins/cartons/industrial environment
- camera ID
- date and time
- event markers where useful
- playback controls
- scrubber/timeline
- Back
- no horizontal overflow

Do not implement face recognition, employee surveillance, live multi-camera tracking, or production CCTV integration.

## 8. Evidence Model
**Recorded evidence:** WMS/ERP/scanner/inventory transactions → `RECORDED`

**Observed evidence:** camera/visual events → `OBSERVED`

Scanner evidence tells what was recorded. Camera evidence tells what was observed. Neither alone automatically proves physical location.

## 9. Evidence Fusion
Combine sources.

Example:
```text
Scanner: A12 → B07 recorded
Camera: A12 → B07 observed
→ strong corroboration
```

If sources disagree:
```text
Scanner: A12
Camera: movement toward C19
→ CONFLICTING
```

Do not arbitrarily select a location. Show the conflict and require verification/escalation according to configured rules.

## 10. Internal Support States
Use:
- `HIGH_SUPPORT`
- `MEDIUM_SUPPORT`
- `LOW_STALE`
- `CONFLICTING`
- `INSUFFICIENT_EVIDENCE`

These are primarily internal/supervisor states, not picker-facing scores.

Rules:
- High: transaction + camera corroborate.
- Medium: strong single source.
- Low/stale: old or weak evidence; show timestamp and require verification.
- Conflicting: sources disagree; do not guess.
- Insufficient: not enough evidence; say so and escalate where configured.

## 11. Guardrails
1. Never invent a location.
2. Never state inventory is physically present without human verification.
3. Never treat missing evidence as positive evidence.
4. Never hide conflicting evidence.
5. Never treat stale evidence as current.
6. Never invent a procedure.
7. Never blame a worker based only on visual association.
8. Never let the LLM override structured evidence.
9. Never let Gmail/email content determine inventory location.
10. If evidence is insufficient, explicitly say so.

Preferred language:
- “Scanner records show…”
- “Camera evidence suggests…”
- “The latest recorded movement was…”
- “Try B07”
- “Physical verification required”
- “Conflicting evidence”

Avoid “definitely,” “guaranteed,” and unsupported certainty.

## 12. Recommendation Logic
V1 should primarily use deterministic evidence logic based on:
- exact SKU
- recency
- source/destination
- movement type/status
- camera movement evidence
- previous discrepancy as supporting evidence

**Do not implement predictive ML in V1.**

No risk scores, Isolation Forest, XGBoost, autonomous audits, autonomous inventory correction, or autonomous order rerouting.

## 13. Human Verification
Worker verification is the final authority.

Outcomes:
- `FOUND`
- `NOT_FOUND`
- `PARTIALLY_FOUND`
- `WRONG_QUANTITY`
- `DAMAGED`
- `ESCALATE`

Verified outcomes become historical data for evaluation.

## 14. Data Flywheel
```text
Failed Pick
→ Recommendation
→ Worker Verification
→ Actual Outcome
→ Labeled Historical Data
→ Pattern Analysis
→ Future Predictive Models
```

## 15. SOP / RAG
RAG is a supporting capability for:
- approved warehouse SOP questions
- discrepancy procedures
- operational guidance

RAG must **not** be used to invent physical inventory locations.

```text
SOP Documents
→ Parsing
→ Chunks + Metadata
→ Retrieval
→ LLM
→ Answer + Citation
```

If no relevant SOP is found: **“No approved procedure was found for this question.”**

## 16. LLM Role
The LLM is a reasoning/explanation layer for:
- concise investigation explanations
- supervisor summaries
- SOP Q&A
- natural-language evidence explanations

It must not invent locations, movement events, quantities, worker actions, SOPs, or investigation results.

## 17. Gmail
Gmail is an **outbound notification/action tool**, not an evidence source.

Flow:
```text
StockTrace Investigation
→ Escalation / Conflict / Attention Required
→ Gmail
→ Supervisor / Configured Recipient
```

Possible emails:
- failed-pick escalation
- conflicting-evidence alert
- investigation summary

Example:
```text
Subject: StockTrace — Failed Pick Requires Attention — CASE-1042

Case: CASE-1042
SKU: SKU-1042
Expected Location: A12
Recommended Location: B07
Evidence: Scanner + Camera
Status: Verification Required

Action:
Please physically verify the recommended location.
```

For StockTrace, Gmail should support **sending**, not inbox reading.

Do not use Gmail content to investigate inventory.

Never hardcode credentials or expose them in UI/logs/GitHub.

**Important:** The original HelloPM generic harness used Gmail App Password authentication for a read-only Gmail capability. StockTrace has a different requirement: outbound email. Do not blindly copy the generic read-only implementation. Choose a secure outbound implementation compatible with the deployment environment.

## 18. Connectors
### Core
1. Inventory / WMS / ERP
2. Scanner
3. Camera
4. LLM

### Supporting
5. Gmail
6. SOP / Document retrieval

### Optional later
7. Google Sheets for logging/export

### Not required for V1
8. Web Search

Keep integrations modular and continue using mock/synthetic adapters for the prototype.

## 19. Harness Architecture
Follow the HelloPM principle: **the model is the brain; the harness is the body around it.**

The harness provides:
- tools/data access
- context
- permissions
- orchestration
- guardrails
- connector interfaces
- audit/logging

```text
WMS / ERP / Excel / CSV
        +
Scanner
        +
Camera
        ↓
Data Normalization
        ↓
Evidence Engine
        ↓
Evidence Fusion
        ↓
Candidate Locations
        ↓
Ranking / Guardrails
        ↓
LLM Explanation where appropriate
        ↓
Human Verification
        ↓
Resolution
        ↓
Gmail Notification when required
        ↓
Investigation / Audit Log
```

Suggested interfaces:
- `InventoryConnector`
- `ScannerConnector`
- `CameraConnector`
- `GmailConnector`
- `DocumentConnector`
- `LLMProvider`

## 20. Model Providers
The architecture may support:
- OpenAI
- Anthropic
- Google
- xAI

Only implement providers actually required/configured. Never expose provider API keys in the frontend.

## 21. Security
Never hardcode, commit, display, or log secrets.

Use environment variables/secrets. Before deployment, inspect the repository for accidental credentials.

## 22. UI Principles
Preserve the existing StockTrace design.

StockTrace should feel like a real warehouse operations tool, not an AI demo.

Avoid:
- long explanation cards
- AI jargon
- duplicate information
- unnecessary technical IDs
- raw confidence percentages in picker UI
- oversized fixed-width panels
- horizontal scrolling
- nested scrollbars

Supervisor views may expose more evidence detail, timestamps, investigation history, conflicts, verification outcomes, resolution time, and escalation state.

## 23. Metrics
**Primary:** Failed-pick resolution time — from failed pick entering StockTrace until physical verification or escalation.

Secondary:
- recommendation precision
- recommendation success rate
- resolution rate
- no-reliable-recommendation rate
- escalation rate
- unsupported recommendation rate

Compliance:
- evidence citation rate
- SOP citation compliance
- refusal compliance

Do not use a synthetic “91% risk” number as the primary success metric.

## 24. Evaluation Cases
Maintain:
- **E1:** recent confirmed movement → candidate surfaced
- **E2:** no evidence → refuse to guess
- **E3:** conflicting movement → show conflict/escalate
- **E4:** stale transaction → low/stale
- **E5:** worker rejects → not confirmed
- **E6:** wrong quantity → discrepancy
- **E7:** supervisor asks why → cite evidence
- **E8:** unsupported question → insufficient evidence
- **E9:** single stale/weak signal → low confidence + timestamp + verification
- **E10:** no matching SOP → no approved procedure found

For synthetic evaluation, hidden `true_location` may be used only to calculate evaluation quality. Never expose it to the engine or user.

## 25. Roadmap
**V1:** Failed-Pick Resolution — transaction + camera evidence → next location → human verification.

**V2:** Verification Copilot — historical discrepancy/verification patterns.

**V3:** Inventory Risk Radar — predictive ML based on verified outcomes.

**V4:** Vision-Assisted Movement Reconstruction.

Do not prematurely build later versions.

## 26. MVP Scope
### P0
- failed-pick case
- expected inventory/location
- scanner evidence
- camera evidence
- evidence fusion
- candidate locations
- recommendation
- evidence explanation
- physical verification
- resolution/discrepancy
- investigation logging

### P1
- supervisor explanation
- SOP/RAG
- Gmail notification

### Out of scope
- WMS replacement
- automatic inventory adjustment
- autonomous rerouting
- autonomous audit dispatch
- predictive ML
- production live CV
- face recognition
- employee surveillance
- hardware/RFID/drones

## 27. Development Method — IMPORTANT
Follow the HelloPM development approach.

**Do not implement this entire document in one prompt.**

For every step:
```text
Inspect
→ Plan the smallest logical change
→ Implement
→ Test
→ Report
→ STOP
```

Use extreme token discipline.

Do not modify unrelated files. Do not rewrite working components without a reason. Keep each step reviewable.

## 28. Antigravity Starting Instruction
After giving Antigravity this MD file, send:

> Hey, we need to continue building StockTrace V1.
>
> You are given this MD file as the master product/build specification and you also have the existing StockTrace codebase.
>
> First, inspect the existing code and compare it with this specification.
>
> Do NOT rebuild the product.
> Do NOT make changes yet.
>
> Tell me:
> 1. What is already implemented
> 2. What is partially implemented
> 3. What is missing
> 4. Any architecture/security issues that matter for deployment
> 5. The smallest logical next development step
>
> Keep extreme token discipline.
> Work one step at a time.
> Do not proceed to the next step until the current step has been reviewed and validated.

## 29. Deployment
Target: **Render**

```text
StockTrace Code
→ Local Testing
→ GitHub
→ Render
→ Live StockTrace URL
```

Before deployment:
- type-check
- build successfully
- test core workflows
- check environment variables
- ensure no secrets are committed
- test camera viewer
- test investigation
- test verification
- test supervisor views

For React/Vite, determine exact Render build/start configuration from the existing `package.json`. Do not use the Streamlit command from the generic HelloPM harness.

Only add environment variables actually required by the implementation.

## 30. Final Product Principle
StockTrace answers:

> **“The system says the item is here, but I can't find it. Where should I look next, and why?”**

The answer must be:
- evidence-based
- concise
- explainable
- human-verifiable
- safe when evidence is missing or conflicting

### Core loop
```text
FAILED PICK
→ FIND THE EVIDENCE
→ FIND THE NEXT LOCATION
→ VERIFY
→ RESOLVE
```

**STOCKTRACE — Inventory Movement & Location Intelligence**
