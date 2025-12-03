# Setup Guide for LangGraph Agent

## Prerequisites

- Node.js 18+ and npm
- Next.js 16.x
- API keys for Google Gemini, Pinecone, and optionally Tavily

## Installation

```bash
# Install dependencies (already done if following from previous assignments)
npm install
```

## Environment Configuration

Create a `.env.local` file in the project root with the following variables:

```bash
# Google Gemini API (Required)
# Get your API key from: https://makersuite.google.com/app/apikey
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here

# Pinecone Vector Database (Required)
# Get your API key from: https://www.pinecone.io/
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_TEXT=card-text-index
PINECONE_INDEX_IMAGE=card-image-index

# Tavily Web Search (Optional - for enhanced card descriptions)
# Sign up at: https://www.tavily.com/
# If not provided, the agent will skip web search and use base descriptions
TAVILY_API_KEY=your_tavily_api_key_here
```

## Pinecone Index Setup

You need two Pinecone indexes with specific dimensions:

### Text Index (384 dimensions)

```bash
# Using Pinecone CLI or dashboard
Index Name: card-text-index
Dimensions: 384
Metric: cosine
```

### Image Index (512 dimensions)

```bash
# Using Pinecone CLI or dashboard
Index Name: card-image-index
Dimensions: 512
Metric: cosine
```

See [PINECONE_SETUP.md](./PINECONE_SETUP.md) for detailed instructions.

## Tavily Setup (Optional)

Tavily is used for web search to enhance card descriptions with market data and player information.

### Steps to Get API Key:

1. Visit [https://www.tavily.com/](https://www.tavily.com/)
2. Sign up for a free account
3. Navigate to your dashboard
4. Copy your API key
5. Add it to `.env.local` as `TAVILY_API_KEY`

### Free Tier Limits:

- 1,000 requests per month
- 3 results per request (we use this)
- Basic search depth

### Fallback Behavior:

If `TAVILY_API_KEY` is not set or requests fail:

- Agent continues without web search
- Uses base card description from metadata
- No error thrown - graceful degradation

## Running the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## Testing the Agent

### 1. Upload Tab

1. Navigate to the Upload tab
2. Drag and drop a PSA certified NBA card image
3. (Optional) Enter a hint: e.g., "Focus on rookie card features"
4. Click "Analyze 1 Card"
5. Watch the 6-step progress indicator:
   - Extract → Validate → Certify → Describe → Embed → Save

### 2. View Results

After analysis completes, you'll see:

- ✅ **Database Status**: Confirmation with card ID
- 🌟 **AI-Generated Description**: Rich, collector-friendly text
- 🔗 **Web Sources**: Expandable citations (if Tavily enabled)
- 📜 **Certification Status**: PSA verification result
- 📊 **Card Details**: All extracted information

### 3. Search Tab

1. Wait ~10 seconds for embeddings to index
2. Switch to Search tab
3. Enter a query: e.g., "LeBron James rookie card"
4. Adjust filters and weights as needed
5. View hybrid search results

## Troubleshooting

### Agent Times Out

**Issue**: Request takes longer than 60 seconds

**Solutions**:

- Check network connectivity for PSA cert verification
- Verify Tavily API is responding (if enabled)
- Increase `maxDuration` in `/app/api/analyze-card/route.ts`

### Web Search Fails

**Issue**: Description doesn't include market insights

**Possible Causes**:

- `TAVILY_API_KEY` not set or invalid
- Free tier limit exceeded
- Network issues

**Behavior**:

- Agent continues with base description
- Check console for "Web search failed or skipped" message

### Embeddings Generation Slow

**Issue**: First request takes very long

**Explanation**:

- Models download on first use (~100MB)
- Subsequent requests use cached models
- Normal behavior - be patient on first run

### Database Save Fails

**Issue**: Card not searchable after upload

**Check**:

- Pinecone API key is valid
- Index names match environment variables
- Index dimensions are correct (384 for text, 512 for image)
- Check server logs for detailed error

## Agent Architecture

The agent follows this pipeline:

```
┌─────────────┐
│   Extract   │ ← Multimodal analysis with Gemini
└──────┬──────┘
       ↓
┌─────────────┐
│  Validate   │ ← NBA card verification
└──────┬──────┘
       ↓
┌─────────────┐
│   Certify   │ ← PSA website verification
└──────┬──────┘
       ↓
┌─────────────┐
│  Describe   │ ← AI description + web search (Tavily)
└──────┬──────┘
       ↓
┌─────────────┐
│ Embeddings  │ ← Text + image embeddings
└──────┬──────┘
       ↓
┌─────────────┐
│    Save     │ ← Pinecone storage
└─────────────┘
```

Each step can fail gracefully without breaking the entire pipeline.

## Development Tips

### Enable Detailed Logging

Add console logs in `lib/langgraph-agent.ts` to see tool execution:

```typescript
console.log(`[${new Date().toISOString()}] Tool: extractCardInformation`);
```

### Test Individual Tools

Each tool can be tested independently:

```typescript
import { extractCardInformation } from "@/lib/langgraph-agent";

const result = await extractCardInformation({
  imageBase64: "...",
  mimeType: "image/jpeg",
  currentStep: "extract",
});
```

### Skip Web Search in Development

To test faster without web search:

```bash
# Don't set TAVILY_API_KEY in .env.local
# OR temporarily comment out the Tavily API call
```

## Additional Resources

- [Agent Refactoring Documentation](./AGENT_REFACTORING.md)
- [RAG Implementation Guide](./RAG_IMPLEMENTATION.md)
- [Usage Guide](./USAGE_GUIDE.md)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraphjs/)
- [Tavily API Docs](https://docs.tavily.com/)

## Support

For issues or questions:

1. Check the console logs for detailed error messages
2. Review the documentation in `guidelines/`
3. Verify all environment variables are set correctly
4. Test with the provided example cards
