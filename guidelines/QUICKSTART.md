# Quick Start Guide - Multimodal RAG for Card Classifier

Get your multimodal RAG system running in **5 minutes**! ⚡

## Prerequisites

- Node.js 18+ installed
- Pinecone account ([sign up free](https://www.pinecone.io))
- Google AI API key (already configured)

## Step 1: Set Up Environment (30 seconds)

Create `.env.local` file:

```bash
cat > .env.local << 'EOF'
GOOGLE_GENERATIVE_AI_API_KEY=your_existing_google_key
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_TEXT_INDEX=card-classifier-text
PINECONE_IMAGE_INDEX=card-classifier-image
EOF
```

**Get your Pinecone API key:**

1. Go to [console.pinecone.io](https://console.pinecone.io)
2. Navigate to "API Keys"
3. Copy your API key
4. Replace `your_pinecone_api_key_here` in `.env.local`

## Step 2: Install Pinecone CLI (1 minute)

### macOS

```bash
brew tap pinecone-io/tap
brew install pinecone-io/tap/pinecone
```

### Other Platforms

Download from [GitHub Releases](https://github.com/pinecone-io/cli/releases)

### Verify & Authenticate

```bash
pc version
export PINECONE_API_KEY=$(grep PINECONE_API_KEY .env.local | cut -d '=' -f2)
pc auth configure --api-key $PINECONE_API_KEY
```

## Step 3: Create Pinecone Indexes (1 minute)

**Why two indexes?** Text embeddings (384D) and image embeddings (512D) need separate indexes.

```bash
# Text index (384 dimensions)
pc index create -n card-classifier-text -d 384 -m cosine -c aws -r us-east-1

# Image index (512 dimensions)
pc index create -n card-classifier-image -d 512 -m cosine -c aws -r us-east-1
```

**Wait for indexes to be ready:**

```bash
pc index list
# Both should show status: Ready (wait 30-60s if Initializing)
```

## Step 4: Test Connection (30 seconds)

```bash
npx tsx scripts/test-rag.ts
```

Expected output:

```
🔍 Testing Pinecone connection...
✅ Pinecone client initialized

📋 Available indexes:
  - card-classifier-text (384D, cosine)
  - card-classifier-image (512D, cosine)

📊 Text Index Stats:
  Total records: 0
  Namespaces: []

🖼️  Image Index Stats:
  Total records: 0
  Namespaces: []

✅ Connection test complete!
```

## Step 5: Start the Server (10 seconds)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 6: Upload Your First Card (2 minutes)

### Option A: Via Web Interface

1. Go to [http://localhost:3000](http://localhost:3000)
2. Drag & drop a PSA card image
3. Wait for extraction (1-2 seconds)
4. ✅ Card data displayed + embeddings stored!

### Option B: Via API

```bash
curl -X POST http://localhost:3000/api/analyze-card \
  -F "file=@path/to/your/card.jpg"
```

**Note:** First upload takes 30-60 seconds (downloading ML models). Subsequent uploads are fast (~2-3s).

## Step 7: Search for Cards (30 seconds)

**⚠️ Important:** Wait 10+ seconds after upload for Pinecone indexing!

```bash
# Wait for indexing
sleep 10

# Search!
curl "http://localhost:3000/api/search-cards?query=test&topK=5"
```

### Advanced Search (POST)

```bash
curl -X POST http://localhost:3000/api/search-cards \
  -H "Content-Type: application/json" \
  -d '{
    "query": "LeBron James rookie card",
    "textWeight": 0.5,
    "imageWeight": 0.5,
    "topK": 10,
    "filters": {
      "card_rookie": true,
      "psa_grade": { "$gte": 9 }
    }
  }'
```

## 🎉 Success!

You now have a working multimodal RAG system that:

- ✅ Extracts structured data from card images
- ✅ Creates text embeddings (semantic search)
- ✅ Creates image embeddings (visual search)
- ✅ Performs hybrid retrieval with tunable weights
- ✅ Filters by metadata (grade, year, player, etc.)

## Next Steps

### Understanding Hybrid Search Weights

**Semantic-focused** (text-heavy queries):

```json
{
  "query": "high grade rookie cards from 2000s",
  "textWeight": 0.8,
  "imageWeight": 0.2
}
```

**Visual-focused** (image similarity):

```json
{
  "query": "cards with similar design",
  "textWeight": 0.2,
  "imageWeight": 0.8
}
```

**Balanced** (general search):

```json
{
  "query": "LeBron James cards",
  "textWeight": 0.5,
  "imageWeight": 0.5
}
```

### Verify Everything Works

```bash
# 1. Check index stats
pc index describe -n card-classifier-text
pc index describe -n card-classifier-image

# 2. Run connection test
npx tsx scripts/test-rag.ts

# 3. Test upload
curl -X POST http://localhost:3000/api/analyze-card -F "file=@card.jpg"

# 4. Wait 10 seconds
sleep 10

# 5. Test search
curl "http://localhost:3000/api/search-cards?query=test"
```

## Troubleshooting

### "Index not found" error

```bash
# Check if indexes exist
pc index list

# Recreate if needed
pc index create -n card-classifier-text -d 384 -m cosine -c aws -r us-east-1
pc index create -n card-classifier-image -d 512 -m cosine -c aws -r us-east-1
```

### No search results after upload

```bash
# Wait longer (10+ seconds for indexing)
sleep 15

# Check if records were stored
pc index describe -n card-classifier-text
# Should show recordCount > 0
```

### First upload very slow

- **Normal!** ML models downloading (~500MB)
- First request: 30-60 seconds
- Subsequent requests: 2-3 seconds

### TypeScript errors

```bash
# Reinstall dependencies
npm install

# Check versions
node --version  # Should be 18+
npx tsc --version  # Should be 5+
```

## Documentation

- **PINECONE_SETUP.md** - Detailed setup instructions
- **USAGE_GUIDE.md** - API examples and usage patterns
- **RAG_IMPLEMENTATION.md** - Technical architecture details
- **AGENTS.md** - Pinecone best practices reference

## Example Queries to Try

After uploading a few cards:

```bash
# Find rookie cards
curl -X POST http://localhost:3000/api/search-cards \
  -H "Content-Type: application/json" \
  -d '{"query": "rookie card", "topK": 5}'

# Find high-grade cards
curl -X POST http://localhost:3000/api/search-cards \
  -H "Content-Type: application/json" \
  -d '{
    "query": "basketball cards",
    "filters": {"psa_grade": {"$gte": 9}}
  }'

# Find specific player
curl "http://localhost:3000/api/search-cards?query=LeBron+James"
```

## Performance Tips

1. **Batch uploads**: Upload multiple cards in parallel
2. **Adjust topK**: Lower = faster (try topK=5 vs topK=50)
3. **Use filters**: Reduce search space with metadata
4. **Pre-warm**: Make a test request after server start

## Architecture Summary

```
Upload → Gemini Vision → Structured Data
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
              Text Embed           Image Embed
              (384D)               (512D)
                    ↓                   ↓
              Text Index          Image Index
              (Pinecone)          (Pinecone)
                    ↓                   ↓
                    └─────────┬─────────┘
                              ↓
                       Hybrid Search
                     (Weighted Merge)
                              ↓
                      Ranked Results
```

## Need Help?

- Check documentation: `USAGE_GUIDE.md`, `RAG_IMPLEMENTATION.md`
- Pinecone docs: [docs.pinecone.io](https://docs.pinecone.io)
- Test connection: `npx tsx scripts/test-rag.ts`

---

**You're all set! 🚀** Upload some cards and start searching!
