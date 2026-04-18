'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  RefreshCw,
  Link2,
  AlertTriangle,
  GitMerge,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '@/store/useStore';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Shimmer } from './ui/Loading';
import SpeakerButton from './ui/SpeakerButton';
import type { AutoInsight, CrossDocInsight } from '@/types';

const TAG_STYLES: Record<AutoInsight['tag'], string> = {
  connection: 'text-accent-hover border-accent/30 bg-accent/5',
  implication: 'text-blue-300 border-blue-500/30 bg-blue-500/5',
  question: 'text-yellow-300 border-yellow-500/30 bg-yellow-500/5',
  pattern: 'text-success border-success/30 bg-success/5',
  contrast: 'text-orange-300 border-orange-500/30 bg-orange-500/5',
};

const CROSS_TYPE_ICON: Record<CrossDocInsight['type'], React.ElementType> = {
  agreement: GitMerge,
  contradiction: AlertTriangle,
  extension: ArrowRight,
  analogy: Link2,
  gap: HelpCircle,
};

const CROSS_TYPE_COLOR: Record<CrossDocInsight['type'], string> = {
  agreement: 'text-success',
  contradiction: 'text-danger',
  extension: 'text-accent-hover',
  analogy: 'text-blue-300',
  gap: 'text-warning',
};

interface Props {
  fullscreen?: boolean;
}

export default function InsightsPanel({ fullscreen = false }: Props) {
  const insightsPanelOpen = useStore((s) => s.insightsPanelOpen);
  const documents = useStore((s) => s.documents);
  const [tab, setTab] = useState<'feed' | 'cross'>('feed');
  const [autoInsights, setAutoInsights] = useState<AutoInsight[]>([]);
  const [crossInsights, setCrossInsights] = useState<CrossDocInsight[]>([]);
  const [loading, setLoading] = useState(false);

  const ready = documents.filter((d) => d.status === 'ready');

  const fetchFeed = async () => {
    if (ready.length === 0) return;
    setLoading(true);
    try {
      if (tab === 'feed') {
        const { insights } = await api.autoInsightFeed();
        setAutoInsights(insights || []);
      } else {
        const { insights } = await api.crossDocumentInsights();
        setCrossInsights(insights || []);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fullscreen || insightsPanelOpen) fetchFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  if (!fullscreen && !insightsPanelOpen) return null;

  return (
    <aside
      className={cn(
        'flex flex-col border-l border-border bg-bg-elevated/40 backdrop-blur-xl',
        fullscreen ? 'flex-1' : 'w-96 flex-shrink-0'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent-hover" />
          <div className="text-sm font-semibold">AI Insights</div>
        </div>
        <button
          onClick={fetchFeed}
          disabled={loading || ready.length === 0}
          className="flex h-7 w-7 items-center justify-center rounded-md text-fg-muted hover:bg-bg-hover hover:text-fg disabled:opacity-40"
          title="Refresh"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(['feed', 'cross'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'relative flex-1 px-3 py-2 text-xs font-medium transition-colors',
              tab === t ? 'text-fg' : 'text-fg-muted hover:text-fg'
            )}
          >
            {t === 'feed' ? 'Auto Feed' : 'Cross-Doc'}
            {tab === t && (
              <motion.div
                layoutId="insights-tab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
              />
            )}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3">
        {ready.length === 0 && (
          <div className="flex h-full items-center justify-center p-6 text-center text-xs text-fg-subtle">
            Upload documents to generate insights.
          </div>
        )}

        {ready.length > 0 && loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card space-y-2 p-4">
                <Shimmer className="h-3 w-3/4" />
                <Shimmer className="h-2 w-full" />
                <Shimmer className="h-2 w-5/6" />
              </div>
            ))}
          </div>
        )}

        {!loading && tab === 'feed' && autoInsights.length > 0 && (
          <div className="space-y-2.5">
            <AnimatePresence>
              {autoInsights.map((ins, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="card-hover p-3.5"
                >
                  <div
                    className={cn(
                      'mb-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider',
                      TAG_STYLES[ins.tag] || TAG_STYLES.pattern
                    )}
                  >
                    {ins.tag}
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold leading-snug">{ins.headline}</div>
                      <div className="mt-1 text-[11px] leading-relaxed text-fg-muted">
                        {ins.body}
                      </div>
                    </div>
                    <SpeakerButton
                      id={`auto-insight-${i}`}
                      text={`${ins.headline}. ${ins.body}`}
                      size="sm"
                      className="flex-shrink-0"
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {!loading && tab === 'cross' && crossInsights.length > 0 && (
          <div className="space-y-2.5">
            <AnimatePresence>
              {crossInsights.map((ins, i) => {
                const Icon = CROSS_TYPE_ICON[ins.type] || Link2;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="card-hover p-3.5"
                  >
                    <div className="mb-1.5 flex items-center gap-2">
                      <Icon className={cn('h-3.5 w-3.5', CROSS_TYPE_COLOR[ins.type])} />
                      <span className={cn('text-[10px] font-semibold uppercase tracking-wider', CROSS_TYPE_COLOR[ins.type])}>
                        {ins.type}
                      </span>
                      <SpeakerButton
                        id={`cross-insight-${i}`}
                        text={`${ins.type} insight. ${ins.title}. ${ins.description}`}
                        size="sm"
                        className="ml-auto"
                      />
                    </div>
                    <div className="text-xs font-semibold leading-snug">{ins.title}</div>
                    <div className="mt-1 text-[11px] leading-relaxed text-fg-muted">
                      {ins.description}
                    </div>
                    {ins.documents?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {ins.documents.map((d, j) => (
                          <span key={j} className="chip text-[9px]">
                            {d}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {!loading &&
          ready.length > 0 &&
          ((tab === 'feed' && autoInsights.length === 0) ||
            (tab === 'cross' && crossInsights.length === 0)) && (
            <div className="flex h-full items-center justify-center p-6 text-center text-xs text-fg-subtle">
              {tab === 'cross' && ready.length < 2
                ? 'Upload at least 2 documents for cross-doc insights.'
                : 'Click refresh to generate insights.'}
            </div>
          )}
      </div>
    </aside>
  );
}
