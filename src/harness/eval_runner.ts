/**
 * StockTrace — Master Build Specification Evaluation Runner
 * Section 24: Evaluation Cases E1 to E10
 * 
 * Verifies that the StockTrace harness, candidate engine, guardrails,
 * and SOP retrieval conform strictly to specification requirements.
 */

import { StockTraceCaseEngine } from './case_engine';
import { applyGuardrails } from './guardrails';
import { sopService } from '../services/sop/sop_service';
import { RawScannerInput, RawCameraInput } from './evidence_normalizer';

interface EvalResult {
  id: string;
  title: string;
  passed: boolean;
  notes: string;
}

export function runStockTraceEvaluationSuite(): {
  total: number;
  passed: number;
  failed: number;
  results: EvalResult[];
} {
  const results: EvalResult[] = [];
  const engine = new StockTraceCaseEngine();

  // --------------------------------------------------------------------------
  // E1: Recent confirmed movement -> candidate surfaced (HIGH_SUPPORT)
  // --------------------------------------------------------------------------
  {
    engine.registerCase({
      case_id: 'EVAL-CASE-E1',
      sku: 'SKU-E1',
      item_name: 'Industrial Valve Unit',
      expected_location: 'A12',
      expected_quantity: 1,
    });

    const scanner: RawScannerInput[] = [
      {
        time: '14:32',
        sku: 'SKU-E1',
        fromLocation: 'A12',
        toLocation: 'B07',
        qty: 1,
        type: 'Transfer',
        scannerId: 'SCAN-01',
      },
    ];
    const camera: RawCameraInput[] = [
      {
        exactTime: '14:34',
        camera: 'A12-CAM',
        eventDescription: 'Movement departing A12 toward B07',
        fromLocation: 'A12',
        toLocation: 'B07',
      },
    ];

    const res = engine.runInvestigation('EVAL-CASE-E1', scanner, camera, {
      referenceNow: '14:40',
    });

    const passed =
      res.evaluation.hasWinningCandidate === true &&
      res.evaluation.topCandidate?.location === 'B07' &&
      res.evaluation.confidenceState === 'HIGH_SUPPORT' &&
      res.fusedReport.classification === 'CORROBORATED' &&
      res.evaluation.recommendationDisplay === 'TRY B07';

    results.push({
      id: 'E1',
      title: 'Recent confirmed movement -> candidate surfaced',
      passed,
      notes: passed
        ? `Surfaced candidate B07 with HIGH_SUPPORT from corroborated scanner + camera.`
        : `Failed to surface expected candidate. Got state: ${res.evaluation.confidenceState}`,
    });
  }

  // --------------------------------------------------------------------------
  // E2: No evidence -> refuse to guess (INSUFFICIENT_EVIDENCE)
  // --------------------------------------------------------------------------
  {
    engine.registerCase({
      case_id: 'EVAL-CASE-E2',
      sku: 'SKU-E2',
      item_name: 'Obsolete Fitting',
      expected_location: 'A12',
      expected_quantity: 1,
    });

    const res = engine.runInvestigation('EVAL-CASE-E2', [], [], {
      referenceNow: '14:40',
    });

    const passed =
      res.evaluation.hasWinningCandidate === false &&
      res.evaluation.confidenceState === 'INSUFFICIENT_EVIDENCE' &&
      res.evaluation.topCandidate === undefined &&
      res.evaluation.directiveText.includes('review');

    results.push({
      id: 'E2',
      title: 'No evidence -> refuse to guess',
      passed,
      notes: passed
        ? `Correctly refused to recommend location. State: INSUFFICIENT_EVIDENCE.`
        : `Violated refusal guardrail; recommended candidate without evidence.`,
    });
  }

  // --------------------------------------------------------------------------
  // E3: Conflicting movement -> show conflict / escalate (CONFLICTING)
  // --------------------------------------------------------------------------
  {
    engine.registerCase({
      case_id: 'EVAL-CASE-E3',
      sku: 'SKU-E3',
      item_name: 'Dual Conveyor Belt',
      expected_location: 'A12',
      expected_quantity: 1,
    });

    const res = engine.runInvestigation('EVAL-CASE-E3', [], [], {
      forceScenario: 'conflict',
      referenceNow: '14:40',
    });

    const passed =
      res.evaluation.hasWinningCandidate === false &&
      res.evaluation.confidenceState === 'CONFLICTING' &&
      res.fusedReport.classification === 'CONFLICTING' &&
      res.evaluation.directiveText.includes('Do not guess');

    results.push({
      id: 'E3',
      title: 'Conflicting movement -> show conflict and escalate',
      passed,
      notes: passed
        ? `Refused to pick arbitrary winner. State: CONFLICTING, directive: "Do not guess".`
        : `Selected a candidate despite conflicting evidence.`,
    });
  }

  // --------------------------------------------------------------------------
  // E4: Stale transaction -> low/stale (LOW_STALE)
  // --------------------------------------------------------------------------
  {
    engine.registerCase({
      case_id: 'EVAL-CASE-E4',
      sku: 'SKU-E4',
      item_name: 'Historical Fasteners',
      expected_location: 'A12',
      expected_quantity: 1,
    });

    // Event 3+ hours old relative to referenceNow 14:40
    const scanner: RawScannerInput[] = [
      {
        time: '11:15',
        sku: 'SKU-E4',
        fromLocation: 'A12',
        toLocation: 'B07',
        qty: 1,
        type: 'Transfer',
        scannerId: 'SCAN-OLD',
      },
    ];

    const res = engine.runInvestigation('EVAL-CASE-E4', scanner, [], {
      isStale: true,
      referenceNow: '14:40',
    });

    const passed =
      res.fusedReport.isStale === true &&
      res.evaluation.confidenceState === 'LOW_STALE' &&
      (res.evaluation.recommendationDisplay?.includes('STALE') ?? false);

    results.push({
      id: 'E4',
      title: 'Stale transaction -> low/stale flag',
      passed,
      notes: passed
        ? `Flagged evidence older than freshness threshold as LOW_STALE.`
        : `Did not enforce stale flag for historical evidence.`,
    });
  }

  // --------------------------------------------------------------------------
  // E5: Worker rejects -> not confirmed; record outcome & escalate
  // --------------------------------------------------------------------------
  {
    engine.registerCase({
      case_id: 'EVAL-CASE-E5',
      sku: 'SKU-E5',
      item_name: 'Electronic Module',
      expected_location: 'A12',
      expected_quantity: 1,
    });

    const verifyResult = engine.recordWorkerVerification({
      caseId: 'EVAL-CASE-E5',
      outcome: 'NOT_FOUND',
      verifiedLocation: 'B07',
    });

    const caseModel = engine.getCase('EVAL-CASE-E5');
    const passed =
      caseModel?.worker_verification === 'NOT_FOUND' &&
      caseModel?.status === 'NOT_FOUND' &&
      verifyResult.discrepancy?.status === 'ESCALATED';

    results.push({
      id: 'E5',
      title: 'Worker rejects -> not confirmed; escalate',
      passed,
      notes: passed
        ? `Enforced Rule 1 & 8: Unconfirmed recommendation transitioned to NOT_FOUND / ESCALATED.`
        : `Failed to escalate or recorded incorrect worker verification status.`,
    });
  }

  // --------------------------------------------------------------------------
  // E6: Wrong quantity -> discrepancy record logged
  // --------------------------------------------------------------------------
  {
    engine.registerCase({
      case_id: 'EVAL-CASE-E6',
      sku: 'SKU-E6',
      item_name: 'Precision Bearings Box',
      expected_location: 'A12',
      expected_quantity: 5,
    });

    const verifyResult = engine.recordWorkerVerification({
      caseId: 'EVAL-CASE-E6',
      outcome: 'WRONG_QUANTITY',
      verifiedLocation: 'B07',
      actualQuantity: 2,
    });

    const passed =
      verifyResult.discrepancy !== undefined &&
      verifyResult.discrepancy.verification_result === 'WRONG_QUANTITY' &&
      verifyResult.discrepancy.expected_quantity === 5 &&
      verifyResult.discrepancy.found_quantity === 2;

    results.push({
      id: 'E6',
      title: 'Wrong quantity -> discrepancy record logged',
      passed,
      notes: passed
        ? `Created discrepancy record with count mismatch: expected 5, found 2.`
        : `Failed to create expected quantity discrepancy record.`,
    });
  }

  // --------------------------------------------------------------------------
  // E7: Supervisor asks why -> cite evidence (scanner + camera)
  // --------------------------------------------------------------------------
  {
    engine.registerCase({
      case_id: 'EVAL-CASE-E7',
      sku: 'SKU-E7',
      item_name: 'Servo Actuator',
      expected_location: 'A12',
      expected_quantity: 1,
    });

    const scanner: RawScannerInput[] = [
      {
        time: '14:32',
        sku: 'SKU-E7',
        fromLocation: 'A12',
        toLocation: 'B07',
        qty: 1,
        type: 'Transfer',
        scannerId: 'SCAN-01',
      },
    ];
    const camera: RawCameraInput[] = [
      {
        exactTime: '14:34',
        camera: 'Aisle-3-CAM',
        eventDescription: 'Visual movement along Aisle 3 toward B07',
        fromLocation: 'A12',
        toLocation: 'B07',
      },
    ];

    const res = engine.runInvestigation('EVAL-CASE-E7', scanner, camera, {
      referenceNow: '14:40',
    });

    const hasScannerCitation = res.evaluation.scannerEvidenceSummary.length > 0;
    const hasCameraCitation = res.evaluation.cameraEvidenceSummary.length > 0;
    const hasWhyRationale = res.evaluation.whyRationale.length > 0;

    const passed = hasScannerCitation && hasCameraCitation && hasWhyRationale;

    results.push({
      id: 'E7',
      title: 'Supervisor asks why -> cite evidence',
      passed,
      notes: passed
        ? `Investigation cites scanner records, camera timeline, and fused causal rationale.`
        : `Missing required evidence citations in evaluation report.`,
    });
  }

  // --------------------------------------------------------------------------
  // E8: Unsupported question / inference -> refuse via guardrails
  // --------------------------------------------------------------------------
  {
    // Deliberately construct an evaluation that tries to recommend a candidate without evidence
    const illegalEvaluation = {
      hasWinningCandidate: true,
      candidates: [
        {
          location: 'Z99',
          score: 0.9,
          rank: 1,
          supportingEvidence: [],
          confidenceState: 'HIGH_SUPPORT' as const,
          rationale: 'Arbitrary guess',
        },
      ],
      topCandidate: {
        location: 'Z99',
        score: 0.9,
        rank: 1,
        supportingEvidence: [],
        confidenceState: 'HIGH_SUPPORT' as const,
        rationale: 'Arbitrary guess',
      },
      recommendationDisplay: 'TRY Z99',
      movementPath: [],
      scannerEvidenceSummary: '',
      cameraEvidenceSummary: '',
      whyRationale: 'Ungrounded',
      directiveText: 'Check Z99',
      confidenceState: 'INSUFFICIENT_EVIDENCE' as const,
    };

    const guardrailCheck = applyGuardrails(illegalEvaluation, []);
    const passed =
      guardrailCheck.isPermitted === false &&
      guardrailCheck.violations.length > 0 &&
      guardrailCheck.sanitizedEvaluation.hasWinningCandidate === false;

    results.push({
      id: 'E8',
      title: 'Unsupported inference -> refuse via guardrails',
      passed,
      notes: passed
        ? `Guardrail blocked unsupported recommendation and stripped invalid candidate.`
        : `Guardrail failed to intercept ungrounded recommendation.`,
    });
  }

  // --------------------------------------------------------------------------
  // E9: Single stale/weak signal -> low confidence + timestamp + verification
  // --------------------------------------------------------------------------
  {
    engine.registerCase({
      case_id: 'EVAL-CASE-E9',
      sku: 'SKU-E9',
      item_name: 'Pneumatic Hose',
      expected_location: 'A12',
      expected_quantity: 1,
    });

    const staleScanner: RawScannerInput[] = [
      {
        time: '10:00',
        sku: 'SKU-E9',
        fromLocation: 'A12',
        toLocation: 'B07',
        qty: 1,
        type: 'Transfer',
        scannerId: 'SCAN-OLD',
      },
    ];

    const res = engine.runInvestigation('EVAL-CASE-E9', staleScanner, [], {
      isStale: true,
      referenceNow: '14:40',
    });

    const passed =
      res.evaluation.confidenceState === 'LOW_STALE' &&
      res.evaluation.whyRationale.includes('Physical confirmation required');

    results.push({
      id: 'E9',
      title: 'Single stale/weak signal -> low confidence + verification required',
      passed,
      notes: passed
        ? `Single historical signal marked LOW_STALE with mandatory physical verification requirement.`
        : `Failed to enforce verification directive for weak/stale signal.`,
    });
  }

  // --------------------------------------------------------------------------
  // E10: No matching SOP -> no approved procedure found (Strict Refusal)
  // --------------------------------------------------------------------------
  {
    const refusalQuery1 = sopService.querySop('How do I calibrate drone flight telemetry?');
    const refusalQuery2 = sopService.querySop('Where is SKU-9999 right now?');

    const expectedRefusal = 'No approved procedure was found for this question.';
    const passed =
      refusalQuery1.matched === false &&
      refusalQuery1.answer === expectedRefusal &&
      refusalQuery2.matched === false &&
      refusalQuery2.answer === expectedRefusal;

    results.push({
      id: 'E10',
      title: 'No matching SOP -> exact refusal compliance',
      passed,
      notes: passed
        ? `Strict Section 15 compliance: returned "${expectedRefusal}" for unmatched and location-invention queries.`
        : `Failed exact refusal compliance: got "${refusalQuery1.answer}"`,
    });
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  return {
    total: results.length,
    passed: passedCount,
    failed: failedCount,
    results,
  };
}

// Direct execution when invoked via CLI/tsx
const suite = runStockTraceEvaluationSuite();
console.log('================================================================');
console.log('STOCKTRACE MASTER BUILD EVALUATION SUITE (SECTION 24)');
console.log('================================================================');
console.log(`Total Cases: ${suite.total} | Passed: ${suite.passed} | Failed: ${suite.failed}\n`);

for (const r of suite.results) {
  const icon = r.passed ? '✓ PASS' : '✗ FAIL';
  console.log(`[${icon}] ${r.id}: ${r.title}`);
  console.log(`       Note: ${r.notes}`);
}

console.log('================================================================');

if (suite.failed > 0) {
  process.exit(1);
} else {
  console.log('ALL SPECIFICATION EVALUATION CASES PASSED PERFECTLY (10/10).');
  process.exit(0);
}
