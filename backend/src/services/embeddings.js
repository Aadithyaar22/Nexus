import axios from 'axios';

/**
 * HuggingFace moved their serverless inference API to a new router in mid-2025.
 * The old `api-inference.huggingface.co/pipeline/feature-extraction/<model>`
 * URL now returns 404 for most embedding models.
 *
 * The current canonical endpoint is:
 *   https://router.huggingface.co/hf-inference/models/<model>/pipeline/feature-extraction
 *
 * Docs: https://huggingface.co/docs/inference-providers/en/providers/hf-inference
 */
const HF_ROUTER_BASE = 'https://router.huggingface.co/hf-inference/models';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Cold-start aware HF call. First request to a model after it's been idle
 * can return 503 with `{estimated_time}` — we retry with backoff.
 *
 * `BAAI/bge-small-en-v1.5` returns a 384-dim float vector per input string.
 * For batched inputs, the response is `[[...], [...]]`.
 */
const callHF = async (texts, attempt = 1) => {
  const apiKey = process.env.HF_TOKEN;
  const model = process.env.EMBEDDING_MODEL || 'BAAI/bge-small-en-v1.5';
  if (!apiKey) throw new Error('HF_TOKEN not configured');

  const url = `${HF_ROUTER_BASE}/${model}/pipeline/feature-extraction`;

  try {
    const { data } = await axios.post(
      url,
      { inputs: texts, options: { wait_for_model: true } },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 120_000,
      }
    );
    return data;
  } catch (err) {
    const status = err.response?.status;
    const body = err.response?.data;

    // Model loading — retry with backoff up to 3 times
    if ((status === 503 || body?.error?.includes?.('loading')) && attempt <= 3) {
      const waitS = body?.estimated_time || 10;
      console.log(`[hf] model warming up, waiting ${waitS}s (attempt ${attempt}/3)`);
      await sleep(Math.min(waitS, 30) * 1000);
      return callHF(texts, attempt + 1);
    }

    // 404 usually means the model isn't served by hf-inference provider.
    // Give a clearer error message.
    if (status === 404) {
      throw new Error(
        `HF embedding 404: model "${model}" is not available via hf-inference router. ` +
        `Try a supported model like BAAI/bge-small-en-v1.5, sentence-transformers/all-MiniLM-L6-v2, ` +
        `or intfloat/e5-small-v2. Set EMBEDDING_MODEL in .env.`
      );
    }

    const msg = body?.error || err.message;
    throw new Error(`HF embedding call failed (${status || 'no status'}): ${msg}`);
  }
};

/**
 * Generate embeddings for a batch of texts. 32 per batch keeps each request
 * fast even for cold workers.
 */
export const embedBatch = async (texts) => {
  if (!texts?.length) return [];

  const BATCH = 32;
  const results = [];

  for (let i = 0; i < texts.length; i += BATCH) {
    const slice = texts.slice(i, i + BATCH);
    const data = await callHF(slice);

    // Normalise response shape:
    //   - batch input → [[...384...], [...384...]]
    //   - single input → [...384...]
    if (Array.isArray(data) && Array.isArray(data[0]) && typeof data[0][0] === 'number') {
      results.push(...data);
    } else if (Array.isArray(data) && typeof data[0] === 'number') {
      results.push(data);
    } else {
      throw new Error(
        `Unexpected HF embedding response shape: ${JSON.stringify(data).slice(0, 120)}...`
      );
    }
  }

  return results;
};

export const embedOne = async (text) => {
  const [vec] = await embedBatch([text]);
  return vec;
};