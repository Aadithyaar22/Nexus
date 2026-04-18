/**
 * Semantic-ish chunking: split by paragraphs, then greedily pack
 * paragraphs into chunks up to `chunkSize` chars, with `overlap` chars
 * of the previous chunk carried forward. This preserves sentence /
 * paragraph boundaries far better than a hard character split.
 */
export const chunkText = (text, opts = {}) => {
  const chunkSize = opts.chunkSize ?? Number(process.env.CHUNK_SIZE) ?? 900;
  const overlap = opts.overlap ?? Number(process.env.CHUNK_OVERLAP) ?? 150;

  const clean = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (!clean) return [];

  // Split on paragraph breaks first, then fall back to sentences if a
  // paragraph alone exceeds chunkSize.
  const paragraphs = clean.split(/\n\n+/);
  const units = [];
  for (const p of paragraphs) {
    if (p.length <= chunkSize) {
      units.push(p);
    } else {
      // break oversized paragraph into sentences
      const sentences = p.match(/[^.!?\n]+[.!?]+(\s|$)|[^.!?\n]+$/g) || [p];
      for (const s of sentences) {
        if (s.length <= chunkSize) units.push(s.trim());
        else {
          // hard fallback — rare, but handle monolithic blocks
          for (let i = 0; i < s.length; i += chunkSize) {
            units.push(s.slice(i, i + chunkSize));
          }
        }
      }
    }
  }

  const chunks = [];
  let current = '';
  for (const unit of units) {
    if ((current + '\n\n' + unit).length > chunkSize && current) {
      chunks.push(current.trim());
      // carry overlap from tail of previous chunk
      current = current.slice(-overlap) + '\n\n' + unit;
    } else {
      current = current ? current + '\n\n' + unit : unit;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks;
};
