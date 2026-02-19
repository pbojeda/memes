import { Router } from 'express';
import { validateCart } from '../presentation/controllers/cartController';

const router = Router();

// Public endpoint — no authMiddleware required
router.post('/validate', validateCart);

export default router;
