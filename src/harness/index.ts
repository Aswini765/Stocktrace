/**
 * StockTrace — Unified Domain-Specific Harness API
 * 
 * Orchestration, tool, context, and guardrail layer around the warehouse
 * failed-pick investigation workflow.
 * 
 * Architecture Pipeline:
 * WMS / ERP / CSV
 *       +
 * Scanner + Camera
 *       ↓
 * Input / Adapter Boundary (inventory_adapter.ts)
 *       ↓
 * Evidence Normalization (evidence_normalizer.ts)
 *       ↓
 * Evidence Fusion (evidence_fusion.ts)
 *       ↓
 * Candidate Generation + Ranking (candidate_engine.ts)
 *       ↓
 * Safety Guardrails (guardrails.ts)
 *       ↓
 * Grounded LLM Explanation (explanation_engine.ts)
 *       ↓
 * Human Verification (case_engine.ts)
 *       ↓
 * Resolution / Discrepancy Record (guardrails.ts)
 *       ↓
 * Gmail Notification + Audit Trail (services/email)
 */

import { stockTraceEngine, InvestigationExecutionResult, UserRole } from './case_engine';
import { RawScannerInput, RawCameraInput, normalizeEvidenceCollection } from './evidence_normalizer';
import { ScannerEvidence, CameraEvidenceEvent, WorkerVerificationOutcome, HarnessCaseModel, DiscrepancyRecord } from './types';
import { sopService } from '../services/sop/sop_service';
import { SopQueryResult } from '../services/sop/types';
import { runStockTraceEvaluationSuite } from './eval_runner';
import { stockTraceNotifier, EmailTriggerContext, SendEmailResult } from '../services/email';

// Re-export Core Domain Types
export * from './types';
export * from './evidence_normalizer';
export * from './evidence_fusion';
export * from './candidate_engine';
export * from './guardrails';
export * from './explanation_engine';
export * from './inventory_adapter';
export { stockTraceEngine, StockTraceCaseEngine, type InvestigationExecutionResult, type UserRole } from './case_engine';

/**
 * Main Pipeline Entrypoint 1: Run Investigation
 * Normalizes signals, fuses scanner + camera, computes candidate rankings,
 * verifies safety guardrails, and attaches a grounded explanation.
 */
export function runInvestigation(
  caseId: string,
  scannerRecords: (RawScannerInput | ScannerEvidence)[],
  cameraRecords: (RawCameraInput | CameraEvidenceEvent)[],
  options?: {
    forceScenario?: 'happy-path' | 'conflict' | 'no-camera';
    isStale?: boolean;
    referenceNow?: Date | number | string;
    operatorRole?: UserRole;
  }
): InvestigationExecutionResult {
  return stockTraceEngine.runInvestigation(caseId, scannerRecords, cameraRecords, options);
}

/**
 * Main Pipeline Entrypoint 2: Verify Case (Human-in-the-Loop)
 * Records floor picker or supervisor verification, creates discrepancy records
 * if partial/wrong-qty/damaged, and maintains strict immutability.
 */
export function verifyCase(params: {
  caseId: string;
  outcome: WorkerVerificationOutcome;
  verifiedLocation?: string;
  actualQuantity?: number;
  notes?: string;
  role?: UserRole;
}): {
  caseModel: HarnessCaseModel;
  discrepancy?: DiscrepancyRecord;
} {
  return stockTraceEngine.recordWorkerVerification(params);
}

/**
 * Main Pipeline Entrypoint 3: SOP / Operational Guidance Query
 * Strictly grounded in approved warehouse SOPs.
 * Refuses physical location queries with: "No approved procedure was found for this question."
 */
export function querySop(query: string): SopQueryResult {
  return sopService.querySop(query);
}

/**
 * Main Pipeline Entrypoint 4: Automated Evaluation Suite
 * Executes Section 24 test cases E1 through E10.
 */
export function evaluateSuite() {
  return runStockTraceEvaluationSuite();
}

/**
 * Main Pipeline Entrypoint 5: Outbound Escalation Dispatch
 * Dispatches audit notifications to warehouse supervisors via Gmail connector.
 */
export async function notifyEscalation(context: EmailTriggerContext, recipient?: string): Promise<SendEmailResult> {
  return stockTraceNotifier.notifyEscalationRequired(context, recipient);
}
