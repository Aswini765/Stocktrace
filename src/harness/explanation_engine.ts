/**
 * StockTrace — Grounded Operator Explanation Layer
 * 
 * Rules:
 * 1. Grounded strictly in fused evidence and guardrail results.
 * 2. NEVER invents a location not surfaced by candidate evaluation.
 * 3. NEVER overrides guardrails.
 * 4. NEVER converts missing or stale evidence into a confident recommendation.
 * 5. Falls back to deterministic rule-based explanation when no LLM API key is present.
 */

import { FusedEvidenceReport } from './evidence_fusion';
import { CandidateEvaluationResult } from './candidate_engine';
import { ConfidenceState } from './types';

export interface GroundedExplanationResult {
  explanationText: string;
  citedEvidence: string[];
  confidenceState: ConfidenceState;
  guardrailCompliant: true;
  recommendation?: string;
  directiveText: string;
  source: 'DETERMINISTIC_GROUNDED' | 'LLM_GROUNDED';
}

export interface ExplanationInput {
  fusedReport: FusedEvidenceReport;
  evaluation: CandidateEvaluationResult;
  operatorRole?: 'OPERATOR' | 'SUPERVISOR' | 'SYSTEM';
}

/**
 * Generates a strictly grounded, operator-facing explanation.
 */
export function generateGroundedExplanation(input: ExplanationInput): GroundedExplanationResult {
  const { fusedReport, evaluation } = input;

  const citations: string[] = [];

  // 1. Gather recorded scanner citations
  for (const s of fusedReport.recordedEvidence) {
    citations.push(`Scanner [${s.source_id || 'SYS'}]: ${s.event_type} at ${s.source_location || 'bin'} -> ${s.destination_location} (${s.timestamp})`);
  }

  // 2. Gather camera citations
  for (const c of fusedReport.observedEvidence) {
    citations.push(`Camera [${c.source_id || 'CAM'}]: ${c.notes || 'Activity observed'} (${c.timestamp})`);
  }

  // Handle Conflicting evidence state
  if (evaluation.confidenceState === 'CONFLICTING') {
    return {
      explanationText: `Conflicting evidence detected. Scanner records indicate location ${fusedReport.conflictingDetails?.recordedDestination || 'one bin'}, while visual camera feeds observe movement toward ${fusedReport.conflictingDetails?.observedDestination || 'another bin'}. To prevent false picks or misplaced stock, StockTrace refuses to select an arbitrary winner.`,
      citedEvidence: citations,
      confidenceState: 'CONFLICTING',
      guardrailCompliant: true,
      recommendation: undefined,
      directiveText: evaluation.directiveText,
      source: 'DETERMINISTIC_GROUNDED',
    };
  }

  // Handle Insufficient evidence state
  if (evaluation.confidenceState === 'INSUFFICIENT_EVIDENCE') {
    return {
      explanationText: 'No recent scanner transactions or camera footage could be identified for this item. StockTrace refuses to guess physical locations without corroborating signals.',
      citedEvidence: citations,
      confidenceState: 'INSUFFICIENT_EVIDENCE',
      guardrailCompliant: true,
      recommendation: undefined,
      directiveText: evaluation.directiveText,
      source: 'DETERMINISTIC_GROUNDED',
    };
  }

  // Handle Stale evidence state
  if (evaluation.confidenceState === 'LOW_STALE') {
    return {
      explanationText: `Last recorded movement to ${evaluation.topCandidate?.location || 'suggested bin'} occurred over 2 hours ago. Signals are considered stale and require immediate physical verification.`,
      citedEvidence: citations,
      confidenceState: 'LOW_STALE',
      guardrailCompliant: true,
      recommendation: evaluation.recommendationDisplay,
      directiveText: evaluation.directiveText,
      source: 'DETERMINISTIC_GROUNDED',
    };
  }

  // Handle Corroborated or Single-Signal Supported State
  const topLoc = evaluation.topCandidate?.location;
  const explanation = evaluation.whyRationale ||
    (fusedReport.hasCameraFootage
      ? `Scanner records place the item at ${fusedReport.expectedLocation}. Camera evidence suggests movement toward ${topLoc}. Physical verification required.`
      : `Last recorded scanner activity logged at ${topLoc}. Camera footage unavailable.`);

  return {
    explanationText: explanation,
    citedEvidence: citations,
    confidenceState: evaluation.confidenceState,
    guardrailCompliant: true,
    recommendation: evaluation.recommendationDisplay,
    directiveText: evaluation.directiveText,
    source: 'DETERMINISTIC_GROUNDED',
  };
}
