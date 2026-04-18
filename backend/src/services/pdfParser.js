import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// pdf-parse's entry point auto-runs a test file in newer versions; require
// the lib directly to avoid that.
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

export const extractPdfText = async (buffer) => {
  const data = await pdfParse(buffer);
  return (data.text || '').trim();
};

export const extractTextFile = (buffer) => buffer.toString('utf-8').trim();
