import { Router } from 'express';
import { getHealth } from '../presentation/controllers/healthController';

const router = Router();

router.get('/', getHealth);

export default router;
