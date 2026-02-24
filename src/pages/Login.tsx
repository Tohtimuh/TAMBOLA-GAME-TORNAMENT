import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { motion } from 'motion/react';
import { Phone, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Login: React.FC = () => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: mobile.trim(), password: password })
      });
      const data = await res.json();
      
      if (res.ok) {
        login(data.token, data.user);
        toast.success(`Welcome back, ${data.user.name}!`);
        if (data.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        toast.error(data.error || 'Invalid credentials');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-600 to-violet-600" />
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Welcome Back</h2>
          <p className="text-zinc-500 mt-2">Enter your credentials to access your account</p>
          <button 
            type="button"
            onClick={() => { setMobile('9999999999'); setPassword('1234'); }}
            className="mt-4 text-xs text-indigo-500 hover:text-indigo-700 font-bold underline"
          >
            Debug: Auto-fill Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-2">Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="tel"
                required
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="9999999999"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center group disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
            {!loading && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-zinc-500">
          Don't have an account? <Link to="/register" className="text-indigo-600 font-bold hover:underline">Register now</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
