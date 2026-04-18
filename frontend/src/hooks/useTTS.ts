'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import { api } from '@/lib/api';

/**
 * Unified TTS hook.
 *
 * Design: we keep a single audio/speech source active at a time across the
 * whole app — clicking "speak" on one panel stops any other playback. This
 * is implemented via a module-level registry so components don't need to
 * coordinate via context.
 */

type PlayingState = {
  id: string | null;
  stop: () => void;
};

// Module-level singleton — one source of truth for "what's playing now".
let currentlyPlaying: PlayingState = { id: null, stop: () => {} };
const listeners = new Set<(id: string | null) => void>();

const setPlaying = (state: PlayingState) => {
  if (currentlyPlaying.id && currentlyPlaying.id !== state.id) {
    // Stop whatever was playing before without triggering its own state update
    const prevStop = currentlyPlaying.stop;
    currentlyPlaying = state;
    try { prevStop(); } catch { /* noop */ }
  } else {
    currentlyPlaying = state;
  }
  listeners.forEach((l) => l(state.id));
};

export const useTTS = () => {
  const ttsMode = useStore((s) => s.ttsMode);
  const ttsVoiceURI = useStore((s) => s.ttsVoiceURI);
  const ttsRate = useStore((s) => s.ttsRate);
  const elevenLabsAvailable = useStore((s) => s.elevenLabsAvailable);

  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Subscribe to the global playing-state
  useEffect(() => {
    const listener = (id: string | null) => setPlayingId(id);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const stop = useCallback(() => {
    currentlyPlaying.stop();
    setPlaying({ id: null, stop: () => {} });
    setLoadingId(null);
  }, []);

  const speakBrowser = useCallback(
    (id: string, text: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        throw new Error('Browser TTS not supported');
      }
      const synth = window.speechSynthesis;
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = ttsRate;

      // Match selected voice if one was saved
      if (ttsVoiceURI) {
        const voice = synth.getVoices().find((v) => v.voiceURI === ttsVoiceURI);
        if (voice) utter.voice = voice;
      }

      const done = () => {
        if (currentlyPlaying.id === id) setPlaying({ id: null, stop: () => {} });
      };
      utter.onend = done;
      utter.onerror = done;

      setPlaying({
        id,
        stop: () => {
          try { synth.cancel(); } catch { /* noop */ }
        },
      });
      synth.speak(utter);
    },
    [ttsRate, ttsVoiceURI]
  );

  const speakElevenLabs = useCallback(async (id: string, text: string) => {
    setLoadingId(id);
    try {
      const blob = await api.tts(text);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.playbackRate = 1; // ElevenLabs includes pacing already

      const done = () => {
        URL.revokeObjectURL(url);
        if (currentlyPlaying.id === id) setPlaying({ id: null, stop: () => {} });
      };
      audio.onended = done;
      audio.onerror = done;

      setPlaying({
        id,
        stop: () => {
          try {
            audio.pause();
            audio.src = '';
          } catch { /* noop */ }
          URL.revokeObjectURL(url);
        },
      });
      await audio.play();
    } finally {
      setLoadingId((prev) => (prev === id ? null : prev));
    }
  }, []);

  const speak = useCallback(
    async (id: string, text: string) => {
      if (!text?.trim()) return;

      // Toggle off if already playing this one
      if (currentlyPlaying.id === id) {
        stop();
        return;
      }

      // Strip markdown for speech — asterisks and backticks get spelled
      // out literally by both engines, which sounds awful.
      const clean = text
        .replace(/[*_`~#>]/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [text](url) → text
        .replace(/\n{2,}/g, '. ')
        .replace(/\s+/g, ' ')
        .trim();

      const useEleven = ttsMode === 'elevenlabs' && elevenLabsAvailable;

      try {
        if (useEleven) {
          await speakElevenLabs(id, clean);
        } else {
          speakBrowser(id, clean);
        }
      } catch (err) {
        console.error('[tts] failed, falling back to browser:', err);
        // Graceful fallback if ElevenLabs is down / out of quota
        if (useEleven) speakBrowser(id, clean);
      }
    },
    [ttsMode, elevenLabsAvailable, stop, speakElevenLabs, speakBrowser]
  );

  return {
    speak,
    stop,
    playingId,
    loadingId,
    isPlaying: (id: string) => playingId === id,
    isLoading: (id: string) => loadingId === id,
  };
};

/** Helper to list available browser voices (for the settings picker). */
export const useBrowserVoices = () => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const synth = window.speechSynthesis;
    const load = () => {
      const v = synth.getVoices();
      if (v.length) setVoices(v);
    };
    load();
    // Chrome loads voices async — need this listener too
    synth.addEventListener?.('voiceschanged', load);
    return () => synth.removeEventListener?.('voiceschanged', load);
  }, []);

  return voices;
};
