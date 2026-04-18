import Document from '../models/Document.js';
import { callLLMJson } from '../services/llm.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const CLAMP = 9000;
const clamp = (t) =>
  t.length <= CLAMP
    ? t
    : t.slice(0, CLAMP / 2) + '\n\n[...truncated...]\n\n' + t.slice(-CLAMP / 2);

const loadCorpus = async (documentIds) => {
  const filter = documentIds?.length ? { _id: { $in: documentIds } } : { status: 'ready' };
  const docs = await Document.find(filter).lean();
  if (!docs.length) return null;
  return docs.map((d) => `=== ${d.title} ===\n${clamp(d.content)}`).join('\n\n');
};

// ---------- FLASHCARDS ----------
export const generateFlashcards = asyncHandler(async (req, res) => {
  const { documentIds, count = 12 } = req.body || {};
  const corpus = await loadCorpus(documentIds);
  if (!corpus) return res.status(400).json({ error: 'No documents available' });

  const result = await callLLMJson(
    [
      {
        role: 'system',
        content: `Create spaced-repetition flashcards. Respond with valid JSON only:
{
  "cards": [
    { "front": string (concise prompt), "back": string (clear answer, 1-3 sentences), "topic": string }
  ]
}
Cards should test real understanding, not trivia. Mix recall, application, and "why" questions.`,
      },
      { role: 'user', content: `Create ${count} flashcards from:\n\n${corpus}` },
    ],
    { temperature: 0.4, maxTokens: 2500 }
  );
  res.json(result);
});

// ---------- MCQs ----------
export const generateMCQs = asyncHandler(async (req, res) => {
  const { documentIds, count = 10 } = req.body || {};
  const corpus = await loadCorpus(documentIds);
  if (!corpus) return res.status(400).json({ error: 'No documents available' });

  const result = await callLLMJson(
    [
      {
        role: 'system',
        content: `Create a multiple-choice quiz. Respond with valid JSON only:
{
  "questions": [
    {
      "question": string,
      "options": string[] (exactly 4),
      "correctIndex": number (0-3),
      "explanation": string (1-2 sentences)
    }
  ]
}
Distractors must be plausible — no obvious wrong answers. Cover a range of difficulty.`,
      },
      { role: 'user', content: `Create ${count} MCQs from:\n\n${corpus}` },
    ],
    { temperature: 0.4, maxTokens: 3000 }
  );
  res.json(result);
});

// ---------- EXAM QUESTIONS ----------
export const generateExamQuestions = asyncHandler(async (req, res) => {
  const { documentIds, count = 8 } = req.body || {};
  const corpus = await loadCorpus(documentIds);
  if (!corpus) return res.status(400).json({ error: 'No documents available' });

  const result = await callLLMJson(
    [
      {
        role: 'system',
        content: `Predict high-value exam questions a professor would actually ask. Respond with valid JSON only:
{
  "questions": [
    {
      "question": string,
      "type": "short-answer" | "long-answer" | "analytical" | "application",
      "difficulty": "easy" | "medium" | "hard",
      "modelAnswer": string (outline of what a great answer would include)
    }
  ]
}`,
      },
      { role: 'user', content: `Create ${count} exam questions from:\n\n${corpus}` },
    ],
    { temperature: 0.45, maxTokens: 3000 }
  );
  res.json(result);
});
