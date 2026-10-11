/**
 * StockTrace — Vector Ingestion Pipeline
 * 
 * Ingests approved warehouse SOPs, discrepancy resolution procedures,
 * and landmark descriptions into the vector store.
 */

import { vectorStore } from './vectorStore';
import { APPROVED_SOPS } from '../sop/sop_data';
import { VectorSearchResult } from './types';

function computeContentHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = (hash * 31 + content.charCodeAt(i)) % 2147483647;
  }
  return `hash-${Math.abs(hash).toString(16)}`;
}

let isInitialized = false;

/**
 * Initializes and populates the vector store with approved warehouse SOP documents.
 */
export async function initializeVectorStore(): Promise<number> {
  if (isInitialized) {
    return vectorStore.getChunkCount();
  }

  for (const sop of APPROVED_SOPS) {
    // 1. Ingest document summary chunk
    const summaryContent = `${sop.title}: ${sop.summary} Keywords: ${sop.keywords.join(', ')}`;
    await vectorStore.addChunk({
      id: `chunk-${sop.id}-summary`,
      documentId: sop.id,
      title: sop.title,
      category: 'SOP',
      content: summaryContent,
      contentHash: computeContentHash(summaryContent),
      metadata: {
        version: sop.revision,
        source: 'Warehouse Standard Operating Procedures (SOP Manual)',
        lastUpdated: sop.effectiveDate,
      },
    });

    // 2. Ingest document steps chunk
    const stepsContent = `${sop.title} Detailed Procedures: ${sop.steps.join(' ')}`;
    await vectorStore.addChunk({
      id: `chunk-${sop.id}-steps`,
      documentId: sop.id,
      title: `${sop.title} (Execution Steps)`,
      category: 'SOP',
      content: stepsContent,
      contentHash: computeContentHash(stepsContent),
      metadata: {
        version: sop.revision,
        source: 'Warehouse Standard Operating Procedures (SOP Manual)',
        lastUpdated: sop.effectiveDate,
      },
    });
  }

  // 3. Ingest warehouse rack landmark descriptions
  const landmarks = [
    {
      id: 'lm-aisle-3-blue-rack',
      title: 'Aisle 3 Blue Rack Landmark Description',
      content: 'Aisle 3 Blue Rack contains bins A10 through B15. Bottom shelf is Level 1 near packing conveyor 02.',
      zone: 'ZONE-A3',
    },
    {
      id: 'lm-staging-buffer-b07',
      title: 'Staging Buffer Bay B07 Description',
      content: 'Bin B07 is situated near the yellow staging buffer zone, adjacent to the outbound sorting chute.',
      zone: 'ZONE-B',
    },
    {
      id: 'lm-cage-bay-e14',
      title: 'Locked High-Value Cage Bay E14',
      content: 'Bay E14 is a locked cage dedicated to high-value automation parts and PLCs with biometric scanner verification.',
      zone: 'ZONE-E',
    },
  ];

  for (const lm of landmarks) {
    await vectorStore.addChunk({
      id: lm.id,
      documentId: lm.id,
      title: lm.title,
      category: 'LANDMARK',
      content: lm.content,
      contentHash: computeContentHash(lm.content),
      metadata: {
        version: '1.0',
        warehouseZone: lm.zone,
        source: 'Warehouse Facility Map & Landmark Index',
        lastUpdated: '2026-10-01',
      },
    });
  }

  isInitialized = true;
  return vectorStore.getChunkCount();
}

/**
 * Queries the vector database with guardrail protection.
 * Strictly prevents using vector retrieval to invent physical inventory locations.
 */
export async function querySopVector(
  queryText: string,
  options?: { topK?: number; minScore?: number; categoryFilter?: string }
): Promise<{
  matched: boolean;
  results: VectorSearchResult[];
  refusalReason?: string;
}> {
  await initializeVectorStore();

  const normalized = queryText.toLowerCase().trim();

  // Guardrail: Refuse queries trying to guess SKU physical location via semantic search
  const locationInventionPattern = /(where is|where can i find|where located|tell me location of|what bin is)\s+(sku|item|box|pallet|[a-z0-9-]+)/i;
  if (
    locationInventionPattern.test(normalized) &&
    !normalized.includes('procedure') &&
    !normalized.includes('protocol') &&
    !normalized.includes('sop') &&
    !normalized.includes('how')
  ) {
    return {
      matched: false,
      results: [],
      refusalReason:
        'SOP vector search cannot invent physical inventory locations. Relational movement tracking is required.',
    };
  }

  const results = await vectorStore.search({
    queryText,
    topK: options?.topK || 3,
    minSimilarityScore: options?.minScore || 0.15,
    categoryFilter: options?.categoryFilter,
  });

  return {
    matched: results.length > 0,
    results,
  };
}
