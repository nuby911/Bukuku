import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, LayoutDashboard, ArrowRightLeft, PieChart, Users, LogOut, ChevronRight
} from 'lucide-react';

// Lazy load components for better performance
const LandingPage = lazy(() => import('./LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));

// Loading component for Suspense
const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="text-slate-500 font-medium">Bentar ya...</p>
  </div>
);

const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

function AppRoutes({ currentUser, token, handleLoginSuccess, handleLogout }: any) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageLoader />}>
        <Routes location={location}>
          <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
          
          <Route path="/verify-email" element={<PageTransition><VerifyEmailPage /></PageTransition>} />

          <Route 
            path="/login" 
            element={
              <PageTransition>
                {!currentUser ? <LoginPage onAuthSuccess={handleLoginSuccess} /> : <Navigate to="/dashboard" />}
              </PageTransition>
            } 
          />
          
          <Route 
            path="/dashboard" 
            element={
              <PageTransition>
                {currentUser && token ? (
                  currentUser.role === 'super_admin' ? 
                    <AdminDashboard user={currentUser} token={token} onLogout={handleLogout} /> 
                    : 
                    <UserDashboard user={currentUser} token={token} onLogout={handleLogout} />
                ) : <Navigate to="/login" />}
              </PageTransition>
            } 
          />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

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
      <AppRoutes 
        currentUser={currentUser} 
        token={token} 
        handleLoginSuccess={handleLoginSuccess} 
        handleLogout={handleLogout} 
      />
    </BrowserRouter>
  );
}
