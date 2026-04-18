'use client';

import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import WorkspaceView from '@/components/WorkspaceView';
import ChatInterface from '@/components/ChatInterface';
import InsightsPanel from '@/components/InsightsPanel';
import StudyMode from '@/components/StudyMode';
import ConceptBattle from '@/components/ConceptBattle';
import KnowledgeFusion from '@/components/KnowledgeFusion';
import ConfusionDetector from '@/components/ConfusionDetector';
import KnowledgeGapView from '@/components/KnowledgeGapView';
import TTSSettings from '@/components/TTSSettings';

export default function Home() {
  const view = useStore((s) => s.view);
  const fetchDocuments = useStore((s) => s.fetchDocuments);
  const fetchTTSStatus = useStore((s) => s.fetchTTSStatus);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const ttsSettingsOpen = useStore((s) => s.ttsSettingsOpen);
  const setTTSSettingsOpen = useStore((s) => s.setTTSSettingsOpen);

  useEffect(() => {
    fetchDocuments().catch(() => {});
    fetchTTSStatus().catch(() => {});
  }, [fetchDocuments, fetchTTSStatus]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-48 -left-48 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-48 -right-48 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      {sidebarOpen && <Sidebar />}

      <main className="relative flex min-w-0 flex-1 flex-col">
        <TopBar />
        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {view === 'workspace' && <WorkspaceView />}
            {view === 'chat' && <ChatInterface />}
            {view === 'study' && <StudyMode />}
            {view === 'battle' && <ConceptBattle />}
            {view === 'fusion' && <KnowledgeFusion />}
            {view === 'confusion' && <ConfusionDetector />}
            {view === 'gaps' && <KnowledgeGapView />}
            {view === 'insights' && <InsightsPanel fullscreen />}
          </div>
          {view !== 'insights' && <InsightsPanel />}
        </div>
      </main>

      <AnimatePresence>
        {ttsSettingsOpen && <TTSSettings onClose={() => setTTSSettingsOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
