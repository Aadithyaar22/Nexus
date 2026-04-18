'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Loader2, AlertTriangle, CheckCircle2, Lightbulb, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '@/store/useStore';
import { api } from '@/lib/api';
import { EmptyState } from './ui/Loading';
import SpeakerButton from './ui/SpeakerButton';
import type { Confusion } from '@/types';

export default function ConfusionDetector() {
  const documents = useStore((s) => s.documents);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Confusion[]>([]);

  const ready = documents.filter((d) => d.status === 'ready');

  const run = async () => {
    if (!ready.length) return;
    setLoading(true);
    try {
      const { confusions } = await api.confusionDetector();
      setItems(confusions || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ready.length && items.length === 0 && !loading) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (ready.length === 0) {
    return (
      <EmptyState
        icon={HelpCircle}
        title="No documents yet"
        description="Upload something to spot commonly misunderstood concepts."
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Commonly misunderstood concepts</div>
          <div className="text-xs text-fg-subtle">
            Where intuition typically goes wrong — with plain-English fixes.
          </div>
        </div>
        <button onClick={run} disabled={loading} className="btn-outline">
          <RefreshCw className="h-4 w-4" />
          {loading ? 'Analysing...' : 'Refresh'}
        </button>
      </div>

      {loading && items.length === 0 && (
        <div className="mt-6 flex items-center gap-3 text-fg-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Scanning for tricky concepts...</span>
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {items.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="card p-5"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <HelpCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />
                <div className="text-sm font-semibold">{c.concept}</div>
              </div>
              <SpeakerButton
                id={`confusion-${i}`}
                text={`${c.concept}. Common misconception: ${c.commonMisconception}. Actual truth: ${c.actualTruth}. ${c.simpleExplanation}. Think of it this way: ${c.analogy}`}
                size="sm"
              />
            </div>

            <div className="mb-3 rounded-lg border border-danger/30 bg-danger/5 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-danger">
                <AlertTriangle className="h-3 w-3" />
                Common misconception
              </div>
              <div className="text-xs text-fg">{c.commonMisconception}</div>
            </div>

            <div className="mb-3 rounded-lg border border-success/30 bg-success/5 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-success">
                <CheckCircle2 className="h-3 w-3" />
                Actual truth
              </div>
              <div className="text-xs text-fg">{c.actualTruth}</div>
            </div>

            <div className="mb-3">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
                Plain-English explanation
              </div>
              <div className="text-xs text-fg-muted">{c.simpleExplanation}</div>
            </div>

            {c.analogy && (
              <div className="mb-3 rounded-lg border-l-2 border-accent bg-bg-elevated/40 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-accent-hover">
                  <Lightbulb className="h-3 w-3" />
                  Analogy
                </div>
                <div className="text-xs italic text-fg">{c.analogy}</div>
              </div>
            )}

            {c.confusedWith?.length > 0 && (
              <div>
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
                  Often confused with
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {c.confusedWith.map((x, j) => (
                    <span key={j} className="chip">
                      {x}
                    </span>
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
