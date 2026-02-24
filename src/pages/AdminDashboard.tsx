import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { Users, Trophy, ArrowUpRight, ArrowDownLeft, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';

const AdminDashboard: React.FC = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [qrUrl, setQrUrl] = useState('');
  const [updatingQr, setUpdatingQr] = useState(false);

  useEffect(() => {
    fetch('/api/admin/stats', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setStats);

    fetch('/api/settings/deposit-qr')
      .then(res => res.json())
      .then(data => setQrUrl(data.url));
  }, [token]);

  const handleUpdateQr = async () => {
    setUpdatingQr(true);
    try {
      const res = await fetch('/api/admin/settings/deposit-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ url: qrUrl })
      });
      if (res.ok) {
        toast.success('QR Code URL updated successfully!');
      } else {
        toast.error('Failed to update QR Code URL');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setUpdatingQr(false);
    }
  };

  if (!stats || stats.error) return (
    <div className="p-8 text-center text-zinc-500">
      {stats?.error ? `Error: ${stats.error}` : 'Loading stats...'}
    </div>
  );

  const cards = [
    { label: 'Total Users', value: stats.totalUsers?.count ?? 0, icon: Users, color: 'bg-blue-500' },
    { label: 'Total Games', value: stats.totalGames?.count ?? 0, icon: Trophy, color: 'bg-indigo-500' },
    { label: 'Total Deposits', value: `₹${(stats.totalDeposits?.total || 0).toFixed(2)}`, icon: ArrowUpRight, color: 'bg-emerald-500' },
    { label: 'Total Withdrawals', value: `₹${(stats.totalWithdrawals?.total || 0).toFixed(2)}`, icon: ArrowDownLeft, color: 'bg-red-500' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.h1 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-4xl font-black text-zinc-900 mb-10 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-500"
      >
        Admin Overview
      </motion.h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5 }}
            className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/20 p-8 shadow-xl hover:shadow-2xl transition-all group"
          >
            <div className={`${card.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
              <card.icon className="w-7 h-7" />
            </div>
            <div className="text-zinc-500 text-sm font-black uppercase tracking-widest mb-2">{card.label}</div>
            <div className="text-4xl font-black text-zinc-900 tracking-tighter">{card.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/20 p-10 shadow-xl">
          <h3 className="text-2xl font-black mb-8 flex items-center text-zinc-900">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center mr-4">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
            </div>
            Revenue Insights
          </h3>
          <div className="h-72 flex items-center justify-center text-zinc-400 font-medium italic border-4 border-dashed border-zinc-50 rounded-[2rem] bg-zinc-50/30">
            Chart visualization coming soon...
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/20 p-10 shadow-xl">
          <h3 className="text-2xl font-black mb-8 flex items-center text-zinc-900">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mr-4">
              <Trophy className="w-6 h-6 text-emerald-600" />
            </div>
            Deposit QR Code
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">QR Code Image URL</label>
              <input 
                type="text"
                value={qrUrl}
                onChange={(e) => setQrUrl(e.target.value)}
                placeholder="https://example.com/qr-code.png"
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            {qrUrl && (
              <div className="flex justify-center p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <img src={qrUrl} alt="Deposit QR" className="max-h-48 rounded-lg shadow-md" referrerPolicy="no-referrer" />
              </div>
            )}
            <button
              onClick={handleUpdateQr}
              disabled={updatingQr}
              className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-black hover:bg-zinc-800 transition-all disabled:opacity-50"
            >
              {updatingQr ? 'Updating...' : 'Update QR Code'}
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-black rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden lg:col-span-2">
          <div className="relative z-10">
            <h3 className="text-2xl font-black mb-8">System Status</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center py-4 border-b border-white/5">
                <span className="text-zinc-400 font-medium">Database</span>
                <span className="text-emerald-400 font-black flex items-center bg-emerald-400/10 px-4 py-1.5 rounded-full">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></div>
                  Healthy
                </span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-white/5">
                <span className="text-zinc-400 font-medium">WebSocket Server</span>
                <span className="text-emerald-400 font-black flex items-center bg-emerald-400/10 px-4 py-1.5 rounded-full">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></div>
                  Connected
                </span>
              </div>
              <div className="flex justify-between items-center py-4">
                <span className="text-zinc-400 font-medium">API Latency</span>
                <span className="text-indigo-400 font-black bg-indigo-400/10 px-4 py-1.5 rounded-full">12ms</span>
              </div>
            </div>
          </div>
          {/* Decorative glow */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
