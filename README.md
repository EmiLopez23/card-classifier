# PSA Card Classifier - Multi-Tool AI Agent

An intelligent PSA certified NBA card classifier powered by LangGraph, featuring a 6-stage AI agent pipeline with multimodal analysis, web search, and hybrid RAG retrieval.

![Next.js](https://img.shields.io/badge/Next.js-16.x-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![LangGraph](https://img.shields.io/badge/LangGraph-1.x-green)

## ✨ Features

- 🤖 **Multi-Tool LangGraph Agent** - 6-stage pipeline for complete card analysis
- 🔍 **Vision Analysis** - Google Gemini 2.5 Flash for multimodal card extraction
- ✅ **NBA Validation** - Strict schema validation and required field checks
- 🔐 **PSA Certification** - Automatic authenticity verification via psacard.com
- ✨ **AI Descriptions** - Rich, collector-friendly text with web search enhancement
- 🌐 **Web Search** - Tavily integration for market data and player stats
- 🧮 **Hybrid Embeddings** - Text (384-dim) + Image (512-dim) vectors
- 💾 **Vector Storage** - Dual-index Pinecone for semantic search
- 🔎 **RAG Search** - Multimodal retrieval with adjustable weights
- 🎨 **Modern UI** - Beautiful interface with progress tracking

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- API keys for:
  - Google Gemini (required)
  - Pinecone (required)
  - Tavily (optional, for enhanced descriptions)

### Installation

```bash
# Clone and install
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📋 Environment Variables

```bash
# Required
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_TEXT=card-text-index
PINECONE_INDEX_IMAGE=card-image-index

# Optional (enhances descriptions with market data)
TAVILY_API_KEY=your_tavily_key
```

## 🏗️ Architecture

### Agent Pipeline

```
📥 Upload → 🔍 Extract → ✅ Validate → 🔐 Certify → ✨ Describe → 🧮 Embed → 💾 Save
```

### Tools

1. **Extract**: Multimodal analysis with Gemini Vision
2. **Validate**: NBA card verification and schema validation
3. **Certify**: PSA website authenticity check
4. **Describe**: AI-enhanced descriptions with web search
5. **Embeddings**: Text + image vector generation
6. **Save**: Automatic Pinecone dual-index storage

### Tech Stack

- **Framework**: Next.js 16 with App Router
- **Agent**: LangGraph state machine
- **Vision AI**: Google Gemini 2.5 Flash
- **Embeddings**: Transformers.js (MiniLM + CLIP)
- **Vector DB**: Pinecone (dual indexes)
- **Web Search**: Tavily API
- **Validation**: Zod schemas
- **UI**: React + Tailwind CSS

## 📖 Usage

### 1. Upload Card

- Drag and drop PSA certified NBA card image
- (Optional) Add hint: "Focus on rookie card features"
- Click "Analyze 1 Card"
- Watch 6-step progress indicator

### 2. View Results

- ✅ Database save confirmation
- ✨ AI-generated description
- 🔗 Web sources (expandable)
- 🔐 PSA certification status
- 📊 Complete card details

### 3. Search Cards

- Switch to Search tab
- Enter query: "LeBron James rookie"
- Adjust text/image weights
- Filter by grade, team, year, etc.
- View hybrid RAG results

## 📚 Documentation

Comprehensive guides available in `guidelines/`:

- **[AGENT_REFACTORING.md](guidelines/AGENT_REFACTORING.md)** - Complete architecture details
- **[SETUP.md](guidelines/SETUP.md)** - Step-by-step setup instructions
- **[USAGE_GUIDE.md](guidelines/USAGE_GUIDE.md)** - How to use the app
- **[RAG_IMPLEMENTATION.md](guidelines/RAG_IMPLEMENTATION.md)** - Hybrid search internals
- **[REFACTORING_COMPLETE.md](REFACTORING_COMPLETE.md)** - What changed in this version

## 🎯 Project Structure

```
card-classifier/
├── app/                    # Next.js app router
│   ├── api/               # API routes (analyze, search)
│   └── page.tsx           # Main UI
├── components/            # React components
│   ├── upload-card.tsx   # Upload with hint field
│   ├── result-card.tsx   # Results with AI description
│   └── ui/               # shadcn/ui components
├── lib/                   # Core logic
│   ├── langgraph-agent.ts # 6-tool LangGraph agent
│   ├── embeddings.ts     # Text + image embeddings
│   ├── vector-store.ts   # Pinecone operations
│   └── schemas.ts        # Zod validation schemas
├── hooks/                 # React hooks
│   └── use-card-analyzer.ts # Queue + retry logic
└── guidelines/            # Documentation
```

## 🧪 Development

```bash
# Run development server
npm run dev

# Lint code
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## 🐛 Troubleshooting

### Agent is slow on first run

Models download on first use (~100MB). Subsequent runs use cached models.

### Descriptions lack market data

Set `TAVILY_API_KEY` in `.env.local` for web search enhancement.

### Cards not saving to database

- Verify Pinecone indexes exist with correct dimensions (384 for text, 512 for image)
- Check API key is valid
- Review server logs for errors

See [SETUP.md](guidelines/SETUP.md) for detailed troubleshooting.

## 📊 Performance

- **Pipeline Time**: 20-40 seconds (varies with web search)
- **Timeout**: 60 seconds maximum
- **Concurrency**: Up to 3 cards simultaneously
- **Retry Logic**: 2 attempts with exponential backoff
- **Model Caching**: Downloads once, cached thereafter

## 🎓 Assignment Implementation

This project implements a comprehensive LangGraph agent as specified:

✅ Single agent with explicit state machine  
✅ Multimodal info call (image/PDF + hint)  
✅ Validates and extracts PSA card data  
✅ Certifies authenticity via PSA website  
✅ Rich descriptions with web search (Tavily)  
✅ Text + image embeddings generation  
✅ Persists to Pinecone for hybrid RAG  
✅ Maintains Assignment-2 retrieval API  
✅ Updated UI with new functionality

## 🤝 Contributing

The agent is modular - each tool can be:

- Enhanced with better models
- Replaced with alternatives
- Extended with new features
- Run in parallel (future optimization)

## 📄 License

See LICENSE file in repository.

## 🔗 Resources

- [LangGraph Documentation](https://langchain-ai.github.io/langgraphjs/)
- [Google Gemini API](https://ai.google.dev/)
- [Pinecone Vector Database](https://www.pinecone.io/)
- [Tavily Search API](https://www.tavily.com/)
- [Next.js Documentation](https://nextjs.org/docs)

---

Built with ❤️ using LangGraph, Next.js, and modern AI tools
