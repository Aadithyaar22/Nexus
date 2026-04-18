import multer from 'multer';

// Store in memory — files are small (docs/PDFs), and we parse immediately.
// For larger files or long-running jobs, swap to disk + background worker.
const storage = multer.memoryStorage();

const ALLOWED_MIME = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/octet-stream', // some browsers send .md as this
]);

export const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    const ok =
      ALLOWED_MIME.has(file.mimetype) ||
      /\.(pdf|txt|md|markdown)$/i.test(file.originalname);
    if (!ok) return cb(new Error(`Unsupported file type: ${file.mimetype}`));
    cb(null, true);
  },
});
