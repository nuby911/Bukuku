import { Response, NextFunction } from 'express';
import { pool } from '../config/db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string || '';
    
    // Pagination offset
    const safeLimit = limit > 200 ? 200 : Math.max(1, limit);
    const offset = (Math.max(1, page) - 1) * safeLimit;

    let countQuery = 'SELECT COUNT(id) FROM users';
    let countValues: any[] = [];
    let usersQuery = `
      SELECT id, nama_lengkap, email, role, created_at, last_login_at 
      FROM users 
    `;
    let usersValues: any[] = [];
    let whereClause = '';

    if (search) {
      whereClause = ' WHERE nama_lengkap ILIKE $1 OR email ILIKE $1 ';
      countQuery += whereClause;
      countValues.push(`%${search}%`);
      
      usersQuery += whereClause;
      usersQuery += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3 ';
      usersValues = [`%${search}%`, safeLimit, offset];
    } else {
      usersQuery += ' ORDER BY created_at DESC LIMIT $1 OFFSET $2 ';
      usersValues = [safeLimit, offset];
    }

    const countResult = await pool.query(countQuery, countValues);
    const totalItems = parseInt(countResult.rows[0].count);

    const usersResult = await pool.query(usersQuery, usersValues);

    res.status(200).json({
      message: 'Daftar pengguna berhasil dimuat',
      data: usersResult.rows,
      meta: {
        totalItems,
        currentPage: page,
        totalPages: Math.ceil(totalItems / safeLimit),
        itemsPerPage: safeLimit,
        hasNextPage: page < Math.ceil(totalItems / safeLimit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.params.id;
    
    if (userId === req.user?.id) {
       res.status(400).json({ error: 'Anda tidak dapat menghapus akun Anda sendiri.' });
       return;
    }

    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
      return;
    }

    if (userResult.rows[0].role === 'super_admin') {
      res.status(403).json({ error: 'Anda tidak dapat menghapus akun sesama Super Admin.' });
      return;
    }

    await pool.query('DELETE FROM transaksi WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM kategori_transaksi WHERE user_id = $1', [userId]);
    
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    
    res.status(200).json({ message: 'Pengguna dan seluruh datanya berhasil dihapus secara permanen.' });
  } catch (error) {
    next(error);
  }
};

