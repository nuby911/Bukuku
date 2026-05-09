import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, X, Wallet, LayoutDashboard, PieChart, ArrowRightLeft, 
  Smartphone, BarChart3, Lock, ChevronRight, 
  Facebook, Twitter, Instagram, Globe, MessageCircle
} from 'lucide-react';

const translations = {
  id: {
    features: "Fitur",
    pricing: "Harga",
    contact: "Kontak",
    login: "Login",
    register_free: "Mulai Gratis",
    total_balance: "Saldo Mahasiswa",
    dashboard: "Dashboard",
    transactions: "Catatan",
    reports: "Laporan",
    income: "Uang Masuk",
    expense: "Uang Keluar",
    feature_title: "Fitur Simpel Buat Mahasiswa",
    feature_desc: "Semua kebutuhan atur duit jajan biar tetap survive sampai akhir bulan, tanpa ribet",
    feat_1_title: "Catat Cepat",
    feat_1_desc: "Input uang masuk atau makan siang dalam hitungan detik",
    feat_2_title: "Mobile Ready",
    feat_2_desc: "Cek sisa saldo langsung dari HP pas lagi nongkrong",
    feat_3_title: "Statistik Jajan",
    feat_3_desc: "Lihat pengeluaran apa yang bikin kamu sering boros",
    feat_4_title: "Privasi Aman",
    feat_4_desc: "Data keuanganmu aman, cuma kamu yang bisa lihat",
    step_1_title: "Bikin Akun",
    step_1_desc: "Daftar instan pakai email",
    step_2_title: "Input Pengeluaran",
    step_2_desc: "Mulai catat Uang pengeluaran Kamu",
    step_3_title: "Bebas Boncos",
    step_3_desc: "Pantau sisa budget harianmu",
    footer_copy: "© 2026 bukuku. Sahabat finansial mahasiswa.",
    footer_privacy: "Kebijakan Privasi",
    footer_terms: "Syarat & Ketentuan",
    hero_badge: "Teman Setia 10.000+ Mahasiswa",
    hero_title_1: "Atur Duit Jajan",
    hero_title_2: "Tanpa Drama",
    hero_title_3: "& Boncos",
    hero_desc: "Pantau uang bulanan, kiriman ortu, dan project sampingan agar tetap survive sampai akhir bulan",
    hero_start: "Mulai Atur Duit",
    hero_demo: "Cara Daftar",
    cta_title: "Siap jadi mahasiswa melek finansial?",
    cta_desc: "Gabung dengan ribuan mahasiswa yang sudah pakai bukuku untuk kelola keuangan mu lebih cerdas",
    cta_btn: "Daftar Sekarang, Gratis!"
  },
  en: {
    features: "Features",
    pricing: "Pricing",
    contact: "Contact",
    login: "Login",
    register_free: "Start for Free",
    total_balance: "Student Balance",
    dashboard: "Dashboard",
    transactions: "Records",
    reports: "Reports",
    income: "Income",
    expense: "Expenses",
    feature_title: "Simple Features for Students",
    feature_desc: "Everything you need to manage allowance and stay updated until the end of the month.",
    feat_1_title: "Quick Record",
    feat_1_desc: "Input allowance or lunch expenses in seconds.",
    feat_2_title: "Mobile Ready",
    feat_2_desc: "Check your remaining balance directly from your phone while hanging out.",
    feat_3_title: "Spending Stats",
    feat_3_desc: "See which expenses are making you overspend.",
    feat_4_title: "Safe Privacy",
    feat_4_desc: "Your financial data is secure, only you can see it.",
    step_1_title: "Create Account",
    step_1_desc: "Instant registration via campus email",
    step_2_title: "Input Expenses",
    step_2_desc: "Start recording rent or tuition",
    step_3_title: "No More Broke",
    step_3_desc: "Monitor your daily budget",
    footer_copy: "© 2026 bukuku. Your campus financial buddy.",
    footer_privacy: "Privacy Policy",
    footer_terms: "Terms & Conditions",
    hero_badge: "Trusted by 10,000+ Students",
    hero_title_1: "Manage Allowance",
    hero_title_2: "No Drama",
    hero_title_3: "& No Broke",
    hero_desc: "Track monthly allowance, parent transfers, and side projects to survive until the end of the month.",
    hero_start: "Get Started",
    hero_demo: "How to Join",
    cta_title: "Ready to be a financially savvy student?",
    cta_desc: "Join thousands of students who have switched to bukuku for smarter campus budget management.",
    cta_btn: "Register for Free Now"
  }
};const ChaosText = React.memo(({ text, delayOffset = 0 }: { text: string, delayOffset?: number }) => {
  const words = useMemo(() => text.split(" "), [text]);
  return (
    <>
      {words.map((word, wordIdx) => (
        <span key={wordIdx} className="inline-block whitespace-nowrap">
          {word.split("").map((char, charIdx) => {
            const i = wordIdx * 20 + charIdx;
            const randX = ((i * 17) % 30) - 15;
            const randY = ((i * 23) % 30) - 15;
            const randRot = ((i * 29) % 60) - 30;

            return (
              <motion.span
                key={charIdx}
                className="inline-block cursor-default will-change-transform"
                initial={{ 
                  opacity: 0, 
                  y: randY * 2, 
                  x: randX * 2, 
                  rotate: randRot,
                  scale: 0.3
                }}
                whileInView={{ opacity: 1, y: 0, x: 0, rotate: 0, scale: 1 }}
                whileHover={{ 
                  scale: 1.25, 
                  y: -5,
                  transition: { type: "spring", stiffness: 400, damping: 10 }
                }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{
                  duration: 0.8,
                  delay: delayOffset + (wordIdx * 5 + charIdx) * 0.01,
                  type: "spring",
                  damping: 12,
                  stiffness: 100
                }}
              >
                {char}
              </motion.span>
            );
          })}
          {wordIdx !== words.length - 1 && <span className="inline-block whitespace-pre"> </span>}
        </span>
      ))}
    </>
  );
});

