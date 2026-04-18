'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export const Shimmer = ({ className = '' }: { className?: string }) => (
  <div
    className={`rounded-md bg-gradient-to-r from-bg-hover via-bg-card to-bg-hover bg-[length:1000px_100%] animate-shimmer ${className}`}
  />
);

export const SpinnerCard = ({
  label = 'Thinking...',
  subtitle,
}: {
  label?: string;
  subtitle?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center gap-3 rounded-xl border border-border bg-bg-card p-5"
  >
    <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-accent/10">
      <Loader2 className="h-4 w-4 animate-spin text-accent-hover" />
      <div className="absolute inset-0 animate-pulse-slow rounded-lg bg-accent/10" />
    </div>
    <div>
      <div className="text-sm font-medium">{label}</div>
      {subtitle && <div className="text-xs text-fg-subtle">{subtitle}</div>}
    </div>
  </motion.div>
);

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
    <div className="grid h-14 w-14 place-items-center rounded-2xl border border-border bg-bg-card">
      <Icon className="h-6 w-6 text-fg-muted" />
    </div>
    <div>
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-xs text-fg-subtle">{description}</div>
    </div>
    {action}
  </div>
);
