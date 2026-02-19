import { Router } from 'express';
import { validatePromoCode } from '../presentation/controllers/promoCodeController';

const router = Router();

// Public endpoint — no authMiddleware required
router.post('/validate', validatePromoCode);

export default router;
