import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import {
  uploadDocument,
  listDocuments,
  getDocument,
  deleteDocument,
} from '../controllers/documentController.js';

const router = Router();

router.post('/upload', upload.single('file'), uploadDocument);
router.get('/', listDocuments);
router.get('/:id', getDocument);
router.delete('/:id', deleteDocument);

export default router;
