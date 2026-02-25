import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { Ticket, Transaction } from '../types';
import { Trophy, Wallet, History, Star, TrendingUp, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      const fetchData = async () => {
        try {
          const [ticketsRes, txRes] = await Promise.all([
            fetch('/api/wallet/history', { headers: { Authorization: `Bearer ${token}` } }), // Just to get some data for now
            fetch('/api/wallet/history', { headers: { Authorization: `Bearer ${token}` } })
          ]);
          const txData = await txRes.json();
          setTransactions(txData);
          setLoading(false);
        } catch (error) {
          console.error(error);
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [token]);

  if (loading) return <div className="p-8 text-center">Loading Dashboard...</div>;

  const totalWins = transactions.filter(t => t.type === 'win').reduce((sum, t) => sum + t.amount, 0);
  const totalGames = transactions.filter(t => t.type === 'buy_ticket').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Welcome back, {user?.name}! 👋</h1>
        <p className="text-zinc-500 font-medium">Here's what's happening with your Tambola account.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
            <Wallet className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-1">Balance</div>
          <div className="text-2xl font-black text-zinc-900">₹{user?.balance.toFixed(2)}</div>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-1">Total Wins</div>
          <div className="text-2xl font-black text-zinc-900">₹{totalWins.toFixed(2)}</div>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
            <Trophy className="w-6 h-6 text-amber-600" />
          </div>
          <div className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-1">Games Played</div>
          <div className="text-2xl font-black text-zinc-900">{totalGames}</div>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mb-4">
            <Star className="w-6 h-6 text-rose-600" />
          </div>
          <div className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-1">Loyalty Points</div>
          <div className="text-2xl font-black text-zinc-900">1,250</div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-zinc-900 flex items-center">
                <History className="w-5 h-5 mr-2 text-indigo-600" />
                Recent Activity
              </h3>
              <Link to="/wallet" className="text-sm font-bold text-indigo-600 hover:underline">View All</Link>
            </div>
            <div className="divide-y divide-zinc-100">
              {transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="px-8 py-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${
                      tx.type === 'win' ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      {tx.type === 'win' ? <Trophy className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-bold text-zinc-900 capitalize">{tx.type.replace('_', ' ')}</div>
                      <div className="text-xs text-zinc-500">{new Date(tx.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className={`font-black ${tx.type === 'win' ? 'text-emerald-600' : 'text-zinc-900'}`}>
                    {tx.type === 'win' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="p-12 text-center text-zinc-500 italic">No recent activity</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-4">Ready for a game?</h3>
              <p className="text-zinc-400 mb-6 font-medium">There are 3 live tournaments happening right now. Join and win big!</p>
              <Link to="/" className="inline-flex items-center bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/20">
                Browse Games
                <Calendar className="w-4 h-4 ml-2" />
              </Link>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-indigo-600/20 rounded-full blur-2xl"></div>
          </div>

          <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm">
            <h3 className="text-lg font-bold text-zinc-900 mb-4">Quick Tips</h3>
            <ul className="space-y-4 text-sm text-zinc-600 font-medium">
              <li className="flex items-start">
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                Buy multiple tickets to increase your winning probability.
              </li>
              <li className="flex items-start">
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                Join the game room 5 minutes early to avoid missing any numbers.
              </li>
              <li className="flex items-start">
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                Keep an eye on the Prize Pool distribution for each game.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
