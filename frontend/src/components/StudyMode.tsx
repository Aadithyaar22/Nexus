'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ListChecks, ScrollText, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '@/store/useStore';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { EmptyState } from './ui/Loading';
import SpeakerButton from './ui/SpeakerButton';
import Flashcard from './Flashcard';
import Quiz from './Quiz';
import type { Flashcard as FlashcardT, MCQ, ExamQuestion } from '@/types';

type Mode = 'flashcards' | 'quiz' | 'exam';

export default function StudyMode() {
  const documents = useStore((s) => s.documents);
  const selectedDocIds = useStore((s) => s.selectedDocIds);
  const [mode, setMode] = useState<Mode>('flashcards');
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<FlashcardT[]>([]);
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [exam, setExam] = useState<ExamQuestion[]>([]);

  const ready = documents.filter((d) => d.status === 'ready');

  const generate = async () => {
    if (ready.length === 0) return;
    setLoading(true);
    try {
      const ids = selectedDocIds.length ? selectedDocIds : undefined;
      if (mode === 'flashcards') {
        const { cards } = await api.generateFlashcards(ids, 12);
        setCards(cards || []);
      } else if (mode === 'quiz') {
        const { questions } = await api.generateMCQs(ids, 10);
        setMcqs(questions || []);
      } else {
        const { questions } = await api.generateExamQuestions(ids, 8);
        setExam(questions || []);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (ready.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No documents ready"
        description="Upload and wait for at least one document to finish processing."
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
      {/* Mode selector */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg border border-border bg-bg-card p-1">
          <ModeBtn mode={mode} setMode={setMode} value="flashcards" icon={BookOpen} label="Flashcards" />
          <ModeBtn mode={mode} setMode={setMode} value="quiz" icon={ListChecks} label="Quiz" />
          <ModeBtn mode={mode} setMode={setMode} value="exam" icon={ScrollText} label="Exam Qs" />
        </div>

        <button onClick={generate} disabled={loading} className="btn-primary">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Generate {mode === 'flashcards' ? 'flashcards' : mode === 'quiz' ? 'quiz' : 'exam questions'}
            </>
          )}
        </button>
      </div>

      <div className="mt-6 flex-1">
        <AnimatePresence mode="wait">
          {mode === 'flashcards' && (
            <motion.div
              key="flashcards"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="h-full"
            >
              {cards.length === 0 ? (
                <PromptToGenerate label="flashcards" />
              ) : (
                <Flashcard cards={cards} />
              )}
            </motion.div>
          )}

          {mode === 'quiz' && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {mcqs.length === 0 ? (
                <PromptToGenerate label="a quiz" />
              ) : (
                <Quiz questions={mcqs} />
              )}
            </motion.div>
          )}

          {mode === 'exam' && (
            <motion.div
              key="exam"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {exam.length === 0 ? (
                <PromptToGenerate label="exam questions" />
              ) : (
                <ExamList questions={exam} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const ModeBtn = ({
  mode,
  setMode,
  value,
  icon: Icon,
  label,
}: {
  mode: Mode;
  setMode: (m: Mode) => void;
  value: Mode;
  icon: React.ElementType;
  label: string;
}) => (
  <button
    onClick={() => setMode(value)}
    className={cn(
      'relative flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
      mode === value ? 'text-fg' : 'text-fg-muted hover:text-fg'
    )}
  >
    {mode === value && (
      <motion.div
        layoutId="study-mode"
        className="absolute inset-0 rounded-md bg-accent/15 ring-1 ring-accent/30"
      />
    )}
    <span className="relative z-10 flex items-center gap-2">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  </button>
);

const PromptToGenerate = ({ label }: { label: string }) => (
  <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border text-sm text-fg-subtle">
    Click generate to create {label} from your documents.
  </div>
);

const DIFF_COLOR = {
  easy: 'text-success',
  medium: 'text-warning',
  hard: 'text-danger',
};

const ExamList = ({ questions }: { questions: ExamQuestion[] }) => (
  <div className="space-y-3">
    {questions.map((q, i) => (
      <motion.details
        key={i}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.03 }}
        className="group card overflow-hidden"
      >
        <summary className="flex cursor-pointer items-start gap-3 p-4">
          <div className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-md bg-bg-hover text-xs font-semibold text-fg-muted">
            {i + 1}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="chip text-[9px]">{q.type}</span>
              <span className={cn('chip text-[9px] capitalize', DIFF_COLOR[q.difficulty])}>
                {q.difficulty}
              </span>
            </div>
            <div className="mt-1.5 text-sm font-medium">{q.question}</div>
          </div>
        </summary>
        <div className="border-t border-border bg-bg-elevated/40 p-4">
          <div className="mb-1.5 flex items-center justify-between">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
              Model answer
            </div>
            <SpeakerButton
              id={`exam-q-${i}`}
              text={`Question. ${q.question}. Model answer. ${q.modelAnswer}`}
              size="sm"
            />
          </div>
          <div className="text-sm text-fg-muted">{q.modelAnswer}</div>
        </div>
      </motion.details>
    ))}
  </div>
);
