/**
 * StockTrace — Approved Warehouse SOP Documents
 * Master Build Specification Section 15
 * 
 * Rules:
 * - Approved procedures for failed picks, misplaced stock, damage, and count discrepancies.
 * - RAG must NOT be used to invent physical inventory locations.
 */

import { SopDocument } from './types';

export const APPROVED_SOPS: SopDocument[] = [
  {
    id: 'SOP-WHS-001',
    title: 'Failed Pick Escalation & Resolution Protocol',
    category: 'Failed Pick',
    effectiveDate: '01 Jan 2026',
    revision: 'v2.1',
    citation: 'SOP-WHS-001 §3.2 (Failed Pick Handling)',
    summary: 'Standard warehouse procedure when an expected SKU is absent from its primary bin location.',
    keywords: [
      'failed pick',
      'item not found',
      'missing item',
      'item absent',
      'cant find item',
      'cannot find item',
      'unable to locate',
      'picker escalation',
    ],
    steps: [
      '1. Visually check primary expected location and immediately adjacent bin faces.',
      '2. Launch StockTrace to evaluate combined scanner put-away records and camera corridor events.',
      '3. Physically inspect recommended candidate location (e.g., Bay B07).',
      '4. If item is located: select FOUND in StockTrace to complete pick and record confirmation.',
      '5. If item is absent: select NOT FOUND in StockTrace to dispatch automatic supervisor alert.',
    ],
  },
  {
    id: 'SOP-WHS-002',
    title: 'Misplaced Inventory Physical Verification',
    category: 'Verification',
    effectiveDate: '15 Jan 2026',
    revision: 'v1.4',
    citation: 'SOP-WHS-002 §2.4 (Physical Verification)',
    summary: 'Rules for confirming physical stock presence before updating inventory records.',
    keywords: [
      'physical verification',
      'misplaced stock',
      'verify location',
      'trust principle',
      'human confirmation',
      'candidate location',
    ],
    steps: [
      '1. Never assume physical presence based solely on system suggestions or visual evidence.',
      '2. An authorized warehouse associate must physically reach and confirm the SKU barcode.',
      '3. Scan barcode at verified bin location.',
      '4. Record confirmation in StockTrace so the operational audit log captures associate verification.',
    ],
  },
  {
    id: 'SOP-WHS-003',
    title: 'Damaged or Unusable Inventory Protocol',
    category: 'Damage',
    effectiveDate: '10 Feb 2026',
    revision: 'v2.0',
    citation: 'SOP-WHS-003 §4.1 (Damage Quarantine)',
    summary: 'Procedure when requested stock is physically located but damaged, broken, or unfit for customer fulfillment.',
    keywords: [
      'damaged',
      'broken',
      'unusable',
      'crushed',
      'leaking',
      'defective',
      'package damaged',
      'damaged inventory',
    ],
    steps: [
      '1. Do NOT fulfill or pick damaged inventory into active order totes.',
      '2. Select "Damaged" outcome in StockTrace verification bar.',
      '3. Enter brief note detailing damage (e.g., "Outer packaging crushed").',
      '4. Place yellow Quarantine hold sticker on the carton/unit.',
      '5. Move damaged unit to designated Aisle QA Quarantine Bin.',
    ],
  },
  {
    id: 'SOP-WHS-004',
    title: 'Inventory Count Discrepancy & Cycle Count Trigger',
    category: 'Discrepancy',
    effectiveDate: '01 Mar 2026',
    revision: 'v1.8',
    citation: 'SOP-WHS-004 §5.0 (Count Mismatch)',
    summary: 'Action required when actual bin quantity differs from expected pick order quantity.',
    keywords: [
      'wrong quantity',
      'partial pick',
      'partially found',
      'count mismatch',
      'shortage',
      'insufficient quantity',
      'overage',
    ],
    steps: [
      '1. If partial quantity is present: pick available units and select "Partially Found" in StockTrace.',
      '2. If total bin count does not match expected: select "Wrong Quantity" and enter actual observed count.',
      '3. StockTrace automatically generates a Discrepancy Record flagged for "Pending Review".',
      '4. Supervisor queue automatically schedules an off-shift cycle count for the bin.',
    ],
  },
  {
    id: 'SOP-WHS-005',
    title: 'Conflicting Inventory Movement Reconciliation',
    category: 'Reconciliation',
    effectiveDate: '15 Mar 2026',
    revision: 'v1.2',
    citation: 'SOP-WHS-005 §1.6 (Conflicting Records)',
    summary: 'Standard resolution when scanner transaction records and camera movement evidence point to differing locations.',
    keywords: [
      'conflict',
      'conflicting evidence',
      'scanner camera disagreement',
      'disagree',
      'no reliable location',
      'conflicting information',
    ],
    steps: [
      '1. Never guess an arbitrary winning location when transaction and visual records conflict.',
      '2. StockTrace marks state as CONFLICTING and refuses speculative recommendation.',
      '3. Both scanner destination and observed camera corridor are documented in the investigation.',
      '4. Escalate case directly to warehouse supervisor review.',
      '5. Supervisor dispatches physical audit across both contested locations.',
    ],
  },
];
