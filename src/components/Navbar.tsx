import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { LayoutDashboard, Wallet, LogOut, Trophy, Users, Settings, History } from 'lucide-react';
import { cn } from '../types';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = user?.role === 'admin' ? [
    { name: 'Admin', path: '/admin', icon: Settings },
    { name: 'Games', path: '/admin/games', icon: Trophy },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Trans.', path: '/admin/transactions', icon: History },
  ] : [
    { name: 'Home', path: '/', icon: Trophy },
    { name: 'Wallet', path: '/wallet', icon: Wallet },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  ];

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center group">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-indigo-200 group-hover:rotate-12 transition-transform">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 tracking-tighter">TAMBOLA PRO</span>
              </Link>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      location.pathname === item.path
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                    )}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <div className="flex flex-col items-end mr-2 sm:mr-4">
                    <span className="text-sm font-semibold text-zinc-900 truncate max-w-[100px]">{user.name}</span>
                    <span className="text-xs text-indigo-600 font-bold">₹{user.balance.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link to="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">Login</Link>
                  <Link to="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Register</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-zinc-200 px-6 py-3 z-50 flex justify-between items-center shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center space-y-1 transition-all",
              location.pathname === item.path
                ? "text-indigo-600 scale-110"
                : "text-zinc-400 hover:text-zinc-600"
            )}
          >
            <item.icon className={cn("w-6 h-6", location.pathname === item.path ? "fill-indigo-50" : "")} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{item.name}</span>
          </Link>
        ))}
      </div>
    </>
  );
};

export default Navbar;
