import { Router } from 'express';
import healthRoutes from './healthRoutes';
import authRoutes from './authRoutes';
import productTypeRoutes from './productTypeRoutes';
import productRoutes from './productRoutes';
import uploadRoutes from './uploadRoutes';
import reviewRoutes from './reviewRoutes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/product-types', productTypeRoutes);
router.use('/products', productRoutes);
router.use('/upload', uploadRoutes);
router.use('/reviews', reviewRoutes);

export default router;
