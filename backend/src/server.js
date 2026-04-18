import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import { connectDB } from './config/db.js';
import documentsRouter from './routes/documents.js';
import chatRouter from './routes/chat.js';
import insightsRouter from './routes/insights.js';
import studyRouter from './routes/study.js';
import advancedRouter from './routes/advanced.js';
import ttsRouter from './routes/tts.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ---- Middleware ----
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Rate limit: 120 requests / minute / IP — generous for a single user, safe for demo
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
}));

// ---- Routes ----
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ai-notebook-llm', timestamp: Date.now() });
});

app.use('/api/documents', documentsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/study', studyRouter);
app.use('/api/advanced', advancedRouter);
app.use('/api/tts', ttsRouter);

// Global error handler — must be last
app.use(errorHandler);

// ---- Bootstrap ----
const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`\n AI Notebook backend running on :${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/api/health\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
