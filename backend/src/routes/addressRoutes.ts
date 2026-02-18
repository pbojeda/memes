import { Router } from 'express';
import {
  listAddresses,
  createAddress,
  getAddressById,
  updateAddress,
  deleteAddress,
} from '../presentation/controllers/addressController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// All address routes require authentication
router.get('/', authMiddleware, listAddresses);
router.post('/', authMiddleware, createAddress);
router.get('/:addressId', authMiddleware, getAddressById);
router.patch('/:addressId', authMiddleware, updateAddress);
router.delete('/:addressId', authMiddleware, deleteAddress);

export default router;
