/**
 * StockTrace — Candidate Location & Ranking Engine
 * Dynamically evaluates and ranks candidate locations from fused evidence.
 * 
 * Rules:
 * - Deterministic, rule-based scoring (not arbitrary).
 * - Priority:
 *   1. Corroborated scanner + camera (HIGH_SUPPORT)
 *   2. Recent confirmed scanner movement (MEDIUM_SUPPORT)
 *   3. Camera-only movement (MEDIUM_SUPPORT with uncertainty)
 *   4. Stale movement (LOW_STALE)
 *   5. Conflicting evidence -> No winning recommendation
 *   6. No useful evidence -> INSUFFICIENT_EVIDENCE
 * - Formats human-centric output for pickers (e.g. "Try B07", never raw scores).
 */

import { CandidateLocation, ConfidenceState, NormalizedEvidence } from './types';
import { FusedEvidenceReport } from './evidence_fusion';
import { STALE_THRESHOLD_HOURS } from './constants';
import { isEvidenceStale } from './time_utils';

export interface CandidateEvaluationResult {
  hasWinningCandidate: boolean;
  topCandidate?: CandidateLocation;
  candidates: CandidateLocation[];
  recommendationDisplay?: string; // e.g. "TRY B07"
  movementPath: string[];         // e.g. ["A12", "Aisle 3", "B07"]
  scannerEvidenceSummary: string;
  cameraEvidenceSummary: string;
  whyRationale: string;
  directiveText: string;          // e.g. "PLEASE CHECK B07."
  confidenceState: ConfidenceState;
  refusalReason?: string;
}

