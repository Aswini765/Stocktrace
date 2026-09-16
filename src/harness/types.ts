/**
 * StockTrace — Domain-Specific Harness Types
 * Inventory Movement & Location Intelligence
 * Master specification reference: FAILED_PICK_RESOLUTION_ASSISTANT_HARNESS_BUILD.md
 */

export type CaseStatus =
  | 'FAILED_PICK'
  | 'INVESTIGATING'
  | 'RECOMMENDATION_READY'
  | 'AWAITING_VERIFICATION'
  | 'FOUND'
  | 'NOT_FOUND'
  | 'PARTIALLY_FOUND'
  | 'WRONG_QUANTITY'
  | 'DAMAGED'
  | 'ESCALATED'
  | 'CLOSED';

export interface CaseAuditEvent {
  event_id: string;
  case_id: string;
  timestamp: string;
  from_status?: CaseStatus;
  to_status: CaseStatus;
  action: string;
  actor: string;
  details?: Record<string, unknown> | string;
}

export type ScannerMovementType =
  | 'RECEIVING'
  | 'PUT_AWAY'
  | 'MOVE'
  | 'PICK'
  | 'RETURN'
  | 'ADJUSTMENT'
  | 'TRANSFER';

export interface ScannerEvidence {
  sku: string;
  location: string;
  quantity: number;
  timestamp: string;
  movement_type: ScannerMovementType;
  source?: string;
  destination?: string;
  transaction_id: string;
  status: string;
}

export interface CameraEvidenceEvent {
  camera_event_id: string;
  timestamp: string;
  camera_id: string;
  source_location?: string;
  destination_location?: string;
  sku: string;
  movement_type: string;
  worker_id_or_device_id?: string;
  confidence: number;
  video_reference?: string;
}

export interface NormalizedEvidence {
  source_type: 'scanner' | 'camera';
  sku: string;
  source_location?: string;
  destination_location: string;
  timestamp: string;
  event_type: string;
  status: 'recorded' | 'observed';
  source_id: string;
  confidence: number | null;
  video_reference?: string;
  notes?: string;
}

export type ConfidenceState =
  | 'HIGH_SUPPORT'
  | 'MEDIUM_SUPPORT'
  | 'LOW_STALE'
  | 'CONFLICTING'
  | 'INSUFFICIENT_EVIDENCE'
  | 'NO_CAMERA';

export interface CandidateLocation {
  location: string;
  score: number;
  rank: number;
  supportingEvidence: NormalizedEvidence[];
  confidenceState: ConfidenceState;
  rationale: string;
}

export type WorkerVerificationOutcome =
  | 'FOUND'
  | 'NOT_FOUND'
  | 'PARTIALLY_FOUND'
  | 'WRONG_QUANTITY'
  | 'DAMAGED'
  | 'ESCALATE';

export interface HarnessCaseModel {
  case_id: string;
  sku: string;
  item_name: string;
  expected_location: string;
  expected_quantity: number;
  failed_at: string;
  status: CaseStatus;
  scanner_evidence: ScannerEvidence[];
  camera_evidence: CameraEvidenceEvent[];
  candidate_locations: CandidateLocation[];
  recommendation?: string;
  recommendation_reason?: string;
  confidence_state?: ConfidenceState;
  worker_verification?: WorkerVerificationOutcome;
  found_quantity?: number;
  outcome?: string;
  created_at: string;
  updated_at: string;
}

export interface DiscrepancyRecord {
  case_id: string;
  sku: string;
  expected_location: string;
  recommended_location?: string;
  verification_result: WorkerVerificationOutcome;
  expected_quantity: number;
  found_quantity: number;
  timestamp: string;
  evidence_summary: string;
  status: 'LOGGED' | 'INVESTIGATING' | 'AUDIT_PENDING' | 'RESOLVED' | 'ESCALATED';
}

export interface ExternalCallLog {
  provider: string;
  model?: string;
  operation: string;
  timestamp: string;
  success: boolean;
  latency_ms: number;
  error_category?: string;
}
