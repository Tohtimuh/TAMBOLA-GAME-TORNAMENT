import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, User, Phone, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', mobile: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success('Registration successful! Please login.');
        navigate('/login');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Registration failed');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-600 to-violet-600" />
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Create Account</h2>
          <p className="text-zinc-500 mt-2">Join the ultimate Tambola community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="John Doe"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-2">Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="tel"
                required
                value={formData.mobile}
                onChange={e => setFormData({...formData, mobile: e.target.value})}
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
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center group disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
            {!loading && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-zinc-500">
          Already have an account? <Link to="/login" className="text-indigo-600 font-bold hover:underline">Sign in</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
