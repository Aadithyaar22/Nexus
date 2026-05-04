# Nexus — AI Thinking Workspace

An AI system that reads, connects, analyzes, and evolves knowledge across
multiple documents. Not a chatbot. Not a PDF reader. A workspace that builds
understanding.

**Live Demo → [nexus-ai.vercel.app](https://ai-notebook-llm.vercel.app/)**

## What it does

Upload PDFs or text files. Nexus will:

1. **Chat** — Answer questions grounded in your documents (multi-doc RAG
   with retrieval-cited sources).
2. **Summarise** — Short summary, key points, and core concepts, per
   document or combined across everything.
3. **Study Mode** — Generate flashcards, MCQ quizzes, and predicted exam
   questions with model answers.
4. **Cross-Document Insights** — Find agreement, contradictions, extensions,
   analogies, and gaps *between* your documents.
5. **Auto Insight Feed** — Proactively surface things you didn't ask about.
6. **Knowledge Gap Detector** — Identify missing concepts and suggest what
   to learn next, ranked by priority.
7. **Concept Battle** — Head-to-head comparison of two ideas, grounded in
   evidence retrieved from your documents.
8. **Knowledge Fusion** — Synthesise multiple documents into one unified
   mental model (thesis + pillars + open questions).
9. **Confusion Detector** — Identify commonly misunderstood concepts with
   simple explanations and analogies.
10. **Text-to-Speech everywhere** — Listen to any AI-generated output. Free
    browser TTS by default with voice picker + speed slider, optional
    premium ElevenLabs voices via toggle.

## Architecture

```
┌─────────────────┐       ┌─────────────────┐       ┌───────────────┐
│   Next.js UI    │◀─────▶│  Express API    │◀─────▶│   MongoDB     │
│  (Vercel)       │       │  (Render)       │       │  (Atlas)      │
└─────────────────┘       └────────┬────────┘       └───────────────┘
                                   │
                                   ├─── Groq         (LLM, OpenAI-compat)
                                   └─── HuggingFace  (embeddings, free tier)
```

- **Chunking**: paragraph-aware with sentence fallback + character overlap
- **Embeddings**: `BAAI/bge-small-en-v1.5` (384 dims) via HF Inference API
- **Retrieval**: in-memory cosine similarity top-K (swap for Atlas Vector
  Search at scale — the interface is already abstracted)
- **Generation**: Groq, default `llama-3.3-70b-versatile` — swap via
  `GROQ_MODEL`. Other options: `llama-3.1-8b-instant` (faster),
  `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3-32b`.

## Quick start

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env       # fill in keys
npm run dev                # runs on :5000

# 2. Frontend (in a new terminal)
cd frontend
npm install
cp .env.local.example .env.local
npm run dev                # runs on :3000
```

You need MongoDB running locally (or an Atlas URI), a Groq key, and an HF
token. See `backend/README.md` for details.

## Folder layout

```
ai-notebook-llm/
├── backend/       Express API · MongoDB models · RAG pipeline
├── frontend/      Next.js App Router · Tailwind · Framer Motion
└── README.md
```

Individual READMEs live in each app folder.

## Why these providers

- **Groq** runs open-weight models (Llama, GPT-OSS, Qwen) on custom LPU
  hardware. It's typically 3–10× faster than equivalent OpenRouter calls,
  which makes the chat UX feel real-time.
- **Groq doesn't host embedding models**, so we use HuggingFace's free
  serverless inference API for `BAAI/bge-small-en-v1.5`. First call to a
  cold model may take ~20s while it warms up; subsequent calls are fast.

Both integrations are isolated to single files (`backend/src/services/llm.js`
and `backend/src/services/embeddings.js`) — swap providers without touching
anything else.

## Deploy

Full walkthrough in [`DEPLOYMENT.md`](./DEPLOYMENT.md) — Render + Vercel +
Atlas + all free API keys, stays on $0/month.

- **Frontend** — Vercel (zero config). Set `NEXT_PUBLIC_API_URL`.
- **Backend** — Render (Node web service). Set all `.env` variables.
- **Database** — MongoDB Atlas free tier is plenty for early use.

## Author
 
**Aadithya A R** — [LinkedIn](https://www.linkedin.com/in/aadithya-a-r/) · [GitHub](https://github.com/Aadithyaar22)
 
> Built as part of exploring production-grade RAG systems. Feedback welcome — open an issue or reach out directly.
