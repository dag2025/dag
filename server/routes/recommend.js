import express from 'express';
import { getOutfitRecommendations, postFeedback } from '../controllers/recommendController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All recommendation endpoints require authentication
router.use(authenticate);

router.get('/outfit', getOutfitRecommendations);
router.post('/feedback', postFeedback);

export default router;