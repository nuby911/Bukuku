import { Router } from 'express';
import { body, query } from 'express-validator';
import { verifyToken } from '../middleware/authMiddleware.js';
import { createTransaksi, getTransaksi, getTransaksiSummary, updateTransaksi, deleteTransaksi } from '../controllers/transaksiController.js';

const router = Router();
// ...
router.use(verifyToken);

// Endpoint [GET] - Ambil Ringkasan Saldo (Pemasukan, Pengeluaran)
router.get(
  '/summary',
  [
    query('startDate').optional().matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/).escape(),
    query('endDate').optional().matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/).escape(),
    query('days').optional().isInt({ min: 1 }).toInt().escape(),
  ],
  getTransaksiSummary
);

// Endpoint [POST] - Input Transaksi Baru
router.post(
  '/',
  [
    body('kategori_nama').optional().isString().trim().escape().withMessage('Kategori harus berupa teks'),
    body('tanggal')
      .isISO8601().withMessage('Tanggal transaksi wajib berformat ISO 8601 (YYYY-MM-DD)')
      .escape(),
    body('nominal')
      .notEmpty().withMessage('Nominal wajib diisi')
      .custom((value) => {
        // Hapus semua karakter non-angka
        const cleanedValue = value.toString().replace(/[^0-9]/g, '');
        // Pastikan hanya angka dan tidak kosong, lalu buat check agar nilainya gt 0
        if (!/^[0-9]+$/.test(cleanedValue) || Number(cleanedValue) <= 0) {
          throw new Error('Nominal harus berupa angka lebih besar dari Rp 0');
        }
        return true;
      }),
    body('keterangan')
      .optional()
      .isString()
      .trim()
      .escape(), // Menetralisir input payload berbahaya
    body('tipe')
      .isIn(['masuk', 'keluar']).withMessage('Tipe arus kas keliru. Gunakan: "masuk" / "keluar"')
  ],
  createTransaksi
);

// Endpoint [PUT] - Update Transaksi
router.put(
  '/:id',
  [
    body('kategori_nama').optional().isString().trim().escape().withMessage('Kategori harus berupa teks'),
    body('tanggal')
      .isISO8601().withMessage('Tanggal transaksi wajib berformat ISO 8601 (YYYY-MM-DD)')
      .escape(),
    body('nominal')
      .notEmpty().withMessage('Nominal wajib diisi')
      .custom((value) => {
        const cleanedValue = value.toString().replace(/[^0-9]/g, '');
        if (!/^[0-9]+$/.test(cleanedValue) || Number(cleanedValue) <= 0) {
          throw new Error('Nominal harus berupa angka lebih besar dari Rp 0');
        }
        return true;
      }),
    body('keterangan')
      .optional()
      .isString()
      .trim()
      .escape(),
    body('tipe')
      .isIn(['masuk', 'keluar']).withMessage('Tipe arus kas keliru. Gunakan: "masuk" / "keluar"')
  ],
  updateTransaksi
);

// Endpoint [DELETE] - Hapus Transaksi
router.delete('/:id', deleteTransaksi);

// Endpoint [GET] - Ambil Laporan Semua Transaksi
router.get(
  '/', 
  [
     query('page').optional().isInt({ min: 1 }).toInt(),
     query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
     query('tipe').optional().isIn(['masuk', 'keluar']).escape(),
     query('startDate').optional().matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/).withMessage('Format tanggal mulai tidak valid (YYYY-MM-DD)').escape(),
     query('endDate').optional().matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/).withMessage('Format tanggal akhir tidak valid (YYYY-MM-DD)').escape(),
     query('days').optional().isInt({ min: 1, max: 3650 }).toInt().escape(),
  ],
  getTransaksi
);

export default router;
