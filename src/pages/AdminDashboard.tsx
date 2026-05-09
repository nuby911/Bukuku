import React, { useState, useEffect, useCallback } from 'react';
import { Users, LogOut, Search, Loader2, Trash2, Globe } from 'lucide-react';

const translations = {
  id: {
    admin_panel: "Admin Panel",
    welcome: "Selamat datang kembali",
    logout: "Logout",
    error_fetch: "Gagal mengambil data user",
    error_system: "Terjadi kesalahan sistem",
    error_header: "Error: ",
    error_footer: ". Mohon pastikan Server Database telah tersambung atau refresh halaman.",
    all_users: "Daftar Seluruh Pengguna",
    search_placeholder: "Cari nama atau email...",
    id_user: "ID User",
    full_name: "Nama Lengkap",
    email: "Email",
    role: "Role",
    registered_since: "Terdaftar Sejak",
    last_login: "Terakhir Login",
    action: "Aksi",
    loading_users: "Memuat riwayat pengguna...",
    no_users: "Belum ada data pengguna yang terdaftar.",
    never_login: "Belum Pernah Login",
    delete_user: "Hapus Pengguna",
    confirm_delete: "Apakah Anda yakin ingin menghapus akun",
    confirm_delete_warn: "? Semua data transaksi akan terhapus permanen.",
    failed_delete: "Gagal menghapus pengguna"
  },
  en: {
    admin_panel: "Admin Panel",
    welcome: "Welcome back",
    logout: "Logout",
    error_fetch: "Failed to fetch user data",
    error_system: "A system error occurred",
    error_header: "Error: ",
    error_footer: ". Please ensure the database server is connected or refresh the page.",
    all_users: "All Users List",
    search_placeholder: "Search name or email...",
    id_user: "User ID",
    full_name: "Full Name",
    email: "Email",
    role: "Role",
    registered_since: "Registered Since",
    last_login: "Last Login",
    action: "Action",
    loading_users: "Loading users history...",
    no_users: "No users registered yet.",
    never_login: "Never Logged In",
    delete_user: "Delete User",
    confirm_delete: "Are you sure you want to delete the account",
    confirm_delete_warn: "? All transaction data will be permanently deleted.",
    failed_delete: "Failed to delete user"
  }
};