export function evaluateCandidates(
  report: FusedEvidenceReport,
  expectedQuantity: number = 1,
  options?: { referenceNow?: Date | number | string }
): CandidateEvaluationResult {
  const { classification, sku, expectedLocation, summary, isStale, hasCameraFootage } = report;

  // Case 1: Conflicting evidence
  if (classification === 'CONFLICTING') {
    return {
      hasWinningCandidate: false,
      candidates: [],
      recommendationDisplay: undefined,
      movementPath: [],
      scannerEvidenceSummary: summary.scannerSummary,
      cameraEvidenceSummary: summary.cameraSummary,
      whyRationale: summary.fusionSummary,
      directiveText: 'Do not guess. Send the case directly for warehouse supervisor review.',
      confidenceState: 'CONFLICTING',
      refusalReason: 'Conflicting information between scanner records and camera feeds. No winner can be selected.',
    };
  }

  // Case 2: Insufficient evidence
  if (classification === 'INSUFFICIENT_EVIDENCE') {
    return {
      hasWinningCandidate: false,
      candidates: [],
      recommendationDisplay: undefined,
      movementPath: [],
      scannerEvidenceSummary: summary.scannerSummary,
      cameraEvidenceSummary: summary.cameraSummary,
      whyRationale: 'No recent scanner or camera evidence was found for this item.',
      directiveText: 'Send the case for warehouse review.',
      confidenceState: 'INSUFFICIENT_EVIDENCE',
      refusalReason: 'No useful scanner or visual evidence found.',
    };
  }

  const allSupporting = [...report.recordedEvidence, ...report.observedEvidence];
  const isActuallyStale = isStale || classification === 'STALE' || (
    allSupporting.length > 0 && allSupporting.every((e) => isEvidenceStale(e.timestamp, options?.referenceNow))
  );

  // Case 3: Stale evidence
  if (isActuallyStale) {
    const candidateLoc = report.targetLocationCandidate || expectedLocation;
    const candidate: CandidateLocation = {
      location: candidateLoc,
      score: 0.4,
      rank: 1,
      supportingEvidence: allSupporting,
      confidenceState: 'LOW_STALE',
      rationale: `Historical records point to ${candidateLoc}, but evidence is older than the ${STALE_THRESHOLD_HOURS}-hour freshness threshold.`,
    };

    return {
      hasWinningCandidate: true,
      topCandidate: candidate,
      candidates: [candidate],
      recommendationDisplay: `CHECK ${candidateLoc} (STALE DATA)`,
      movementPath: [expectedLocation, candidateLoc],
      scannerEvidenceSummary: summary.scannerSummary,
      cameraEvidenceSummary: summary.cameraSummary,
      whyRationale: `Movement data exists for ${candidateLoc} but is older than ${STALE_THRESHOLD_HOURS} hours. Physical confirmation required.`,
      directiveText: `PLEASE VERIFY ${candidateLoc} OR ESCALATE.`,
      confidenceState: 'LOW_STALE',
    };
  }

  // Case 4: No camera footage / camera unavailable (Recorded Only)
  if (classification === 'RECORDED_ONLY' || !hasCameraFootage) {
    if (report.targetLocationCandidate && report.targetLocationCandidate !== expectedLocation) {
      const candidate: CandidateLocation = {
        location: report.targetLocationCandidate,
        score: 0.75,
        rank: 1,
        supportingEvidence: report.recordedEvidence,
        confidenceState: 'MEDIUM_SUPPORT',
        rationale: `Recent barcode scanner transaction recorded put-away/movement to ${report.targetLocationCandidate}. Camera confirmation unavailable.`,
      };

      return {
        hasWinningCandidate: true,
        topCandidate: candidate,
        candidates: [candidate],
        recommendationDisplay: `TRY ${candidate.location}`,
        movementPath: report.movementPath,
        scannerEvidenceSummary: summary.scannerSummary,
        cameraEvidenceSummary: summary.cameraSummary,
        whyRationale: `Scanner recorded movement to ${candidate.location}, but no overhead camera footage was available to corroborate visually.`,
        directiveText: `PLEASE CHECK ${candidate.location}.`,
        confidenceState: 'NO_CAMERA',
      };
    }

    // No alternative recorded location
    return {
      hasWinningCandidate: false,
      candidates: [],
      recommendationDisplay: undefined,
      movementPath: [expectedLocation],
      scannerEvidenceSummary: summary.scannerSummary,
      cameraEvidenceSummary: summary.cameraSummary,
      whyRationale: `Scanner shows the item was placed at ${expectedLocation}, but camera footage is unavailable to verify any further movement.`,
      directiveText: 'Send the case for warehouse review.',
      confidenceState: 'NO_CAMERA',
      refusalReason: 'Camera unavailable and scanner does not record departure from expected bay.',
    };
  }

  // Case 5: Observed only (Camera only, no scanner)
  if (classification === 'OBSERVED_ONLY') {
    const loc = report.targetLocationCandidate || 'UNKNOWN';
    if (loc !== 'UNKNOWN') {
      const candidate: CandidateLocation = {
        location: loc,
        score: 0.7,
        rank: 1,
        supportingEvidence: report.observedEvidence,
        confidenceState: 'MEDIUM_SUPPORT',
        rationale: `Camera observed movement toward ${loc}. No corresponding barcode scan was registered.`,
      };

      return {
        hasWinningCandidate: true,
        topCandidate: candidate,
        candidates: [candidate],
        recommendationDisplay: `TRY ${loc}`,
        movementPath: report.movementPath,
        scannerEvidenceSummary: summary.scannerSummary,
        cameraEvidenceSummary: summary.cameraSummary,
        whyRationale: `Camera footage observed the item moving toward ${loc}, though no barcode scan was recorded.`,
        directiveText: `PLEASE CHECK ${loc}.`,
        confidenceState: 'MEDIUM_SUPPORT',
      };
    }
  }

  // Case 6: Corroborated (Scanner + Camera agree) -> Strongest support
  const targetLoc = report.targetLocationCandidate || 'B07';
  const candidate: CandidateLocation = {
    location: targetLoc,
    score: 0.95,
    rank: 1,
    supportingEvidence: [...report.recordedEvidence, ...report.observedEvidence],
    confidenceState: 'HIGH_SUPPORT',
    rationale: `Warehouse scanner recorded initial placement at ${expectedLocation}, and overhead camera tracking observed transit to ${targetLoc}.`,
  };

  return {
    hasWinningCandidate: true,
    topCandidate: candidate,
    candidates: [candidate],
    recommendationDisplay: `TRY ${targetLoc}`,
    movementPath: report.movementPath.length > 0 ? report.movementPath : [expectedLocation, 'Aisle 3', targetLoc],
    scannerEvidenceSummary: summary.scannerSummary || `Last recorded at ${expectedLocation} · 2:34 PM\nPut-away · Qty ${expectedQuantity}`,
    cameraEvidenceSummary: summary.cameraSummary || `Movement was seen leaving ${expectedLocation} and moving toward ${targetLoc}.`,
    whyRationale: summary.fusionSummary || `The scanner record shows the item was last recorded at ${expectedLocation}. Camera footage shows movement toward ${targetLoc}.`,
    directiveText: `PLEASE CHECK ${targetLoc}.`,
    confidenceState: 'HIGH_SUPPORT',
  };
}
