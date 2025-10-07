import { OpenAI } from 'openai';
import { EmbeddingPort, EmbeddingOptions } from '../embedding.port';

/**
 * OpenAI embeddings driver implementation
 */
export class OpenAIEmbeddingsDriver implements EmbeddingPort {
  private client: OpenAI;
  private model: string;
  private dimensions: number;

  constructor(apiKey: string, options: { model?: string; dimensions?: number } = {}) {
    this.client = new OpenAI({ apiKey });
    this.model = options.model || 'text-embedding-3-small';
    this.dimensions = options.dimensions || 1536; // Default for text-embedding-3-small
  }

  async generateEmbeddings(texts: string[], options: EmbeddingOptions = {}): Promise<number[][]> {
    try {
      const response = await this.client.embeddings.create({
        model: options.model || this.model,
        input: texts,
        encoding_format: options.encodingFormat || 'float',
        dimensions: options.dimensions || this.dimensions,
        user: options.user,
      });

      return response.data.map(item => item.embedding);
    } catch (error) {
      console.error('OpenAI embeddings error:', error);
      throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
  }

  getEmbeddingDimensions(): number {
    return this.dimensions;
  }

  async isHealthy(): Promise<boolean> {
    try {
      // Simple health check by generating a small embedding
      await this.generateEmbeddings(['health check'], {
        model: 'text-embedding-3-small',
        dimensions: 1536
      });
      return true;
    } catch (error) {
      console.error('OpenAI embeddings health check failed:', error);
      return false;
    }
  }
}

/**
 * Factory function to create OpenAI embeddings driver
 */
export function createOpenAIEmbeddingsDriver(): OpenAIEmbeddingsDriver {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  return new OpenAIEmbeddingsDriver(apiKey, {
    model: process.env.OPENAI_EMBEDDINGS_MODEL || 'text-embedding-3-small',
    dimensions: parseInt(process.env.OPENAI_EMBEDDINGS_DIMENSIONS || '1536')
  });
}


