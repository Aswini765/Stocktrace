/**
 * StockTrace — Modular Gmail Connector
 * 
 * Capability: Outbound Action Tool ONLY (Send email via Google Gmail REST API).
 * 
 * STRICT COMPLIANCE RULES:
 * 1. Scope: 'https://www.googleapis.com/auth/gmail.send' ONLY.
 * 2. NO reading inbox, NO searching threads, NO modifying emails, NO monitoring incoming mail.
 * 3. Never hardcode credentials.
 * 4. Modular interface: sendEmail({ recipient, subject, body, caseId }).
 * 5. Returns structured SendEmailResult with timestamp, success, and clean errors.
 */

import { EmailProvider } from './provider';
import { SendEmailPayload, SendEmailResult, GmailConnectorStatus } from './types';

declare global {
  interface ImportMeta {
    env: Record<string, string | undefined>;
  }

  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

export class GmailConnector implements EmailProvider {
  public readonly providerName = 'Google Gmail API';
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private defaultRecipient: string = '';
  private lastSentAt?: string;
  private lastError?: string;

  constructor(defaultRecipient?: string) {
    // Configured recipient such as warehouse supervisor or operator email
    this.defaultRecipient =
      defaultRecipient ||
      (import.meta.env.VITE_SUPERVISOR_EMAIL as string) ||
      'aswini.27196@gmail.com';
  }

  /**
   * Sets or overrides the current access token.
   */
  public setAccessToken(token: string, expiresInSeconds: number = 3600): void {
    this.accessToken = token;
    this.tokenExpiresAt = Date.now() + expiresInSeconds * 1000;
    this.lastError = undefined;
  }

  /**
   * Retrieves active status of the Gmail connector.
   */
  public async getStatus(): Promise<GmailConnectorStatus> {
    const isTokenValid = Boolean(this.accessToken && Date.now() < this.tokenExpiresAt);
    return {
      isConfigured: true,
      isAuthenticated: isTokenValid,
      activeRecipient: this.defaultRecipient,
      lastSentAt: this.lastSentAt,
      lastError: this.lastError,
    };
  }

  /**
   * Updates the configured notification recipient (e.g. warehouse supervisor).
   */
  public setRecipient(recipient: string): void {
    if (recipient && recipient.trim().length > 0) {
      this.defaultRecipient = recipient.trim();
    }
  }

  public getRecipient(): string {
    return this.defaultRecipient;
  }

  /**
   * Encodes an email in standard RFC 2822 / MIME format for Gmail API raw format.
   */
  private createMimeMessage(recipient: string, subject: string, body: string): string {
    // Sanitize headers to prevent header injection
    const cleanSubject = subject.replace(/[\r\n]+/g, ' ').trim();
    const cleanRecipient = recipient.replace(/[\r\n]+/g, ' ').trim();

    const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(cleanSubject)))}?=`;
    const messageParts = [
      `To: ${cleanRecipient}`,
      `Subject: ${utf8Subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
      '',
      btoa(unescape(encodeURIComponent(body))),
    ];

    const mimeString = messageParts.join('\r\n');
    // Gmail API raw format expects standard websafe base64 (RFC 4648)
    return btoa(mimeString)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * Requests authorization via Google Identity Services client-side token flow.
   * Scoped ONLY to 'https://www.googleapis.com/auth/gmail.send'.
   */
  public async requestAuthorization(): Promise<string> {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
    if (!clientId) {
      const err = 'Google Client ID is not configured in environment variables (VITE_GOOGLE_CLIENT_ID).';
      this.lastError = err;
      throw new Error(err);
    }

    if (!window.google?.accounts?.oauth2) {
      const err = 'Google Identity Services library is not loaded.';
      this.lastError = err;
      throw new Error(err);
    }

    return new Promise((resolve, reject) => {
      try {
        const client = window.google!.accounts!.oauth2!.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/gmail.send',
          callback: (res) => {
            if (res.error) {
              this.lastError = `OAuth Error: ${res.error}`;
              reject(new Error(this.lastError));
              return;
            }
            if (res.access_token) {
              this.setAccessToken(res.access_token);
              resolve(res.access_token);
            } else {
              const err = 'No access token received from Google authorization.';
              this.lastError = err;
              reject(new Error(err));
            }
          },
        });

        client.requestAccessToken({ prompt: '' });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Authorization request failed.';
        this.lastError = msg;
        reject(new Error(msg));
      }
    });
  }

  /**
   * Sends an outbound email via Gmail REST API.
   * Method: POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send
   */
  public async sendEmail(payload: SendEmailPayload): Promise<SendEmailResult> {
    const recipient = payload.recipient || this.defaultRecipient;
    const nowIso = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (!recipient || !recipient.includes('@')) {
      const errorMsg = 'Invalid recipient email address.';
      this.lastError = errorMsg;
      return {
        success: false,
        recipient: recipient || 'undefined',
        subject: payload.subject,
        timestamp: nowIso,
        error: errorMsg,
      };
    }

    // Check authorization token
    let token = this.accessToken;
    if (!token || Date.now() >= this.tokenExpiresAt) {
      try {
        token = await this.requestAuthorization();
      } catch (authErr: unknown) {
        const msg = authErr instanceof Error ? authErr.message : 'Authentication required to send email.';
        this.lastError = msg;
        return {
          success: false,
          recipient,
          subject: payload.subject,
          timestamp: nowIso,
          error: msg,
        };
      }
    }

    try {
      const raw = this.createMimeMessage(recipient, payload.subject, payload.body);
      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw }),
      });

      if (!response.ok) {
        let errDetail = `Gmail API error HTTP ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson?.error?.message) {
            errDetail = errJson.error.message;
          }
        } catch {
          // ignore json parse error
        }
        this.lastError = errDetail;
        return {
          success: false,
          recipient,
          subject: payload.subject,
          timestamp: nowIso,
          error: errDetail,
        };
      }

      const resultData = await response.json();
      this.lastSentAt = nowIso;
      this.lastError = undefined;

      return {
        success: true,
        messageId: resultData.id,
        recipient,
        subject: payload.subject,
        timestamp: nowIso,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error communicating with Gmail API.';
      this.lastError = msg;
      return {
        success: false,
        recipient,
        subject: payload.subject,
        timestamp: nowIso,
        error: msg,
      };
    }
  }
}

/**
 * Singleton instance of the StockTrace Gmail Connector
 */
export const gmailConnector = new GmailConnector();
