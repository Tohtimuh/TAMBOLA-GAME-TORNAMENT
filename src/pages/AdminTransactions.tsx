import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { Transaction } from '../types';
import { CheckCircle2, XCircle, Clock, User, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const AdminTransactions: React.FC = () => {
  const { token } = useAuth();
  const [txs, setTxs] = useState<Transaction[]>([]);

  const fetchTxs = () => {
    fetch('/api/admin/transactions', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setTxs);
  };

  useEffect(fetchTxs, [token]);

  const handleApprove = async (id: number) => {
    const res = await fetch(`/api/admin/transactions/${id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) fetchTxs();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-zinc-900 mb-8">Transaction Requests</h1>
      
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-zinc-50 text-zinc-500 text-xs font-bold uppercase tracking-wider">
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Details</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {txs.map(tx => (
              <tr key={tx.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center mr-3">
                      <User className="w-4 h-4 text-zinc-500" />
                    </div>
                    <span className="font-bold text-zinc-900">{tx.user_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    {tx.type === 'deposit' ? <ArrowUpRight className="w-4 h-4 mr-2 text-emerald-500" /> : <ArrowDownLeft className="w-4 h-4 mr-2 text-red-500" />}
                    <span className="capitalize text-sm font-medium">{tx.type}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-bold text-zinc-900">₹{tx.amount.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    tx.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {tx.status === 'pending' ? <Clock className="w-3 h-3 mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                    {tx.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-zinc-500 max-w-xs truncate">{tx.details}</td>
                <td className="px-6 py-4">
                  {tx.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApprove(tx.id)}
                        className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
                        title="Approve"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                      <button
                        className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        title="Reject"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTransactions;
