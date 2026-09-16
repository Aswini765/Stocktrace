export type TabType =
  | 'open-cases'
  | 'completed-cases'
  | 'dashboard'
  | 'investigations'
  | 'discrepancies'
  | 'data-sources';

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

export interface FailedPickCase {
  id: string;
  sku: string;
  item: string;
  qty: number;
  expectedLocation: string;
  status: CaseStatus;
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

export interface CameraEvent {
  camera: string;
  timeRange: string;
  exactTime: string;
  date?: string;
  statusText: string;
  eventDescription: string;
  frameVisualType: 'a12' | 'aisle3' | 'b07' | 'c03' | 'empty';
  sourceLocation?: string;
  destinationLocation?: string;
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

