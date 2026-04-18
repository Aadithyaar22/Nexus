'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, MessageSquare, Loader2, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { EmptyState } from './ui/Loading';
import SpeakerButton from './ui/SpeakerButton';

export default function ChatInterface() {
  const messages = useStore((s) => s.messages);
  const sendMessage = useStore((s) => s.sendMessage);
  const sending = useStore((s) => s.sending);
  const newChat = useStore((s) => s.newChat);
  const documents = useStore((s) => s.documents);
  const selectedDocIds = useStore((s) => s.selectedDocIds);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, sending]);

  const submit = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    await sendMessage(text);
    inputRef.current?.focus();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Upload a document first"
        description="The chat uses retrieval-augmented generation across your documents."
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2 text-xs text-fg-muted">
          <FileText className="h-3.5 w-3.5" />
          {selectedDocIds.length === 0
            ? `All ${documents.length} documents`
            : `${selectedDocIds.length} document${selectedDocIds.length !== 1 ? 's' : ''} scoped`}
        </div>
        <button onClick={newChat} className="btn-ghost text-xs">
          <Plus className="h-3.5 w-3.5" />
          New chat
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
        {messages.length === 0 && <ChatIntro />}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={cn(
                'flex gap-3',
                msg.role === 'user' ? 'flex-row-reverse' : ''
              )}
            >
              <div
                className={cn(
                  'grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg text-[10px] font-semibold',
                  msg.role === 'user'
                    ? 'bg-bg-card text-fg-muted'
                    : 'bg-gradient-to-br from-accent to-blue-500 text-white'
                )}
              >
                {msg.role === 'user' ? 'You' : 'AI'}
              </div>
              <div
                className={cn(
                  'min-w-0 max-w-[85%]',
                  msg.role === 'user' ? 'text-right' : ''
                )}
              >
                <div
                  className={cn(
                    'inline-block rounded-2xl px-4 py-2.5 text-sm',
                    msg.role === 'user'
                      ? 'bg-accent/15 text-fg'
                      : 'bg-bg-card border border-border'
                  )}
                >
                  <div className="prose-custom text-left">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                </div>

                {msg.role === 'assistant' && (
                  <div className="mt-1.5 flex items-center gap-1">
                    <SpeakerButton id={`chat-msg-${i}`} text={msg.content} size="sm" />
                  </div>
                )}

                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 space-y-1.5 text-left">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
                      Sources
                    </div>
                    <div className="space-y-1">
                      {msg.sources.slice(0, 4).map((s, j) => (
                        <details
                          key={j}
                          className="group rounded-md border border-border bg-bg-elevated/60 text-xs transition-colors hover:border-border-hover"
                        >
                          <summary className="flex cursor-pointer items-center gap-2 px-2.5 py-1.5">
                            <FileText className="h-3 w-3 flex-shrink-0 text-fg-subtle" />
                            <span className="truncate text-fg">{s.documentTitle}</span>
                            <span className="ml-auto flex-shrink-0 text-fg-subtle">
                              {(s.score * 100).toFixed(0)}%
                            </span>
                          </summary>
                          <div className="border-t border-border px-2.5 py-2 text-fg-muted">
                            {s.snippet}...
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {sending && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-accent to-blue-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
            </div>
            <div className="text-sm text-fg-muted">Retrieving & thinking...</div>
          </motion.div>
        )}
      </div>

      {/* Composer */}
      <div className="flex-shrink-0 border-t border-border bg-bg-elevated/40 p-4 backdrop-blur-xl">
        <div className="relative mx-auto max-w-3xl">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask anything about your documents..."
            rows={1}
            className="input resize-none pr-12"
            style={{ minHeight: '42px', maxHeight: '160px' }}
          />
          <button
            onClick={submit}
            disabled={!input.trim() || sending}
            className="absolute bottom-1.5 right-1.5 flex h-8 w-8 items-center justify-center rounded-md bg-accent text-white transition-all hover:bg-accent-hover disabled:opacity-40"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        <div className="mx-auto mt-2 max-w-3xl text-center text-[10px] text-fg-subtle">
          Press <kbd className="rounded border border-border bg-bg-hover px-1">Enter</kbd> to send ·{' '}
          <kbd className="rounded border border-border bg-bg-hover px-1">Shift+Enter</kbd> for newline
        </div>
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  'What are the main arguments across these documents?',
  'Where do the sources disagree?',
  'Summarise the methodology',
  'What are the practical implications?',
];

function ChatIntro() {
  const sendMessage = useStore((s) => s.sendMessage);
  return (
    <div className="m-auto max-w-xl text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-accent to-blue-500 shadow-lg shadow-accent/30">
        <MessageSquare className="h-5 w-5 text-white" />
      </div>
      <div className="mt-3 text-base font-semibold">Ask across your knowledge</div>
      <div className="mt-1 text-xs text-fg-subtle">
        Every answer is grounded in chunks retrieved from your uploaded documents.
      </div>
      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => sendMessage(s)}
            className="card-hover px-3 py-2.5 text-left text-xs text-fg-muted"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
