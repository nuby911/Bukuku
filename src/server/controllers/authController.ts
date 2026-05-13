import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { validationResult } from 'express-validator';
import { sendResetCodeEmail, sendVerificationEmail } from '../services/mailService.js';
import crypto from 'crypto';

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

const getBaseUrl = (req: Request) => {
  if (process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL') {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}`;
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

    const userCheckResult = await pool.query('SELECT id, is_verified FROM users WHERE email = $1', [email]);
    
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 jam
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    let newUser;

    if (userCheckResult.rows.length > 0) {
      const existingUser = userCheckResult.rows[0];
      
      if (existingUser.is_verified) {
        res.status(409).json({ error: 'Email sudah terdaftar. Silakan gunakan email lain atau login.' });
        return;
      }

      // Jika belum terverifikasi, kita "timpa" data lamanya (registrasi ulang)
      const updateResult = await pool.query(
        'UPDATE users SET nama_lengkap = $1, password_hash = $2, verification_token = $3, verification_expires = $4, last_verification_sent_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id, nama_lengkap, email',
        [nama_lengkap, password_hash, verificationToken, verificationExpires, existingUser.id]
      );
      newUser = updateResult.rows[0];
    } else {
      // Jika benar-benar baru
      const insertResult = await pool.query(
        'INSERT INTO users (nama_lengkap, email, password_hash, verification_token, verification_expires, last_verification_sent_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING id, nama_lengkap, email',
        [nama_lengkap, email, password_hash, verificationToken, verificationExpires]
      );
      newUser = insertResult.rows[0];
    }

    // Kirim Email Verifikasi
    const baseUrl = getBaseUrl(req);
    
    try {
      await sendVerificationEmail(email, verificationToken, baseUrl);
    } catch (mailError) {
      console.error('Gagal mengirim email verifikasi:', mailError);
      // Tetap lanjutkan registrasi tapi berikan warning atau handle sesuai kebijakan
    }

    res.status(201).json({
      message: 'Registrasi berhasil. Silakan cek email Anda untuk memverifikasi akun.',
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
      'SELECT id, email, password_hash, nama_lengkap, role, is_verified FROM users WHERE email = $1', 
      [email]
    );
    
    if (userResult.rows.length === 0) {
      res.status(401).json({ error: 'Email atau kata sandi yang Anda masukkan salah.' });
      return;
    }

    const user = userResult.rows[0];

    if (!user.is_verified) {
      res.status(403).json({ 
        error: 'Akun Anda belum diverifikasi.', 
        code: 'EMAIL_NOT_VERIFIED' 
      });
      return;
    }

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

export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token) {
      res.status(400).json({ error: 'Token verifikasi tidak ditemukan.' });
      return;
    }

    const userResult = await pool.query(
      'SELECT id, verification_expires FROM users WHERE verification_token = $1 AND is_verified = FALSE',
      [token]
    );

    if (userResult.rows.length === 0) {
      res.status(400).json({ error: 'Token tidak valid atau akun sudah terverifikasi.' });
      return;
    }

    const user = userResult.rows[0];

    if (new Date() > new Date(user.verification_expires)) {
      res.status(400).json({ error: 'Token verifikasi telah kadaluwarsa. Silakan lakukan registrasi ulang atau minta link baru.' });
      return;
    }

    // Update status user jadi terverifikasi
    await pool.query(
      'UPDATE users SET is_verified = TRUE, verification_token = NULL, verification_expires = NULL WHERE id = $1',
      [user.id]
    );

    // Redirect atau berikan response sukses
    // Untuk API, kita berikan response sukses. Nanti frontend akan menangani tampilannya.
    res.status(200).json({ 
      message: 'Email berhasil diverifikasi! Sekarang Anda dapat login.' 
    });
  } catch (error: any) {
    next(error);
  }
};

export const resendVerificationEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email diperlukan.' });
      return;
    }

    const userResult = await pool.query(
      'SELECT id, is_verified, last_verification_sent_at FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
      return;
    }

    const user = userResult.rows[0];

    if (user.is_verified) {
      res.status(400).json({ error: 'Akun ini sudah terverifikasi.' });
      return;
    }

    // Rate limit: 2 menit
    if (user.last_verification_sent_at) {
      const lastSent = new Date(user.last_verification_sent_at).getTime();
      const now = Date.now();
      const diffSeconds = Math.floor((now - lastSent) / 1000);
      
      if (diffSeconds < 120) {
        const remaining = 120 - diffSeconds;
        res.status(429).json({ 
          error: `Silakan tunggu ${remaining} detik lagi sebelum mengirim ulang email.` 
        });
        return;
      }
    }

    // Generate New Token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 jam

    await pool.query(
      'UPDATE users SET verification_token = $1, verification_expires = $2, last_verification_sent_at = CURRENT_TIMESTAMP WHERE id = $3',
      [verificationToken, verificationExpires, user.id]
    );

    const baseUrl = getBaseUrl(req);

    try {
      await sendVerificationEmail(email, verificationToken, baseUrl);
    } catch (mailError) {
      console.error('Gagal kirim ulang email verifikasi:', mailError);
    }

    res.status(200).json({ 
      message: 'Email verifikasi telah dikirim ulang. Silakan cek inbox Anda.' 
    });
  } catch (error: any) {
    next(error);
  }
};

export const checkVerificationStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.query;

    if (!email) {
      res.status(400).json({ error: 'Email diperlukan.' });
      return;
    }

    const userResult = await pool.query(
      'SELECT is_verified FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
      return;
    }

    res.status(200).json({ 
      is_verified: userResult.rows[0].is_verified 
    });
  } catch (error: any) {
    next(error);
  }
};
