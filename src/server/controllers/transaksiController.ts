import { Response } from 'express';
import { pool } from '../config/db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { validationResult } from 'express-validator';
import { getOrCreateKategori } from '../services/transactionService.js';

export const createTransaksi = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
       res.status(400).json({ errors: errors.array() });
       return;
    }

    // MULTI-TENANT FATAL SECURITY: Identitas Client (User ID) _HARUS_ selalu kita periksa dari
    // Token yang sudah divalidasi server, bukan dari Body Request buatan client yang bisa di spoofing/inject.
    const userId = req.user?.id; 
    const { kategori_nama, tanggal, keterangan, tipe } = req.body;
    
    // Pembersihan input nominal (format ribuan seperti '1.000.000' dibersihkan)
    let { nominal } = req.body;
    let cleanNominalStr = nominal ? nominal.toString().replace(/[^0-9]/g, '') : '0';
    
    if (!/^[0-9]+$/.test(cleanNominalStr)) {
       res.status(400).json({ error: 'Format Nominal tidak valid, harus berisi angka.' });
       return;
    }
    
    const parsedNominal = BigInt(cleanNominalStr); // atau bisa juga Number/Decimal menyesuaikan schema
    if (parsedNominal <= 0n) {
       res.status(400).json({ error: 'Nominal harus lebih besar dari Rp 0.' });
       return;
    }

    // Upsert Kategori using Service
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
    console.error('Create Transaksi Controller Error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan back-end karena kegagalan database.' });
  }
};

export const getTransaksi = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 1. ISOLASI DATA MULTI-TENANT
    // Tanpa Filter ini, satu pengguna dapat meretas API (IDOR) dan melihat data dompet semua pendaftar.
    const userId = req.user?.id;
    
    // 2. PAGINATION DESTRUCTURING
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    // DDOS Shield: Batasi agar maksimal memuat 100 baris dalam sekali tembakan API
    const safeLimit = limit > 100 ? 100 : Math.max(1, limit);
    const offset = (Math.max(1, page) - 1) * safeLimit;

    // 3. OPTIONAL FILTERING UNTUK LAPORAN
    const { tipe, startDate, endDate, days } = req.query;

    const queryParams: any[] = [userId];
    let queryOptions = `WHERE t.user_id = $1`;
    let paramIndex = 2;

    if (tipe === 'masuk' || tipe === 'keluar') {
      queryOptions += ` AND t.tipe = $${paramIndex}`;
      queryParams.push(tipe);
      paramIndex++;
    }

    // Days filter logic (Quick Filter)
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

    // 4. EKSEKUSI PENGHITUNGAN TOTAL RECORD (Keperluan UI Page Numbers)
    const countResult = await pool.query(
      `SELECT COUNT(t.id) FROM transaksi t ${queryOptions}`,
      queryParams
    );
    const totalItems = parseInt(countResult.rows[0].count);

    // 5. QUERY DATA DENGAN JOIN (Untuk Menampilkan Label Kategori Secara Mudah di View) 
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

    // 6. KEMBALIKAN PAYLOAD HYBRID BESERTA METADATA
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
    console.error('Get Transaksi Controller Error:', error);
    res.status(500).json({ error: 'Peladen (Server) mendapati kegagalan me-render list Transaksi' });
  }
};
