import { Router } from 'express';
import { validateCart } from '../presentation/controllers/cartController';
import { calculateOrderTotal } from '../presentation/controllers/orderTotalController';

const router = Router();

// Public endpoints — no authMiddleware required
router.post('/validate', validateCart);
router.post('/calculate', calculateOrderTotal);

export default router;
