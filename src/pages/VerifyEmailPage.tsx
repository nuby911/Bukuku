import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Token verifikasi tidak ditemukan.');
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message);
        } else {
          setStatus('error');
          setMessage(data.error || 'Terjadi kesalahan saat memverifikasi email.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Gagal terhubung ke server.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100 text-center"
      >
        {status === 'loading' && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Loader2 size={64} className="text-blue-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Memverifikasi Email...</h1>
            <p className="text-slate-500">Mohon tunggu sebentar, kami sedang memproses permintaan Anda.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                <CheckCircle2 size={40} />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-900">Verifikasi Berhasil!</h1>
              <p className="text-slate-500">{message}</p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-[0.98]"
            >
              Lanjut ke Login
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-600">
                <XCircle size={40} />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-900">Verifikasi Gagal</h1>
              <p className="text-slate-500">{message}</p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-[0.98]"
              >
                Kembali ke Login
              </button>
              <Link
                to="/"
                className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
