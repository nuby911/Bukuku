import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import compression from 'compression';
import authRoutes from './src/server/routes/authRoute.js';
import transaksiRoutes from './src/server/routes/transaksiRoute.js';
import adminRoutes from './src/server/routes/adminRoute.js';
import { errorHandler } from './src/server/middleware/errorMiddleware.js';

async function startServer() {
  const app = express();
  app.set('trust proxy', true);
  // PORT adapts to environment for Cloud Run compatibility
  const PORT = Number(process.env.PORT) || 3000;

  // Global Middlewares Setting
  app.use(compression()); // Compress all responses
  app.use(cors());
  app.use(express.json()); // Built-in parsing form & body API
  app.use(express.urlencoded({ extended: true }));

  // API Routes / Application Routing Logic 
  // Diposisikan sebelum middleware VITE agar API tidak ditabrak oleh routing Frontend
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', environment: process.env.NODE_ENV, pesan: "SaaS API Engine sedang berjalan" });
  });

  // Melakukan 'Mounting' routing Auth dan Transaksi sebagai modular API Endpoint
  app.use('/api/auth', authRoutes);
  app.use('/api/transaksi', transaksiRoutes);
  app.use('/api/admin', adminRoutes);
  app.use(errorHandler);

  // Vite Rendering Config: Memastikan Full-Stack Environment AI Studio
  if (process.env.NODE_ENV !== 'production') {
    // Mode Dev: Express menjadi proxy Vite HMR untuk SPA React
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Mode Production: Node.js melayani static-built dari Vite index.html
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Menginkubasi Express Server
  app.listen(PORT, '0.0.0.0', () => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`aturlah.id (Dev) Backend Server running on http://localhost:${PORT}`);
    }
  });
}

startServer();