export default function AdminDashboard({ user, token, onLogout }: { user: any, token: string, onLogout: () => void }) {
  const [lang, setLang] = useState<'id' | 'en'>('id');
  const t = translations[lang];

  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{id: string, name: string} | null>(null);
  
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users?limit=50&search=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || t.error_fetch);
      }
      
      setUsersList(data.data);
      setError('');
    } catch (err: any) {
      setError(err.message || t.error_system);
    } finally {
      setLoading(false);
    }
  }, [token, searchQuery]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [fetchUsers]);

  const handleDeleteClick = (id: string, name: string) => {
    setUserToDelete({ id, name });
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    if (!userToDelete) return;
    
    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.failed_delete);
      }

      setError(''); // Clear any previous errors
      fetchUsers(); // Refresh the list
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err: any) {
      setError(err.message);
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 mb-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div>
             <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">{t.admin_panel}</h1>
             <p className="text-sm md:text-base text-slate-500">{t.welcome}, {user.nama_lengkap}.</p>
           </div>
           <div className="flex w-full md:w-auto items-center justify-between md:justify-end gap-2 md:gap-4">
             <button 
               onClick={() => setLang(lang === 'id' ? 'en' : 'id')} 
               className="flex flex-1 md:flex-none justify-center items-center gap-2 text-slate-500 hover:text-blue-600 bg-white hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors font-medium border border-slate-200 shadow-sm"
             >
               <Globe size={16} /> {lang === 'id' ? 'EN' : 'ID'}
             </button>
             <button onClick={onLogout} className="flex flex-1 md:flex-none justify-center items-center gap-2 text-rose-600 hover:text-white hover:bg-rose-600 px-4 py-2 rounded-lg transition-colors font-semibold border border-rose-200 shadow-sm">
               <LogOut size={18} /> {t.logout}
             </button>
           </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 pb-12">
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl font-medium">
            {t.error_header}{error}{t.error_footer}
          </div>
        )}

        <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="font-bold flex items-center gap-2 text-slate-800"><Users /> {t.all_users}</h2>
            <div className="relative w-full md:w-auto">
               <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
               <input 
                 type="text" 
                 placeholder={t.search_placeholder} 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full md:w-64 pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
               />
            </div>
          </div>
          {/* Desktop View Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-4">{t.id_user}</th>
                  <th className="px-6 py-4">{t.full_name}</th>
                  <th className="px-6 py-4">{t.email}</th>
                  <th className="px-6 py-4">{t.role}</th>
                  <th className="px-6 py-4">{t.registered_since}</th>
                  <th className="px-6 py-4">{t.last_login}</th>
                  <th className="px-6 py-4 text-center">{t.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                         <Loader2 size={24} className="animate-spin text-blue-500 mb-2" />
                         {t.loading_users}
                      </div>
                    </td>
                  </tr>
                ) : usersList.length === 0 ? (
                   <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                      {t.no_users}
                    </td>
                  </tr>
                ) : (
                  usersList.map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">{u.id.split('-')[0]}***</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{u.nama_lengkap}</td>
                      <td className="px-6 py-4">{u.email}</td>
                      <td className="px-6 py-4">
                         <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {u.role}
                         </span>
                      </td>
                      <td className="px-6 py-4">{new Date(u.created_at).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US')}</td>
                      <td className="px-6 py-4 text-slate-400 font-medium">{u.last_login_at ? new Date(u.last_login_at).toLocaleString(lang === 'id' ? 'id-ID' : 'en-US') : t.never_login}</td>
                      <td className="px-6 py-4 text-center">
                        {u.id !== user.id && u.role !== 'super_admin' && (
                          <button 
                            onClick={() => handleDeleteClick(u.id, u.nama_lengkap)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                            title={t.delete_user}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
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
                {t.loading_users}
              </div>
            ) : usersList.length === 0 ? (
               <div className="py-12 text-center text-slate-500 font-medium">
                 {t.no_users}
               </div>
            ) : (
              usersList.map((u: any) => (
                <div key={u.id} className="p-4 flex flex-col gap-3 hover:bg-slate-50 active:bg-slate-100 transition-colors">
                  <div className="flex justify-between items-start gap-2">
                    <div className="overflow-hidden">
                      <p className="font-bold text-slate-900 truncate">{u.nama_lengkap}</p>
                      <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 ${u.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {u.role}
                    </span>
                  </div>
                  <div className="flex justify-between items-end mt-1">
                    <div className="text-[10px] text-slate-400 space-y-1">
                      <p><span className="font-semibold text-slate-500">{t.registered_since}:</span> {new Date(u.created_at).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US')}</p>
                      <p><span className="font-semibold text-slate-500">{t.last_login}:</span> {u.last_login_at ? new Date(u.last_login_at).toLocaleString(lang === 'id' ? 'id-ID' : 'en-US') : t.never_login}</p>
                    </div>
                    {u.id !== user.id && u.role !== 'super_admin' && (
                      <button 
                        onClick={() => handleDeleteClick(u.id, u.nama_lengkap)}
                        className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-100 shrink-0"
                        title={t.delete_user}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-[1.5rem] w-full max-w-sm p-6 shadow-2xl relative">
            <h3 className="text-xl font-bold text-slate-900 mb-2">{t.delete_user}</h3>
            <p className="text-slate-600 mb-6">
              {t.confirm_delete} <strong>{userToDelete?.name}</strong>{t.confirm_delete_warn}
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={executeDelete}
                className="px-4 py-2 font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-200 transition-all hover:scale-105 active:scale-95"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

