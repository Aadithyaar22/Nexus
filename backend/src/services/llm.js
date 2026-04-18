import axios from 'axios';

// Groq exposes an OpenAI-compatible endpoint, so the request shape is
// identical to OpenRouter / OpenAI. Only the URL, auth key, and the
// model identifier change. Speeds are typically 3–10× higher than
// OpenRouter for equivalent open-weight models, which makes the UX
// noticeably snappier.
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Call the LLM via Groq.
 * @param {Array<{role: string, content: string}>} messages
 * @param {object} opts - { model, temperature, maxTokens, jsonMode }
 * @returns {Promise<string>} assistant text
 */
export const callLLM = async (messages, opts = {}) => {
  const {
    model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    temperature = 0.3,
    maxTokens = 2000,
    jsonMode = false,
  } = opts;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not configured');

  const body = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };
  // Groq supports OpenAI-style JSON mode on most models. If a model rejects
  // it (rare), we still parse defensively in callLLMJson below.
  if (jsonMode) body.response_format = { type: 'json_object' };

  try {
    const { data } = await axios.post(GROQ_URL, body, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 90_000,
    });
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty LLM response');
    return content.trim();
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    throw new Error(`LLM call failed: ${msg}`);
  }
};

/**
 * Call the LLM and safely parse a JSON response.
 * Handles markdown code fences that some models emit even in JSON mode.
 */
export const callLLMJson = async (messages, opts = {}) => {
  const raw = await callLLM(messages, { ...opts, jsonMode: true });
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // last-ditch: extract the first { ... } or [ ... ] block
    const match = cleaned.match(/([\[{][\s\S]*[\]}])/);
    if (match) return JSON.parse(match[1]);
    throw new Error(`Could not parse LLM JSON: ${cleaned.slice(0, 200)}...`);
  }
};
