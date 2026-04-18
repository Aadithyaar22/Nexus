'use client';

import { useState, useRef, DragEvent } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '@/store/useStore';
import { cn, formatBytes } from '@/lib/utils';

interface Props {
  onClose: () => void;
}

export default function DocumentUpload({ onClose }: Props) {
  const uploadDocument = useStore((s) => s.uploadDocument);
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (list: FileList | File[]) => {
    const valid = Array.from(list).filter((f) => {
      const ok = /\.(pdf|txt|md|markdown)$/i.test(f.name);
      if (!ok) toast.error(`${f.name}: unsupported type`);
      if (f.size > 20 * 1024 * 1024) {
        toast.error(`${f.name}: max 20 MB`);
        return false;
      }
      return ok;
    });
    setFiles((prev) => [...prev, ...valid]);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  const runUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      if (done.has(file.name)) continue;
      try {
        await uploadDocument(file, (pct) =>
          setProgress((p) => ({ ...p, [file.name]: pct }))
        );
        setDone((d) => new Set(d).add(file.name));
        toast.success(`${file.name} processed`);
      } catch (err: any) {
        toast.error(`${file.name}: ${err.message}`);
      }
    }
    setUploading(false);
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
          <div>
            <div className="text-sm font-semibold">Upload documents</div>
            <div className="text-xs text-fg-subtle">PDF, TXT, or Markdown · Max 20 MB</div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-fg-muted hover:bg-bg-hover hover:text-fg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-10 transition-all',
              dragging
                ? 'border-accent bg-accent/5'
                : 'border-border hover:border-border-hover hover:bg-bg-hover/50'
            )}
          >
            <Upload
              className={cn(
                'h-8 w-8 transition-colors',
                dragging ? 'text-accent' : 'text-fg-subtle'
              )}
            />
            <div className="text-sm font-medium text-fg">
              Drop files here or click to browse
            </div>
            <div className="text-xs text-fg-subtle">
              We'll chunk, embed, and index them automatically
            </div>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,.txt,.md,.markdown"
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((f) => {
                const pct = progress[f.name] ?? 0;
                const isDone = done.has(f.name);
                return (
                  <div
                    key={f.name}
                    className="flex items-center gap-3 rounded-lg border border-border bg-bg-elevated p-3"
                  >
                    <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-md bg-bg-hover">
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : uploading && pct < 100 ? (
                        <Loader2 className="h-4 w-4 animate-spin text-accent" />
                      ) : (
                        <FileText className="h-4 w-4 text-fg-muted" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{f.name}</div>
                      <div className="text-[11px] text-fg-subtle">{formatBytes(f.size)}</div>
                      {uploading && pct > 0 && pct < 100 && (
                        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-bg">
                          <div
                            className="h-full bg-accent transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-5 flex items-center justify-end gap-2">
            <button onClick={onClose} className="btn-ghost">
              {done.size ? 'Close' : 'Cancel'}
            </button>
            <button
              onClick={runUpload}
              disabled={!files.length || uploading}
              className="btn-primary"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload {files.length > 0 && `(${files.length})`}
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
