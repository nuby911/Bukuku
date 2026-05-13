import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Wallet, Loader2, ArrowLeft, Globe, Mail, RefreshCw, CheckCircle, User, Lock } from 'lucide-react';
import { authTranslations } from '../constants/authTranslations';

export default function LoginPage({ onAuthSuccess }: { onAuthSuccess: (user: any, token: string) => void }) {
  const [lang, setLang] = useState<'id' | 'en'>('id');
  const t = authTranslations[lang];

  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';

  const [authState, setAuthState] = useState<'login' | 'register' | 'forgot' | 'reset' | 'waiting'>(initialMode);
  
  const [nama_lengkap, setNamaLengkap] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<React.ReactNode>('');
  const [success, setSuccess] = useState<React.ReactNode>('');
  
  // Background polling for verification
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (authState === 'waiting' && email) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/auth/check-verification?email=${email}`);
          const contentType = res.headers.get("content-type");
          if (res.ok && contentType && contentType.includes("application/json")) {
            const data = await res.json();
            if (data.is_verified) {
              setAuthState('login');
              setSuccess('Email berhasil diverifikasi! Silakan masuk.');
              setError('');
            }
          }
        } catch (e) {
          // Silent fail for polling
        }
      }, 5000); // Check every 5 seconds
    }
    return () => clearInterval(interval);
  }, [authState, email]);

  // Cooldown timer logic
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    let endpoint = '';
    let payload = {};

    if (authState === 'register') {
      endpoint = '/api/auth/register';
      payload = { nama_lengkap, email, password };
    } else if (authState === 'login') {
      endpoint = '/api/auth/login';
      payload = { email, password };
    } else if (authState === 'forgot') {
      endpoint = '/api/auth/forgot-password';
      payload = { email };
    } else if (authState === 'reset') {
      endpoint = '/api/auth/reset-password';
      payload = { email, code, newPassword: password };
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        // Fallback for non-json responses (like 404 or 500 html pages)
        throw new Error('email belum di verifikasi');
      }

      if (!response.ok) {
        if (data.code === 'EMAIL_NOT_VERIFIED') {
          setAuthState('waiting');
          setCooldown(120);
          setError(data.error);
          return;
        }
        if (data.errors && data.errors.length > 0) {
          throw new Error(data.errors[0].msg);
        }
        throw new Error(data.error || t.sys_error);
      }

      if (authState === 'register') {
        setAuthState('waiting');
        setCooldown(120);
        setPassword('');
        setSuccess(data.message || t.register_success);
      } else if (authState === 'login') {
        onAuthSuccess(data.user, data.token);
        navigate('/dashboard');
      } else if (authState === 'forgot') {
        setAuthState('reset');
        setSuccess(data.message);
      } else if (authState === 'reset') {
        setAuthState('login');
        setPassword('');
        setCode('');
        setSuccess(data.message);
      }
    } catch (err: any) {
      setError(err.message || t.conn_error);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const resData = await res.json();
        if (res.ok) {
          setSuccess(resData.message);
          setCooldown(120);
        } else {
          setError(resData.error);
        }
      } else {
        setError('email belum di verifikasi');
      }
    } catch (e) {
      setError(t.conn_error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Sticky Top Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 w-full px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <Wallet size={16} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">aturlah.id</span>
          </div>
          <button 
            onClick={() => setLang(lang === 'id' ? 'en' : 'id')} 
            className="text-xs font-semibold px-3 py-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-colors rounded-lg flex items-center gap-1 border border-slate-200"
          >
            <Globe size={14} /> {lang === 'id' ? 'EN' : 'ID'}
          </button>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-2xl border border-slate-100 w-full max-w-md relative">
          {authState === 'waiting' ? (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 animate-pulse">
                  <Mail size={40} />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Cek Email Kamu!</h2>
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium rounded-xl mb-4">
                  {success || t.verify_pending}
                </div>
                <p className="text-slate-500 text-sm">
                  Kami telah mengirimkan link verifikasi ke:
                </p>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm font-mono text-slate-600 break-all select-all">
                  {email}
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading || cooldown > 0}
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50 flex flex-col items-center justify-center gap-1"
                >
                  <div className="flex items-center gap-2">
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={18} className={cooldown > 0 ? 'opacity-50' : ''} />}
                    <span>Kirim Ulang Email</span>
                  </div>
                  {cooldown > 0 && (
                    <span className="text-[10px] font-medium opacity-80">Tunggu {cooldown} detik</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthState('login');
                    setError('');
                    setSuccess('');
                  }}
                  className="w-full bg-slate-50 text-slate-600 font-bold py-4 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-all"
                >
                  Sudah Verifikasi? Masuk
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Belum menerima email? Periksa folder spam atau klik tombol kirim ulang di atas.
              </p>
            </div>
          ) : (
            <>
              <button 
                type="button"
                onClick={() => {
                  if (authState !== 'login') {
                    setAuthState('login');
                    setError('');
                    setSuccess('');
                  } else {
                    navigate('/');
                  }
                }}
                className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center p-2 rounded-full hover:bg-slate-100"
                title={authState !== 'login' ? t.back_to_login : t.back_to_home}
              >
                <ArrowLeft size={20} />
              </button>

              <div className="text-center mb-8 mt-2">
                 <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Wallet size={24} className="text-white" />
                 </div>
                 <h2 className="text-2xl font-extrabold text-slate-900">
                   {authState === 'register' ? t.register_title : 
                    authState === 'forgot' ? t.forgot_title :
                    authState === 'reset' ? t.reset_title :
                    t.login_title}
                 </h2>
                 <p className="text-slate-500 font-medium">
                   {authState === 'register' ? t.register_subtitle : 
                    authState === 'forgot' ? t.forgot_subtitle :
                    authState === 'reset' ? t.reset_subtitle :
                    t.login_subtitle}
                 </p>
              </div>
            </>
          )}

          {authState !== 'waiting' && (
            <>
              {error && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm font-semibold rounded-xl text-center">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm font-semibold rounded-xl text-center">
                  {success}
                </div>
              )}
            </>
          )}

          {authState !== 'waiting' && (
            <form onSubmit={handleAuth} className="space-y-4">
              {authState === 'register' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">{t.full_name}</label>
              <input 
                type="text" 
                required
                value={nama_lengkap} 
                onChange={e => setNamaLengkap(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                placeholder={t.full_name_placeholder} 
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">{t.email}</label>
            <input 
              type="email" 
              required
              value={email} 
              disabled={authState === 'reset'}
              onChange={e => setEmail(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-60" 
              placeholder={t.email_placeholder} 
            />
          </div>

          {authState === 'reset' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">{t.otp_code}</label>
              <input 
                type="text" 
                required
                maxLength={6}
                value={code} 
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))} 
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center tracking-[10px] font-bold text-xl" 
                placeholder={t.otp_placeholder} 
              />
            </div>
          )}

          {(authState !== 'forgot') && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                {authState === 'reset' ? t.new_password : t.password}
              </label>
              <input 
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                placeholder={authState === 'reset' ? t.new_password_placeholder : t.password_placeholder}
              />
            </div>
          )}

          {authState === 'login' && (
            <div className="text-right">
              <button 
                type="button"
                onClick={() => { setAuthState('forgot'); setError(''); setSuccess(''); }}
                className="text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                {t.forgot_password}
              </button>
            </div>
          )}
          
          <div className="pt-4">
             <button 
               type="submit" 
               disabled={loading}
               className="w-full py-3 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-200 hover:-translate-y-0.5 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
             >
                {loading ? <Loader2 size={18} className="animate-spin" /> : 
                 (authState === 'register' ? t.register_btn : 
                  authState === 'forgot' ? t.send_code :
                  authState === 'reset' ? t.reset_btn :
                  t.login_btn)}
             </button>
          </div>
        </form>
          )}

        <div className="mt-6 text-center space-y-4">
           {authState === 'login' ? (
             <button 
               onClick={() => { setAuthState('register'); setError(''); setSuccess(''); }}
               className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
             >
               {t.to_register}
             </button>
           ) : (
             <button 
               onClick={() => { setAuthState('login'); setError(''); setSuccess(''); }}
               className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
             >
               {authState === 'register' ? t.to_login : t.back_to_login_btn}
             </button>
           )}
        </div>
      </motion.div>
    </div>
  </div>
  );
}
