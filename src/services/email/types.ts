/**
 * StockTrace — Outbound Email & Notification Types
 * 
 * IMPORTANT ARCHITECTURAL BOUNDARY:
 * Outbound action / notification output ONLY.
 * Email is NEVER an evidence source and NEVER alters inventory state,
 * candidate ranking, or verification results.
 */

export interface EmailRecipientConfig {
  email: string;
  name?: string;
  role?: string;
}

export interface SendEmailPayload {
  recipient: string;
  subject: string;
  body: string;
  caseId?: string;
  sku?: string;
  triggerType?: 'failed-pick-escalation' | 'conflicting-evidence' | 'investigation-summary' | 'manual-test';
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  recipient: string;
  subject: string;
  timestamp: string;
  error?: string;
}

export interface GmailConnectorStatus {
  isConfigured: boolean;
  isAuthenticated: boolean;
  activeRecipient: string;
  lastSentAt?: string;
  lastError?: string;
}

export interface EmailTriggerContext {
  caseId: string;
  sku: string;
  itemName?: string;
  expectedLocation: string;
  recommendedLocation?: string;
  scannerEvidenceSummary?: string;
  cameraEvidenceSummary?: string;
  status: 'Verification Required' | 'Conflicting Evidence' | 'Unresolved Failed Pick' | 'Escalated';
  actionDirective: string;
}
