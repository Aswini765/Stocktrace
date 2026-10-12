/**
 * StockTrace — Agentic Investigation Platform
 * Orchestration State Machine, Tool Registry, and Agent Types
 */

import { WorkerVerificationOutcome } from '../types';

/**
 * Explicit Investigation State Machine States
 * Strictly enforced in backend orchestrator.
 */
export type InvestigationState =
  | 'REPORT_RECEIVED'
  | 'IDENTIFYING_ORDER'
  | 'NEEDS_CLARIFICATION'
  | 'TASK_ASSIGNED'
  | 'GATHERING_EVIDENCE'
  | 'EVALUATING_EVIDENCE'
  | 'RECOMMENDATION_AVAILABLE'
  | 'AWAITING_PICKER_VERIFICATION'
  | 'RESOLVED'
  | 'ESCALATED'
  | 'FAILED_RETRYABLE';

/**
 * Valid state transitions mapping.
 * Any attempt to transition to an unlisted state will be rejected.
 */
export const ALLOWED_STATE_TRANSITIONS: Record<InvestigationState, InvestigationState[]> = {
  REPORT_RECEIVED: ['IDENTIFYING_ORDER', 'FAILED_RETRYABLE'],
  IDENTIFYING_ORDER: ['TASK_ASSIGNED', 'NEEDS_CLARIFICATION', 'ESCALATED', 'FAILED_RETRYABLE'],
  NEEDS_CLARIFICATION: ['IDENTIFYING_ORDER', 'ESCALATED', 'FAILED_RETRYABLE'],
  TASK_ASSIGNED: ['GATHERING_EVIDENCE', 'FAILED_RETRYABLE'],
  GATHERING_EVIDENCE: ['EVALUATING_EVIDENCE', 'FAILED_RETRYABLE'],
  EVALUATING_EVIDENCE: ['RECOMMENDATION_AVAILABLE', 'ESCALATED', 'RESOLVED', 'FAILED_RETRYABLE'],
  RECOMMENDATION_AVAILABLE: ['AWAITING_PICKER_VERIFICATION', 'ESCALATED', 'FAILED_RETRYABLE'],
  AWAITING_PICKER_VERIFICATION: ['RESOLVED', 'ESCALATED', 'GATHERING_EVIDENCE'],
  RESOLVED: ['AWAITING_PICKER_VERIFICATION'], // Recheck / audit review only
  ESCALATED: ['AWAITING_PICKER_VERIFICATION', 'RESOLVED'], // Supervisor resolution
  FAILED_RETRYABLE: ['IDENTIFYING_ORDER', 'GATHERING_EVIDENCE', 'ESCALATED'],
};

/**
 * Evidence Tiers
 */
export type EvidenceTier = 'TIER_1_SCANNER_WMS' | 'TIER_2_TARGETED_CAMERA';

/**
 * Tool Permission Classification
 */
export type ToolAccessType = 'READ_ONLY' | 'CONTROLLED_WRITE' | 'BLOCKED_DANGEROUS';

/**
 * Tool Registration Schema
 */
export interface RegisteredTool<TInput = any, TOutput = any> {
  name: string;
  description: string;
  accessType: ToolAccessType;
  requiredRole?: 'PICKER' | 'SUPERVISOR' | 'SYSTEM';
  execute: (input: TInput, context: OrchestrationContext) => Promise<TOutput> | TOutput;
}

/**
 * Investigation Trace & Telemetry Context
 */
export interface OrchestrationContext {
  traceId: string;
  caseId: string;
  taskId?: string;
  operatorRole: 'PICKER' | 'SUPERVISOR' | 'SYSTEM';
  scenarioId?: string;
  startTime: number;
  toolCallCount: number;
  maxToolCalls: number;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
  };
  costEstimatesInr: number;
  logs: Array<{
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR';
    event: string;
    data?: any;
  }>;
}

/**
 * Structured Grounded Recommendation Output
 */
export interface GroundedRecommendationOutput {
  status: 'SUPPORTED_RECOMMENDATION' | 'INSUFFICIENT_EVIDENCE' | 'CONFLICTING_EVIDENCE' | 'STALE_EVIDENCE' | 'ESCALATION_REQUIRED';
  suggestedBin?: string;
  expectedBin: string;
  locationDescription?: string;
  evidenceRecordIds: string[];
  evidenceTierUsed: EvidenceTier;
  confidenceState: 'HIGH_SUPPORT' | 'MEDIUM_SUPPORT' | 'LOW_STALE' | 'CONFLICTING' | 'INSUFFICIENT_EVIDENCE' | 'NO_CAMERA';
  reasoning: string;
  timestamps: {
    evidenceTimestamp?: string;
    evaluatedAt: string;
  };
  awaitingVerification: boolean;
  nextAllowedActions: ('FOUND_HERE' | 'STILL_NOT_FOUND' | 'LESS_QUANTITY' | 'DAMAGED' | 'ESCALATE')[];
  costEstimateInr: number;
}
