'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Loader2, ArrowRight, Plus, Minus, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import SpeakerButton from './ui/SpeakerButton';
import type { ConceptBattleResult, ConceptBattleSide } from '@/types';

export default function ConceptBattle() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ConceptBattleResult | null>(null);

  const run = async () => {
    if (!a.trim() || !b.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const r = await api.conceptBattle(a.trim(), b.trim());
      setResult(r);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
      {/* Input */}
      <div className="card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Swords className="h-4 w-4 text-accent-hover" />
          <div className="text-sm font-semibold">Compare two concepts</div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_1fr_auto]">
          <input
            value={a}
            onChange={(e) => setA(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run()}
            placeholder="e.g., REST API"
            className="input"
          />
          <div className="grid place-items-center text-fg-subtle">
            <span className="text-xs font-semibold">VS</span>
          </div>
          <input
            value={b}
            onChange={(e) => setB(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run()}
            placeholder="e.g., GraphQL"
            className="input"
          />
          <button
            onClick={run}
            disabled={loading || !a.trim() || !b.trim()}
            className="btn-primary"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Battle
          </button>
        </div>
      </div>

      {/* Result */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-5 flex items-center justify-center gap-3 py-12 text-fg-muted"
          >
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Staging the battle...</span>
          </motion.div>
        )}

        {result && !loading && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 space-y-5"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Side side={result.conceptA} color="violet" />
              <Side side={result.conceptB} color="blue" />
            </div>

            {/* Key differences table */}
            {result.keyDifferences?.length > 0 && (
              <div className="card overflow-hidden">
                <div className="border-b border-border px-5 py-3 text-sm font-semibold">
                  Head-to-head
                </div>
                <div className="divide-y divide-border">
                  <div className="grid grid-cols-[180px_1fr_1fr] gap-4 bg-bg-elevated/40 px-5 py-2 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
                    <div>Dimension</div>
                    <div>{result.conceptA.name}</div>
                    <div>{result.conceptB.name}</div>
                  </div>
                  {result.keyDifferences.map((d, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[180px_1fr_1fr] gap-4 px-5 py-3 text-xs"
                    >
                      <div className="font-semibold text-fg">{d.dimension}</div>
                      <div className="text-fg-muted">{d.a}</div>
                      <div className="text-fg-muted">{d.b}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* When to use */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="card p-5">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-accent-hover">
                  When {result.conceptA.name} wins
                </div>
                <div className="text-sm text-fg-muted">{result.whenToUseA}</div>
              </div>
              <div className="card p-5">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-blue-300">
                  When {result.conceptB.name} wins
                </div>
                <div className="text-sm text-fg-muted">{result.whenToUseB}</div>
              </div>
            </div>

            {/* Verdict */}
            <div className="card border-accent/30 bg-gradient-to-r from-accent/10 via-transparent to-blue-500/10 p-5">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-accent-hover">
                  <ArrowRight className="h-3 w-3" />
                  Verdict
                </div>
                <SpeakerButton
                  id="battle-verdict"
                  text={`Verdict comparing ${result.conceptA.name} and ${result.conceptB.name}. ${result.verdict}. When to use ${result.conceptA.name}: ${result.whenToUseA}. When to use ${result.conceptB.name}: ${result.whenToUseB}.`}
                  size="sm"
                />
              </div>
              <div className="text-sm leading-relaxed">{result.verdict}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const Side = ({
  side,
  color,
}: {
  side: ConceptBattleSide;
  color: 'violet' | 'blue';
}) => (
  <div
    className={cn(
      'card p-5',
      color === 'violet' ? 'border-accent/30' : 'border-blue-500/30'
    )}
  >
    <div
      className={cn(
        'mb-1 text-[10px] font-semibold uppercase tracking-wider',
        color === 'violet' ? 'text-accent-hover' : 'text-blue-300'
      )}
    >
      {color === 'violet' ? 'Concept A' : 'Concept B'}
    </div>
    <div className="mb-2 text-lg font-semibold">{side.name}</div>
    <div className="mb-4 text-sm text-fg-muted">{side.definition}</div>

    <Section icon={Plus} title="Strengths" items={side.strengths} accent="success" />
    <Section icon={Minus} title="Weaknesses" items={side.weaknesses} accent="danger" />
    <Section icon={ArrowRight} title="Best for" items={side.bestFor} accent="fg" />
  </div>
);

const Section = ({
  icon: Icon,
  title,
  items,
  accent,
}: {
  icon: React.ElementType;
  title: string;
  items: string[];
  accent: 'success' | 'danger' | 'fg';
}) => {
  if (!items?.length) return null;
  const color =
    accent === 'success' ? 'text-success' : accent === 'danger' ? 'text-danger' : 'text-fg-muted';
  return (
    <div className="mb-3 last:mb-0">
      <div className={cn('mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider', color)}>
        <Icon className="h-3 w-3" />
        {title}
      </div>
      <ul className="space-y-1 text-xs text-fg">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span className={cn('mt-1 h-1 w-1 flex-shrink-0 rounded-full', accent === 'success' ? 'bg-success' : accent === 'danger' ? 'bg-danger' : 'bg-fg-muted')} />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
};
