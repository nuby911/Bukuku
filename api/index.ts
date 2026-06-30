import express from 'express';
import cors from 'cors';
import compression from 'compression';
import authRoutes from '../src/server/routes/authRoute';
import transaksiRoutes from '../src/server/routes/transaksiRoute';
import adminRoutes from '../src/server/routes/adminRoute';
import { errorHandler } from '../src/server/middleware/errorMiddleware';
import { pool } from '../src/server/config/db';

const app = express();

app.set('trust proxy', true);

// Global Middlewares Setting
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes dengan Health Check Diagnostik Database
app.get('/api/health', async (req, res) => {
  try {
    const dbResult = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'ok', 
      database: 'connected',
      time: dbResult.rows[0].now,
      environment: process.env.NODE_ENV, 
      pesan: "SaaS API Engine dan Database berjalan dengan baik di Vercel!" 
    });
  } catch (dbError: any) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: dbError.message || dbError,
      code: dbError.code,
      pesan: "Koneksi ke database gagal dari Vercel.",
      hint: "Pastikan DATABASE_URL di Vercel diatur menggunakan format URL Publik (misalnya koneksi eksternal Supabase/Neon atau External IP Google Cloud SQL) dan database mengizinkan koneksi publik dari Vercel (IP 0.0.0.0/0)."
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/transaksi', transaksiRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

export default app;
