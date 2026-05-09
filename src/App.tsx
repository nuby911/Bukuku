import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Wallet, LayoutDashboard, ArrowRightLeft, PieChart, Users, LogOut, ChevronRight
} from 'lucide-react';
import LandingPage from './LandingPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('bukukas_token');
    const savedUser = localStorage.getItem('bukukas_user');
    
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        // If JSON parsing fails, clear bad data
        localStorage.removeItem('bukukas_token');
        localStorage.removeItem('bukukas_user');
      }
    }
    setIsInitializing(false);
  }, []);

  const handleLoginSuccess = (userAuthData: any, tokenString: string) => {
    setCurrentUser(userAuthData);
    setToken(tokenString);
    localStorage.setItem('bukukas_token', tokenString);
    localStorage.setItem('bukukas_user', JSON.stringify(userAuthData));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('bukukas_token');
    localStorage.removeItem('bukukas_user');
  };

  if (isInitializing) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-medium">Memuat sesi...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        <Route 
          path="/login" 
          element={!currentUser ? <LoginPage onAuthSuccess={handleLoginSuccess} /> : <Navigate to="/dashboard" />} 
        />
        
        <Route 
          path="/dashboard" 
          element={
            currentUser && token ? (
              currentUser.role === 'super_admin' ? 
                <AdminDashboard user={currentUser} token={token} onLogout={handleLogout} /> 
                : 
                <UserDashboard user={currentUser} token={token} onLogout={handleLogout} />
            ) : <Navigate to="/login" />
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}
