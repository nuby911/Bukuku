import { Response, NextFunction } from 'express';
import { pool } from '../config/db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { validationResult } from 'express-validator';
import { getOrCreateKategori } from '../services/transactionService.js';

export const createTransaksi = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
       res.status(400).json({ errors: errors.array() });
       return;
    }

    const userId = req.user?.id; 
    const { kategori_nama, tanggal, keterangan, tipe } = req.body;
    
    let { nominal } = req.body;
    let cleanNominalStr = nominal ? nominal.toString().replace(/[^0-9]/g, '') : '0';
    
    if (!/^[0-9]+$/.test(cleanNominalStr)) {
       res.status(400).json({ error: 'Format Nominal tidak valid, harus berisi angka.' });
       return;
    }
    
    const parsedNominal = BigInt(cleanNominalStr); 
    if (parsedNominal <= 0n) {
       res.status(400).json({ error: 'Nominal harus lebih besar dari Rp 0.' });
       return;
    }

    const kategori_id = await getOrCreateKategori(userId!, kategori_nama, tipe);

    const insertResult = await pool.query(
      `INSERT INTO transaksi (user_id, kategori_id, tanggal, nominal, keterangan, tipe) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, tanggal, nominal, tipe, keterangan`,
      [userId, kategori_id, tanggal, parsedNominal.toString(), keterangan, tipe]
    );

    res.status(201).json({
      message: 'Transaksi pencatatan sukses disimpan',
      data: insertResult.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

export const getTransaksi = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const safeLimit = limit > 100 ? 100 : Math.max(1, limit);
    const offset = (Math.max(1, page) - 1) * safeLimit;

    const { tipe, startDate, endDate, days } = req.query;

    const queryParams: any[] = [userId];
    let queryOptions = `WHERE t.user_id = $1`;
    let paramIndex = 2;

    if (tipe === 'masuk' || tipe === 'keluar') {
      queryOptions += ` AND t.tipe = $${paramIndex}`;
      queryParams.push(tipe);
      paramIndex++;
    }

    if (days && !startDate && !endDate) {
      const daysCount = parseInt(days as string);
      const today = new Date();
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - (daysCount - 1));
      
      const startDateStr = pastDate.toISOString().split('T')[0];
      const endDateStr = today.toISOString().split('T')[0];
      
      queryOptions += ` AND t.tanggal BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      queryParams.push(startDateStr, endDateStr);
      paramIndex += 2;
    } else {
      if (startDate && endDate) {
         queryOptions += ` AND t.tanggal BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
         queryParams.push(startDate, endDate);
         paramIndex += 2;
      } else if (startDate) {
         queryOptions += ` AND t.tanggal >= $${paramIndex}`;
         queryParams.push(startDate);
         paramIndex++;
      } else if (endDate) {
         queryOptions += ` AND t.tanggal <= $${paramIndex}`;
         queryParams.push(endDate);
         paramIndex++;
      }
    }

    const countResult = await pool.query(
      `SELECT COUNT(t.id) FROM transaksi t ${queryOptions}`,
      queryParams
    );
    const totalItems = parseInt(countResult.rows[0].count);

    const dataQuery = `
      SELECT t.id, t.tanggal, t.nominal, t.keterangan, t.tipe, k.nama_kategori 
      FROM transaksi t
      LEFT JOIN kategori_transaksi k ON t.kategori_id = k.id
      ${queryOptions}
      ORDER BY t.tanggal DESC, t.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(safeLimit, offset);
    
    const dataResult = await pool.query(dataQuery, queryParams);

    res.status(200).json({
      message: 'Transaksi berhasil dimuat',
      data: dataResult.rows,
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

export const getTransaksiSummary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { startDate, endDate, days } = req.query;

    const queryParams: any[] = [userId];
    let queryOptions = `WHERE user_id = $1`;
    let paramIndex = 2;

    if (days && !startDate && !endDate) {
      const daysCount = parseInt(days as string);
      const today = new Date();
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - (daysCount - 1));
      
      const startDateStr = pastDate.toISOString().split('T')[0];
      const endDateStr = today.toISOString().split('T')[0];
      
      queryOptions += ` AND tanggal BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      queryParams.push(startDateStr, endDateStr);
      paramIndex += 2;
    } else {
      if (startDate && endDate) {
         queryOptions += ` AND tanggal BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
         queryParams.push(startDate, endDate);
      } else if (startDate) {
         queryOptions += ` AND tanggal >= $${paramIndex}`;
         queryParams.push(startDate);
      } else if (endDate) {
         queryOptions += ` AND tanggal <= $${paramIndex}`;
         queryParams.push(endDate);
      }
    }

    const summaryQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN tipe = 'masuk' THEN nominal::numeric ELSE 0 END), 0) as total_masuk,
        COALESCE(SUM(CASE WHEN tipe = 'keluar' THEN nominal::numeric ELSE 0 END), 0) as total_keluar
      FROM transaksi
      ${queryOptions}
    `;

    const result = await pool.query(summaryQuery, queryParams);
    
    res.status(200).json({
      totalMasuk: parseFloat(result.rows[0].total_masuk),
      totalKeluar: parseFloat(result.rows[0].total_keluar)
    });
  } catch (error) {
    next(error);
  }
};
