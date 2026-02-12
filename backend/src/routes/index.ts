import { Router } from 'express';
import healthRoutes from './healthRoutes';
import authRoutes from './authRoutes';
import productTypeRoutes from './productTypeRoutes';
import productRoutes from './productRoutes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/product-types', productTypeRoutes);
router.use('/products', productRoutes);

export default router;
