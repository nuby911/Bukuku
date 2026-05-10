import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, LayoutDashboard, ArrowRightLeft, PieChart, LogOut, Plus, Loader2, DollarSign, X, Globe, Download
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { dashboardTranslations } from '../constants/translations';

const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b', '#8b5cf6'];

export default function UserDashboard({ user, token, onLogout }: { user: any, token: string, onLogout: () => void }) {
  const [lang, setLang] = useState<'id' | 'en'>('id');
  const t = dashboardTranslations[lang];

  const [activeMenu, setActiveMenu] = useState<'summary' | 'history' | 'report'>('summary');
  const [transaksiList, setTransaksiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [totalMasuk, setTotalMasuk] = useState(0);
  const [totalKeluar, setTotalKeluar] = useState(0);
  const [editItem, setEditItem] = useState<string | null>(null);

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'masuk' | 'keluar'>('all');
  const [filterDays, setFilterDays] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    tipe: 'keluar',
    kategori_nama: '',
    tanggal: new Date().toISOString().split('T')[0],
    nominal: '',
    keterangan: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const fetchTransaksi = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch List Transaksi (berdasarkan pagination/limit)
      let listUrl = '/api/transaksi?limit=100';
      if (filterDays) listUrl += `&days=${filterDays}`;
      if (startDate) listUrl += `&startDate=${startDate}`;
      if (endDate) listUrl += `&endDate=${endDate}`;
      if (filterType !== 'all') listUrl += `&tipe=${filterType}`;

      // 2. Fetch Summary (Kalkulasi Server-Side untuk Akurasi 100%)
      let summaryUrl = '/api/transaksi/summary?';
      if (filterDays) summaryUrl += `days=${filterDays}`;
      if (startDate) summaryUrl += `&startDate=${startDate}`;
      if (endDate) summaryUrl += `&endDate=${endDate}`;

      const [listRes, summaryRes] = await Promise.all([
        fetch(listUrl, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(summaryUrl, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      const listData = await listRes.json();
      const summaryData = await summaryRes.json();
      
      if (!listRes.ok) throw new Error(listData.error || t.error_fetch);
      if (!summaryRes.ok) throw new Error(summaryData.error || t.error_fetch);
      
      setTransaksiList(listData.data);
      setTotalMasuk(summaryData.totalMasuk);
      setTotalKeluar(summaryData.totalKeluar);

    } catch (err: any) {
      setError(err.message || t.error_fetch);
    } finally {
      setLoading(false);
    }
  }, [token, filterDays, startDate, endDate, filterType, t.error_fetch]);

  useEffect(() => {
    fetchTransaksi();
  }, [fetchTransaksi]);

  const handleSubmitTransaksi = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitError('');

    try {
      const url = editItem ? `/api/transaksi/${editItem}` : '/api/transaksi';
      const method = editItem ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || (editItem ? t.error_update : t.error_submit));

      setShowModal(false);
      setEditItem(null);
      setFormData({
        tipe: 'keluar',
        kategori_nama: '',
        tanggal: new Date().toISOString().split('T')[0],
        nominal: '',
        keterangan: ''
      });
      fetchTransaksi(); // Refresh data
    } catch (err: any) {
      setSubmitError(err.message || (editItem ? t.error_update : t.error_submit));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditClick = (trx: any) => {
    setEditItem(trx.id);
    setFormData({
      tipe: trx.tipe,
      kategori_nama: trx.nama_kategori || '',
      tanggal: new Date(trx.tanggal).toISOString().split('T')[0],
      nominal: parseInt(trx.nominal).toLocaleString('id-ID'),
      keterangan: trx.keterangan || ''
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditItem(null);
    setFormData({
      tipe: 'keluar',
      kategori_nama: '',
      tanggal: new Date().toISOString().split('T')[0],
      nominal: '',
      keterangan: ''
    });
    setShowModal(true);
  };

  // Format Rupiah memoized
  const formatRupiah = useCallback((angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  }, []);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(t.report_title, 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`${t.owner}: ${user.nama_lengkap}`, 14, 30);
    doc.text(`Waktu Cetak: ${new Date().toLocaleString(lang === 'id' ? 'id-ID' : 'en-US')}`, 14, 36);
    
    // Summary
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`Ringkasan Saldo`, 14, 48);
    
    doc.setFontSize(10);
    doc.text(`${t.total_income}: ${formatRupiah(totalMasuk)}`, 14, 55);
    doc.text(`${t.total_expense}: ${formatRupiah(totalKeluar)}`, 14, 61);
    doc.text(`${t.total_balance}: ${formatRupiah(totalMasuk - totalKeluar)}`, 14, 67);

    // Table Data
    const tableColumn = [t.date, t.description, t.category, t.type, t.amount];
    const tableRows = [];

    transaksiList.forEach((trx: any) => {
      const trxData = [
        new Date(trx.tanggal).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US'),
        trx.keterangan || '-',
        trx.nama_kategori || t.no_category,
        trx.tipe === 'masuk' ? t.income : t.expense,
        formatRupiah(parseFloat(trx.nominal))
      ];
      tableRows.push(trxData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 75,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] }, // blue-600
    });

    doc.save(`Laporan_bukuku_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Optimasi Kalkulasi Chart dengan useMemo agar tidak re-render berat
  const chartData = useMemo(() => {
    const categories: Record<string, number> = {};
    transaksiList.forEach((trx: any) => {
      if (trx.tipe === 'keluar') {
        const catName = trx.nama_kategori || t.no_category;
        categories[catName] = (categories[catName] || 0) + parseFloat(trx.nominal);
      }
    });

    return Object.keys(categories)
      .map((key) => ({
        name: key,
        value: categories[key],
      }))
      .sort((a, b) => b.value - a.value);
  }, [transaksiList, t.no_category]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
         <div className="p-6 border-b border-slate-100 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <Wallet size={16} className="text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">bukuku.</span>
         </div>
         <nav className="flex-1 p-4 space-y-2">
            <button 
              onClick={() => setActiveMenu('summary')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeMenu === 'summary' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            >
               <LayoutDashboard size={18} /> {t.summary_menu}
            </button>
            <button 
              onClick={() => setActiveMenu('history')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeMenu === 'history' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            >
               <ArrowRightLeft size={18} /> {t.history_menu}
            </button>
            <button 
              onClick={() => setActiveMenu('report')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeMenu === 'report' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            >
               <PieChart size={18} /> {t.report_menu}
            </button>
         </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:max-h-screen md:overflow-hidden min-h-screen pb-20 md:pb-0">
        <header className="px-4 sm:px-8 py-4 sm:py-6 bg-white/80 backdrop-blur-md border-b border-slate-200 flex justify-between items-center z-30 sticky top-0">
           <div>
             <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
               {activeMenu === 'summary' ? t.summary : activeMenu === 'history' ? t.history_menu : t.report_menu}
             </h1>
             <p className="text-[10px] sm:text-sm font-medium text-slate-500 mt-1">{t.subtitle}</p>
           </div>
           <div className="flex items-center gap-1.5 sm:gap-4">
                <div className="text-left border-r border-slate-200 pr-2 sm:pr-4">
                   <p className="text-[10px] sm:text-sm font-bold text-slate-900 leading-tight truncate max-w-[80px] sm:max-w-none">{user.nama_lengkap}</p>
                   <p className="text-[8px] sm:text-[10px] uppercase font-bold tracking-wider text-slate-400">{t.owner}</p>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50">
                    <button 
                      onClick={() => setLang(lang === 'id' ? 'en' : 'id')} 
                      className="flex items-center gap-1.5 text-slate-600 hover:text-blue-600 bg-white px-2 py-1.5 rounded-[10px] transition-all font-bold border border-slate-200 shadow-sm text-[10px] sm:text-xs"
                    >
                      <Globe size={12} className="text-slate-400" /> {lang === 'id' ? 'EN' : 'ID'}
                    </button>
                    
                    <button onClick={onLogout} className="text-slate-400 hover:bg-rose-50 hover:text-rose-600 p-1.5 rounded-[10px] transition-all bg-white border border-slate-200 shadow-sm">
                      <LogOut size={16} />
                    </button>
                </div>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl font-medium flex items-center gap-3">
                <span className="bg-rose-200 text-rose-800 rounded-full w-6 h-6 flex items-center justify-center font-bold">!</span>
                {error}
              </div>
            )}

            {/* Global Filter Bar */}
            <div className="mb-8 bg-white p-4 sm:p-6 rounded-[1.5rem] border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <ArrowRightLeft size={16} className="text-blue-600" />
                    Filter Transaksi
                  </h3>
                  <p className="text-xs text-slate-500">Sesuaikan tampilan data berdasarkan waktu dan tipe</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                   <button 
                      onClick={() => { setFilterDays(1); setStartDate(''); setEndDate(''); setTempStartDate(''); setTempEndDate(''); }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${filterDays === 1 ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                   >
                     Hari Ini
                   </button>
                   <button 
                      onClick={() => { setFilterDays(7); setStartDate(''); setEndDate(''); setTempStartDate(''); setTempEndDate(''); }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${filterDays === 7 ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                   >
                     7 Hari
                   </button>
                   <button 
                      onClick={() => { setFilterDays(30); setStartDate(''); setEndDate(''); setTempStartDate(''); setTempEndDate(''); }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${filterDays === 30 ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                   >
                     30 Hari
                   </button>
                   <button 
                      onClick={() => { setFilterDays(null); setStartDate(''); setEndDate(''); setTempStartDate(''); setTempEndDate(''); }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${filterDays === null && !startDate ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                   >
                     Semua
                   </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4">
                 <div className="md:col-span-5 flex items-center gap-2">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <input 
                        type="date"
                        value={tempStartDate}
                        onChange={(e) => setTempStartDate(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                      />
                      <input 
                        type="date"
                        value={tempEndDate}
                        onChange={(e) => setTempEndDate(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                      />
                    </div>
                    <button 
                      onClick={() => { setStartDate(tempStartDate); setEndDate(tempEndDate); setFilterDays(null); }}
                      className="px-4 py-2 bg-slate-900 border border-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-sm"
                    >
                      Terapkan
                    </button>
                 </div>

                 <div className="md:col-span-7 flex items-center gap-2">
                    <div className="flex-1 relative">
                       <input 
                        type="text" 
                        placeholder="Cari transaksi..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-4 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <select 
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as any)}
                      className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold text-slate-700"
                    >
                      <option value="all">Semua Tipe</option>
                      <option value="masuk">Pemasukan</option>
                      <option value="keluar">Pengeluaran</option>
                    </select>
                 </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
            {activeMenu === 'summary' && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-blue-600 to-blue-800 shadow-xl shadow-blue-200 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] text-white relative overflow-hidden flex flex-col justify-center">
                    <div className="absolute top-0 right-0 p-16 bg-white/10 blur-[50px] rounded-full pointer-events-none"></div>
                    <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-blue-500/20 blur-[30px] rounded-full pointer-events-none"></div>
                    <p className="text-xs sm:text-sm uppercase tracking-wider font-bold text-blue-100 mb-2">{t.total_balance}</p>
                    <p className="text-3xl sm:text-4xl font-black tracking-tight">{formatRupiah(totalMasuk - totalKeluar)}</p>
                  </div>
                  
                  <div className="col-span-1 bg-white border border-slate-200 shadow-sm p-4 sm:p-6 rounded-[1.5rem] flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 text-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                        <DollarSign size={20} className="sm:hidden" />
                        <DollarSign size={24} className="hidden sm:block" />
                    </div>
                    <div className="overflow-hidden w-full">
                        <p className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-slate-400 mb-1 truncate">{t.total_income}</p>
                        <p className="text-lg sm:text-xl font-extrabold text-slate-900 truncate">{formatRupiah(totalMasuk)}</p>
                    </div>
                  </div>

                  <div className="col-span-1 bg-white border border-slate-200 shadow-sm p-4 sm:p-6 rounded-[1.5rem] flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rose-50 text-rose-600 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                        <ArrowRightLeft size={18} className="sm:hidden" />
                        <ArrowRightLeft size={20} className="hidden sm:block" />
                    </div>
                    <div className="overflow-hidden w-full">
                        <p className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-slate-400 mb-1 truncate">{t.total_expense}</p>
                        <p className="text-lg sm:text-xl font-extrabold text-slate-900 truncate">{formatRupiah(totalKeluar)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden mb-8">
                  <div className="p-4 flex-col sm:flex-row sm:p-6 sm:px-8 border-b border-slate-100 flex sm:justify-between items-start sm:items-center gap-4">
                    <h2 className="font-bold text-lg text-slate-900">{t.recent_transactions}</h2>
                    <button 
                      onClick={openAddModal}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-slate-200 hover:-translate-y-0.5 transition-all"
                    >
                        <Plus size={16} /> {t.add_transaction}
                    </button>
                  </div>
                  
                  <TransactionTable 
                    list={transaksiList.slice(0, 10)} 
                    loading={loading}
                    t={t}
                    lang={lang}
                    formatRupiah={formatRupiah}
                    onEdit={handleEditClick}
                  />
                </div>
              </motion.div>
            )}

            {activeMenu === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="font-bold text-lg text-slate-900">{t.history_menu}</h2>
                      <p className="text-sm text-slate-500">Riwayat transaksi berdasarkan filter di atas</p>
                    </div>
                    <button 
                      onClick={openAddModal}
                      className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-slate-200 hover:-translate-y-0.5 transition-all w-full md:w-auto justify-center"
                    >
                        <Plus size={16} /> {t.add_transaction}
                    </button>
                  </div>
                  <TransactionTable 
                    list={transaksiList.filter((trx: any) => {
                      const matchesSearch = 
                        (trx.keterangan?.toLowerCase().includes(searchTerm.toLowerCase())) || 
                        (trx.nama_kategori?.toLowerCase().includes(searchTerm.toLowerCase()));
                      return matchesSearch;
                    })}
                    loading={loading}
                    t={t}
                    lang={lang}
                    formatRupiah={formatRupiah}
                    onEdit={handleEditClick}
                  />
                </div>
              </motion.div>
            )}

            {activeMenu === 'report' && (
              <motion.div
                key="report"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{t.report_title}</h2>
                      <p className="text-sm text-slate-500">Statistik Pengeluaran & Ringkasan</p>
                    </div>
                    <button 
                      onClick={handleDownloadPDF}
                      className="flex items-center justify-center gap-2 w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all font-bold"
                    >
                      <Download size={18} /> {t.download_pdf}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pie Chart */}
                    <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-200">
                      <h3 className="text-lg font-bold text-slate-800 mb-6">Distribusi Pengeluaran</h3>
                      <div className="h-[300px] w-full">
                        {chartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <RechartsTooltip 
                                formatter={(value: number) => formatRupiah(value)}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                              />
                              <Legend />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <PieChart size={48} className="mb-4 opacity-50" />
                            <p>Belum ada data pengeluaran</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="space-y-4">
                      <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-200 flex items-center gap-4">
                          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                             <Wallet size={28} />
                          </div>
                          <div>
                             <p className="text-sm font-bold text-slate-500 uppercase tracking-tighter">{t.total_balance}</p>
                             <p className="text-2xl font-black text-slate-900">{formatRupiah(totalMasuk - totalKeluar)}</p>
                          </div>
                       </div>
                       <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-200 flex items-center gap-4">
                          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                             <DollarSign size={28} />
                          </div>
                          <div>
                             <p className="text-sm font-bold text-slate-500 uppercase tracking-tighter">{t.total_income}</p>
                             <p className="text-2xl font-black text-emerald-600">{formatRupiah(totalMasuk)}</p>
                          </div>
                       </div>
                       <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-200 flex items-center gap-4">
                          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
                             <ArrowRightLeft size={28} />
                          </div>
                          <div>
                             <p className="text-sm font-bold text-slate-500 uppercase tracking-tighter">{t.total_expense}</p>
                             <p className="text-2xl font-black text-rose-600">{formatRupiah(totalKeluar)}</p>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            </AnimatePresence>
        </div>
      </div>

      {/* Modal Tambah Transaksi */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors p-2"
            >
              <X size={20} />
            </button>
            <div className="p-8">
               <h3 className="text-xl font-bold text-slate-900 mb-6">{editItem ? t.edit_transaction_title : t.add_transaction_title}</h3>
               
               {submitError && (
                 <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-sm font-medium rounded-xl border border-rose-100">
                   {submitError}
                 </div>
               )}

               <form onSubmit={handleSubmitTransaksi} className="space-y-4">
                 
                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1">{t.type_label}</label>
                   <div className="grid grid-cols-2 gap-3">
                     <button
                       type="button"
                       onClick={() => setFormData({...formData, tipe: 'keluar'})}
                       className={`py-3 px-4 rounded-xl text-sm font-bold transition-all border ${formData.tipe === 'keluar' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                     >
                        {t.expense}
                     </button>
                     <button
                       type="button"
                       onClick={() => setFormData({...formData, tipe: 'masuk'})}
                       className={`py-3 px-4 rounded-xl text-sm font-bold transition-all border ${formData.tipe === 'masuk' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                     >
                        {t.income}
                     </button>
                   </div>
                 </div>

                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">{t.date_label}</label>
                    <input 
                      type="date" 
                      required
                      value={formData.tanggal}
                      onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                 </div>

                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">{t.category_label}</label>
                    <input 
                      type="text" 
                      placeholder={t.category_placeholder} 
                      value={formData.kategori_nama}
                      onChange={(e) => setFormData({...formData, kategori_nama: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                 </div>

                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">{t.amount_label}</label>
                    <div className="relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">Rp</span>
                       <input 
                         type="text" 
                         required
                         placeholder="0"
                         value={formData.nominal}
                         onChange={(e) => {
                            // Cuma boleh masuk angka
                            let valStr = e.target.value.replace(/[^0-9]/g, '');
                            if(valStr){
                              valStr = parseInt(valStr).toLocaleString('id-ID');
                            }
                            setFormData({...formData, nominal: valStr});
                         }}
                         className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                       />
                    </div>
                 </div>

                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">{t.desc_label}</label>
                    <textarea 
                      placeholder={t.desc_placeholder} 
                      rows={2}
                      value={formData.keterangan}
                      onChange={(e) => setFormData({...formData, keterangan: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                 </div>

                 <button 
                   type="submit" 
                   disabled={submitLoading}
                   className="w-full py-4 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                 >
                   {submitLoading ? <Loader2 size={18} className="animate-spin" /> : <Wallet size={18} />}
                   {submitLoading ? (editItem ? t.updating : t.saving) : (editItem ? t.update : t.save)}
                 </button>

               </form>
            </div>
          </div>
        </div>
      )}
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-lg border border-white/20 shadow-2xl rounded-2xl px-2 py-2 flex items-center gap-1 z-40 ring-1 ring-slate-200">
          <button 
            onClick={() => setActiveMenu('summary')}
            className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 ${activeMenu === 'summary' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}
          >
             <LayoutDashboard size={20} />
             <span className="text-[9px] font-bold uppercase tracking-tighter">Ringkasan</span>
          </button>
          <button 
            onClick={() => setActiveMenu('history')}
            className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 ${activeMenu === 'history' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}
          >
             <ArrowRightLeft size={20} />
             <span className="text-[9px] font-bold uppercase tracking-tighter">Histori</span>
          </button>
          <button 
            onClick={() => setActiveMenu('report')}
            className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 ${activeMenu === 'report' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}
          >
             <PieChart size={20} />
             <span className="text-[9px] font-bold uppercase tracking-tighter">Laporan</span>
          </button>
          <div className="w-[1px] h-6 bg-slate-200 mx-1"></div>
          <button 
            onClick={openAddModal}
            className="p-3 bg-slate-900 text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all flex flex-col items-center gap-1"
          >
             <Plus size={20} />
             <span className="text-[9px] font-bold uppercase tracking-tighter">Catat</span>
          </button>
      </div>

    </div>
  );
}

// Sub-komponen yang di-memoized untuk performa maksimal
const TransactionTable = React.memo(({ list, loading, t, lang, formatRupiah, onEdit }: any) => (
  <div className="w-full">
    {/* Desktop View Table */}
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
          <tr>
            <th className="px-6 py-4">{t.date}</th>
            <th className="px-6 py-4">{t.description}</th>
            <th className="px-6 py-4">{t.category}</th>
            <th className="px-6 py-4 text-right">{t.amount}</th>
            <th className="px-6 py-4 text-center">{t.type}</th>
            <th className="px-6 py-4 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                <Loader2 size={24} className="animate-spin text-blue-500 mx-auto mb-2" />
                {t.loading}
              </td>
            </tr>
          ) : list.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-16 text-center">
                  <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wallet size={32} />
                  </div>
                  <p className="text-slate-500 font-medium">{t.no_transactions}</p>
                  <p className="text-slate-400 text-sm mt-1">{t.no_transactions_sub}</p>
              </td>
            </tr>
          ) : (
            list.map((trx: any) => (
              <tr key={trx.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">
                  {new Date(trx.tanggal).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-6 py-4 truncate max-w-[200px]">{trx.keterangan || '-'}</td>
                <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-semibold">
                      {trx.nama_kategori || t.no_category}
                    </span>
                </td>
                <td className={`px-6 py-4 font-bold text-right ${trx.tipe === 'masuk' ? 'text-emerald-600' : 'text-slate-900'}`}>
                  {trx.tipe === 'masuk' ? '+' : '-'} {formatRupiah(parseFloat(trx.nominal))}
                </td>
                <td className="px-6 py-4 text-center">
                  {trx.tipe === 'masuk' ? (
                      <span className="inline-flex items-center justify-center px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold uppercase tracking-wider">{t.income}</span>
                  ) : (
                      <span className="inline-flex items-center justify-center px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px] font-bold uppercase tracking-wider">{t.expense}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <button 
                    onClick={() => onEdit(trx)}
                    className="text-blue-500 hover:text-blue-700 font-bold text-xs"
                  >
                    {t.edit}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>

    {/* Mobile View Card List */}
    <div className="md:hidden divide-y divide-slate-100 bg-white">
      {loading ? (
        <div className="py-12 text-center text-slate-500">
          <Loader2 size={24} className="animate-spin text-blue-500 mx-auto mb-2" />
          {t.loading}
        </div>
      ) : list.length === 0 ? (
        <div className="py-12 text-center px-6">
          <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-3">
            <Wallet size={24} />
          </div>
          <p className="text-slate-500 text-sm font-bold">{t.no_transactions}</p>
        </div>
      ) : (
        list.map((trx: any) => (
          <div key={trx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 transition-colors" onClick={() => onEdit(trx)}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${trx.tipe === 'masuk' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                 {trx.tipe === 'masuk' ? <DollarSign size={18} /> : <ArrowRightLeft size={18} />}
              </div>
              <div className="overflow-hidden">
                 <p className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{trx.keterangan || t.no_description}</p>
                 <div className="flex items-center gap-2 mt-0.5">
                   <span className="text-[10px] font-bold text-slate-400">
                     {new Date(trx.tanggal).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' })}
                   </span>
                   <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                   <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tight">{trx.nama_kategori || t.no_category}</span>
                 </div>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-black whitespace-nowrap ${trx.tipe === 'masuk' ? 'text-emerald-600' : 'text-slate-900'}`}>
                {trx.tipe === 'masuk' ? '+' : '-'} {formatRupiah(parseFloat(trx.nominal))}
              </p>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${trx.tipe === 'masuk' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {trx.tipe === 'masuk' ? t.income : t.expense}
                </span>
                <span className="text-[9px] text-blue-500 font-bold">{t.edit}</span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
));