const Navbar = React.memo(({ lang, setLang, t }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-4 lg:py-5">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <div className="w-3 h-3 border-2 border-white rounded-sm"></div>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">bukuku</span>
          </div>
          
          {/* Desktop Links - Hidden always per user request */}
          <div className="hidden items-center space-x-8 text-sm font-medium text-slate-600">
            <a href="#fitur" className="hover:text-blue-600 transition-colors uppercase tracking-widest">{t.features}</a>
            <a href="#kontak" className="hover:text-blue-600 transition-colors uppercase tracking-widest">{t.contact}</a>
          </div>

          <div className="hidden items-center space-x-4">
             <button 
               onClick={() => setLang(lang === 'id' ? 'en' : 'id')} 
               className="text-xs font-bold px-3 py-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-colors rounded-lg flex items-center gap-1 border border-slate-200"
             >
               <Globe size={14} /> {lang === 'id' ? 'EN' : 'ID'}
             </button>
            <button 
              onClick={() => navigate('/login')}
              className="text-sm font-bold px-4 py-2 text-slate-800 hover:text-blue-600 transition-colors"
            >
              {t.login}
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="text-sm font-bold bg-blue-600 text-white px-5 py-2.5 rounded-full shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all hover:-translate-y-0.5"
            >
              {t.register_free}
            </button>
          </div>

          {/* Hamburger Menu - Always visible now */}
          <div className="flex items-center gap-2">
             <button 
               onClick={() => setLang(lang === 'id' ? 'en' : 'id')} 
               className="text-xs font-bold px-2 py-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-colors rounded-lg flex items-center gap-1"
             >
               <Globe size={16} /> {lang === 'id' ? 'EN' : 'ID'}
             </button>
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 100, 
              damping: 20,
              mass: 1
            }}
            className="bg-white border-t border-slate-100 p-6 absolute w-full left-0 shadow-2xl z-50 overflow-hidden"
          >
            <div className="flex flex-col space-y-4 text-sm font-medium max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
              <a href="#fitur" onClick={() => setIsOpen(false)} className="text-slate-600 hover:text-blue-600 p-2 rounded-lg hover:bg-slate-50">{t.features}</a>
              <a href="#kontak" onClick={() => setIsOpen(false)} className="text-slate-600 hover:text-blue-600 p-2 rounded-lg hover:bg-slate-50">{t.contact}</a>
              <hr className="border-slate-100 my-2" />
              <div className="flex flex-col gap-3 pt-2">
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/login');
                  }} 
                  className="text-center font-bold border border-slate-200 text-slate-700 px-5 py-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  {t.login}
                </button>
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/login');
                  }} 
                  className="text-center font-bold bg-blue-600 text-white px-5 py-3 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors"
                >
                  {t.register_free}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
});

