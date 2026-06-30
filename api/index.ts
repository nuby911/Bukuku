import express from 'express';
import cors from 'cors';
import compression from 'compression';
import authRoutes from './src/server/routes/authRoute';
import transaksiRoutes from './src/server/routes/transaksiRoute';
import adminRoutes from './src/server/routes/adminRoute';
import { errorHandler } from './src/server/middleware/errorMiddleware';

const app = express();

app.set('trust proxy', true);

// Global Middlewares Setting
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV, pesan: "SaaS API Engine sedang berjalan" });
});

app.use('/api/auth', authRoutes);
app.use('/api/transaksi', transaksiRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

export default app;
