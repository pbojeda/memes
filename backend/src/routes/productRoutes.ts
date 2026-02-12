import { Router } from 'express';
import { getProductDetail } from '../presentation/controllers/productController';

const router = Router();

// GET /api/products/:slug - Get product detail (public, no auth)
router.get('/:slug', getProductDetail);

export default router;
