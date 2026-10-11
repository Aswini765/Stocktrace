export type TabType =
  | 'open-cases'
  | 'completed-cases'
  | 'dashboard'
  | 'investigations'
  | 'discrepancies'
  | 'data-sources';

export type { DispatchOrder } from './services/dispatch/dispatchService';

export type ScenarioType =
  | 'happy-path'
  | 'no-camera'
  | 'conflict'
  | 'scanner-only'
  | 'camera-only'
  | 'stale';

export type CaseStatus =
  | 'ITEM_NOT_FOUND'
  | 'INVESTIGATING'
  | 'TRY_LOCATION'
  | 'RESOLVED'
  | 'ESCALATED';

export type CasePriority = 'HIGH' | 'MEDIUM' | 'NORMAL';

export type WorkerVerificationOutcome =
  | 'FOUND'
  | 'NOT_FOUND'
  | 'PARTIALLY_FOUND'
  | 'WRONG_QUANTITY'
  | 'DAMAGED'
  | 'ESCALATE';

export type AppRole = 'home' | 'picker' | 'supervisor' | 'manager';

export type EvidenceType =
  | 'TRANSACTION_SCANNER'
  | 'SCANNER_ONLY'
  | 'TRANSACTION_ONLY'
  | 'INSUFFICIENT';

export type EvidenceTier =
  | 'TIER_1_SCANNER_WMS'
  | 'TIER_2_TARGETED_CAMERA'
  | 'TIER_3_CONDITIONAL_AI'
  | 'INSUFFICIENT'
  | 'CONFLICTING'
  | 'STALE'
  | EvidenceType;

export interface CaseAuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
  tierUsed?: EvidenceTier;
}

export interface RoiAssumptions {
  failedPicksPerDay: number;
  operatingDaysPerMonth: number;
  searchTimeBeforeMins: number;
  searchTimeAfterMins: number;
  hourlyLaborCost: number;
  delayedOrdersPercent: number;
  avgOrderValue: number;
  contributionMarginPercent: number;
  stockWriteOffPercent: number;
  avgItemWriteOffCost: number;
  expectedRecoveryRatePercent: number;
  avgInvestigationCostPerCase: number;
  monthlySoftwareCost: number;
  // Backward compatibility
  avgItemValue?: number;
}

export interface CameraEvidenceDetail {
  cameraId: string;
  timestamp: string;
  observation: string;
  limitation: string;
  videoClipUrl?: string;
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'BLIND_SPOT';
}

export interface Tier3AiAnalysisDetail {
  eligible: boolean;
  ineligibilityReason?: string;
  status: 'NOT_RUN' | 'RUNNING' | 'COMPLETED' | 'BLOCKED_BY_GUARDRAIL';
  triggeredReason?: string;
  estimatedCostInr: number;
  visualConfidence?: number;
  analysisSummary?: string;
  detectedLocation?: string;
  timestamp?: string;
}

export interface FailedPickCase {
  id: string;
  sku: string;
  item: string;
  qty: number;
  expectedLocation: string;
  status: CaseStatus;
  priority?: CasePriority;
  orderNumber?: string;
  destinationBin?: string;
  reportedAt?: string;
  reportedBy?: string;
  recommendedLocation?: string;
  foundLocation?: string;
  resolutionTime?: string;
  completedAt?: string;
  investigationId?: string;
  discrepancyId?: string;
  movementPath?: string;
  // V2 Product Extensions
  itemValue?: number;
  orderValue?: number;
  evidenceTierUsed?: EvidenceTier;
  tierResolutionNote?: string;
  landmarkHint?: string;
  binDiagramUrl?: string;
  pickerOutcome?: WorkerVerificationOutcome;
  pickerNotes?: string;
  pickerTimestamp?: string;
  foundQuantity?: number;
  damageReason?: string;
  photoUrl?: string;
  voiceInstructionText?: {
    en: string;
    hi: string;
    kn: string;
  };
  cameraEvidence?: CameraEvidenceDetail;
  tier3AiAnalysis?: Tier3AiAnalysisDetail;
  auditTrail?: CaseAuditEntry[];
}

// Backward compatibility alias
export type PickTask = FailedPickCase;
export type PickTaskStatus = CaseStatus | 'PENDING' | 'PICKING' | 'NOT FOUND' | 'COMPLETED' | 'Ready' | 'In Progress';

export interface ScannerTransaction {
  time: string;
  sku: string;
  fromLocation: string;
  toLocation: string;
  qty: number;
  type: string;
  scannerId: string;
}

export interface InvestigationRecord {
  id: string;
  caseId?: string;
  taskId?: string;
  sku: string;
  expectedLocation: string;
  recommendedLocation: string;
  evidence: string;
  status: 'Resolved' | 'Escalated';
  resolutionTime: string;
  timestamp: string;
  reason?: string;
  evidenceTier?: EvidenceTier;
}

export interface DiscrepancyRecord {
  id: string;
  caseId?: string;
  taskId?: string;
  sku: string;
  itemName: string;
  expectedLocation: string;
  foundLocation: string;
  reason: string;
  time: string;
  evidence: string;
  status: 'Resolved' | 'Pending Review';
  resolvedBy: string;
}

export interface DataSourceItem {
  id: string;
  name: string;
  status: 'Connected' | 'Degraded' | 'Offline';
  source: string;
  details: string;
  lastSync: string;
  recordCount: string;
}
