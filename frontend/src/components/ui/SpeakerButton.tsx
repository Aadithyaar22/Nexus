'use client';

import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { useTTS } from '@/hooks/useTTS';
import { cn } from '@/lib/utils';

interface Props {
  id: string;
  text: string;
  size?: 'sm' | 'md';
  variant?: 'ghost' | 'chip';
  className?: string;
  title?: string;
}

export default function SpeakerButton({
  id,
  text,
  size = 'sm',
  variant = 'ghost',
  className,
  title,
}: Props) {
  const { speak, isPlaying, isLoading } = useTTS();
  const playing = isPlaying(id);
  const loading = isLoading(id);

  const sizing = size === 'sm' ? 'h-6 w-6' : 'h-7 w-7';
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        speak(id, text);
      }}
      disabled={!text?.trim()}
      title={title || (playing ? 'Stop speaking' : 'Listen')}
      aria-label={playing ? 'Stop speaking' : 'Listen'}
      className={cn(
        'inline-flex items-center justify-center rounded-md transition-all duration-150',
        sizing,
        variant === 'ghost' &&
          'text-fg-subtle hover:bg-bg-hover hover:text-fg-muted disabled:opacity-30 disabled:hover:bg-transparent',
        variant === 'chip' &&
          'border border-border bg-bg-elevated/60 text-fg-muted hover:border-accent/40 hover:bg-accent/10 hover:text-accent-hover disabled:opacity-30',
        playing && 'bg-accent/15 text-accent-hover',
        className
      )}
    >
      {loading ? (
        <Loader2 className={cn(iconSize, 'animate-spin')} />
      ) : playing ? (
        <VolumeX className={iconSize} />
      ) : (
        <Volume2 className={iconSize} />
      )}
    </button>
  );
}
