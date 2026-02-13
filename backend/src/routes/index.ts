import { Router } from 'express';
import healthRoutes from './healthRoutes';
import authRoutes from './authRoutes';
import productTypeRoutes from './productTypeRoutes';
import productRoutes from './productRoutes';
import uploadRoutes from './uploadRoutes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/product-types', productTypeRoutes);
router.use('/products', productRoutes);
router.use('/upload', uploadRoutes);

export default router;
