import { Router } from 'express';
import {
  conceptBattle,
  knowledgeFusion,
  confusionDetector,
} from '../controllers/advancedController.js';

const router = Router();

router.post('/concept-battle', conceptBattle);
router.post('/knowledge-fusion', knowledgeFusion);
router.get('/confusion-detector', confusionDetector);

export default router;
