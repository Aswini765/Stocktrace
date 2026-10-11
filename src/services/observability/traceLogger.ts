/**
 * StockTrace — Observability, Structured Trace Logger & Cost Tracking
 * 
 * Tracks end-to-end investigation executions with correlation IDs, latency measurement,
 * tool invocation histories, and estimated compute costs.
 */

import { InvestigationState, EvidenceTier } from '../../orchestrator/types';

export interface InvestigationTrace {
  traceId: string;
  caseId: string;
  taskId?: string;
  scenarioId?: string;
  operatorRole: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  finalState: InvestigationState;
  toolsInvoked: string[];
  evidenceRecordIds: string[];
  evidenceTierUsed?: EvidenceTier;
  costEstimateInr: number;
  logs: Array<{
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR';
    event: string;
    data?: any;
  }>;
}

export class TraceLogger {
  private traces: Map<string, InvestigationTrace> = new Map();

  public createTrace(params: {
    caseId: string;
    operatorRole: string;
    scenarioId?: string;
    taskId?: string;
  }): InvestigationTrace {
    const traceId = `trc-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const trace: InvestigationTrace = {
      traceId,
      caseId: params.caseId,
      taskId: params.taskId,
      scenarioId: params.scenarioId,
      operatorRole: params.operatorRole,
      startedAt: new Date().toISOString(),
      finalState: 'REPORT_RECEIVED',
      toolsInvoked: [],
      evidenceRecordIds: [],
      costEstimateInr: 0,
      logs: [
        {
          timestamp: new Date().toISOString(),
          level: 'INFO',
          event: 'TRACE_INITIATED',
          data: { traceId, caseId: params.caseId },
        },
      ],
    };

    this.traces.set(traceId, trace);
    return trace;
  }

  public getTrace(traceId: string): InvestigationTrace | undefined {
    return this.traces.get(traceId);
  }

  public getAllTraces(): InvestigationTrace[] {
    return Array.from(this.traces.values());
  }

  public completeTrace(
    traceId: string,
    updates: Partial<InvestigationTrace>
  ): InvestigationTrace | undefined {
    const trace = this.traces.get(traceId);
    if (!trace) return undefined;

    const completedAt = new Date().toISOString();
    const durationMs = Date.now() - new Date(trace.startedAt).getTime();

    const finalized: InvestigationTrace = {
      ...trace,
      ...updates,
      completedAt,
      durationMs,
    };

    this.traces.set(traceId, finalized);
    return finalized;
  }
}

export const traceLogger = new TraceLogger();
