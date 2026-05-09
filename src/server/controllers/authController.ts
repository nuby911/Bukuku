import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { validationResult } from 'express-validator';
import { sendResetCodeEmail } from '../services/mailService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_development_key';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Eksekusi validasi input menggunakan express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { nama_lengkap, email, password } = req.body;

    // 2. Proteksi Double-Registration (Mencegah Constraint Violation Murni)
    // Penggunaan $1 adalah "Parameterized Query". Ini memastikan postgres meng-escape value secara otomatis
    // dan menghapus celah serangan SQL Injection di level engine.
    const userCheckResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheckResult.rows.length > 0) {
      res.status(409).json({ error: 'Email sudah terdaftar. Silakan gunakan email lain atau login.' });
      return;
    }

    // 3. Cryptography - Hashing Password
    // SaltRounds=10 memberikan keseimbangan antara keamanan Bruteforce dan Performa.
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // 4. Persistence
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
    console.error('Register Controller Error:', error);
    if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN' || (error.message && error.message.includes('getaddrinfo'))) {
      res.status(500).json({ error: 'Koneksi database PostgreSQL gagal. Silakan periksa pengaturan DATABASE_URL di menu Settings > Secrets.' });
    } else {
      res.status(500).json({ error: 'Terjadi kesalahan internal server saat memproses registrasi' });
    }
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Validasi Input Dasar
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body;

    // 2. Ambil Profil Berdasarkan Email, termasuk ROLE
    const userResult = await pool.query(
      'SELECT id, email, password_hash, nama_lengkap, role FROM users WHERE email = $1', 
      [email]
    );
    
    // Gunakan generic error msg untuk mempersulit user-enumeration attack
    if (userResult.rows.length === 0) {
      res.status(401).json({ error: 'Email atau kata sandi yang Anda masukkan salah.' });
      return;
    }

    const user = userResult.rows[0];

    // 3. Komparasi Hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Email atau kata sandi yang Anda masukkan salah.' });
      return;
    }

    // 3b. Update Audit Log: last_login_at
    await pool.query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    // 4. Manajemen Sesi dengan JSON Web Token
    // Payload menyertakan public ID, email, dan role, tanpa data sensitif spt password
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '12h' } // Token akan hangus dalam 12 Jam demi keamanan SaaS
    );

    res.status(200).json({
      message: 'Berhasil login ke Dashboard',
      token, // Client idealnya menyimpan ini di HttpOnly Cookies (Jika Server-Render) atau LocalStorage/Memory
      user: {
        id: user.id,
        nama_lengkap: user.nama_lengkap,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('Login Controller Error:', error);
    if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN' || (error.message && error.message.includes('getaddrinfo'))) {
      res.status(500).json({ error: 'Koneksi database PostgreSQL gagal. Silakan periksa pengaturan DATABASE_URL di menu Settings > Secrets.' });
    } else {
      res.status(500).json({ error: 'Terjadi kesalahan sistem saat mencoba masuk' });
    }
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      // Kita tetap beri respon sukses demi privasi user (mencegah validasi email mana yg exist)
      res.status(200).json({ message: 'Jika email terdaftar, kode verifikasi akan dikirim.' });
      return;
    }

    const userId = userResult.rows[0].id;
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit random
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 menit

    await pool.query(
      'UPDATE users SET reset_code = $1, reset_expires = $2 WHERE id = $3',
      [resetCode, expires, userId]
    );

    await sendResetCodeEmail(email, resetCode);

    res.status(200).json({ message: 'Kode verifikasi telah dikirim ke email Anda.' });
  } catch (error: any) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ error: 'Gagal mengirim email reset password.' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
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
    console.error('Reset Password Error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat mereset password.' });
  }
};
