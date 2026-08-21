import { Router } from 'express';
import {
  getQuestions,
  getActiveAssessment,
  startAssessment,
  saveProgress,
  submitAssessment,
  getResults,
  getResultById,
} from '../controllers/diagnostic.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// Protect all diagnostic routes
router.use(protect);

router.get('/questions', getQuestions);
router.get('/assessment/active', getActiveAssessment);
router.post('/assessment/start', startAssessment);
router.post('/assessment/save', saveProgress);
router.post('/assessment/submit', submitAssessment);
router.get('/results', getResults);
router.get('/results/:id', getResultById);

export default router;
