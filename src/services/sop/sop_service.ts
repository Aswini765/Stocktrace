/**
 * StockTrace — SOP & Operational Guidance Retrieval Service
 * Master Build Specification Section 15 & 16
 * 
 * STRICT COMPLIANCE RULES:
 * 1. RAG is a supporting capability for approved warehouse SOP questions,
 *    discrepancy procedures, and operational guidance ONLY.
 * 2. RAG must NOT be used to invent physical inventory locations.
 * 3. If no relevant SOP is found, MUST return exactly:
 *    "No approved procedure was found for this question."
 */

import { APPROVED_SOPS } from './sop_data';
import { SopDocument, SopQueryResult } from './types';

export class SopService {
  private sops: SopDocument[] = APPROVED_SOPS;

  /**
   * Evaluates a user query against approved warehouse SOPs.
   */
  public querySop(query: string): SopQueryResult {
    const rawQuery = (query || '').trim();
    if (!rawQuery) {
      return {
        matched: false,
        query: rawQuery,
        answer: 'No approved procedure was found for this question.',
        refusalReason: 'Empty query provided.',
      };
    }

    const normalized = rawQuery.toLowerCase();

    // RULE 1: Guardrail against using SOP to guess or invent SKU physical locations
    // e.g. "Where is SKU-1042 located right now?" or "Where is my item?"
    const locationInventionPattern = /(where is|where can i find|where located|tell me location of|what bin is)\s+(sku|item|box|pallet|[a-z0-9-]+)/i;
    if (locationInventionPattern.test(normalized) && !normalized.includes('procedure') && !normalized.includes('protocol') && !normalized.includes('sop') && !normalized.includes('how')) {
      return {
        matched: false,
        query: rawQuery,
        answer: 'No approved procedure was found for this question.',
        refusalReason:
          'SOP operational guidance cannot invent or determine specific physical inventory locations. Use the StockTrace investigation tool to trace SKU transactions and visual events.',
      };
    }

    // Score documents based on keyword, title, category, and step matches
    let topScore = 0;
    let topDoc: SopDocument | null = null;

    const searchTokens = normalized.split(/\s+/).filter((t) => t.length > 2);

    for (const doc of this.sops) {
      let score = 0;

      // Exact keyword match
      for (const kw of doc.keywords) {
        if (normalized.includes(kw.toLowerCase())) {
          score += 10;
        }
      }

      // Title & category match
      if (normalized.includes(doc.title.toLowerCase())) {
        score += 8;
      }
      if (normalized.includes(doc.category.toLowerCase())) {
        score += 4;
      }

      // Token matching across summary and steps
      for (const token of searchTokens) {
        if (doc.title.toLowerCase().includes(token)) score += 3;
        if (doc.summary.toLowerCase().includes(token)) score += 2;
        for (const step of doc.steps) {
          if (step.toLowerCase().includes(token)) score += 1;
        }
      }

      if (score > topScore) {
        topScore = score;
        topDoc = doc;
      }
    }

    // Threshold check (minimum score required for genuine match)
    if (!topDoc || topScore < 4) {
      return {
        matched: false,
        query: rawQuery,
        answer: 'No approved procedure was found for this question.',
        refusalReason: 'No approved warehouse SOP addresses this query with sufficient relevance.',
      };
    }

    return {
      matched: true,
      query: rawQuery,
      answer: topDoc.summary,
      citation: topDoc.citation,
      document: topDoc,
      applicableSteps: topDoc.steps,
    };
  }

  /**
   * Retrieves all approved SOP documents.
   */
  public getAllSops(): SopDocument[] {
    return [...this.sops];
  }

  /**
   * Retrieves an SOP by ID.
   */
  public getSopById(id: string): SopDocument | undefined {
    return this.sops.find((s) => s.id === id);
  }
}

export const sopService = new SopService();
