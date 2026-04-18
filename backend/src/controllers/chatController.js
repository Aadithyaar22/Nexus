import Chat from '../models/Chat.js';
import { retrieveRelevantChunks, formatContext } from '../services/retrieval.js';
import { callLLM } from '../services/llm.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const SYSTEM_PROMPT = `You are an AI thinking partner inside a knowledge workspace.
You have access to excerpts from the user's own uploaded documents.

Rules:
1. Answer ONLY using the provided context. If the answer is not in the context, say so plainly.
2. When you make a factual claim, reference the source like [Source 1] or [Source 2].
3. Be crisp, precise, and structured. Use short paragraphs or bullet lists when helpful.
4. If the user's question spans multiple documents, synthesise — don't just quote one.
5. Never fabricate citations or page numbers.`;

export const sendMessage = asyncHandler(async (req, res) => {
  const { message, chatId, documentIds } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

  // 1. Retrieve relevant chunks from the scoped documents (or all)
  const retrieved = await retrieveRelevantChunks(message, {
    documentIds: documentIds?.length ? documentIds : null,
    topK: 6,
  });

  if (!retrieved.length) {
    return res.json({
      reply: "I don't have any documents to draw from yet. Upload something to get started.",
      sources: [],
      chatId: chatId || null,
    });
  }

  const context = formatContext(retrieved);

  // 2. Load or create chat, pull last N turns for continuity
  let chat;
  if (chatId) {
    chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
  } else {
    chat = new Chat({
      title: message.slice(0, 60),
      scopedDocumentIds: documentIds || [],
    });
  }

  const history = chat.messages.slice(-6).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // 3. Call the LLM
  const reply = await callLLM(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
      {
        role: 'user',
        content: `CONTEXT:\n${context}\n\nQUESTION: ${message}`,
      },
    ],
    { temperature: 0.3, maxTokens: 1500 }
  );

  // 4. Persist
  const sources = retrieved.map((c) => ({
    documentId: c.documentId,
    documentTitle: c.documentTitle,
    chunkIndex: c.chunkIndex,
    snippet: c.text.slice(0, 220),
    score: c.score,
  }));
  chat.messages.push({ role: 'user', content: message });
  chat.messages.push({ role: 'assistant', content: reply, sources });
  await chat.save();

  res.json({
    reply,
    sources,
    chatId: chat._id,
  });
});

export const listChats = asyncHandler(async (_req, res) => {
  const chats = await Chat.find({}, 'title updatedAt scopedDocumentIds')
    .sort({ updatedAt: -1 })
    .lean();
  res.json(chats.map((c) => ({ ...c, id: c._id })));
});

export const getChat = asyncHandler(async (req, res) => {
  const chat = await Chat.findById(req.params.id).lean();
  if (!chat) return res.status(404).json({ error: 'Chat not found' });
  res.json({ ...chat, id: chat._id });
});

export const deleteChat = asyncHandler(async (req, res) => {
  await Chat.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});
