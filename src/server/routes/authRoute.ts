import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, forgotPassword, resetPassword, verifyEmail, resendVerificationEmail, checkVerificationStatus } from '../controllers/authController';

const router = Router();

// Endpoint Verifikasi Email (Token dari URL)
router.get('/verify-email', verifyEmail);

// Endpoint Kirim Ulang Verifikasi
router.post('/resend-verification', resendVerificationEmail);

// Endpoint Cek Status Verifikasi (Polling)
router.get('/check-verification', checkVerificationStatus);

// Endpoint Lupa Password (Minta Kode)
router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Mohon isi email valid Anda').normalizeEmail()
  ],
  forgotPassword
);

// Endpoint Reset Password (Verifikasi Kode & Update)
router.post(
  '/reset-password',
  [
    body('email').isEmail().normalizeEmail(),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Kode harus 6 digit'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password baru minimal 8 karakter')
  ],
  resetPassword
);

// Endpoint Registrasi Pengguna Baru
router.post(
  '/register',
  [
    // Serangkaian aturan perlindungan dan sanitasi XSS (Cross Site Scripting)
    body('nama_lengkap')
      .notEmpty().withMessage('Nama lengkap wajib diisi')
      .trim()
      .escape(), // Konversi karakter HTML (seperti <script>) agar tidak aktif & aman masuk database
    body('email')
      .isEmail().withMessage('Format email tidak memenuhi standar penulisan')
      .normalizeEmail(), // Sanitasi case-sensitigity (Test@Gmail.com => test@gmail.com)
    body('password')
      .isLength({ min: 8 }).withMessage('Demi keamanan, panjang password minimal 8 karakter')
  ],
  register
);

// Endpoint Auth/Login
router.post(
  '/login',
  [
    body('email')
      .isEmail().withMessage('Mohon isi email valid Anda')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Anda lupa memasukkan kata sandi')
  ],
  login
);

export default router;
