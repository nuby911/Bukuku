import { Pool } from 'pg';

// Kita menggunakan process.env.DATABASE_URL yang diatur melalui Settings > Secrets
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: DATABASE_URL environment variable is missing! Check Settings > Secrets.');
  }
}

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false // Diperlukan Supabase
  },
  max: 20, 
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error('Koneksi Database bermasalah pada client Node.js yang sedang idle', err);
  }
});

