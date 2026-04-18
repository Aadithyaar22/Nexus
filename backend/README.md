# AI Notebook LLM — Backend

Node.js + Express + MongoDB. Handles document ingestion, chunking, embedding,
retrieval, and all LLM-powered features.

## Setup

```bash
cd backend
npm install
cp .env.example .env
# fill in your keys, then:
npm run dev
```

Required environment variables:

- `MONGO_URI` — MongoDB connection string (local or Atlas)
- `GROQ_API_KEY` — get one free at https://console.groq.com/keys
- `HF_TOKEN` — get one free at https://huggingface.co/settings/tokens (a
  read-scope token is enough)

## Why Groq + HuggingFace?

- **Groq** for the LLM — by far the fastest inference for open-weight models
  (Llama 3.3 70B, GPT-OSS, Qwen). Generous free tier.
- **HuggingFace** for embeddings — Groq does not host embedding models. HF's
  serverless inference API runs `BAAI/bge-small-en-v1.5` (384 dims, MTEB
  top-tier for its size) for free. First call to a cold model may take ~20s
  while it loads; subsequent calls are fast.

To swap providers, only `src/services/llm.js` and `src/services/embeddings.js`
change — everything else is provider-agnostic.

## API surface

| Method | Path                              | Purpose                          |
| ------ | --------------------------------- | -------------------------------- |
| GET    | `/api/health`                     | Health check                     |
| POST   | `/api/documents/upload`           | Upload PDF / text / markdown     |
| GET    | `/api/documents`                  | List documents                   |
| GET    | `/api/documents/:id`              | Get one document                 |
| DELETE | `/api/documents/:id`              | Delete + cascade chunks          |
| POST   | `/api/chat/message`               | RAG chat turn                    |
| GET    | `/api/chat`                       | List chats                       |
| GET    | `/api/chat/:id`                   | Get chat with history            |
| DELETE | `/api/chat/:id`                   | Delete chat                      |
| GET    | `/api/insights/summary/:id`       | Summarise one document           |
| GET    | `/api/insights/summary/all`       | Summarise everything combined    |
| GET    | `/api/insights/cross-document`    | Cross-document insights          |
| GET    | `/api/insights/auto-feed`         | Proactive insight feed           |
| GET    | `/api/insights/knowledge-gaps`    | What the user should learn next  |
| POST   | `/api/study/flashcards`           | Generate flashcards              |
| POST   | `/api/study/mcqs`                 | Generate multiple-choice quiz    |
| POST   | `/api/study/exam-questions`       | Predict exam-style questions     |
| POST   | `/api/advanced/concept-battle`    | Compare two concepts             |
| POST   | `/api/advanced/knowledge-fusion`  | Unified mental model             |
| GET    | `/api/advanced/confusion-detector`| Commonly misunderstood concepts  |

## Retrieval architecture

- **Chunking** — paragraph-aware with sentence fallback and character overlap
  (see `src/services/chunking.js`). Default 900 chars, 150 overlap.
- **Embeddings** — `BAAI/bge-small-en-v1.5` (384 dims) via HF Inference API,
  batched in groups of 32 with cold-start retry.
- **Retrieval** — in-memory cosine similarity across all chunks. Good for up
  to ~50k chunks. For larger deployments swap to MongoDB Atlas Vector Search;
  the `retrieveRelevantChunks` signature stays identical.

## Deployment (Render)

1. Create a new Web Service, connect the repo.
2. Root directory: `backend`
3. Build: `npm install`
4. Start: `npm start`
5. Add all `.env` variables in Render's env panel.
6. Use MongoDB Atlas free tier for the database.
