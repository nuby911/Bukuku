import dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';

// Kita menggunakan process.env.DATABASE_URL yang diatur melalui Settings > Secrets
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('⚠️ GAGAL MEMUAT DATABASE_URL: Variabel lingkungan DATABASE_URL tidak ditemukan. Pastikan Anda mengaturnya di Vercel Settings > Environment Variables.');
}

export const pool = new Pool({
  connectionString: connectionString || undefined,
  ssl: connectionString ? {
    rejectUnauthorized: false // Diperlukan Supabase / Neon
  } : undefined,
  max: 20, 
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error('Koneksi Database bermasalah pada client Node.js yang sedang idle', err);
  }
});

