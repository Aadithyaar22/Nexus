import Chunk from '../models/Chunk.js';
import { embedOne } from './embeddings.js';
import { cosineSimilarity } from '../utils/similarity.js';

/**
 * Retrieve top-K chunks by cosine similarity to a query.
 *
 * For small/medium collections (< ~50k chunks), scoring in memory is fine
 * and avoids the operational cost of managing a vector index. For larger
 * deployments, swap this for MongoDB Atlas Vector Search — the function
 * signature stays identical.
 *
 * @param {string} query - natural language query
 * @param {object} opts - { topK, documentIds }
 * @returns {Promise<Array<{documentId, documentTitle, chunkIndex, text, score}>>}
 */
export const retrieveRelevantChunks = async (query, opts = {}) => {
  const topK = opts.topK ?? Number(process.env.TOP_K) ?? 6;
  const documentIds = opts.documentIds?.length ? opts.documentIds : null;

  const queryVec = await embedOne(query);

  const filter = documentIds ? { documentId: { $in: documentIds } } : {};
  // Pull only the fields we need to keep memory in check
  const chunks = await Chunk.find(filter, {
    embedding: 1,
    text: 1,
    chunkIndex: 1,
    documentId: 1,
    documentTitle: 1,
  }).lean();

  const scored = chunks.map((c) => ({
    documentId: c.documentId,
    documentTitle: c.documentTitle,
    chunkIndex: c.chunkIndex,
    text: c.text,
    score: cosineSimilarity(queryVec, c.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
};

/**
 * Build a context string from retrieved chunks, with source tags the
 * LLM can cite.
 */
export const formatContext = (chunks) =>
  chunks
    .map(
      (c, i) =>
        `[Source ${i + 1} — "${c.documentTitle}" · chunk ${c.chunkIndex}]\n${c.text}`
    )
    .join('\n\n---\n\n');
