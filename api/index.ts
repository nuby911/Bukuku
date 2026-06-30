import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import authRoutes from '../src/server/routes/authRoute.js';
import transaksiRoutes from '../src/server/routes/transaksiRoute.js';
import adminRoutes from '../src/server/routes/adminRoute.js';
import { errorHandler } from '../src/server/middleware/errorMiddleware.js';
import { pool } from '../src/server/config/db.js';

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

// API Routes untuk Migrasi Database Aman di Vercel
app.get('/api/migrate', async (req, res) => {
  const { secret } = req.query;
  const systemSecret = process.env.JWT_SECRET;
  
  if (!systemSecret) {
    return res.status(500).json({
      status: 'error',
      pesan: 'JWT_SECRET belum diatur di environment variable server.'
    });
  }
  
  if (!secret || secret !== systemSecret) {
    return res.status(401).json({
      status: 'error',
      pesan: 'Akses ditolak. Parameter "secret" tidak cocok dengan JWT_SECRET.'
    });
  }

  try {
    const sqlPath = path.join(process.cwd(), 'database', 'schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Jalankan migrasi pembuatan tabel
    await pool.query(sql);
    
    // Seed default admin account
    const hash = await bcrypt.hash('12345678', 10);
    const adminCheck = await pool.query('SELECT * FROM users WHERE email = $1', ['admin@bukukas.com']);
    let adminCreated = false;
    
    if (adminCheck.rows.length === 0) {
      await pool.query(`
        INSERT INTO users (nama_lengkap, email, password_hash, role, is_verified)
        VALUES ('Super Admin', 'admin@bukukas.com', $1, 'super_admin', true)
      `, [hash]);
      adminCreated = true;
    }
    
    res.json({
      status: 'success',
      pesan: 'Migrasi database berhasil dijalankan di Vercel!',
      adminCreated
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      pesan: 'Gagal menjalankan migrasi database.',
      error: err.message || err
    });
  }
});

// API Route untuk memverifikasi user yang sudah ada secara manual & aman tanpa menghapus data
app.get('/api/verify-user', async (req, res) => {
  const { email, secret } = req.query;
  const systemSecret = process.env.JWT_SECRET;
  
  if (!systemSecret) {
    return res.status(500).json({
      status: 'error',
      pesan: 'JWT_SECRET belum diatur di environment variable server.'
    });
  }
  
  if (!secret || secret !== systemSecret) {
    return res.status(401).json({
      status: 'error',
      pesan: 'Akses ditolak. Parameter "secret" tidak cocok dengan JWT_SECRET.'
    });
  }

  if (!email) {
    return res.status(400).json({
      status: 'error',
      pesan: 'Parameter "email" wajib diisi.'
    });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET is_verified = true WHERE email = $1 RETURNING id, email, role, is_verified',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        pesan: `User dengan email "${email}" tidak ditemukan di database.`
      });
    }
    
    res.json({
      status: 'success',
      pesan: `Akun ${email} berhasil diverifikasi! Silakan coba login kembali.`,
      user: result.rows[0]
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      pesan: 'Gagal memverifikasi user.',
      error: err.message || err
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/transaksi', transaksiRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

export default app;
