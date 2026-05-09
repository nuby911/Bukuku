import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('🔥 Server Error:', err);
  
  // Custom error messages based on type
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Data yang dikirimkan tidak valid.' });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Sesi anda telah berakhir, silakan login kembali.' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Terjadi kesalahan sistem internal.'
  });
};
