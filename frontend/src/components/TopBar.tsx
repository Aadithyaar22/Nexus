'use client';

import { motion } from 'framer-motion';
import { PanelLeft, PanelRight, Sparkles, X, Volume2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { View } from '@/types';

const TITLES: Record<View, { title: string; subtitle: string }> = {
  workspace: { title: 'Workspace', subtitle: 'Your uploaded knowledge' },
  chat: { title: 'Chat', subtitle: 'Ask questions across every document' },
  insights: { title: 'Insights Feed', subtitle: 'What the AI noticed' },
  study: { title: 'Study Mode', subtitle: 'Flashcards · Quizzes · Exam questions' },
  battle: { title: 'Concept Battle', subtitle: 'Compare two ideas head-to-head' },
  fusion: { title: 'Knowledge Fusion', subtitle: 'Unified mental model' },
  confusion: { title: 'Confusion Detector', subtitle: 'Commonly misunderstood concepts' },
  gaps: { title: 'Knowledge Gaps', subtitle: 'What you should learn next' },
};

export default function TopBar() {
  const view = useStore((s) => s.view);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const toggleInsightsPanel = useStore((s) => s.toggleInsightsPanel);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const insightsPanelOpen = useStore((s) => s.insightsPanelOpen);
  const selectedDocIds = useStore((s) => s.selectedDocIds);
  const clearDocSelection = useStore((s) => s.clearDocSelection);
  const setTTSSettingsOpen = useStore((s) => s.setTTSSettingsOpen);
  const ttsMode = useStore((s) => s.ttsMode);

  const meta = TITLES[view];

  return (
    <header className="relative z-10 flex h-14 flex-shrink-0 items-center justify-between border-b border-border bg-bg-elevated/60 px-4 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="btn-ghost h-8 w-8 p-0"
          title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        >
          <PanelLeft className="h-4 w-4" />
        </button>
        <div>
          <motion.div
            key={view}
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-semibold leading-tight"
          >
            {meta.title}
          </motion.div>
          <div className="text-[11px] text-fg-subtle">{meta.subtitle}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {selectedDocIds.length > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={clearDocSelection}
            className="chip group"
          >
            <Sparkles className="h-3 w-3 text-accent-hover" />
            Scoped to {selectedDocIds.length} doc
            {selectedDocIds.length !== 1 && 's'}
            <X className="h-3 w-3 opacity-60 group-hover:opacity-100" />
          </motion.button>
        )}
        <button
          onClick={() => setTTSSettingsOpen(true)}
          className="btn-ghost relative h-8 w-8 p-0"
          title="Voice settings"
        >
          <Volume2 className="h-4 w-4" />
          {ttsMode === 'elevenlabs' && (
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent" />
          )}
        </button>
        <button
          onClick={toggleInsightsPanel}
          className="btn-ghost h-8 w-8 p-0"
          title={insightsPanelOpen ? 'Hide insights' : 'Show insights'}
        >
          <PanelRight className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
