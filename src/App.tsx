import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import WalletPage from './pages/Wallet';
import GameRoom from './pages/GameRoom';
import AdminDashboard from './pages/AdminDashboard';
import AdminGames from './pages/AdminGames';
import AdminUsers from './pages/AdminUsers';
import AdminTransactions from './pages/AdminTransactions';

const PrivateRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />;
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/wallet" element={<PrivateRoute><WalletPage /></PrivateRoute>} />
          <Route path="/game/:id" element={<GameRoom />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<PrivateRoute adminOnly><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/games" element={<PrivateRoute adminOnly><AdminGames /></PrivateRoute>} />
          <Route path="/admin/users" element={<PrivateRoute adminOnly><AdminUsers /></PrivateRoute>} />
          <Route path="/admin/transactions" element={<PrivateRoute adminOnly><AdminTransactions /></PrivateRoute>} />
        </Routes>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
