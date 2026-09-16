/**
 * StockTrace — SOP & Operational Guidance Types
 * Master Build Specification Section 15 & 16
 */

export interface SopDocument {
  id: string; // e.g. "SOP-WHS-001"
  title: string;
  category: 'Failed Pick' | 'Verification' | 'Damage' | 'Discrepancy' | 'Reconciliation';
  effectiveDate: string;
  revision: string;
  summary: string;
  steps: string[];
  refusalDirective?: string;
  keywords: string[];
  citation: string;
}

export interface SopQueryResult {
  matched: boolean;
  query: string;
  answer: string;
  citation?: string;
  document?: SopDocument;
  applicableSteps?: string[];
  refusalReason?: string;
}
