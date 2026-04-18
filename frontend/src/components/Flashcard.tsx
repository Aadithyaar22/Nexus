'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import SpeakerButton from './ui/SpeakerButton';
import type { Flashcard as FlashcardT } from '@/types';

interface Props {
  cards: FlashcardT[];
}

export default function Flashcard({ cards }: Props) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = cards[index];
  const progress = ((index + 1) / cards.length) * 100;

  const next = () => {
    setFlipped(false);
    setTimeout(() => setIndex((i) => Math.min(i + 1, cards.length - 1)), 150);
  };
  const prev = () => {
    setFlipped(false);
    setTimeout(() => setIndex((i) => Math.max(i - 1, 0)), 150);
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center">
      {/* Progress */}
      <div className="mb-4 w-full">
        <div className="mb-1.5 flex items-center justify-between text-xs text-fg-muted">
          <span>
            {index + 1} / {cards.length}
          </span>
          <span className="chip">{card.topic}</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-bg-card">
          <motion.div
            className="h-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="w-full" style={{ perspective: '1200px' }}>
        <motion.button
          onClick={() => setFlipped((f) => !f)}
          className="relative h-72 w-full cursor-pointer"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-border bg-bg-card p-8 text-center shadow-xl"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
              Question
            </div>
            <div className="mt-3 text-lg font-medium leading-snug">{card.front}</div>
            <div className="mt-auto text-[11px] text-fg-subtle">Click to reveal answer</div>
          </div>
          {/* Back */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-accent/40 bg-gradient-to-br from-bg-card to-accent/5 p-8 text-center shadow-xl"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-accent-hover">
              Answer
            </div>
            <div className="mt-3 text-sm leading-relaxed text-fg">{card.back}</div>
            <div className="mt-auto text-[11px] text-fg-subtle">Click to flip back</div>
          </div>
        </motion.button>
      </div>

      {/* Controls */}
      <div className="mt-5 flex items-center gap-2">
        <button
          onClick={prev}
          disabled={index === 0}
          className="btn-outline h-9 w-9 p-0 disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button onClick={() => setFlipped((f) => !f)} className="btn-ghost">
          <RotateCcw className="h-3.5 w-3.5" />
          Flip
        </button>
        <SpeakerButton
          id={`flashcard-${index}-${flipped ? 'back' : 'front'}`}
          text={flipped ? `Answer. ${card.back}` : `Question. ${card.front}`}
          size="md"
          variant="chip"
          title={flipped ? 'Listen to answer' : 'Listen to question'}
        />
        <button
          onClick={next}
          disabled={index === cards.length - 1}
          className="btn-outline h-9 w-9 p-0 disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
