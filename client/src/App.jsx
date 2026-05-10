import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';

// Pages
import HeroPage from './pages/HeroPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage'; // Contains Event Creation and User Bookings
import AdminDashboard from './pages/AdminDashboard';
import RecommendationsPage from './pages/RecommendationsPage';
import BookingPage from './pages/BookingPage';
import EventPlanningPage from './pages/EventPlanningPage';
import ManualPlannerPage from './pages/ManualPlannerPage';

// Components
import AIChatWidget from './components/AIChatWidget';
import BackButton from './components/BackButton';


// Auth State Provider
const AuthContext = React.createContext();

export const useAuth = () => React.useContext(AuthContext);

const App = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      // Decode token to get user level (simplified)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ id: payload.id, role: payload.role, fullName: payload.fullName });
      } catch (e) {
        setToken(null);
        localStorage.removeItem('token');
      }
    } else {
      setUser(null);
    }
  }, [token]);

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <BrowserRouter>
        <TopBar />
        <Routes>
          <Route path="/" element={<HeroPage />} />
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />} />
          <Route path="/dashboard" element={user ? <DashboardPage /> : <Navigate to="/auth" replace />} />
          <Route path="/admin" element={user && user.role === 'admin' ? <AdminDashboard /> : <Navigate to="/auth" replace />} />
          <Route path="/event-planner" element={user ? <EventPlanningPage /> : <Navigate to="/auth" replace />} />
          <Route path="/manual-planner" element={user ? <ManualPlannerPage /> : <Navigate to="/auth" replace />} />
          <Route path="/recommendations/:eventId" element={user ? <RecommendationsPage /> : <Navigate to="/auth" replace />} />
          <Route path="/book/:eventId" element={user ? <BookingPage /> : <Navigate to="/auth" replace />} />

        </Routes>
        <AIChatWidget />
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

const TopBar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Hide top bar on raw hero (hero has its own)
  if (location.pathname === '/' || location.pathname === '/auth') return null;

  return (
    <header className="fixed top-0 w-full z-50 bg-black/70 backdrop-blur-xl border-b border-white/10 transition-all duration-500">
      <div className="flex justify-between items-center w-full px-8 py-6 max-w-[1440px] mx-auto">
        <div className="flex items-center gap-6">
          {location.pathname !== '/dashboard' && location.pathname !== '/admin' && (
            <BackButton />
          )}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-300">
            <img src="/logo.png" alt="KAIROS" className="h-8 w-auto object-contain brightness-110 contrast-125" />
            <span className="text-xl font-light tracking-[0.3em] text-white">KAIROS</span>
          </Link>
        </div>

        <nav className="flex gap-8 items-center font-label-sm text-label-sm uppercase">
          {user && user.role === 'admin' && (
            <Link to="/admin" className="text-white/60 hover:text-white transition-opacity duration-300">Admin</Link>
          )}
          {user && user.role !== 'admin' && (
            <>
              <Link to="/dashboard" className="text-white/60 hover:text-white transition-opacity duration-300">Dashboard</Link>
              <Link to="/event-planner" className="text-white/60 hover:text-white transition-opacity duration-300">AI Planner</Link>
            </>
          )}
          {user && (
            <button onClick={logout} className="text-primary border border-primary/30 px-6 py-2 rounded hover:bg-primary/10 transition-colors duration-300">
              LOGOUT
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default App;
