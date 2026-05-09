import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Use a more subtle logging for production if needed, or keep it for backend monitoring
  const isProd = process.env.NODE_ENV === 'production';
  
  if (!isProd) {
    console.error('🔥 Server Error Detail:', err);
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Data yang dikirimkan tidak valid.' });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Sesi anda tidak valid, silakan login kembali.' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Sesi anda telah berakhir, silakan login kembali.' });
  }

  // Database Connection Errors
  if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.message.includes('getaddrinfo')) {
    return res.status(503).json({ error: 'Koneksi ke pangkalan data gagal. Layanan sedang dalam pemeliharaan.' });
  }

  const statusCode = err.status || 500;
  const message = (isProd && statusCode === 500) 
    ? 'Terjadi kesalahan sistem internal yang tidak terduga.' 
    : (err.message || 'Terjadi kesalahan sistem internal.');

  res.status(statusCode).json({ error: message });
};
