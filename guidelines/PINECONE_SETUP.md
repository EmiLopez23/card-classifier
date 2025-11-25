# Pinecone RAG Setup Guide

This guide walks you through setting up the multimodal RAG system for card classification.

## Prerequisites

1. **Pinecone Account**: Sign up at [https://www.pinecone.io](https://www.pinecone.io)
2. **Pinecone API Key**: Get your API key from the Pinecone console
3. **Pinecone CLI**: Install for index management

## Step 1: Install Pinecone CLI

### macOS (Homebrew)

```bash
brew tap pinecone-io/tap
brew install pinecone-io/tap/pinecone
```

### Other Platforms

Download from [GitHub Releases](https://github.com/pinecone-io/cli/releases)

### Verify Installation

```bash
pc version
```

## Step 2: Configure Pinecone CLI

Set your API key:

```bash
export PINECONE_API_KEY="your-pinecone-api-key"
pc auth configure --api-key $PINECONE_API_KEY
```

Or use interactive login:

```bash
pc login
pc target -o "your-org" -p "your-project"
```

## Step 3: Create Pinecone Indexes

This system uses **two separate indexes** for optimal performance:

### Text Index (for semantic text search)

```bash
pc index create \
  -n card-classifier-text \
  -d 384 \
  -m cosine \
  -c aws \
  -r us-east-1
```

**Parameters:**

- `-n card-classifier-text`: Index name for text embeddings
- `-d 384`: Dimension for all-MiniLM-L6-v2 embeddings
- `-m cosine`: Cosine similarity metric
- `-c aws`: Cloud provider
- `-r us-east-1`: Region (choose closest to you)

### Image Index (for visual similarity search)

```bash
pc index create \
  -n card-classifier-image \
  -d 512 \
  -m cosine \
  -c aws \
  -r us-east-1
```

**Parameters:**

- `-n card-classifier-image`: Index name for CLIP image embeddings
- `-d 512`: Dimension for CLIP-ViT-B/32 embeddings
- Other parameters same as text index

### Verify Index Creation

```bash
pc index list
pc index describe -n card-classifier-text
pc index describe -n card-classifier-image
```

Wait 30-60 seconds for indexes to become "Ready".

## Step 4: Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Google AI (already configured)
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_TEXT_INDEX=card-classifier-text
PINECONE_IMAGE_INDEX=card-classifier-image
```

## Step 5: Update Code to Use Two Indexes

The current implementation uses a single index. You need to update `lib/pinecone.ts` and `lib/vector-store.ts` to use separate indexes.

### Update lib/pinecone.ts

```typescript
export function getTextIndexName(): string {
  return process.env.PINECONE_TEXT_INDEX || "card-classifier-text";
}

export function getImageIndexName(): string {
  return process.env.PINECONE_IMAGE_INDEX || "card-classifier-image";
}

export function getTextIndex() {
  const pc = getPineconeClient();
  return pc.index(getTextIndexName());
}

export function getImageIndex() {
  const pc = getPineconeClient();
  return pc.index(getImageIndexName());
}
```

## Step 6: Run the Application

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## How It Works

### 1. Upload Flow

When you upload a card image:

1. **Extraction**: Gemini extracts structured data (player, card details, PSA info)
2. **Text Embedding**: Creates semantic embedding from card description
3. **Image Embedding**: Creates CLIP visual embedding from the image
4. **Storage**: Stores both embeddings in separate Pinecone indexes

### 2. Search Flow

When you search:

1. **Text Query Embedding**: Converts your text query to embedding
2. **CLIP Text Embedding**: Creates CLIP embedding for visual matching
3. **Text Search**: Queries text index for semantic matches
4. **Image Search**: Queries image index using CLIP text embedding
5. **Hybrid Merge**: Combines scores with tunable weights
6. **Ranking**: Returns top K results sorted by combined score

## API Endpoints

### Upload & Extract Card

```bash
POST /api/analyze-card
Content-Type: multipart/form-data

file: <image file>
```

### Search Cards (Hybrid)

```bash
POST /api/search-cards
Content-Type: application/json

{
  "query": "LeBron James rookie card",
  "textWeight": 0.5,      // 0-1, default 0.5
  "imageWeight": 0.5,     // 0-1, default 0.5
  "topK": 10,            // default 10
  "filters": {           // optional
    "card_rookie": true,
    "psa_grade": 10
  }
}
```

### Simple Search (GET)

```bash
GET /api/search-cards?query=LeBron+James&topK=5
```

## Tuning Weights

Adjust `textWeight` and `imageWeight` based on your use case:

| Use Case            | textWeight | imageWeight | Best For                                          |
| ------------------- | ---------- | ----------- | ------------------------------------------------- |
| **Semantic Search** | 0.8        | 0.2         | Text-based queries ("rookie cards", "high grade") |
| **Visual Search**   | 0.2        | 0.8         | Finding visually similar cards                    |
| **Balanced**        | 0.5        | 0.5         | General hybrid search                             |
| **Text Only**       | 1.0        | 0.0         | Pure semantic search                              |
| **Image Only**      | 0.0        | 1.0         | Pure visual similarity                            |

## Metadata Filters

Available filter fields:

- `player_name`: String (e.g., "LeBron James")
- `player_team`: String (e.g., "Los Angeles Lakers")
- `card_year`: Number (e.g., 2003)
- `card_brand`: String (e.g., "Topps")
- `psa_grade`: Number (1-10)
- `card_rookie`: Boolean
- `card_autographed`: Boolean
- `rarity`: String ("Common", "Rare", etc.)

### Example with Filters

```json
{
  "query": "high grade basketball cards",
  "topK": 10,
  "filters": {
    "psa_grade": { "$gte": 9 },
    "card_rookie": true,
    "card_year": { "$gte": 2000 }
  }
}
```

## Monitoring

Check index statistics:

```bash
pc index describe -n card-classifier-text
pc index describe -n card-classifier-image
```

View namespace stats programmatically:

```typescript
const textIndex = getTextIndex();
const stats = await textIndex.describeIndexStats();
console.log(stats);
```

## Troubleshooting

### "Index not found" Error

- Run `pc index list` to verify indexes exist
- Check index names in `.env.local` match created indexes
- Wait 30-60 seconds after creation for indexes to become ready

### "No results found"

- Wait 10+ seconds after uploading before searching (eventual consistency)
- Check if embeddings were stored: `pc index describe -n card-classifier-text`
- Try broader queries or remove filters

### Slow Performance

- Models download on first use (~500MB for CLIP)
- Subsequent requests are much faster (models cached)
- Consider using serverless functions with adequate timeout

### TypeScript Errors

- Ensure `@pinecone-database/pinecone` is installed
- Check TypeScript version (4.1+ required)
- Run `npm install` to ensure all dependencies are present

## Best Practices

1. **Always use namespaces** for data isolation
2. **Batch uploads** if processing many cards (96 records/batch max)
3. **Handle errors gracefully** - embedding storage shouldn't block uploads
4. **Monitor costs** - track API usage in Pinecone console
5. **Secure API keys** - never commit `.env.local` to git

## Further Reading

- [Pinecone Documentation](https://docs.pinecone.io/)
- [CLIP Paper](https://arxiv.org/abs/2103.00020)
- [Sentence Transformers](https://www.sbert.net/)
