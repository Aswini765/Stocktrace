/**
 * StockTrace — Guardrails & Trust Layer
 * Enforces mandatory safety, operational, and attribution rules.
 * 
 * Rules:
 * - RULE 1: Never state inventory is physically present unless worker verifies FOUND.
 * - RULE 2: Every recommendation must have supporting evidence.
 * - RULE 3: Every recommendation must have an internal timestamp and source.
 * - RULE 4: Missing evidence -> do not guess.
 * - RULE 5: Stale evidence -> show stale/low support -> require physical verification.
 * - RULE 6: Conflicting evidence -> show conflict -> do not select a winner -> escalate.
 * - RULE 7: Camera unavailable -> continue using scanner evidence if sufficient, else return insufficient evidence.
 * - RULE 8: Worker selects NOT_FOUND -> recommendation is NOT confirmed -> record outcome & escalate.
 * - RULE 9: Worker reports WRONG_QUANTITY or PARTIALLY_FOUND -> record discrepancy.
 * - RULE 10: Unsupported inference -> refuse recommendation.
 * - RULE 11: Neutral attribution only (e.g. "Movement is visually associated with Worker ID 184.", never blame).
 * - RULE 12: No automatic inventory adjustment.
 */

import {
  CandidateLocation,
  WorkerVerificationOutcome,
  DiscrepancyRecord,
  NormalizedEvidence,
} from './types';
import { CandidateEvaluationResult } from './candidate_engine';

export interface GuardrailValidation {
  isPermitted: boolean;
  sanitizedEvaluation: CandidateEvaluationResult;
  violations: string[];
}

export interface VerificationProcessingResult {
  accepted: boolean;
  outcome: WorkerVerificationOutcome;
  status: 'Resolved' | 'Escalated';
  discrepancyRecord?: DiscrepancyRecord;
  auditMessage: string;
  automaticInventoryAdjusted: false; // RULE 12: Strictly false
}

/**
 * Validates candidate evaluation against safety guardrails before displaying to workers.
 */
export function applyGuardrails(
  evaluation: CandidateEvaluationResult,
  evidence: NormalizedEvidence[]
): GuardrailValidation {
  const violations: string[] = [];

  // RULE 6: Conflicting evidence check
  if (evaluation.confidenceState === 'CONFLICTING') {
    if (evaluation.hasWinningCandidate || evaluation.recommendationDisplay) {
      violations.push('RULE 6 VIOLATION: A winning candidate was proposed despite conflicting evidence.');
      return {
        isPermitted: false,
        sanitizedEvaluation: {
          ...evaluation,
          hasWinningCandidate: false,
          topCandidate: undefined,
          recommendationDisplay: undefined,
          directiveText: 'Do not guess. Send the case directly for warehouse supervisor review.',
        },
        violations,
      };
    }
  }

  // RULE 4 & RULE 10: Missing evidence or unsupported inference
  if (evaluation.confidenceState === 'INSUFFICIENT_EVIDENCE' || evidence.length === 0) {
    if (evaluation.hasWinningCandidate || evaluation.recommendationDisplay) {
      violations.push('RULE 4/10 VIOLATION: Recommendation made without supporting evidence.');
      return {
        isPermitted: false,
        sanitizedEvaluation: {
          ...evaluation,
          hasWinningCandidate: false,
          topCandidate: undefined,
          recommendationDisplay: undefined,
          directiveText: 'Send the case for warehouse review.',
        },
        violations,
      };
    }
  }

  // RULE 2 & 3: Recommendation must have supporting evidence, timestamp, and source
  if (evaluation.hasWinningCandidate && evaluation.topCandidate) {
    const candidate = evaluation.topCandidate;
    if (!candidate.supportingEvidence || candidate.supportingEvidence.length === 0) {
      violations.push('RULE 2 VIOLATION: Candidate has no supporting evidence attached.');
      return {
        isPermitted: false,
        sanitizedEvaluation: {
          ...evaluation,
          hasWinningCandidate: false,
          topCandidate: undefined,
          recommendationDisplay: undefined,
        },
        violations,
      };
    }

    const hasTimestampAndSource = candidate.supportingEvidence.every(
      (e) => Boolean(e.timestamp) && Boolean(e.source_id)
    );
    if (!hasTimestampAndSource) {
      violations.push('RULE 3 VIOLATION: Supporting evidence lacks timestamp or source.');
    }

    // RULE 5: Stale evidence must not become HIGH_SUPPORT
    if (evaluation.confidenceState === 'LOW_STALE' || candidate.confidenceState === 'LOW_STALE') {
      if (candidate.score > 0.40) {
        candidate.score = 0.40;
      }
      if (candidate.confidenceState === 'HIGH_SUPPORT') {
        violations.push('RULE 5 VIOLATION: Stale evidence cannot produce HIGH_SUPPORT.');
        candidate.confidenceState = 'LOW_STALE';
      }
    }
  }

  // RULE 11: Sanitize worker attribution in summaries and notes
  const sanitizedScanner = sanitizeWorkerAttribution(evaluation.scannerEvidenceSummary);
  const sanitizedCamera = sanitizeWorkerAttribution(evaluation.cameraEvidenceSummary);
  const sanitizedWhy = sanitizeWorkerAttribution(evaluation.whyRationale);

  return {
    isPermitted: violations.length === 0,
    sanitizedEvaluation: {
      ...evaluation,
      scannerEvidenceSummary: sanitizedScanner,
      cameraEvidenceSummary: sanitizedCamera,
      whyRationale: sanitizedWhy,
    },
    violations,
  };
}

