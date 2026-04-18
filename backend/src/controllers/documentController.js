import Document from '../models/Document.js';
import Chunk from '../models/Chunk.js';
import { extractPdfText, extractTextFile } from '../services/pdfParser.js';
import { chunkText } from '../services/chunking.js';
import { embedBatch } from '../services/embeddings.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { originalname, mimetype, size, buffer } = req.file;
  const isPdf = mimetype === 'application/pdf' || /\.pdf$/i.test(originalname);

  // 1. Extract text
  const content = isPdf ? await extractPdfText(buffer) : extractTextFile(buffer);
  if (!content || content.length < 50) {
    return res.status(400).json({
      error: 'Could not extract meaningful text from this file. It may be a scanned PDF without OCR.',
    });
  }

  // 2. Create document record
  const doc = await Document.create({
    title: req.body.title || originalname.replace(/\.[^.]+$/, ''),
    filename: originalname,
    mimeType: mimetype,
    size,
    content,
    status: 'processing',
  });

  // 3. Chunk + embed (async-ish: we still await but respond once ready)
  try {
    const chunks = chunkText(content);
    if (!chunks.length) throw new Error('Produced zero chunks');

    const embeddings = await embedBatch(chunks);
    const docs = chunks.map((text, i) => ({
      documentId: doc._id,
      documentTitle: doc.title,
      chunkIndex: i,
      text,
      embedding: embeddings[i],
      tokenCount: Math.ceil(text.length / 4),
    }));
    await Chunk.insertMany(docs);

    doc.chunkCount = chunks.length;
    doc.status = 'ready';
    await doc.save();
  } catch (err) {
    doc.status = 'failed';
    doc.error = err.message;
    await doc.save();
    throw err;
  }

  res.status(201).json({
    id: doc._id,
    title: doc.title,
    filename: doc.filename,
    size: doc.size,
    chunkCount: doc.chunkCount,
    status: doc.status,
    createdAt: doc.createdAt,
  });
});

export const listDocuments = asyncHandler(async (_req, res) => {
  const docs = await Document.find({}, '-content')
    .sort({ createdAt: -1 })
    .lean();
  res.json(docs.map((d) => ({ ...d, id: d._id })));
});

export const getDocument = asyncHandler(async (req, res) => {
  const doc = await Document.findById(req.params.id).lean();
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.json({ ...doc, id: doc._id });
});

export const deleteDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await Promise.all([
    Document.findByIdAndDelete(id),
    Chunk.deleteMany({ documentId: id }),
  ]);
  res.json({ ok: true });
});
