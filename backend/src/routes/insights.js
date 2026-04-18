import { Router } from 'express';
import {
  summarizeDocument,
  summarizeAll,
  crossDocumentInsights,
  autoInsightFeed,
  knowledgeGaps,
} from '../controllers/insightController.js';

const router = Router();

router.get('/summary/all', summarizeAll);
router.get('/summary/:id', summarizeDocument);
router.get('/cross-document', crossDocumentInsights);
router.get('/auto-feed', autoInsightFeed);
router.get('/knowledge-gaps', knowledgeGaps);

export default router;