/**
 * Enforces Rule 11: Neutral wording for worker and device associations.
 */
export function sanitizeWorkerAttribution(text: string): string {
  if (!text) return '';
  return text
    .replace(/worker\s+(\w+)\s+(misplaced|lost|stole|dropped|erred\s+with)/gi, 'Movement is visually associated with Worker ID $1')
    .replace(/user\s+(\w+)\s+caused/gi, 'Device associated with ID $1')
    .replace(/operator\s+(\w+)\s+fault/gi, 'Movement associated with Operator $1');
}

/**
 * Handles worker verification results (Rules 1, 8, 9, 12).
 */
export function processVerificationOutcome(params: {
  caseId: string;
  sku: string;
  expectedLocation: string;
  recommendedLocation?: string;
  expectedQuantity: number;
  actualQuantity?: number;
  outcome: WorkerVerificationOutcome;
  notes?: string;
}): VerificationProcessingResult {
  const {
    caseId,
    sku,
    expectedLocation,
    recommendedLocation,
    expectedQuantity,
    actualQuantity = 0,
    outcome,
  } = params;

  // RULE 12: StockTrace NEVER autonomously adjusts WMS inventory balance
  const automaticInventoryAdjusted = false;

  // RULE 1: Only physically verified as FOUND when the worker clicks FOUND
  if (outcome === 'FOUND') {
    return {
      accepted: true,
      outcome: 'FOUND',
      status: 'Resolved',
      auditMessage: `Worker physically verified item presence at ${recommendedLocation || expectedLocation}. Case resolved.`,
      automaticInventoryAdjusted,
    };
  }

  // RULE 8: Worker selects NOT_FOUND -> Recommendation is unconfirmed; escalate case
  if (outcome === 'NOT_FOUND') {
    const discrepancy: DiscrepancyRecord = {
      case_id: caseId,
      sku,
      expected_location: expectedLocation,
      recommended_location: recommendedLocation,
      verification_result: 'NOT_FOUND',
      expected_quantity: expectedQuantity,
      found_quantity: 0,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      evidence_summary: `Item not found at recommended location ${recommendedLocation || '—'}. Physical audit needed.`,
      status: 'ESCALATED',
    };

    return {
      accepted: true,
      outcome: 'NOT_FOUND',
      status: 'Escalated',
      discrepancyRecord: discrepancy,
      auditMessage: `Worker physically checked ${recommendedLocation || expectedLocation} and reported NOT FOUND. Case escalated to supervisor queue.`,
      automaticInventoryAdjusted,
    };
  }

  // RULE 9: WRONG_QUANTITY / PARTIALLY_FOUND / DAMAGED
  if (outcome === 'WRONG_QUANTITY' || outcome === 'PARTIALLY_FOUND' || outcome === 'DAMAGED') {
    const discrepancy: DiscrepancyRecord = {
      case_id: caseId,
      sku,
      expected_location: expectedLocation,
      recommended_location: recommendedLocation,
      verification_result: outcome,
      expected_quantity: expectedQuantity,
      found_quantity: actualQuantity,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      evidence_summary: `Quantity/condition discrepancy reported by worker: expected ${expectedQuantity}, found ${actualQuantity} (${outcome}).`,
      status: 'AUDIT_PENDING',
    };

    return {
      accepted: true,
      outcome,
      status: 'Escalated',
      discrepancyRecord: discrepancy,
      auditMessage: `Worker reported ${outcome} at ${recommendedLocation || expectedLocation}. Audit discrepancy logged.`,
      automaticInventoryAdjusted,
    };
  }

  // Default escalation
  return {
    accepted: true,
    outcome: 'ESCALATE',
    status: 'Escalated',
    auditMessage: `Case manually or automatically escalated for warehouse supervisor review.`,
    automaticInventoryAdjusted,
  };
}
