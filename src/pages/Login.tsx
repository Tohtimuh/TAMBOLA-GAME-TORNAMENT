import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { motion } from 'motion/react';
import { Phone, Lock, ArrowRight } from 'lucide-react';

const Login: React.FC = () => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, password })
    });
    if (res.ok) {
      const data = await res.json();
      login(data.token, data.user);
      navigate('/');
    } else {
      alert('Invalid credentials');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-zinc-50 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-zinc-200"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Welcome Back</h2>
          <p className="text-zinc-500 mt-2">Enter your credentials to access your account</p>
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
                placeholder="+91 98765 43210"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center group"
          >
            Sign In
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
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
