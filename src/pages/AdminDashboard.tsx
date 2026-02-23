import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { Users, Trophy, ArrowUpRight, ArrowDownLeft, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

const AdminDashboard: React.FC = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/stats', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setStats);
  }, [token]);

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
      <h1 className="text-3xl font-bold text-zinc-900 mb-8">Admin Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm"
          >
            <div className={`${card.color} w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg`}>
              <card.icon className="w-6 h-6" />
            </div>
            <div className="text-zinc-500 text-sm font-bold uppercase tracking-wider mb-1">{card.label}</div>
            <div className="text-3xl font-extrabold text-zinc-900">{card.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
            Revenue Insights
          </h3>
          <div className="h-64 flex items-center justify-center text-zinc-400 italic border-2 border-dashed border-zinc-100 rounded-xl">
            Chart visualization coming soon...
          </div>
        </div>
        <div className="bg-zinc-900 rounded-2xl p-8 text-white shadow-xl">
          <h3 className="text-xl font-bold mb-6">System Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-white/10">
              <span className="text-zinc-400">Database</span>
              <span className="text-emerald-400 font-bold flex items-center">
                <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></div>
                Healthy
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-white/10">
              <span className="text-zinc-400">WebSocket Server</span>
              <span className="text-emerald-400 font-bold flex items-center">
                <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></div>
                Connected
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-zinc-400">API Latency</span>
              <span className="text-indigo-400 font-bold">12ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
