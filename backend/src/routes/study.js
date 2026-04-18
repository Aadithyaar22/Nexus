import { Router } from 'express';
import {
  generateFlashcards,
  generateMCQs,
  generateExamQuestions,
} from '../controllers/studyController.js';

const router = Router();

router.post('/flashcards', generateFlashcards);
router.post('/mcqs', generateMCQs);
router.post('/exam-questions', generateExamQuestions);

export default router;
