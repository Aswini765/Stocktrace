/**
 * StockTrace — Timestamp & Staleness Calculation Utilities
 */

import { STALE_THRESHOLD_HOURS, STALE_THRESHOLD_MS } from './constants';

export interface StalenessEvaluation {
  isStale: boolean;
  ageMs?: number;
  ageHours?: number;
  thresholdHours: number;
  thresholdMs: number;
  status: 'FRESH' | 'STALE' | 'INVALID_TIMESTAMP' | 'MISSING_TIMESTAMP';
  reason: string;
  evidenceTime?: number;
  referenceTime: number;
}

/**
 * Resolves a reference 'now' parameter to an epoch millisecond value.
 * Defaults to Date.now() if omitted.
 */
export function getReferenceTimeMs(referenceNow?: Date | number | string): number {
  if (referenceNow === null || referenceNow === undefined) {
    return Date.now();
  }
  if (typeof referenceNow === 'number') {
    return isFinite(referenceNow) ? referenceNow : Date.now();
  }
  if (referenceNow instanceof Date) {
    const t = referenceNow.getTime();
    return isNaN(t) ? Date.now() : t;
  }
  if (typeof referenceNow === 'string') {
    const trimmed = referenceNow.trim();
    if (/^\d{11,14}$/.test(trimmed)) {
      const num = Number(trimmed);
      if (!isNaN(num) && isFinite(num)) return num;
    }
    const parsed = Date.parse(trimmed);
    if (!isNaN(parsed)) return parsed;

    // Time-of-day string like "14:40"
    const timeMatch = trimmed.match(/(?:Today,\s*)?(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
      const meridiem = timeMatch[4] ? timeMatch[4].toLowerCase() : null;
      if (meridiem === 'pm' && hours < 12) hours += 12;
      else if (meridiem === 'am' && hours === 12) hours = 0;

      const d = new Date();
      d.setHours(hours, minutes, seconds, 0);
      return d.getTime();
    }
  }
  return Date.now();
}

/**
 * Parses an evidence timestamp into epoch milliseconds.
 * Returns null if missing, empty, or unparseable.
 *
 * Supported formats:
 * - epoch milliseconds (number)
 * - Date instance
 * - ISO-8601 strings (e.g. "2026-09-15T14:35:00Z")
 * - Time ranges (e.g. "14:34 – 14:36", takes the later timestamp)
 * - 24-hour time of day (e.g. "14:35", "14:35:00")
 * - 12-hour time of day (e.g. "2:35 PM", "11:40 AM")
 * - Human day string (e.g. "Today, 14:35")
 */
export function parseTimestampToMs(
  timestamp: string | number | Date | null | undefined,
  referenceNowMs: number
): number | null {
  if (timestamp === null || timestamp === undefined) {
    return null;
  }

  if (typeof timestamp === 'number') {
    return isFinite(timestamp) && !isNaN(timestamp) ? timestamp : null;
  }

  if (timestamp instanceof Date) {
    const t = timestamp.getTime();
    return isNaN(t) ? null : t;
  }

  if (typeof timestamp !== 'string') {
    return null;
  }

  const trimmed = timestamp.trim();
  if (!trimmed) {
    return null;
  }

  // Range format: "14:32 – 14:36" or "14:32 - 14:36"
  let targetStr = trimmed;
  if (trimmed.includes('–') || (trimmed.includes('-') && !trimmed.match(/^\d{4}-\d{2}-\d{2}/))) {
    const parts = trimmed.split(/[–-]/).map((p) => p.trim());
    if (parts.length > 1 && parts[parts.length - 1]) {
      targetStr = parts[parts.length - 1];
    }
  }

  // Pure numeric string
  if (/^\d{11,14}$/.test(targetStr)) {
    const num = Number(targetStr);
    if (!isNaN(num) && isFinite(num)) return num;
  }

  // Full ISO / standard Date string
  if (targetStr.includes('T') || targetStr.includes('/') || (targetStr.includes('-') && targetStr.match(/^\d{4}/))) {
    const parsed = Date.parse(targetStr);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }

  // Time-of-day parsing (e.g. "14:35", "2:35 PM", "Today, 11:40")
  const timeMatch = targetStr.match(/(?:Today,\s*)?(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
    const meridiem = timeMatch[4] ? timeMatch[4].toLowerCase() : null;

    if (meridiem === 'pm' && hours < 12) {
      hours += 12;
    } else if (meridiem === 'am' && hours === 12) {
      hours = 0;
    }

    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60 && seconds >= 0 && seconds < 60) {
      const refDate = new Date(referenceNowMs);
      const candDate = new Date(refDate);
      candDate.setHours(hours, minutes, seconds, 0);

      // If candDate is in the future compared to refDate by more than 15 minutes,
      // it reflects an event from yesterday
      if (candDate.getTime() > refDate.getTime() + 15 * 60 * 1000) {
        candDate.setDate(candDate.getDate() - 1);
      }

      return candDate.getTime();
    }
  }

  // Fallback Date.parse
  const fallback = Date.parse(targetStr);
  if (!isNaN(fallback)) {
    return fallback;
  }

  return null;
}

/**
 * Detailed evaluation of evidence staleness against a reference time.
 *
 * BOUNDARY RULE:
 * Evidence is considered stale if and only if its age strictly exceeds the threshold:
 * ageMs > STALE_THRESHOLD_MS (i.e. strictly greater than 2 hours).
 *
 * Evidence with ageMs <= STALE_THRESHOLD_MS (e.g. exactly 2 hours old) is FRESH.
 *
 * Missing or invalid timestamps are safely marked isStale = true (never assumed fresh).
 */
export function evaluateEvidenceStaleness(
  timestamp: string | number | Date | null | undefined,
  referenceNow?: Date | number | string
): StalenessEvaluation {
  const refTimeMs = getReferenceTimeMs(referenceNow);

  // 1. Missing timestamp check (Requirement D)
  if (timestamp === null || timestamp === undefined || (typeof timestamp === 'string' && timestamp.trim() === '')) {
    return {
      isStale: true,
      thresholdHours: STALE_THRESHOLD_HOURS,
      thresholdMs: STALE_THRESHOLD_MS,
      status: 'MISSING_TIMESTAMP',
      referenceTime: refTimeMs,
      reason: 'Timestamp is missing; cannot verify freshness (treated as stale/unconfirmed).',
    };
  }

  // 2. Parse timestamp
  const evidenceMs = parseTimestampToMs(timestamp, refTimeMs);

  // 3. Invalid timestamp check (Requirement E)
  if (evidenceMs === null) {
    return {
      isStale: true,
      thresholdHours: STALE_THRESHOLD_HOURS,
      thresholdMs: STALE_THRESHOLD_MS,
      status: 'INVALID_TIMESTAMP',
      referenceTime: refTimeMs,
      reason: `Timestamp "${String(timestamp)}" is invalid or unparseable; cannot verify freshness.`,
    };
  }

  const ageMs = refTimeMs - evidenceMs;
  const ageHours = ageMs / (1000 * 60 * 60);

  // 4. Boundary Rule Check:
  // Strictly greater than 2 hours (> STALE_THRESHOLD_MS) is stale.
  // <= STALE_THRESHOLD_MS is fresh.
  const isStale = ageMs > STALE_THRESHOLD_MS;

  return {
    isStale,
    ageMs,
    ageHours,
    thresholdHours: STALE_THRESHOLD_HOURS,
    thresholdMs: STALE_THRESHOLD_MS,
    status: isStale ? 'STALE' : 'FRESH',
    evidenceTime: evidenceMs,
    referenceTime: refTimeMs,
    reason: isStale
      ? `Evidence age (${ageHours.toFixed(2)}h) exceeds the ${STALE_THRESHOLD_HOURS}-hour freshness threshold.`
      : `Evidence age (${ageHours.toFixed(2)}h) is within the ${STALE_THRESHOLD_HOURS}-hour freshness threshold.`,
  };
}

/**
 * Returns true when evidence age is greater than the configured 2-hour threshold,
 * or when the timestamp is missing/invalid. Returns false otherwise.
 *
 * Never invents a timestamp.
 */
export function isEvidenceStale(
  timestamp: string | number | Date | null | undefined,
  referenceNow?: Date | number | string
): boolean {
  return evaluateEvidenceStaleness(timestamp, referenceNow).isStale;
}
