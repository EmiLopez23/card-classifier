### Pinecone Quickstart (macOS)

This quickstart sets up a minimal workflow to verify Pinecone end-to-end:
- Install Pinecone CLI (for index admin)
- Configure auth
- Create an index with integrated embeddings
- Run a Python script to upsert sample data, search, and rerank results

Prerequisites:
- macOS terminal access
- Python 3.10+ available on PATH
- A Pinecone API key

### 1) Install Pinecone CLI (admin tasks via CLI)

```bash
brew tap pinecone-io/tap
brew install pinecone-io/tap/pinecone
# Upgrade later if needed
brew update && brew upgrade pinecone
```

If you don’t use Homebrew, download the CLI from the GitHub Releases page: `https://github.com/pinecone-io/cli/releases`

Verify:

```bash
pc version
```

### 2) Authenticate

Export your API key and configure the CLI:

```bash
export PINECONE_API_KEY="YOUR_API_KEY_HERE"
pc auth configure --api-key "$PINECONE_API_KEY"
```

Optionally set your default org/project:

```bash
pc target -o "my-org" -p "my-project"
```

### 3) Create a test index (integrated embeddings)

Use CLI for index creation:

```bash
pc index create \
  -n agentic-quickstart-test \
  -m cosine \
  -c aws \
  -r us-east-1 \
  --model llama-text-embed-v2 \
  --field_map text=content
```

You can check the index:

```bash
pc index describe -n agentic-quickstart-test
pc index list
```

### 4) Set up Python environment and install SDK

From the repository root:

```bash
cd pinecone_quickstart
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

Ensure the `PINECONE_API_KEY` env var is still set in this shell.

### 5) Run the quick test

```bash
python quick_test.py
```

What this does:
- Upserts a small dataset into namespace `example-namespace`
- Performs a semantic search
- Reranks results using the hosted `bge-reranker-v2-m3` model
- Prints the most relevant results

If you see relevant “historical structures/monuments” results at the top after reranking, everything is working.

### Notes and best practices
- Use CLI for admin (create/configure/delete indexes). Use SDK for data operations (upsert, search, fetch).
- Always use namespaces (e.g., `example-namespace`).
- Prefer integrated embeddings (no need to generate vectors yourself).
- Rerank for production quality.
- Keep metadata flat (no nested objects) and respect batch limits (text records ≤ 96 per batch).

### Next steps
Pick where to go next and I’ll scaffold it for you:
- Quick test (already set up)
- Build a semantic Search system (documents + filters + rerank)
- Build a multi-tenant RAG example (requires an LLM API key)
- Build a Recommendations demo


