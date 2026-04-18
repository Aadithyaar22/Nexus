'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MCQ } from '@/types';

interface Props {
  questions: MCQ[];
}

export default function Quiz({ questions }: Props) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = Object.entries(answers).reduce(
    (acc, [i, ans]) => acc + (questions[+i].correctIndex === ans ? 1 : 0),
    0
  );

  const allAnswered = Object.keys(answers).length === questions.length;

  const reset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  return (
    <div className="mx-auto max-w-2xl">
      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-4 flex items-center gap-4 border-accent/30 bg-gradient-to-r from-accent/10 to-transparent p-5"
        >
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent/20">
            <Award className="h-6 w-6 text-accent-hover" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-fg-muted">Your score</div>
            <div className="text-2xl font-semibold">
              {score} / {questions.length}
              <span className="ml-2 text-sm font-normal text-fg-muted">
                ({((score / questions.length) * 100).toFixed(0)}%)
              </span>
            </div>
          </div>
          <button onClick={reset} className="btn-outline">
            Retry
          </button>
        </motion.div>
      )}

      <div className="space-y-4">
        {questions.map((q, qi) => {
          const chosen = answers[qi];
          const correct = q.correctIndex;
          return (
            <motion.div
              key={qi}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: qi * 0.04 }}
              className="card p-5"
            >
              <div className="mb-3 flex items-start gap-3">
                <div className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-md bg-bg-hover text-xs font-semibold text-fg-muted">
                  {qi + 1}
                </div>
                <div className="text-sm font-medium leading-snug">{q.question}</div>
              </div>

              <div className="space-y-2 pl-9">
                {q.options.map((opt, oi) => {
                  const isChosen = chosen === oi;
                  const isCorrect = oi === correct;
                  const show = submitted;
                  return (
                    <button
                      key={oi}
                      onClick={() => !submitted && setAnswers((a) => ({ ...a, [qi]: oi }))}
                      disabled={submitted}
                      className={cn(
                        'relative flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-all',
                        !show && isChosen && 'border-accent bg-accent/10 text-fg',
                        !show && !isChosen && 'border-border hover:border-border-hover hover:bg-bg-hover',
                        show && isCorrect && 'border-success bg-success/10 text-fg',
                        show && !isCorrect && isChosen && 'border-danger bg-danger/10 text-fg',
                        show && !isCorrect && !isChosen && 'border-border text-fg-muted'
                      )}
                    >
                      <div
                        className={cn(
                          'grid h-5 w-5 flex-shrink-0 place-items-center rounded-full border',
                          !show && isChosen && 'border-accent bg-accent text-white',
                          !show && !isChosen && 'border-border',
                          show && isCorrect && 'border-success bg-success text-white',
                          show && !isCorrect && isChosen && 'border-danger bg-danger text-white',
                          show && !isCorrect && !isChosen && 'border-border'
                        )}
                      >
                        {show && isCorrect ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : show && !isCorrect && isChosen ? (
                          <XCircle className="h-3 w-3" />
                        ) : (
                          <span className="text-[9px] font-semibold">
                            {String.fromCharCode(65 + oi)}
                          </span>
                        )}
                      </div>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {submitted && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 rounded-lg border border-border bg-bg-elevated/60 p-3 pl-4 text-xs text-fg-muted"
                >
                  <span className="font-semibold text-fg">Explanation: </span>
                  {q.explanation}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {!submitted && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setSubmitted(true)}
            disabled={!allAnswered}
            className="btn-primary"
          >
            Submit {!allAnswered && `(${Object.keys(answers).length}/${questions.length})`}
          </button>
        </div>
      )}
    </div>
  );
}
