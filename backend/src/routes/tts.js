import { Router } from 'express';
import { synthesize, status } from '../controllers/ttsController.js';

const router = Router();

router.get('/status', status);
router.post('/elevenlabs', synthesize);

export default router;
