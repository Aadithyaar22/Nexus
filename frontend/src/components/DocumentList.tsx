'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Trash2, Upload, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '@/store/useStore';
import { cn, formatBytes } from '@/lib/utils';
import DocumentUpload from './DocumentUpload';

export default function DocumentList() {
  const documents = useStore((s) => s.documents);
  const selectedDocIds = useStore((s) => s.selectedDocIds);
  const toggleDocSelection = useStore((s) => s.toggleDocSelection);
  const deleteDocument = useStore((s) => s.deleteDocument);
  const loadingDocs = useStore((s) => s.loadingDocs);
  const [uploadOpen, setUploadOpen] = useState(false);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Delete this document?')) return;
    try {
      await deleteDocument(id);
      toast.success('Document deleted');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between px-5 pt-2 pb-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
          Documents {documents.length > 0 && `(${documents.length})`}
        </h3>
        <button
          onClick={() => setUploadOpen(true)}
          className="flex h-6 w-6 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-bg-hover hover:text-fg"
          title="Upload document"
        >
          <Upload className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
        {loadingDocs && documents.length === 0 && (
          <div className="flex items-center justify-center py-6 text-fg-subtle">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}

        {!loadingDocs && documents.length === 0 && (
          <button
            onClick={() => setUploadOpen(true)}
            className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed border-border py-6 text-center text-fg-subtle transition-colors hover:border-accent/50 hover:text-fg-muted"
          >
            <Upload className="h-5 w-5" />
            <div className="text-xs">Upload your first document</div>
          </button>
        )}

        <AnimatePresence initial={false}>
          {documents.map((doc) => {
            const selected = selectedDocIds.includes(doc.id);
            return (
              <motion.button
                key={doc.id}
                layout
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                onClick={() => toggleDocSelection(doc.id)}
                className={cn(
                  'group flex w-full items-start gap-2.5 rounded-lg p-2 text-left transition-all duration-150',
                  selected
                    ? 'bg-accent/10 ring-1 ring-accent/40'
                    : 'hover:bg-bg-hover'
                )}
              >
                <div
                  className={cn(
                    'mt-0.5 grid h-6 w-6 flex-shrink-0 place-items-center rounded-md transition-colors',
                    selected ? 'bg-accent/20' : 'bg-bg-hover'
                  )}
                >
                  {doc.status === 'processing' ? (
                    <Loader2 className="h-3 w-3 animate-spin text-fg-muted" />
                  ) : doc.status === 'failed' ? (
                    <AlertCircle className="h-3 w-3 text-danger" />
                  ) : selected ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-accent-hover" />
                  ) : (
                    <FileText className="h-3 w-3 text-fg-muted" />
                  )}
                </div>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="truncate text-xs font-medium text-fg">{doc.title}</div>
                  <div className="flex items-center gap-1.5 text-[10px] text-fg-subtle">
                    <span>{formatBytes(doc.size)}</span>
                    <span>·</span>
                    <span>{doc.chunkCount} chunks</span>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(e, doc.id)}
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md opacity-0 transition-all hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {uploadOpen && <DocumentUpload onClose={() => setUploadOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
