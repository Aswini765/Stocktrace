/**
 * StockTrace — Investigation State Machine
 * Enforces allowed lifecycle transitions and logs all state changes.
 */

import { InvestigationState, ALLOWED_STATE_TRANSITIONS } from './types';

export class InvalidStateTransitionError extends Error {
  public fromState: InvestigationState;
  public toState: InvestigationState;

  constructor(fromState: InvestigationState, toState: InvestigationState, message?: string) {
    super(
      message ||
        `Invalid state transition: Cannot transition from '${fromState}' to '${toState}'. Allowed: [${(
          ALLOWED_STATE_TRANSITIONS[fromState] || []
        ).join(', ')}]`
    );
    this.name = 'InvalidStateTransitionError';
    this.fromState = fromState;
    this.toState = toState;
  }
}

export interface StateTransitionRecord {
  fromState: InvestigationState;
  toState: InvestigationState;
  timestamp: string;
  reason?: string;
  actor: string;
}

export class InvestigationStateMachine {
  private currentState: InvestigationState;
  private history: StateTransitionRecord[] = [];
  private caseId: string;

  constructor(caseId: string, initialState: InvestigationState = 'REPORT_RECEIVED') {
    this.caseId = caseId;
    this.currentState = initialState;
    this.history.push({
      fromState: initialState,
      toState: initialState,
      timestamp: new Date().toISOString(),
      reason: 'State machine initialized',
      actor: 'SYSTEM',
    });
  }

  public getState(): InvestigationState {
    return this.currentState;
  }

  public getHistory(): ReadonlyArray<StateTransitionRecord> {
    return this.history;
  }

  public canTransitionTo(nextState: InvestigationState): boolean {
    if (this.currentState === nextState) return true; // Idempotent
    const allowed = ALLOWED_STATE_TRANSITIONS[this.currentState] || [];
    return allowed.includes(nextState);
  }

  public transitionTo(
    nextState: InvestigationState,
    actor: string = 'ORCHESTRATOR',
    reason?: string
  ): InvestigationState {
    // Idempotent transition to same state
    if (this.currentState === nextState) {
      return this.currentState;
    }

    if (!this.canTransitionTo(nextState)) {
      throw new InvalidStateTransitionError(this.currentState, nextState);
    }

    const previousState = this.currentState;
    this.currentState = nextState;

    this.history.push({
      fromState: previousState,
      toState: nextState,
      timestamp: new Date().toISOString(),
      reason,
      actor,
    });

    return this.currentState;
  }
}
