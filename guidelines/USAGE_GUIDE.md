# Card Classifier RAG - Usage Guide

## Quick Start

### 1. Set Up Environment Variables

Create a `.env.local` file in the project root:

```bash
# Copy the example
cat > .env.local << 'EOF'
# Google AI (for card extraction)
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key

# Pinecone (for vector storage)
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_TEXT_INDEX=card-classifier-text
PINECONE_IMAGE_INDEX=card-classifier-image
EOF
```

Replace the placeholder values with your actual API keys.

### 2. Create Pinecone Indexes

**Important**: You need TWO indexes because text and image embeddings have different dimensions.

#### Text Index (384 dimensions)

```bash
pc index create \
  -n card-classifier-text \
  -d 384 \
  -m cosine \
  -c aws \
  -r us-east-1
```

#### Image Index (512 dimensions)

```bash
pc index create \
  -n card-classifier-image \
  -d 512 \
  -m cosine \
  -c aws \
  -r us-east-1
```

Wait 30-60 seconds for indexes to become ready:

```bash
pc index list
```

### 3. Start the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Using the Application

### Upload a Card

1. Drag and drop a PSA card image or click to browse
2. The system will:
   - Extract structured data using Gemini Vision
   - Generate text embedding (384D) from card description
   - Generate CLIP image embedding (512D) from the image
   - Store both embeddings in separate Pinecone indexes
   - Return the extracted card data with a unique `cardId`

**Example Response:**

```json
{
  "cardId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "psa": {
    "certificationNumber": "12345678",
    "grade": 10,
    "gradeLabel": "GEM MT"
  },
  "player": {
    "name": "LeBron James",
    "team": "Cleveland Cavaliers",
    "position": "SF"
  },
  "card": {
    "year": 2003,
    "brand": "Topps",
    "setName": "Chrome",
    "cardNumber": "111",
    "rookie": true,
    "autographed": false
  }
}
```

### Search for Cards

#### Option 1: Using the API (POST)

```bash
curl -X POST http://localhost:3000/api/search-cards \
  -H "Content-Type: application/json" \
  -d '{
    "query": "LeBron James rookie card",
    "textWeight": 0.5,
    "imageWeight": 0.5,
    "topK": 10
  }'
```

**With Filters:**

```bash
curl -X POST http://localhost:3000/api/search-cards \
  -H "Content-Type: application/json" \
  -d '{
    "query": "high grade basketball cards",
    "textWeight": 0.6,
    "imageWeight": 0.4,
    "topK": 5,
    "filters": {
      "psa_grade": { "$gte": 9 },
      "card_rookie": true
    }
  }'
```

#### Option 2: Simple GET Request

```bash
curl "http://localhost:3000/api/search-cards?query=LeBron+James&topK=5"
```

### Search Response Format

```json
{
  "query": "LeBron James rookie card",
  "parameters": {
    "textWeight": 0.5,
    "imageWeight": 0.5,
    "topK": 10,
    "filters": null
  },
  "resultCount": 3,
  "results": [
    {
      "cardId": "a1b2c3d4-...",
      "scores": {
        "text": 0.89,
        "image": 0.76,
        "combined": 0.825
      },
      "card": {
        "player": {
          "name": "LeBron James",
          "team": "Cleveland Cavaliers"
        },
        "card": {
          "year": 2003,
          "brand": "Topps",
          "rookie": true
        },
        "psa": {
          "grade": 10,
          "gradeLabel": "GEM MT"
        },
        "textDescription": "LeBron James Cleveland Cavaliers SF 2003 Topps Chrome...",
        "timestamp": "2025-11-22T10:30:00.000Z"
      }
    }
  ]
}
```

## Understanding Hybrid Search

### How It Works

1. **Text Query → Text Embedding** (384D)

   - Your query is converted to a semantic vector
   - Searches against text embeddings from card descriptions
   - Best for: semantic concepts ("rookie", "high grade", player names)

2. **Text Query → CLIP Text Embedding** (512D)

   - Same query converted to CLIP's visual-semantic space
   - Searches against CLIP image embeddings
   - Best for: visual characteristics, card designs, layouts

3. **Score Merging**

   ```
   combined_score = (text_score × textWeight) + (image_score × imageWeight)
   ```

4. **Ranking**
   - Results sorted by combined score
   - Top K results returned

### Tuning Search Weights

Choose weights based on your use case:

#### Semantic-Heavy Searches

```json
{
  "query": "rookie cards with high PSA grades",
  "textWeight": 0.8,
  "imageWeight": 0.2
}
```

Best for: concept-based queries, metadata searches

#### Visual-Heavy Searches

```json
{
  "query": "cards with similar design to this one",
  "textWeight": 0.2,
  "imageWeight": 0.8
}
```

Best for: finding visually similar cards, design patterns

#### Balanced Hybrid

```json
{
  "query": "LeBron James cards",
  "textWeight": 0.5,
  "imageWeight": 0.5
}
```

Best for: general searches combining semantic and visual

## Advanced Filtering

### Available Filter Fields

