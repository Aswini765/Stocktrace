/**
 * StockTrace — Notification Dispatcher / Outbound Trigger Service
 * 
 * ARCHITECTURAL MANDATE:
 * - Gmail is an OUTPUT / ACTION TOOL ONLY.
 * - It is NEVER an evidence source.
 * - It NEVER influences inventory candidate ranking, fusion, or verification.
 * - Triggers ONLY on explicit attention-required situations:
 *    * Conflicting evidence detected
 *    * Unresolved failed-pick / escalated after worker verification
 *    * Explicit supervisor review request
 * - Normal successful verification DOES NOT trigger email escalation.
 */

import { EmailProvider } from './provider';
import { gmailConnector } from './gmail_connector';
import { StockTraceEmailFormatter } from './formatter';
import { EmailTriggerContext, SendEmailResult } from './types';

export class StockTraceNotificationService {
  private provider: EmailProvider;
  private isEnabled: boolean = true;
  private notificationHistory: SendEmailResult[] = [];

  constructor(provider: EmailProvider = gmailConnector) {
    this.provider = provider;
  }

  public setProvider(provider: EmailProvider): void {
    this.provider = provider;
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public isNotificationEnabled(): boolean {
    return this.isEnabled;
  }

  public getHistory(): SendEmailResult[] {
    return [...this.notificationHistory];
  }

  /**
   * Evaluates whether an email trigger is warranted based on investigation state.
   * STRICT TRIGGER LOGIC:
   * Returns TRUE ONLY for:
   * - Conflicting evidence
   * - Unresolved failed pick / physical verification failed
   * - Escalation required
   * Returns FALSE for:
   * - Normal successful resolution / item found
   * - Ongoing normal picking
   */
  public shouldTriggerAlert(
    situation: 'ITEM_FOUND' | 'CONFLICTING_EVIDENCE' | 'NO_FOOTAGE_ESCALATION' | 'PHYSICAL_CHECK_FAILED' | 'ESCALATED'
  ): boolean {
    if (!this.isEnabled) return false;

    switch (situation) {
      case 'CONFLICTING_EVIDENCE':
      case 'NO_FOOTAGE_ESCALATION':
      case 'PHYSICAL_CHECK_FAILED':
      case 'ESCALATED':
        return true;
      case 'ITEM_FOUND':
      default:
        return false;
    }
  }

  /**
   * Triggers an escalation email for an unresolved failed pick.
   */
  public async notifyEscalationRequired(
    context: EmailTriggerContext,
    recipient?: string
  ): Promise<SendEmailResult> {
    const targetRecipient = recipient || (this.provider === gmailConnector ? (this.provider as typeof gmailConnector).getRecipient() : '');
    const payload = StockTraceEmailFormatter.formatEscalationEmail(context, targetRecipient);
    const result = await this.provider.sendEmail(payload);
    this.notificationHistory.unshift(result);
    return result;
  }

  /**
   * Triggers a conflicting evidence alert email.
   */
  public async notifyConflictingEvidence(
    context: EmailTriggerContext,
    recipient?: string
  ): Promise<SendEmailResult> {
    const targetRecipient = recipient || (this.provider === gmailConnector ? (this.provider as typeof gmailConnector).getRecipient() : '');
    const payload = StockTraceEmailFormatter.formatConflictingEvidenceEmail(context, targetRecipient);
    const result = await this.provider.sendEmail(payload);
    this.notificationHistory.unshift(result);
    return result;
  }

  /**
   * Triggers an investigation summary email.
   */
  public async notifyInvestigationSummary(
    context: EmailTriggerContext,
    recipient?: string
  ): Promise<SendEmailResult> {
    const targetRecipient = recipient || (this.provider === gmailConnector ? (this.provider as typeof gmailConnector).getRecipient() : '');
    const payload = StockTraceEmailFormatter.formatSummaryEmail(context, targetRecipient);
    const result = await this.provider.sendEmail(payload);
    this.notificationHistory.unshift(result);
    return result;
  }

  /**
   * Sends a controlled test email to verify Gmail outbound connectivity.
   */
  public async sendTestEmail(recipient?: string): Promise<SendEmailResult> {
    const targetRecipient = recipient || (this.provider === gmailConnector ? (this.provider as typeof gmailConnector).getRecipient() : '');
    const payload = {
      recipient: targetRecipient,
      subject: 'StockTrace — Outbound Gmail Action Tool Test',
      body: `StockTrace Location Intelligence Test Notification

This is a controlled verification test confirming that StockTrace is successfully connected to Gmail as an outbound action tool.

Permissions:
- Outbound notifications only (https://www.googleapis.com/auth/gmail.send)
- No inbox reading or email modification enabled.

Warehouse: Bengaluru DC (DC-BLR-01)
Timestamp: ${new Date().toISOString()}`,
      triggerType: 'manual-test' as const,
    };

    const result = await this.provider.sendEmail(payload);
    this.notificationHistory.unshift(result);
    return result;
  }
}

export const stockTraceNotifier = new StockTraceNotificationService();
