'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Sparkles, Loader2, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import { useStore } from '@/store/useStore';
import { api } from '@/lib/api';
import { formatBytes, formatDate } from '@/lib/utils';
import { EmptyState } from './ui/Loading';
import SpeakerButton from './ui/SpeakerButton';
import type { Summary } from '@/types';

export default function WorkspaceView() {
  const documents = useStore((s) => s.documents);
  const selectedDocIds = useStore((s) => s.selectedDocIds);
  const setView = useStore((s) => s.setView);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [summaryScope, setSummaryScope] = useState<'all' | string>('all');

  const runSummary = async (scope: 'all' | string) => {
    setLoading(true);
    setSummaryScope(scope);
    try {
      const s = scope === 'all' ? await api.summarizeAll() : await api.summarizeDocument(scope);
      setSummary(s);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Your workspace is empty"
        description="Upload a PDF or text file from the sidebar to get started. The AI will chunk, embed, and index it automatically."
      />
    );
  }

  const ready = documents.filter((d) => d.status === 'ready');

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-3 gap-3"
      >
        <StatCard label="Documents" value={documents.length.toString()} />
        <StatCard label="Ready" value={ready.length.toString()} />
        <StatCard
          label="Total chunks"
          value={ready.reduce((s, d) => s + d.chunkCount, 0).toString()}
        />
      </motion.div>

      {/* Summary engine */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card mt-6 overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-border bg-bg-elevated/40 px-5 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent-hover" />
            <div className="text-sm font-semibold">Smart Summary Engine</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => runSummary('all')}
              disabled={loading || ready.length === 0}
              className="btn-outline text-xs"
            >
              Summarise all
            </button>
            {selectedDocIds.length === 1 && (
              <button
                onClick={() => runSummary(selectedDocIds[0])}
                disabled={loading}
                className="btn-primary text-xs"
              >
                Summarise selected
              </button>
            )}
          </div>
        </div>

        <div className="p-5">
          {loading && (
            <div className="flex items-center gap-3 text-fg-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Distilling knowledge...</span>
            </div>
          )}

          {!loading && !summary && (
            <div className="py-4 text-sm text-fg-subtle">
              Click <strong className="text-fg">Summarise all</strong> to generate a unified
              summary across every ready document, or select one document in the sidebar and
              summarise just that.
            </div>
          )}

          {!loading && summary && (
            <div className="space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
                    Overview
                  </div>
                  <SpeakerButton
                    id={`summary-overview-${summaryScope}`}
                    text={`Overview. ${summary.short}. Key points: ${(summary.keyPoints || []).join('. ')}`}
                    size="sm"
                  />
                </div>
                <div className="prose-custom text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary.short}</ReactMarkdown>
                </div>
              </div>

              {summary.keyPoints?.length > 0 && (
                <div>
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
                    Key points
                  </div>
                  <ul className="space-y-1.5 text-sm">
                    {summary.keyPoints.map((kp, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-accent" />
                        <span className="text-fg">{kp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.concepts?.length > 0 && (
                <div>
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
                    Core concepts
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {summary.concepts.map((c, i) => (
                      <span key={i} className="chip">{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Document grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-6"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold">Documents</div>
          <button onClick={() => setView('chat')} className="btn-ghost text-xs">
            Start chatting →
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {documents.map((doc) => (
            <motion.div
              key={doc.id}
              layout
              className="card-hover p-4"
            >
              <div className="mb-2 flex items-start gap-2">
                <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-md bg-bg-hover">
                  <FileText className="h-4 w-4 text-fg-muted" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{doc.title}</div>
                  <div className="text-[11px] text-fg-subtle">
                    {formatBytes(doc.size)} · {doc.chunkCount} chunks · {formatDate(doc.createdAt)}
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[11px]">
                <span
                  className={
                    doc.status === 'ready'
                      ? 'chip text-success'
                      : doc.status === 'failed'
                      ? 'chip text-danger'
                      : 'chip text-warning'
                  }
                >
                  <span
                    className={
                      doc.status === 'ready'
                        ? 'h-1.5 w-1.5 rounded-full bg-success'
                        : doc.status === 'failed'
                        ? 'h-1.5 w-1.5 rounded-full bg-danger'
                        : 'h-1.5 w-1.5 rounded-full bg-warning'
                    }
                  />
                  {doc.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="card p-4">
    <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
      {label}
    </div>
    <div className="mt-1 text-2xl font-semibold text-fg">{value}</div>
  </div>
);
