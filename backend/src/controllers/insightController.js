import Document from '../models/Document.js';
import { callLLM, callLLMJson } from '../services/llm.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Cap individual document content to avoid context blowups. For very long
 * documents we take the beginning + end (heuristic: abstracts + conclusions
 * usually live there), which works well in practice for summaries and
 * cross-document reasoning without needing recursive summarisation.
 */
const CLAMP_CHARS = 8000;
const clamp = (text) => {
  if (text.length <= CLAMP_CHARS) return text;
  const half = Math.floor(CLAMP_CHARS / 2);
  return text.slice(0, half) + '\n\n[...truncated...]\n\n' + text.slice(-half);
};

// ---------- SUMMARY ENGINE ----------
export const summarizeDocument = asyncHandler(async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  // Cache
  if (doc.summary?.generatedAt && !req.query.refresh) {
    return res.json(doc.summary);
  }

  const result = await callLLMJson(
    [
      {
        role: 'system',
        content:
          'You produce structured summaries. Respond with valid JSON only: {"short": string (2-3 sentences), "keyPoints": string[] (5-7), "concepts": string[] (5-8 core concepts)}.',
      },
      {
        role: 'user',
        content: `Summarise this document:\n\nTitle: ${doc.title}\n\n${clamp(doc.content)}`,
      },
    ],
    { temperature: 0.2, maxTokens: 1200 }
  );

  doc.summary = { ...result, generatedAt: new Date() };
  await doc.save();
  res.json(doc.summary);
});

export const summarizeAll = asyncHandler(async (_req, res) => {
  const docs = await Document.find({ status: 'ready' }).lean();
  if (!docs.length) return res.json({ short: '', keyPoints: [], concepts: [] });

  const combined = docs
    .map((d) => `=== ${d.title} ===\n${clamp(d.content)}`)
    .join('\n\n');

  const result = await callLLMJson(
    [
      {
        role: 'system',
        content:
          'You synthesise multiple documents into one unified summary. Respond with valid JSON only: {"short": string (4-5 sentences capturing the combined picture), "keyPoints": string[] (8-10), "concepts": string[] (10 most important concepts across all documents)}.',
      },
      {
        role: 'user',
        content: `Documents:\n\n${clamp(combined)}`,
      },
    ],
    { temperature: 0.2, maxTokens: 1600 }
  );

  res.json(result);
});

// ---------- CROSS-DOCUMENT INSIGHTS ----------
export const crossDocumentInsights = asyncHandler(async (_req, res) => {
  const docs = await Document.find({ status: 'ready' }).lean();
  if (docs.length < 2) {
    return res.status(400).json({
      error: 'Need at least 2 documents to find cross-document insights',
    });
  }

  const combined = docs
    .map((d) => `=== ${d.title} (id: ${d._id}) ===\n${clamp(d.content)}`)
    .join('\n\n');

  const result = await callLLMJson(
    [
      {
        role: 'system',
        content: `You find non-obvious connections across documents. Respond with valid JSON only:
{
  "insights": [
    {
      "title": string,
      "description": string (2-3 sentences explaining the connection),
      "documents": string[] (document titles involved),
      "type": "agreement" | "contradiction" | "extension" | "analogy" | "gap"
    }
  ]
}
Produce 5-7 insights. Favour deep, non-obvious connections over surface-level restatements.`,
      },
      { role: 'user', content: combined },
    ],
    { temperature: 0.5, maxTokens: 2000 }
  );

  res.json(result);
});

// ---------- AUTO INSIGHT FEED ----------
export const autoInsightFeed = asyncHandler(async (_req, res) => {
  const docs = await Document.find({ status: 'ready' }).lean();
  if (!docs.length) return res.json({ insights: [] });

  const combined = docs
    .map((d) => `=== ${d.title} ===\n${clamp(d.content)}`)
    .join('\n\n');

  const result = await callLLMJson(
    [
      {
        role: 'system',
        content: `You are a proactive research assistant. Generate surprising, useful insights the user didn't explicitly ask for. Respond with valid JSON only:
{
  "insights": [
    {
      "headline": string (punchy, one-liner),
      "body": string (2-4 sentences),
      "tag": "connection" | "implication" | "question" | "pattern" | "contrast"
    }
  ]
}
Produce 6-8 insights. Each should teach the user something they probably didn't already notice.`,
      },
      { role: 'user', content: combined },
    ],
    { temperature: 0.65, maxTokens: 2000 }
  );

  res.json(result);
});

// ---------- KNOWLEDGE GAP DETECTOR ----------
export const knowledgeGaps = asyncHandler(async (_req, res) => {
  const docs = await Document.find({ status: 'ready' }).lean();
  if (!docs.length) return res.json({ gaps: [] });

  const combined = docs
    .map((d) => `=== ${d.title} ===\n${clamp(d.content)}`)
    .join('\n\n');

  const result = await callLLMJson(
    [
      {
        role: 'system',
        content: `Identify what's MISSING from this body of knowledge — concepts, prerequisites, or follow-up topics the user should learn to fully understand the material. Respond with valid JSON only:
{
  "gaps": [
    {
      "concept": string,
      "why": string (why this matters for full understanding),
      "priority": "high" | "medium" | "low",
      "resources": string[] (2-3 suggested topics / search terms to learn it)
    }
  ]
}
Produce 6-8 gaps, sorted by priority (high first).`,
      },
      { role: 'user', content: combined },
    ],
    { temperature: 0.4, maxTokens: 2000 }
  );

  res.json(result);
});
