import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { validationResult } from 'express-validator';
import { sendResetCodeEmail } from '../services/mailService.js';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable is missing! Set it in Settings > Secrets.');
    }
    return 'supersecret_development_key';
  }
  return secret;
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 1. Eksekusi validasi input menggunakan express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { nama_lengkap, email, password } = req.body;

    const userCheckResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheckResult.rows.length > 0) {
      res.status(409).json({ error: 'Email sudah terdaftar. Silakan gunakan email lain atau login.' });
      return;
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const insertResult = await pool.query(
      'INSERT INTO users (nama_lengkap, email, password_hash) VALUES ($1, $2, $3) RETURNING id, nama_lengkap, email',
      [nama_lengkap, email, password_hash]
    );

    const newUser = insertResult.rows[0];

    res.status(201).json({
      message: 'Registrasi berhasil',
      user: newUser
    });
  } catch (error: any) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body;

    const userResult = await pool.query(
      'SELECT id, email, password_hash, nama_lengkap, role FROM users WHERE email = $1', 
      [email]
    );
    
    if (userResult.rows.length === 0) {
      res.status(401).json({ error: 'Email atau kata sandi yang Anda masukkan salah.' });
      return;
    }

    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Email atau kata sandi yang Anda masukkan salah.' });
      return;
    }

    await pool.query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role }, 
      getJwtSecret(), 
      { expiresIn: '12h' } 
    );

    res.status(200).json({
      message: 'Berhasil login ke Dashboard',
      token, 
      user: {
        id: user.id,
        nama_lengkap: user.nama_lengkap,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      res.status(200).json({ message: 'Jika email terdaftar, kode verifikasi akan dikirim.' });
      return;
    }

    const userId = userResult.rows[0].id;
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString(); 
    const expires = new Date(Date.now() + 15 * 60 * 1000); 

    await pool.query(
      'UPDATE users SET reset_code = $1, reset_expires = $2 WHERE id = $3',
      [resetCode, expires, userId]
    );

    await sendResetCodeEmail(email, resetCode);

    res.status(200).json({ message: 'Kode verifikasi telah dikirim ke email Anda.' });
  } catch (error: any) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, code, newPassword } = req.body;

    const userResult = await pool.query(
      'SELECT id, reset_code, reset_expires FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      res.status(400).json({ error: 'Data tidak valid atau kode kadaluwarsa.' });
      return;
    }

    const user = userResult.rows[0];

    if (!user.reset_code || user.reset_code !== code || new Date() > new Date(user.reset_expires)) {
      res.status(400).json({ error: 'Kode verifikasi salah atau sudah kadaluwarsa.' });
      return;
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    await pool.query(
      'UPDATE users SET password_hash = $1, reset_code = NULL, reset_expires = NULL WHERE id = $2',
      [password_hash, user.id]
    );

    res.status(200).json({ message: 'Password berhasil diperbarui. Silakan login.' });
  } catch (error: any) {
    next(error);
  }
};