| Field              | Type    | Example        | Description          |
| ------------------ | ------- | -------------- | -------------------- |
| `player_name`      | string  | "LeBron James" | Player full name     |
| `player_team`      | string  | "Lakers"       | Team name            |
| `card_year`        | number  | 2003           | Card production year |
| `card_brand`       | string  | "Topps"        | Manufacturer         |
| `psa_grade`        | number  | 10             | PSA grade (1-10)     |
| `card_rookie`      | boolean | true           | Is rookie card       |
| `card_autographed` | boolean | true           | Is autographed       |
| `rarity`           | string  | "Very Rare"    | Card rarity          |

### Filter Operators

- `$eq`: Equal to
- `$ne`: Not equal to
- `$gt`: Greater than
- `$gte`: Greater than or equal
- `$lt`: Less than
- `$lte`: Less than or equal
- `$in`: In array
- `$nin`: Not in array

### Filter Examples

**Find high-grade rookie cards from 2000s:**

```json
{
  "query": "basketball rookie cards",
  "filters": {
    "$and": [
      { "card_rookie": true },
      { "psa_grade": { "$gte": 9 } },
      { "card_year": { "$gte": 2000, "$lte": 2009 } }
    ]
  }
}
```

**Find specific player's autographed cards:**

```json
{
  "query": "autographed cards",
  "filters": {
    "$and": [{ "player_name": "LeBron James" }, { "card_autographed": true }]
  }
}
```

**Find cards from specific brands:**

```json
{
  "query": "premium basketball cards",
  "filters": {
    "card_brand": { "$in": ["Topps", "Panini", "Upper Deck"] }
  }
}
```

## Testing & Validation

### 1. Test Upload

```bash
# Upload a sample card
curl -X POST http://localhost:3000/api/analyze-card \
  -F "file=@path/to/card.jpg"
```

### 2. Wait for Indexing

**Important**: Pinecone has eventual consistency (5-10 seconds)

```bash
# Wait 10+ seconds before searching
sleep 10
```

### 3. Test Search

```bash
curl "http://localhost:3000/api/search-cards?query=test&topK=5"
```

### 4. Verify in Pinecone

```bash
# Check text index stats
pc index describe -n card-classifier-text

# Check image index stats
pc index describe -n card-classifier-image
```

## Common Issues & Solutions

### Issue: "Index not found"

**Solution:**

```bash
# Verify indexes exist
pc index list

# Check environment variables
cat .env.local | grep PINECONE

# Ensure index names match
```

### Issue: No search results after upload

**Solution:**

- Wait 10+ seconds for indexing
- Check server logs for errors
- Verify embeddings were stored:
  ```bash
  pc index describe -n card-classifier-text
  ```

### Issue: Slow first request

**Cause:** ML models downloading (~500MB total)
**Solution:**

- First request may take 30-60 seconds
- Subsequent requests are fast (models cached)
- Normal behavior, not an error

### Issue: TypeScript errors

**Solution:**

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check TypeScript version
npx tsc --version  # Should be 5.x
```

## Performance Considerations

### Model Loading

- **First upload**: ~30s (downloading CLIP + sentence-transformer)
- **Subsequent uploads**: ~2-3s (models cached)
- **Search queries**: ~1-2s

### Pinecone Latency

- **Upsert**: 1-3 seconds to store
- **Indexing**: 5-10 seconds to become searchable
- **Query**: <100ms per search

### Optimization Tips

1. **Batch uploads**: Upload multiple cards in parallel
2. **Pre-warm models**: Make a test request on startup
3. **Adjust topK**: Lower values = faster searches
4. **Use filters**: Reduce search space with metadata filters

## Integration Examples

### React Component

```typescript
import { useState } from "react";

function SearchCards() {
  const [results, setResults] = useState([]);

  const search = async (query: string) => {
    const response = await fetch("/api/search-cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        textWeight: 0.5,
        imageWeight: 0.5,
        topK: 10,
      }),
    });
    const data = await response.json();
    setResults(data.results);
  };

  return (
    <div>
      <input onChange={(e) => search(e.target.value)} />
      {results.map((r) => (
        <div key={r.cardId}>
          {r.card.player.name} - {r.card.card.year}
          <span>Score: {r.scores.combined.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}
```

### Python Client

```python
import requests

def search_cards(query, text_weight=0.5, image_weight=0.5):
    response = requests.post(
        'http://localhost:3000/api/search-cards',
        json={
            'query': query,
            'textWeight': text_weight,
            'imageWeight': image_weight,
            'topK': 10
        }
    )
    return response.json()

# Usage
results = search_cards("LeBron James rookie cards", text_weight=0.7)
for result in results['results']:
    print(f"{result['card']['player']['name']} - {result['scores']['combined']}")
```

## Next Steps

1. **Add UI components** for search interface
2. **Implement pagination** for large result sets
3. **Add image display** in search results
4. **Enable bulk uploads** for multiple cards
5. **Add analytics** to track popular searches
6. **Implement caching** for common queries

## Resources

- [Pinecone Documentation](https://docs.pinecone.io/)
- [CLIP Model Paper](https://arxiv.org/abs/2103.00020)
- [Sentence Transformers](https://www.sbert.net/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
