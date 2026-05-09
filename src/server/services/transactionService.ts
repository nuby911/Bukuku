import { pool } from '../config/db.js';

export const getOrCreateKategori = async (userId: string, kategoriNama: string | undefined, tipe: 'masuk' | 'keluar'): Promise<string> => {
  const defaultCatName = tipe === 'masuk' ? 'Pemasukan Lainnya' : 'Pengeluaran Lainnya';
  const targetNama = kategoriNama || defaultCatName;

  // Cek apakah kategori sudah ada
  const catResult = await pool.query(
    'SELECT id FROM kategori_transaksi WHERE user_id = $1 AND nama_kategori = $2 AND tipe = $3',
    [userId, targetNama, tipe]
  );

  if (catResult.rows.length > 0) {
    return catResult.rows[0].id;
  }

  // Jika belum ada, buat baru
  const newCat = await pool.query(
    'INSERT INTO kategori_transaksi (user_id, nama_kategori, tipe) VALUES ($1, $2, $3) RETURNING id',
    [userId, targetNama, tipe]
  );
  
  return newCat.rows[0].id;
};
