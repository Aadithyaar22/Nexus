'use client';

import { motion } from 'framer-motion';
import { X, Volume2, Zap, Globe } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useBrowserVoices, useTTS } from '@/hooks/useTTS';
import { cn } from '@/lib/utils';

interface Props {
  onClose: () => void;
}

export default function TTSSettings({ onClose }: Props) {
  const ttsMode = useStore((s) => s.ttsMode);
  const setTTSMode = useStore((s) => s.setTTSMode);
  const ttsRate = useStore((s) => s.ttsRate);
  const setTTSRate = useStore((s) => s.setTTSRate);
  const ttsVoiceURI = useStore((s) => s.ttsVoiceURI);
  const setTTSVoiceURI = useStore((s) => s.setTTSVoiceURI);
  const elevenLabsAvailable = useStore((s) => s.elevenLabsAvailable);
  const voices = useBrowserVoices();
  const { speak, stop } = useTTS();

  const preview = () => {
    stop();
    setTimeout(
      () =>
        speak(
          'tts-preview',
          'Hi! This is how I sound reading your notes. Pretty good, right?'
        ),
      100
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="card w-full max-w-lg overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-accent-hover" />
            <div className="text-sm font-semibold">Voice settings</div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-fg-muted hover:bg-bg-hover hover:text-fg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* Engine toggle */}
          <div>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
              Engine
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTTSMode('browser')}
                className={cn(
                  'relative flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all',
                  ttsMode === 'browser'
                    ? 'border-accent bg-accent/5'
                    : 'border-border hover:border-border-hover hover:bg-bg-hover'
                )}
              >
                <div className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-fg-muted" />
                  <div className="text-xs font-semibold">Browser</div>
                </div>
                <div className="text-[10px] text-fg-subtle">
                  Free · unlimited · instant
                </div>
              </button>
              <button
                onClick={() =>
                  elevenLabsAvailable
                    ? setTTSMode('elevenlabs')
                    : setTTSMode('browser')
                }
                disabled={!elevenLabsAvailable}
                className={cn(
                  'relative flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all',
                  ttsMode === 'elevenlabs' && elevenLabsAvailable
                    ? 'border-accent bg-accent/5'
                    : 'border-border hover:border-border-hover hover:bg-bg-hover',
                  !elevenLabsAvailable && 'cursor-not-allowed opacity-50'
                )}
              >
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-accent-hover" />
                  <div className="text-xs font-semibold">ElevenLabs</div>
                  <span className="ml-auto rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-accent-hover">
                    Premium
                  </span>
                </div>
                <div className="text-[10px] text-fg-subtle">
                  {elevenLabsAvailable
                    ? 'Human-quality · 10k chars/mo'
                    : 'Not configured on server'}
                </div>
              </button>
            </div>
          </div>

          {/* Browser voice picker (only when browser mode) */}
          {ttsMode === 'browser' && voices.length > 0 && (
            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
                Voice ({voices.length} available)
              </div>
              <select
                value={ttsVoiceURI || ''}
                onChange={(e) => setTTSVoiceURI(e.target.value || null)}
                className="input"
              >
                <option value="">System default</option>
                {voices
                  .slice()
                  .sort((a, b) => {
                    // Prefer English, local, then alphabetical
                    const aLocal = a.localService ? 0 : 1;
                    const bLocal = b.localService ? 0 : 1;
                    if (aLocal !== bLocal) return aLocal - bLocal;
                    return a.name.localeCompare(b.name);
                  })
                  .map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang}){v.localService ? '' : ' · network'}
                    </option>
                  ))}
              </select>
              <div className="mt-1 text-[10px] text-fg-subtle">
                On macOS, voices like Samantha, Alex, and Karen sound
                especially natural.
              </div>
            </div>
          )}

          {/* Speed */}
          {ttsMode === 'browser' && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
                  Speed
                </div>
                <div className="text-xs tabular-nums text-fg-muted">
                  {ttsRate.toFixed(2)}×
                </div>
              </div>
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.05}
                value={ttsRate}
                onChange={(e) => setTTSRate(parseFloat(e.target.value))}
                className="w-full accent-[#8b5cf6]"
              />
              <div className="mt-1 flex justify-between text-[10px] text-fg-subtle">
                <span>0.5×</span>
                <span>1×</span>
                <span>2×</span>
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-bg-elevated/40 p-3">
            <div className="text-xs text-fg-muted">Test the current voice</div>
            <button onClick={preview} className="btn-outline text-xs">
              <Volume2 className="h-3 w-3" />
              Preview
            </button>
          </div>

          {!elevenLabsAvailable && (
            <div className="rounded-lg border border-border bg-bg-elevated/40 p-3 text-[11px] leading-relaxed text-fg-muted">
              <strong className="text-fg">Want premium voices?</strong> Get a
              free ElevenLabs key (10k chars/month) at{' '}
              <span className="text-accent-hover">elevenlabs.io</span>, add{' '}
              <code className="rounded bg-bg-hover px-1 py-0.5 font-mono text-[10px]">
                ELEVENLABS_API_KEY
              </code>{' '}
              to your backend{' '}
              <code className="rounded bg-bg-hover px-1 py-0.5 font-mono text-[10px]">
                .env
              </code>
              , and restart.
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
