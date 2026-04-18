# AI Notebook LLM — Frontend

Next.js 14 (App Router) + Tailwind + Framer Motion + Zustand.

## Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
# point NEXT_PUBLIC_API_URL at your backend
npm run dev
```

Visit http://localhost:3000.

## Structure

```
src/
├── app/               Next.js App Router pages
├── components/        Feature UIs (one per major capability)
│   ├── ui/            Shared primitives
│   ├── Sidebar.tsx
│   ├── WorkspaceView.tsx
│   ├── ChatInterface.tsx
│   ├── InsightsPanel.tsx
│   ├── StudyMode.tsx  (uses Flashcard + Quiz)
│   ├── ConceptBattle.tsx
│   ├── KnowledgeFusion.tsx
│   ├── ConfusionDetector.tsx
│   └── KnowledgeGapView.tsx
├── lib/
│   ├── api.ts         Typed axios client for the backend
│   └── utils.ts
├── store/
│   └── useStore.ts    Zustand — docs, chat, UI state
└── types/index.ts     Shared TypeScript types
```

## Deployment (Vercel)

1. Import repo in Vercel, root `frontend/`.
2. Set `NEXT_PUBLIC_API_URL` to your Render backend URL.
3. Deploy — zero config.
