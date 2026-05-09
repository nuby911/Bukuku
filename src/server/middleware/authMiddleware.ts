import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_development_key';

// Mewariskan interface Request Express untuk menampung data user hasil dekripsi token
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    // Periksa eksistensi dan format token Bearer
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Akses Ditolak: Token tidak ditemukan atau format salah' });
      return;
    }

    const token = authHeader.split(' ')[1];
    
    // Evaluasi integritas & kedaluwarsa JWT secara sinkron
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string, role: string };
    
    // Inject identitas user ke object Request agar endpoint bisa menggunakannya secara aman
    req.user = decoded;
    
    // Lanjutkan ke handler endpoint selanjutnya
    next();
  } catch (error) {
    console.error('Verifikasi Token Gagal:', error instanceof Error ? error.message : error);
    res.status(403).json({ error: 'Akses Ditolak: Sesi anda tidak valid atau sudah kadaluarsa (Harap login kembali)' });
  }
};

// Middleware khusus untuk level Super Admin
export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // Posisikan setelah verifyToken, pastikan req.user sudah tersisip
  if (!req.user) {
    res.status(401).json({ error: 'Akses Ditolak: Sesi belum divalidasi' });
    return;
  }

  if (req.user.role !== 'super_admin') {
     res.status(403).json({ error: 'Sebuah insiden keamanan tercatat. Akses ini khusus untuk Administrator (super_admin).' });
     return;
  }

  next();
};
