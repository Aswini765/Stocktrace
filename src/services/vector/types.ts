/**
 * StockTrace — Vector Storage & Semantic Retrieval Types
 */

export interface VectorDocumentChunk {
  id: string;
  documentId: string;
  title: string;
  category: 'SOP' | 'LANDMARK' | 'DISCREPANCY_GUIDE' | 'SAFETY';
  content: string;
  contentHash: string;
  metadata: {
    version: string;
    warehouseZone?: string;
    source: string;
    lastUpdated: string;
  };
  embedding?: number[];
}

export interface VectorSearchQuery {
  queryText: string;
  topK?: number;
  minSimilarityScore?: number;
  categoryFilter?: string;
  warehouseZoneFilter?: string;
}

export interface VectorSearchResult {
  chunk: VectorDocumentChunk;
  similarityScore: number;
}