const DashboardMockup = React.memo(({ t }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay: 0.2 }}
    className="bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden flex relative ring-4 ring-white/50 will-change-transform"
  >
    <div className="w-56 bg-slate-50/50 border-r border-slate-100 p-6 hidden lg:flex flex-col gap-3">
        <div className="h-6 bg-slate-200/50 rounded animate-pulse mb-6 w-24"></div>
        <div className="h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center px-4 gap-3 text-sm font-bold">
          <LayoutDashboard size={18}/> <span>{t.dashboard}</span>
        </div>
        <div className="h-10 text-slate-500 rounded-xl flex items-center px-4 gap-3 hover:bg-slate-100 transition-colors text-sm font-medium text-blue">
          <ArrowRightLeft size={18}/> <span>{t.transactions}</span>
        </div>
        <div className="h-10 text-slate-500 rounded-xl flex items-center px-4 gap-3 hover:bg-slate-100 transition-colors text-sm font-medium">
          <PieChart size={18}/> <span>{t.reports}</span>
        </div>
    </div>
    
    <div className="flex-1 p-6 md:p-8 bg-white">
       <div className="flex justify-between items-center mb-8">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t.total_balance}</p>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Rp 142.500.000</h2>
          </div>
          <div className="flex space-x-2">
            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-500 ring-4 ring-white shadow-sm z-10">UK</div>
            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-500 ring-4 ring-white shadow-sm -ml-4 z-0">KS</div>
          </div>
       </div>
       
       <div className="h-48 bg-slate-50/80 rounded-2xl flex items-end justify-between p-4 space-x-2 mb-8 border border-slate-100">
           <div className="w-full bg-blue-100 h-1/2 rounded-t-xl transition-all hover:bg-blue-200 cursor-pointer"></div>
           <div className="w-full bg-blue-200 h-3/4 rounded-t-xl transition-all hover:bg-blue-300 cursor-pointer"></div>
           <div className="w-full bg-blue-600 h-full rounded-t-xl shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 cursor-pointer"></div>
           <div className="w-full bg-blue-300 h-2/3 rounded-t-xl transition-all hover:bg-blue-400 cursor-pointer"></div>
           <div className="w-full bg-blue-100 h-1/3 rounded-t-xl transition-all hover:bg-blue-200 cursor-pointer"></div>
           <div className="w-full bg-blue-400 h-4/5 rounded-t-xl transition-all hover:bg-blue-500 cursor-pointer"></div>
       </div>
       
       <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
             <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-2">{t.income}</p>
             <p className="text-lg font-extrabold text-slate-900 tracking-tight">+ Rp 12.4M</p>
          </div>
          <div className="p-5 bg-rose-50 rounded-2xl border border-rose-100">
             <p className="text-[10px] text-rose-600 font-bold uppercase tracking-wider mb-2">{t.expense}</p>
             <p className="text-lg font-extrabold text-slate-900 tracking-tight">- Rp 4.2M</p>
          </div>
       </div>
    </div>
  </motion.div>
));

