/**
 * StockTrace — Vector Store with Cosine Similarity Retrieval
 * Supports semantic search, metadata filtering, and content deduplication.
 */

import { VectorDocumentChunk, VectorSearchQuery, VectorSearchResult } from './types';
import { EmbeddingProvider, defaultEmbeddingProvider, cosineSimilarity } from './embeddingProvider';

export class VectorStore {
  private chunks: Map<string, VectorDocumentChunk> = new Map();
  private embeddingProvider: EmbeddingProvider;

  constructor(provider: EmbeddingProvider = defaultEmbeddingProvider) {
    this.embeddingProvider = provider;
  }

  public async addChunk(chunk: Omit<VectorDocumentChunk, 'embedding'>): Promise<VectorDocumentChunk> {
    const embedding = await this.embeddingProvider.generateEmbedding(chunk.content);
    const fullChunk: VectorDocumentChunk = {
      ...chunk,
      embedding,
    };
    this.chunks.set(fullChunk.id, fullChunk);
    return fullChunk;
  }

  public getChunkCount(): number {
    return this.chunks.size;
  }

  public clear(): void {
    this.chunks.clear();
  }

  public async search(query: VectorSearchQuery): Promise<VectorSearchResult[]> {
    const {
      queryText,
      topK = 3,
      minSimilarityScore = 0.2,
      categoryFilter,
      warehouseZoneFilter,
    } = query;

    const queryEmbedding = await this.embeddingProvider.generateEmbedding(queryText);
    const results: VectorSearchResult[] = [];

    for (const chunk of this.chunks.values()) {
      if (!chunk.embedding) continue;

      // Metadata filters
      if (categoryFilter && chunk.category !== categoryFilter) {
        continue;
      }
      if (warehouseZoneFilter && chunk.metadata.warehouseZone !== warehouseZoneFilter) {
        continue;
      }

      const score = cosineSimilarity(queryEmbedding, chunk.embedding);
      if (score >= minSimilarityScore) {
        results.push({
          chunk,
          similarityScore: score,
        });
      }
    }

    // Sort descending by similarity score
    results.sort((a, b) => b.similarityScore - a.similarityScore);

    return results.slice(0, topK);
  }
}

export const vectorStore = new VectorStore();
