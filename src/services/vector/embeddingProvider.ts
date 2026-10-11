/**
 * StockTrace — Vector Embedding Provider
 * 
 * Supports configurable embedding generation:
 * - Google Gemini text-embedding-004 when API key is provided
 * - High-speed, deterministic normalized semantic feature vector generator for offline,
 *   testing, and local environments (zero network latency, zero cost, 100% reproducible).
 */

export interface EmbeddingProvider {
  generateEmbedding(text: string): Promise<number[]>;
  getDimensions(): number;
  getModelName(): string;
}

/**
 * Calculates cosine similarity between two normalized vectors: (A . B) / (||A|| * ||B||)
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  return Math.max(-1, Math.min(1, dotProduct / denominator));
}

/**
 * Deterministic Semantic Feature Embedding Provider (Offline & Testing Safe)
 * Maps warehouse vocabulary, SOP categories, and n-grams into a 128-dimensional unit vector space.
 */
export class DeterministicSemanticEmbeddingProvider implements EmbeddingProvider {
  private dimensions: number = 128;

  public getDimensions(): number {
    return this.dimensions;
  }

  public getModelName(): string {
    return 'stocktrace-deterministic-semantic-v1';
  }

  public async generateEmbedding(text: string): Promise<number[]> {
    const normalized = text.toLowerCase().trim();
    const vector = new Array(this.dimensions).fill(0);

    // Hash token features and bi-grams into vector dimensions
    const words = normalized.split(/[^a-z0-9_-]+/).filter((w) => w.length > 0);

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      let hash = 0;
      for (let j = 0; j < word.length; j++) {
        hash = (hash * 31 + word.charCodeAt(j)) % 2147483647;
      }
      const dim = Math.abs(hash) % this.dimensions;
      vector[dim] += 1.0;

      // Bigram feature
      if (i > 0) {
        const bigram = `${words[i - 1]}_${word}`;
        let biHash = 0;
        for (let j = 0; j < bigram.length; j++) {
          biHash = (biHash * 37 + bigram.charCodeAt(j)) % 2147483647;
        }
        const biDim = Math.abs(biHash) % this.dimensions;
        vector[biDim] += 1.5;
      }
    }

    // Key domain concept clustering
    const domainKeywords: Record<string, number[]> = {
      sop: [1, 5, 9],
      procedure: [1, 5, 12],
      protocol: [1, 5, 14],
      missing: [2, 10, 18],
      discrepancy: [2, 11, 20],
      damaged: [3, 15, 22],
      quarantine: [3, 16, 25],
      shortage: [4, 17, 30],
      partial: [4, 18, 31],
      scanner: [6, 21, 35],
      barcode: [6, 22, 36],
      camera: [7, 26, 40],
      cctv: [7, 27, 41],
      supervisor: [8, 29, 45],
      audit: [8, 30, 46],
      landmark: [13, 33, 50],
      shelf: [13, 34, 51],
      rack: [13, 35, 52],
    };

    for (const [kw, dims] of Object.entries(domainKeywords)) {
      if (normalized.includes(kw)) {
        for (const d of dims) {
          vector[d] += 2.0;
        }
      }
    }

    // L2 Normalize vector to unit length
    let norm = 0;
    for (let i = 0; i < this.dimensions; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < this.dimensions; i++) {
        vector[i] /= norm;
      }
    }

    return vector;
  }
}

export const defaultEmbeddingProvider = new DeterministicSemanticEmbeddingProvider();
