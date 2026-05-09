import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Loader2, ArrowLeft, Globe } from 'lucide-react';
import { authTranslations } from '../constants/authTranslations';

export default function LoginPage({ onAuthSuccess }: { onAuthSuccess: (user: any, token: string) => void }) {
  const [lang, setLang] = useState<'id' | 'en'>('id');
  const t = authTranslations[lang];

  const [authState, setAuthState] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [nama_lengkap, setNamaLengkap] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

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

      const data = await response.json();

      if (!response.ok) {
        if (data.errors && data.errors.length > 0) {
          throw new Error(data.errors[0].msg);
        }
        throw new Error(data.error || t.sys_error);
      }

      if (authState === 'register') {
        setAuthState('login');
        setPassword('');
        setSuccess(t.register_success);
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

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-2xl border border-slate-100 w-full max-w-md relative">
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

        <button 
          onClick={() => setLang(lang === 'id' ? 'en' : 'id')} 
          className="absolute top-6 right-6 text-xs font-semibold px-2 py-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-colors rounded-lg flex items-center gap-1 border border-transparent shadow-sm hover:border-slate-200"
        >
          <Globe size={14} /> {lang === 'id' ? 'EN' : 'ID'}
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
  );
}
