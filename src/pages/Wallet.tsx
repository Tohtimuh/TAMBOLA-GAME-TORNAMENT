import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { Transaction } from '../types';
import { Wallet, ArrowUpRight, ArrowDownLeft, History, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'motion/react';

const WalletPage: React.FC = () => {
  const { user, token } = useAuth();
  const [history, setHistory] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetch('/api/wallet/history', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(setHistory);
    }
  }, [token]);

  const handleAction = async (type: 'deposit' | 'withdraw') => {
    if (!amount || isNaN(Number(amount))) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/wallet/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount: Number(amount), details })
      });
      if (res.ok) {
        alert(`${type === 'deposit' ? 'Deposit' : 'Withdrawal'} request submitted!`);
        setAmount('');
        setDetails('');
        // Refresh history
        fetch('/api/wallet/history', {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(setHistory);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Balance Card */}
        <div className="lg:col-span-1">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-indigo-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="flex items-center space-x-2 mb-8 opacity-80">
                <Wallet className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-widest">Total Balance</span>
              </div>
              <div className="text-5xl font-extrabold mb-2 tracking-tight">₹{user?.balance.toFixed(2)}</div>
              <div className="text-indigo-200 text-sm">Available for tournaments</div>
            </div>
            {/* Decorative circles */}
            <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -left-12 -top-12 w-48 h-48 bg-indigo-400/20 rounded-full blur-3xl"></div>
          </motion.div>

          <div className="mt-8 bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-zinc-900 mb-6">Quick Actions</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">Payment Details / Bank Info</label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  rows={3}
                  placeholder="UPI ID or Bank Account Details"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleAction('deposit')}
                  disabled={loading}
                  className="flex items-center justify-center bg-emerald-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  Deposit
                </button>
                <button
                  onClick={() => handleAction('withdraw')}
                  disabled={loading}
                  className="flex items-center justify-center bg-zinc-900 text-white px-4 py-3 rounded-xl font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  <ArrowDownLeft className="w-4 h-4 mr-2" />
                  Withdraw
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-900 flex items-center">
                <History className="w-5 h-5 mr-2 text-indigo-600" />
                Transaction History
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-50 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {history.map((tx) => (
                    <tr key={tx.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg mr-3 ${
                            tx.type === 'deposit' || tx.type === 'win' 
                              ? 'bg-emerald-100 text-emerald-600' 
                              : 'bg-red-100 text-red-600'
                          }`}>
                            {tx.type === 'deposit' || tx.type === 'win' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                          </div>
                          <span className="font-bold text-zinc-900 capitalize">{tx.type.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-zinc-900">₹{tx.amount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          tx.status === 'approved' || tx.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : tx.status === 'pending'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                        }`}>
                          {tx.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                          {tx.status === 'approved' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {tx.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                          {tx.status}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-500">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 italic">
                        No transactions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
