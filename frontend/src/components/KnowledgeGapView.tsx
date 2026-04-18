'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Loader2, RefreshCw, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '@/store/useStore';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { EmptyState } from './ui/Loading';
import SpeakerButton from './ui/SpeakerButton';
import type { KnowledgeGap } from '@/types';

const PRI_COLOR: Record<KnowledgeGap['priority'], string> = {
  high: 'text-danger border-danger/40 bg-danger/10',
  medium: 'text-warning border-warning/40 bg-warning/10',
  low: 'text-fg-muted border-border bg-bg-hover',
};

export default function KnowledgeGapView() {
  const documents = useStore((s) => s.documents);
  const [loading, setLoading] = useState(false);
  const [gaps, setGaps] = useState<KnowledgeGap[]>([]);

  const ready = documents.filter((d) => d.status === 'ready');

  const run = async () => {
    if (!ready.length) return;
    setLoading(true);
    try {
      const { gaps } = await api.knowledgeGaps();
      setGaps(gaps || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ready.length && gaps.length === 0 && !loading) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (ready.length === 0) {
    return (
      <EmptyState
        icon={Target}
        title="No documents yet"
        description="Upload material to see what's missing from it."
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">What's missing from your knowledge</div>
          <div className="text-xs text-fg-subtle">
            Concepts, prerequisites, and follow-ups to fully understand the material.
          </div>
        </div>
        <button onClick={run} disabled={loading} className="btn-outline">
          <RefreshCw className="h-4 w-4" />
          {loading ? 'Analysing...' : 'Refresh'}
        </button>
      </div>

      {loading && gaps.length === 0 && (
        <div className="mt-6 flex items-center gap-3 text-fg-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Identifying gaps...</span>
        </div>
      )}

      <div className="mt-5 space-y-3">
        {gaps.map((g, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="card p-5"
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent/10">
                  <Target className="h-4 w-4 text-accent-hover" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{g.concept}</div>
                  <span
                    className={cn(
                      'mt-0.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider',
                      PRI_COLOR[g.priority]
                    )}
                  >
                    {g.priority} priority
                  </span>
                </div>
              </div>
              <SpeakerButton
                id={`gap-${i}`}
                text={`${g.priority} priority knowledge gap: ${g.concept}. ${g.why}`}
                size="sm"
              />
            </div>
            <div className="mt-2 text-xs leading-relaxed text-fg-muted">{g.why}</div>
            {g.resources?.length > 0 && (
              <div className="mt-3 border-t border-border pt-3">
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
                  Suggested directions
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {g.resources.map((r, j) => (
                    <a
                      key={j}
                      href={`https://www.google.com/search?q=${encodeURIComponent(r)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="chip transition-colors hover:border-accent hover:text-accent-hover"
                    >
                      {r}
                      <ArrowUpRight className="h-2.5 w-2.5" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
