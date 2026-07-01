import dotenv from 'dotenv';
dotenv.config();

import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import app from './api/index.js';

const PORT = Number(process.env.PORT) || 3000;

// Vite Rendering Config: Memastikan Full-Stack Environment AI Studio
if (process.env.NODE_ENV !== 'production') {
  // Mode Dev: Express menjadi proxy Vite HMR untuk SPA React
  async function setupVite() {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`aturlah.id (Dev) Backend Server running on http://localhost:${PORT}`);
    });
  }
  setupVite();
} else {
  // Mode Production: Node.js melayani static-built dari Vite index.html
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`aturlah.id (Prod) Backend Server running on http://localhost:${PORT}`);
  });
}
