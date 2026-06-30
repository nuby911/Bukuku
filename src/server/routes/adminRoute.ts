import { Router } from 'express';
import { verifyToken, isAdmin } from '../middleware/authMiddleware';
import { getAllUsers, deleteUser } from '../controllers/adminController';
import { query } from 'express-validator';

const router = Router();

// Middleware: Hanya boleh diakses oleh yang sudah login (verifyToken) DAN role = super_admin (isAdmin)
router.use(verifyToken, isAdmin);

// Endpoint [GET] - API Audit User (Hanya Admin)
router.get(
  '/users',
  [
     query('page').optional().isInt({ min: 1 }).toInt(),
     query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
     query('search').optional().isString()
  ],
  getAllUsers
);

// Endpoint [DELETE] - API Hapus User
router.delete('/users/:id', deleteUser);

export default router;
