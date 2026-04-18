import axios from 'axios';
import type {
  Document,
  Summary,
  ChatMessage,
  Source,
  Flashcard,
  MCQ,
  ExamQuestion,
  CrossDocInsight,
  AutoInsight,
  KnowledgeGap,
  ConceptBattleResult,
  KnowledgeFusionResult,
  Confusion,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const http = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 120_000,
});

http.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg =
      err.response?.data?.error || err.message || 'Something went wrong';
    return Promise.reject(new Error(msg));
  }
);

// ---------- Documents ----------
export const api = {
  // Documents
  listDocuments: () => http.get<Document[]>('/documents').then((r) => r.data),

  uploadDocument: (file: File, title?: string, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append('file', file);
    if (title) form.append('title', title);
    return http
      .post<Document>('/documents/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
        },
      })
      .then((r) => r.data);
  },

  deleteDocument: (id: string) => http.delete(`/documents/${id}`).then((r) => r.data),

  // Chat
  sendMessage: (payload: { message: string; chatId?: string; documentIds?: string[] }) =>
    http
      .post<{ reply: string; sources: Source[]; chatId: string }>('/chat/message', payload)
      .then((r) => r.data),

  listChats: () => http.get('/chat').then((r) => r.data),
  getChat: (id: string) => http.get(`/chat/${id}`).then((r) => r.data),
  deleteChat: (id: string) => http.delete(`/chat/${id}`).then((r) => r.data),

  // Insights
  summarizeDocument: (id: string, refresh = false) =>
    http.get<Summary>(`/insights/summary/${id}${refresh ? '?refresh=1' : ''}`).then((r) => r.data),

  summarizeAll: () => http.get<Summary>('/insights/summary/all').then((r) => r.data),

  crossDocumentInsights: () =>
    http.get<{ insights: CrossDocInsight[] }>('/insights/cross-document').then((r) => r.data),

  autoInsightFeed: () =>
    http.get<{ insights: AutoInsight[] }>('/insights/auto-feed').then((r) => r.data),

  knowledgeGaps: () =>
    http.get<{ gaps: KnowledgeGap[] }>('/insights/knowledge-gaps').then((r) => r.data),

  // Study
  generateFlashcards: (documentIds?: string[], count = 12) =>
    http
      .post<{ cards: Flashcard[] }>('/study/flashcards', { documentIds, count })
      .then((r) => r.data),

  generateMCQs: (documentIds?: string[], count = 10) =>
    http
      .post<{ questions: MCQ[] }>('/study/mcqs', { documentIds, count })
      .then((r) => r.data),

  generateExamQuestions: (documentIds?: string[], count = 8) =>
    http
      .post<{ questions: ExamQuestion[] }>('/study/exam-questions', { documentIds, count })
      .then((r) => r.data),

  // Advanced
  conceptBattle: (conceptA: string, conceptB: string) =>
    http
      .post<ConceptBattleResult>('/advanced/concept-battle', { conceptA, conceptB })
      .then((r) => r.data),

  knowledgeFusion: (documentIds?: string[]) =>
    http
      .post<KnowledgeFusionResult>('/advanced/knowledge-fusion', { documentIds })
      .then((r) => r.data),

  confusionDetector: () =>
    http.get<{ confusions: Confusion[] }>('/advanced/confusion-detector').then((r) => r.data),

  // TTS
  ttsStatus: () =>
    http
      .get<{ elevenlabsAvailable: boolean; maxChars: number; defaultVoiceId: string }>(
        '/tts/status'
      )
      .then((r) => r.data),

  /** Returns a Blob (MP3) from the ElevenLabs proxy. */
  tts: (text: string, voiceId?: string, modelId?: string): Promise<Blob> =>
    http
      .post(
        '/tts/elevenlabs',
        { text, voiceId, modelId },
        { responseType: 'blob' }
      )
      .then((r) => r.data as Blob),
};
