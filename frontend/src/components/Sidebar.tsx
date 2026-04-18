'use client';

import { motion } from 'framer-motion';
import {
  LayoutGrid,
  MessageSquare,
  Sparkles,
  GraduationCap,
  Swords,
  Merge,
  HelpCircle,
  Target,
  Brain,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import type { View } from '@/types';
import DocumentList from './DocumentList';

const NAV: { id: View; label: string; icon: typeof LayoutGrid; description: string }[] = [
  { id: 'workspace', label: 'Workspace', icon: LayoutGrid, description: 'Documents & overview' },
  { id: 'chat', label: 'Chat', icon: MessageSquare, description: 'Ask across documents' },
  { id: 'insights', label: 'Insights', icon: Sparkles, description: 'Auto-generated ideas' },
  { id: 'study', label: 'Study Mode', icon: GraduationCap, description: 'Flashcards & quizzes' },
  { id: 'battle', label: 'Concept Battle', icon: Swords, description: 'Compare two ideas' },
  { id: 'fusion', label: 'Knowledge Fusion', icon: Merge, description: 'Unified mental model' },
  { id: 'gaps', label: 'Knowledge Gaps', icon: Target, description: 'What you\'re missing' },
  { id: 'confusion', label: 'Confusion Detector', icon: HelpCircle, description: 'Common mistakes' },
];

export default function Sidebar() {
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 flex w-72 flex-shrink-0 flex-col border-r border-border bg-bg-elevated/80 backdrop-blur-xl"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-accent to-blue-500 shadow-lg shadow-accent/30">
          <Brain className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-fg">Nexus</div>
          <div className="text-[10px] uppercase tracking-wider text-fg-subtle">
            Thinking Workspace
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5 p-3">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-all duration-150',
                active
                  ? 'bg-accent/10 text-fg'
                  : 'text-fg-muted hover:bg-bg-hover hover:text-fg'
              )}
            >
              {active && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute inset-0 rounded-lg border border-accent/30 bg-gradient-to-r from-accent/10 to-transparent"
                  transition={{ duration: 0.2 }}
                />
              )}
              <div className="relative z-10 flex items-center gap-3">
                <Icon
                  className={cn('h-4 w-4', active ? 'text-accent-hover' : '')}
                  strokeWidth={active ? 2.2 : 1.8}
                />
                <div className="leading-tight">
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-[10px] text-fg-subtle">{item.description}</div>
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-3 my-2 h-px bg-border" />

      {/* Documents */}
      <div className="flex min-h-0 flex-1 flex-col">
        <DocumentList />
      </div>
    </motion.aside>
  );
}
