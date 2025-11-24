import { Pinecone } from "@pinecone-database/pinecone";

// Initialize Pinecone client (singleton pattern)
let pineconeClient: Pinecone | null = null;

export function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      throw new Error("PINECONE_API_KEY environment variable is not set");
    }
    pineconeClient = new Pinecone({ apiKey });
  }
  return pineconeClient;
}

export function getTextIndexName(): string {
  const indexName = process.env.PINECONE_TEXT_INDEX || "card-classifier-text";
  return indexName;
}

export function getImageIndexName(): string {
  const indexName = process.env.PINECONE_IMAGE_INDEX || "card-classifier-image";
  return indexName;
}

// Get the text index (384 dimensions - all-MiniLM-L6-v2)
export function getTextIndex() {
  const pc = getPineconeClient();
  const indexName = getTextIndexName();
  return pc.index(indexName);
}

// Get the image index (512 dimensions - CLIP-ViT-B/32)
export function getImageIndex() {
  const pc = getPineconeClient();
  const indexName = getImageIndexName();
  return pc.index(indexName);
}
