/**
 * StockTrace — Reusable Modular Email Provider Interface
 * 
 * Defines the contract that any outbound notification adapter must satisfy.
 * (e.g. Gmail API, SMTP, Webhook, Mock).
 * 
 * Keep the investigation engine free of vendor-specific logic.
 */

import { SendEmailPayload, SendEmailResult, GmailConnectorStatus } from './types';

export interface EmailProvider {
  readonly providerName: string;
  getStatus(): Promise<GmailConnectorStatus>;
  sendEmail(payload: SendEmailPayload): Promise<SendEmailResult>;
}
