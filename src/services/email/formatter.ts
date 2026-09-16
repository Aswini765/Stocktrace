/**
 * StockTrace — Email Formatter & Templates
 * 
 * Prepares standard outbound alerts according to Product Specifications:
 * - A. Failed-pick escalation
 * - B. Conflicting evidence
 * - C. Investigation summary
 * 
 * Strict Constraint:
 * Only formats data already present in StockTrace. Does NOT invent information.
 */

import { EmailTriggerContext, SendEmailPayload } from './types';

export class StockTraceEmailFormatter {
  /**
   * Template A: Failed-pick escalation
   * Triggered when an investigation requires human floor attention or verification at candidate location.
   */
  public static formatEscalationEmail(
    context: EmailTriggerContext,
    recipient: string
  ): SendEmailPayload {
    const subject = `StockTrace — Failed Pick Requires Attention — ${context.caseId}`;
    const body = `StockTrace Investigation Escalation Alert

Case: ${context.caseId}
SKU: ${context.sku}${context.itemName ? ` (${context.itemName})` : ''}
Expected Location: ${context.expectedLocation}
Recommended Location: ${context.recommendedLocation || 'None (Requires Supervisor Inspection)'}
Evidence: ${context.cameraEvidenceSummary ? 'Scanner + Camera' : 'Scanner Only'}
Status: ${context.status}

Action:
${context.actionDirective || 'Please physically verify the recommended location.'}

---
Generated automatically by StockTrace Location Intelligence.
Warehouse: Bengaluru DC (DC-BLR-01)`;

    return {
      recipient,
      subject,
      body,
      caseId: context.caseId,
      sku: context.sku,
      triggerType: 'failed-pick-escalation',
    };
  }

  /**
   * Template B: Conflicting evidence
   * Triggered when scanner logs point to one location but camera surveillance detects movement toward another.
   */
  public static formatConflictingEvidenceEmail(
    context: EmailTriggerContext,
    recipient: string
  ): SendEmailPayload {
    const subject = `StockTrace — Conflicting Evidence — ${context.caseId}`;
    const body = `StockTrace Investigation Conflict Alert

Case: ${context.caseId}
SKU: ${context.sku}${context.itemName ? ` (${context.itemName})` : ''}

Scanner Evidence:
${context.scannerEvidenceSummary || `Last recorded location: ${context.expectedLocation}`}

Camera Evidence:
${context.cameraEvidenceSummary || 'Movement observed in conflicting aisle/bay'}

Status:
${context.status || 'Conflicting Evidence'}

Action:
${context.actionDirective || 'Physical verification required.'}

---
Generated automatically by StockTrace Location Intelligence.
Warehouse: Bengaluru DC (DC-BLR-01)`;

    return {
      recipient,
      subject,
      body,
      caseId: context.caseId,
      sku: context.sku,
      triggerType: 'conflicting-evidence',
    };
  }

  /**
   * Template C: Investigation summary
   * Sends a concise factual summary when configured.
   */
  public static formatSummaryEmail(
    context: EmailTriggerContext,
    recipient: string
  ): SendEmailPayload {
    const subject = `StockTrace — Investigation Summary — ${context.caseId}`;
    const body = `StockTrace Investigation Summary

Case ID: ${context.caseId}
SKU: ${context.sku}${context.itemName ? ` (${context.itemName})` : ''}
Original Expected Location: ${context.expectedLocation}
Recommended Next Location: ${context.recommendedLocation || 'None'}
Status: ${context.status}

Scanner Record:
${context.scannerEvidenceSummary || 'N/A'}

Camera Observation:
${context.cameraEvidenceSummary || 'N/A'}

Next Action:
${context.actionDirective}

---
Generated automatically by StockTrace Location Intelligence.
Warehouse: Bengaluru DC (DC-BLR-01)`;

    return {
      recipient,
      subject,
      body,
      caseId: context.caseId,
      sku: context.sku,
      triggerType: 'investigation-summary',
    };
  }
}
