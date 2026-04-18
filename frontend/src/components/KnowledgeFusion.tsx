'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Merge, Loader2, Sparkles, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '@/store/useStore';
import { api } from '@/lib/api';
import { EmptyState } from './ui/Loading';
import SpeakerButton from './ui/SpeakerButton';
import type { KnowledgeFusionResult } from '@/types';

export default function KnowledgeFusion() {
  const documents = useStore((s) => s.documents);
  const selectedDocIds = useStore((s) => s.selectedDocIds);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<KnowledgeFusionResult | null>(null);

  const ready = documents.filter((d) => d.status === 'ready');

  const run = async () => {
    setLoading(true);
    setResult(null);
    try {
      const r = await api.knowledgeFusion(
        selectedDocIds.length ? selectedDocIds : undefined
      );
      setResult(r);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (ready.length < 2) {
    return (
      <EmptyState
        icon={Merge}
        title="Need at least 2 documents"
        description="Knowledge Fusion synthesises multiple documents into one unified mental model."
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Fuse your documents</div>
          <div className="text-xs text-fg-subtle">
            Not a summary — a synthesis. One coherent view across
            {' '}
            {selectedDocIds.length || ready.length} documents.
          </div>
        </div>
        <button onClick={run} disabled={loading} className="btn-primary">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Fusing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Fuse knowledge
            </>
          )}
        </button>
      </div>

      {loading && (
        <div className="mt-6 flex items-center gap-3 text-fg-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Building unified mental model...</span>
        </div>
      )}

      {result && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 space-y-5"
        >
          {/* Thesis */}
          <div className="card border-accent/30 bg-gradient-to-br from-accent/10 to-transparent p-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-accent-hover">
                Unified thesis
              </div>
              <SpeakerButton
                id="fusion-thesis"
                text={`Unified thesis. ${result.thesis}. Mental model. ${result.mentalModel}`}
                size="sm"
              />
            </div>
            <div className="text-base font-semibold leading-relaxed">{result.thesis}</div>
          </div>

          {/* Pillars */}
          <div>
            <div className="mb-3 text-sm font-semibold">Pillars of the model</div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {result.pillars.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card p-4"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <div className="grid h-5 w-5 place-items-center rounded-md bg-accent/15 text-[10px] font-semibold text-accent-hover">
                      {i + 1}
                    </div>
                    <div className="text-sm font-semibold">{p.name}</div>
                  </div>
                  <div className="text-xs leading-relaxed text-fg-muted">{p.explanation}</div>
                  {p.evidence?.length > 0 && (
                    <div className="mt-2.5 space-y-1 border-l-2 border-accent/30 pl-3">
                      {p.evidence.map((e, j) => (
                        <div key={j} className="text-[11px] italic text-fg-subtle">
                          "{e}"
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mental model */}
          <div className="card p-5">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
              How it all fits together
            </div>
            <div className="text-sm leading-relaxed text-fg">{result.mentalModel}</div>
          </div>

          {/* Open questions */}
          {result.openQuestions?.length > 0 && (
            <div className="card p-5">
              <div className="mb-3 flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-warning" />
                <div className="text-sm font-semibold">Open questions this raises</div>
              </div>
              <ul className="space-y-2">
                {result.openQuestions.map((q, i) => (
                  <li key={i} className="flex gap-2 text-sm text-fg-muted">
                    <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-warning" />
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
