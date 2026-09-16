/**
 * StockTrace — Operational Constants & Thresholds
 */

/**
 * Maximum age in hours for evidence to be considered fresh.
 * Evidence older than this threshold (> 2 hours) is classified as stale (LOW_STALE)
 * and cannot form a high-confidence recommendation without physical confirmation.
 */
export const STALE_THRESHOLD_HOURS = 2;

/**
 * Stale evidence threshold in milliseconds: 2 hours = 7,200,000 ms.
 */
export const STALE_THRESHOLD_MS = STALE_THRESHOLD_HOURS * 60 * 60 * 1000;
