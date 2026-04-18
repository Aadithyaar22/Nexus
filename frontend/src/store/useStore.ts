import { create } from 'zustand';
import type { Document, ChatMessage, View } from '@/types';
import { api } from '@/lib/api';

interface AppState {
  // Documents
  documents: Document[];
  selectedDocIds: string[];
  loadingDocs: boolean;

  // Chat
  messages: ChatMessage[];
  chatId: string | null;
  sending: boolean;

  // UI
  view: View;
  sidebarOpen: boolean;
  insightsPanelOpen: boolean;

  // TTS
  ttsMode: 'browser' | 'elevenlabs';
  ttsVoiceURI: string | null;
  ttsRate: number;
  elevenLabsAvailable: boolean;
  ttsSettingsOpen: boolean;

  // Actions — Documents
  fetchDocuments: () => Promise<void>;
  uploadDocument: (file: File, onProgress?: (p: number) => void) => Promise<Document>;
  deleteDocument: (id: string) => Promise<void>;
  toggleDocSelection: (id: string) => void;
  clearDocSelection: () => void;

  // Actions — Chat
  sendMessage: (message: string) => Promise<void>;
  newChat: () => void;

  // Actions — UI
  setView: (v: View) => void;
  toggleSidebar: () => void;
  toggleInsightsPanel: () => void;

  // Actions — TTS
  fetchTTSStatus: () => Promise<void>;
  setTTSMode: (mode: 'browser' | 'elevenlabs') => void;
  setTTSVoiceURI: (uri: string | null) => void;
  setTTSRate: (rate: number) => void;
  setTTSSettingsOpen: (open: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
  documents: [],
  selectedDocIds: [],
  loadingDocs: false,

  messages: [],
  chatId: null,
  sending: false,

  view: 'workspace',
  sidebarOpen: true,
  insightsPanelOpen: true,

  // TTS — defaults to browser (free, instant). Hydrate from localStorage on
  // mount so voice + speed preferences stick across sessions.
  ttsMode: 'browser',
  ttsVoiceURI: null,
  ttsRate: 1.0,
  elevenLabsAvailable: false,
  ttsSettingsOpen: false,

  fetchDocuments: async () => {
    set({ loadingDocs: true });
    try {
      const docs = await api.listDocuments();
      set({
        documents: docs.map((d: any) => ({ ...d, id: d.id || d._id })),
        loadingDocs: false,
      });
    } catch (err) {
      set({ loadingDocs: false });
      throw err;
    }
  },

  uploadDocument: async (file, onProgress) => {
    const doc = await api.uploadDocument(file, undefined, onProgress);
    const normalized = { ...doc, id: (doc as any).id || (doc as any)._id };
    set((s) => ({ documents: [normalized, ...s.documents] }));
    return normalized;
  },

  deleteDocument: async (id) => {
    await api.deleteDocument(id);
    set((s) => ({
      documents: s.documents.filter((d) => d.id !== id),
      selectedDocIds: s.selectedDocIds.filter((x) => x !== id),
    }));
  },

  toggleDocSelection: (id) =>
    set((s) => ({
      selectedDocIds: s.selectedDocIds.includes(id)
        ? s.selectedDocIds.filter((x) => x !== id)
        : [...s.selectedDocIds, id],
    })),

  clearDocSelection: () => set({ selectedDocIds: [] }),

  sendMessage: async (message) => {
    const { chatId, selectedDocIds, messages } = get();
    set({
      sending: true,
      messages: [...messages, { role: 'user', content: message }],
    });

    try {
      const res = await api.sendMessage({
        message,
        chatId: chatId || undefined,
        documentIds: selectedDocIds,
      });
      set((s) => ({
        messages: [
          ...s.messages,
          { role: 'assistant', content: res.reply, sources: res.sources },
        ],
        chatId: res.chatId,
        sending: false,
      }));
    } catch (err: any) {
      set((s) => ({
        messages: [
          ...s.messages,
          {
            role: 'assistant',
            content: ` ${err.message || 'Failed to get a response'}`,
          },
        ],
        sending: false,
      }));
    }
  },

  newChat: () => set({ messages: [], chatId: null }),

  setView: (v) => set({ view: v }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleInsightsPanel: () => set((s) => ({ insightsPanelOpen: !s.insightsPanelOpen })),

  // ---- TTS ----
  fetchTTSStatus: async () => {
    try {
      const { elevenlabsAvailable } = await api.ttsStatus();
      set({ elevenLabsAvailable: !!elevenlabsAvailable });

      // Restore saved prefs from localStorage (browser only)
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('tts-prefs');
        if (saved) {
          try {
            const prefs = JSON.parse(saved);
            set({
              ttsMode:
                prefs.ttsMode === 'elevenlabs' && elevenlabsAvailable
                  ? 'elevenlabs'
                  : 'browser',
              ttsVoiceURI: prefs.ttsVoiceURI ?? null,
              ttsRate: typeof prefs.ttsRate === 'number' ? prefs.ttsRate : 1.0,
            });
          } catch { /* corrupted — ignore */ }
        }
      }
    } catch {
      set({ elevenLabsAvailable: false });
    }
  },

  setTTSMode: (mode) => {
    set({ ttsMode: mode });
    persistTTSPrefs(get());
  },
  setTTSVoiceURI: (uri) => {
    set({ ttsVoiceURI: uri });
    persistTTSPrefs(get());
  },
  setTTSRate: (rate) => {
    set({ ttsRate: rate });
    persistTTSPrefs(get());
  },
  setTTSSettingsOpen: (open) => set({ ttsSettingsOpen: open }),
}));

// Persist TTS prefs to localStorage so user doesn't re-pick their voice
// every session. Called after any tts-* setter.
const persistTTSPrefs = (state: AppState) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      'tts-prefs',
      JSON.stringify({
        ttsMode: state.ttsMode,
        ttsVoiceURI: state.ttsVoiceURI,
        ttsRate: state.ttsRate,
      })
    );
  } catch { /* quota exceeded or disabled */ }
};