const FeaturesSection = React.memo(({ t }: any) => {
  const features = useMemo(() => [
    {
      icon: <ArrowRightLeft className="w-6 h-6" />,
      title: t.feat_1_title,
      desc: t.feat_1_desc
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: t.feat_2_title,
      desc: t.feat_2_desc
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: t.feat_3_title,
      desc: t.feat_3_desc
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: t.feat_4_title,
      desc: t.feat_4_desc
    }
  ], [t]);

  return (
    <section id="fitur" className="py-24 bg-slate-50 border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="text-center md:text-left max-w-2xl mb-12">
           <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-4">{t.feature_title}</h2>
           <p className="text-lg text-slate-500 leading-relaxed font-medium">{t.feature_desc}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: idx * 0.05 }}
              key={idx} 
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                {feature.icon}
              </div>
              <h4 className="font-bold text-slate-900 mb-2">{feature.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
});

const HowItWorksSection = React.memo(({ t }: any) => {
  const steps = useMemo(() => [
    { number: "01", title: t.step_1_title, desc: t.step_1_desc, icon: <Lock className="w-5 h-5" /> },
    { number: "02", title: t.step_2_title, desc: t.step_2_desc, icon: <ArrowRightLeft className="w-5 h-5" /> },
    { number: "03", title: t.step_3_title, desc: t.step_3_desc, icon: <BarChart3 className="w-5 h-5" /> }
  ], [t]);

  return (
    <section id="cara-daftar" className="py-16 bg-slate-50 pb-24 scroll-mt-20 leading-relaxed">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="bg-slate-900 text-white p-8 md:p-14 rounded-[3rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-48 bg-blue-600/30 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 p-32 bg-emerald-600/10 blur-[100px] rounded-full mix-blend-screen pointer-events-none"></div>
          
          <div className="relative z-10 mb-12 text-center md:text-left">
            <h3 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight">Bagaimana Cara Memulai?</h3>
            <p className="text-slate-400 font-medium">Hanya butuh 3 langkah instan untuk digitalisasi keuangan Anda.</p>
          </div>

          <div className="relative flex flex-col md:flex-row justify-between items-center gap-12 md:gap-4 p-2 z-10">
            {steps.map((step, idx) => (
               <React.Fragment key={idx}>
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex flex-col items-center md:items-start space-y-4 shrink-0 group text-center md:text-left"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-5xl font-black text-blue-500 group-hover:text-blue-400 transition-colors drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">{step.number}</span>
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                        {step.icon}
                      </div>
                    </div>
                    <div>
                        <p className="text-lg font-bold tracking-wide group-hover:text-blue-300 transition-colors">{step.title}</p>
                        <p className="text-sm font-medium text-slate-400 mt-1 max-w-[200px]">{step.desc}</p>
                    </div>
                  </motion.div>
                  {idx < steps.length - 1 && (
                     <div className="hidden md:block h-px flex-1 bg-gradient-to-r from-blue-500/50 to-transparent mx-4"></div>
                  )}
               </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

const Footer = React.memo(({ t }: any) => (
  <footer id="kontak" className="px-4 sm:px-6 lg:px-10 py-8 bg-white border-t border-slate-200">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t.footer_copy}</p>
      <div className="flex flex-wrap items-center justify-center space-x-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
        <a href="#" className="hover:text-blue-600 transition-colors">{t.footer_privacy}</a>
        <a href="#" className="hover:text-blue-600 transition-colors">{t.footer_terms}</a>
        <div className="flex items-center space-x-3 ml-2 lg:ml-6">
          <div className="w-6 h-6 bg-slate-100 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-md flex items-center justify-center cursor-pointer transition-colors"><Facebook className="w-3.5 h-3.5" /></div>
          <div className="w-6 h-6 bg-slate-100 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-md flex items-center justify-center cursor-pointer transition-colors"><Twitter className="w-3.5 h-3.5" /></div>
          <a href="https://www.instagram.com/rbyiat_?igsh=MXJ1N3R4Zm55Y3Vtbg==" target="_blank" rel="noopener noreferrer" className="w-6 h-6 bg-slate-100 text-slate-400 hover:bg-pink-50 hover:text-pink-600 rounded-md flex items-center justify-center cursor-pointer transition-colors">
            <Instagram className="w-3.5 h-3.5" />
          </a>
          <a href="https://wa.me/6285609199965" target="_blank" rel="noopener noreferrer" className="w-6 h-6 bg-green-50 text-green-600 hover:bg-green-100 rounded-md flex items-center justify-center cursor-pointer transition-colors">
            <MessageCircle className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  </footer>
));
;

export default function LandingPage() {
  const [lang, setLang] = useState<'id' | 'en'>('id');
  const navigate = useNavigate();
  const t = translations[lang];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      <Navbar lang={lang} setLang={setLang} t={t} />
      
      <main className="flex-1 flex flex-col">
        <section className="relative pt-28 pb-20 lg:pt-32 lg:pb-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 z-10 relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              
              <div className="lg:col-span-5 space-y-6 text-center lg:text-left pt-10">
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="inline-flex items-center px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-extrabold uppercase tracking-[0.2em]"
                >
                  {t.hero_badge}
                </motion.div>
                <h1 className="text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-slate-900">
                  <ChaosText text={t.hero_title_1} delayOffset={0.2} /> <span className="text-blue-600 px-1"><ChaosText text={t.hero_title_2} delayOffset={0.4} /></span> <ChaosText text={t.hero_title_3} delayOffset={0.5} />
                </h1>
                <p className="text-lg text-slate-500 leading-relaxed max-w-lg mx-auto lg:mx-0">
                  <ChaosText text={t.hero_desc} delayOffset={0.6} />
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                  <button onClick={() => navigate('/login')} className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all hover:shadow-lg hover:-translate-y-0.5">
                    {t.hero_start}
                  </button>
                  <a href="#cara-daftar" className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-4 font-bold text-slate-700 hover:text-blue-600 transition-colors group">
                    <span className="p-1 rounded-full bg-slate-100 group-hover:bg-blue-50 transition-colors">
                       <ChevronRight className="w-5 h-5" />
                    </span>
                    <span>{t.hero_demo}</span>
                  </a>
                </div>
              </div>

              <div className="lg:col-span-7 relative w-full pt-8 lg:pt-0">
                <DashboardMockup t={t} />
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-blue-200/50 rounded-full blur-3xl -z-10"></div>
                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-200/40 rounded-full blur-3xl -z-10"></div>
              </div>
              
            </div>
          </div>
        </section>

        <FeaturesSection t={t} />
        <HowItWorksSection t={t} />
        
        <section className="py-24 bg-blue-600 relative">
          <div className="absolute inset-0 opacity-10 mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSI+PC9yZWN0Pgo8cGF0aCBkPSJNMCAwTDggOFpNOCAwTDAgOFoiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIj48L3BhdGg+Cjwvc3ZnPg==')]"></div>
          <div className="max-w-3xl mx-auto px-4 text-center relative z-10 flex flex-col items-center">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight">{t.cta_title}</h2>
            <p className="text-blue-100 mb-10 text-lg md:text-xl font-medium max-w-2xl">{t.cta_desc}</p>
            <button onClick={() => navigate('/login')} className="bg-white text-blue-600 px-8 py-4 rounded-xl font-extrabold text-lg flex items-center gap-3 hover:bg-slate-50 transition-all shadow-2xl shadow-blue-900/50 hover:shadow-blue-900/70 hover:-translate-y-1">
              {t.cta_btn}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </section>
      </main>

      <Footer t={t} />
    </div>
  );
}

