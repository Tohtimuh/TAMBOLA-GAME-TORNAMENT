import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { User as UserType } from '../types';
import { Users, Shield, ShieldAlert, Search } from 'lucide-react';

const AdminUsers: React.FC = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setUsers);
  }, [token]);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
    u.mobile.includes(search)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">User Management</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500 w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-zinc-50 text-zinc-500 text-xs font-bold uppercase tracking-wider">
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Balance</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filteredUsers.map(u => (
              <tr key={u.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-zinc-900">{u.name}</div>
                  <div className="text-xs text-zinc-500">ID: #{u.id}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-zinc-900 font-medium">{u.mobile}</div>
                  {u.email && <div className="text-xs text-zinc-500">{u.email}</div>}
                </td>
                <td className="px-6 py-4 font-bold text-indigo-600">₹{u.balance.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-zinc-100 text-zinc-700'
                  }`}>
                    {u.role === 'admin' ? <Shield className="w-3 h-3 mr-1" /> : <Users className="w-3 h-3 mr-1" />}
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-sm font-bold text-red-600 hover:text-red-700 flex items-center">
                    <ShieldAlert className="w-4 h-4 mr-1" />
                    Block
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;
