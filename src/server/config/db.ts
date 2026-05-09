import { Pool } from 'pg';

// Kita menggunakan process.env.DATABASE_URL yang diatur melalui Settings > Secrets
const connectionString = process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false // Diperlukan Supabase
  },
  max: 20, 
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('Koneksi Database bermasalah pada client Node.js yang sedang idle', err);
});

