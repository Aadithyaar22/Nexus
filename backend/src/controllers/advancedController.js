import Document from '../models/Document.js';
import { callLLMJson, callLLM } from '../services/llm.js';
import { retrieveRelevantChunks, formatContext } from '../services/retrieval.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const CLAMP = 9000;
const clamp = (t) =>
  t.length <= CLAMP
    ? t
    : t.slice(0, CLAMP / 2) + '\n\n[...truncated...]\n\n' + t.slice(-CLAMP / 2);

// ---------- CONCEPT BATTLE ----------
export const conceptBattle = asyncHandler(async (req, res) => {
  const { conceptA, conceptB } = req.body || {};
  if (!conceptA || !conceptB) {
    return res.status(400).json({ error: 'Both conceptA and conceptB are required' });
  }

  // Pull retrieval evidence for both concepts so the comparison is grounded
  // in the user's documents, not just the LLM's world knowledge.
  const [chunksA, chunksB] = await Promise.all([
    retrieveRelevantChunks(conceptA, { topK: 4 }),
    retrieveRelevantChunks(conceptB, { topK: 4 }),
  ]);

  const contextA = chunksA.length ? formatContext(chunksA) : '(no evidence found in documents)';
  const contextB = chunksB.length ? formatContext(chunksB) : '(no evidence found in documents)';

  const result = await callLLMJson(
    [
      {
        role: 'system',
        content: `You stage a head-to-head comparison between two concepts grounded in the user's documents. Respond with valid JSON only:
{
  "conceptA": { "name": string, "definition": string, "strengths": string[], "weaknesses": string[], "bestFor": string[] },
  "conceptB": { "name": string, "definition": string, "strengths": string[], "weaknesses": string[], "bestFor": string[] },
  "keyDifferences": [ { "dimension": string, "a": string, "b": string } ],
  "whenToUseA": string,
  "whenToUseB": string,
  "verdict": string (2-3 sentence synthesis — when each wins)
}
Use the document evidence as the primary source. Be specific, not generic.`,
      },
      {
        role: 'user',
        content: `CONCEPT A: ${conceptA}\nEvidence for A:\n${contextA}\n\n---\n\nCONCEPT B: ${conceptB}\nEvidence for B:\n${contextB}`,
      },
    ],
    { temperature: 0.4, maxTokens: 2500 }
  );
  res.json(result);
});

// ---------- KNOWLEDGE FUSION ----------
export const knowledgeFusion = asyncHandler(async (req, res) => {
  const { documentIds } = req.body || {};
  const filter = documentIds?.length ? { _id: { $in: documentIds } } : { status: 'ready' };
  const docs = await Document.find(filter).lean();
  if (docs.length < 2) {
    return res.status(400).json({ error: 'Need at least 2 documents to fuse' });
  }

  const combined = docs
    .map((d) => `=== ${d.title} ===\n${clamp(d.content)}`)
    .join('\n\n');

  const result = await callLLMJson(
    [
      {
        role: 'system',
        content: `You fuse multiple documents into one unified mental model — not a summary, a synthesis. Respond with valid JSON only:
{
  "thesis": string (one-sentence core claim that unifies the documents),
  "pillars": [ { "name": string, "explanation": string (3-4 sentences), "evidence": string[] (short quotes/paraphrases from docs) } ],
  "mentalModel": string (4-6 sentence explanation of how everything fits together),
  "openQuestions": string[] (3-5 questions this fused view raises)
}
Produce 4-6 pillars. Treat the documents as one coherent body of thought.`,
      },
      { role: 'user', content: combined },
    ],
    { temperature: 0.45, maxTokens: 2500 }
  );
  res.json(result);
});

// ---------- CONFUSION DETECTOR ----------
export const confusionDetector = asyncHandler(async (_req, res) => {
  const docs = await Document.find({ status: 'ready' }).lean();
  if (!docs.length) return res.json({ confusions: [] });

  const combined = docs
    .map((d) => `=== ${d.title} ===\n${clamp(d.content)}`)
    .join('\n\n');

  const result = await callLLMJson(
    [
      {
        role: 'system',
        content: `Identify concepts in this material that students commonly get wrong or confuse with something else. Respond with valid JSON only:
{
  "confusions": [
    {
      "concept": string,
      "commonMisconception": string (what people wrongly believe),
      "actualTruth": string (what's actually true),
      "simpleExplanation": string (3-5 sentence ELI15 explanation),
      "analogy": string (a concrete real-world analogy),
      "confusedWith": string[] (related things often mistaken for it)
    }
  ]
}
Produce 5-7 items. Favour concepts that are genuinely tricky, not trivially obvious.`,
      },
      { role: 'user', content: combined },
    ],
    { temperature: 0.45, maxTokens: 2500 }
  );
  res.json(result);
});
