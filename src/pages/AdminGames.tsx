import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { Game } from '../types';
import { Plus, Play, Trash2, Calendar, Users, Trophy, Settings2, Calculator } from 'lucide-react';

const AdminGames: React.FC = () => {
  const { token } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [managingPrizes, setManagingPrizes] = useState<number | null>(null);
  const [gameStats, setGameStats] = useState<{ ticketCount: number, totalCollection: number } | null>(null);
  const [prizePool, setPrizePool] = useState<any>({});

  const [formData, setFormData] = useState({
    name: '',
    ticket_price: '',
    start_time: '',
    min_players: '2',
    max_players: '100',
    prize_pool: {
      full_house: '40%',
      top_line: '15%',
      middle_line: '15%',
      bottom_line: '15%',
      early_5: '10%'
    }
  });

  const fetchGames = () => {
    fetch('/api/games/upcoming')
      .then(res => res.json())
      .then(setGames);
  };

  useEffect(fetchGames, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/games', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ...formData,
        ticket_price: Number(formData.ticket_price),
        min_players: Number(formData.min_players),
        max_players: Number(formData.max_players)
      })
    });
    if (res.ok) {
      setShowForm(false);
      fetchGames();
    }
  };

  const handleManagePrizes = async (game: Game) => {
    setManagingPrizes(game.id);
    setPrizePool(JSON.parse(game.prize_pool));
    const res = await fetch(`/api/admin/games/${game.id}/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const stats = await res.json();
    setGameStats(stats);
  };

  const updatePrizes = async () => {
    if (!managingPrizes) return;
    const res = await fetch(`/api/admin/games/${managingPrizes}/update-prizes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ prize_pool: prizePool })
    });
    if (res.ok) {
      setManagingPrizes(null);
      fetchGames();
    }
  };

  const calculateAmount = (val: string) => {
    if (!gameStats) return '₹0';
    if (val.endsWith('%')) {
      const percent = parseFloat(val.replace('%', ''));
      return `₹${((gameStats.totalCollection * percent) / 100).toFixed(2)}`;
    }
    return val.startsWith('₹') ? val : `₹${val}`;
  };

  const callNumber = async (gameId: number) => {
    const number = prompt('Enter number to call (1-90):');
    if (!number) return;
    const res = await fetch(`/api/admin/games/${gameId}/call-number`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ number: Number(number) })
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Manage Tournaments</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold flex items-center hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create New Game
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-8 mb-12 shadow-lg">
          <h2 className="text-xl font-bold mb-6">Game Details</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Game Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">Ticket Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.ticket_price}
                    onChange={e => setFormData({...formData, ticket_price: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.start_time}
                    onChange={e => setFormData({...formData, start_time: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">Min Players</label>
                  <input
                    type="number"
                    value={formData.min_players}
                    onChange={e => setFormData({...formData, min_players: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">Max Players</label>
                  <input
                    type="number"
                    value={formData.max_players}
                    onChange={e => setFormData({...formData, max_players: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-700">Prize Distribution (%)</h3>
              {Object.entries(formData.prize_pool).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between">
                  <label className="text-sm text-zinc-600 capitalize">{key.replace('_', ' ')}</label>
                  <input
                    type="text"
                    value={val}
                    onChange={e => setFormData({
                      ...formData,
                      prize_pool: { ...formData.prize_pool, [key]: e.target.value }
                    })}
                    className="w-24 px-3 py-1 rounded border border-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
              <div className="pt-4">
                <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                  Create Tournament
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {managingPrizes && gameStats && (
        <div className="bg-zinc-900 text-white rounded-2xl p-8 mb-12 shadow-2xl border border-white/10">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold flex items-center">
                <Calculator className="w-6 h-6 mr-2 text-indigo-400" />
                Calculate Prizes
              </h2>
              <p className="text-zinc-400 mt-1">
                Total Collection: <span className="text-white font-bold">₹{gameStats.totalCollection.toFixed(2)}</span> ({gameStats.ticketCount} Tickets)
              </p>
            </div>
            <button
              onClick={() => setManagingPrizes(null)}
              className="text-zinc-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {Object.entries(prizePool).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between bg-white/5 p-4 rounded-xl">
                  <label className="text-sm font-bold text-zinc-300 capitalize">{key.replace('_', ' ')}</label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="text"
                      value={val as string}
                      onChange={e => setPrizePool({ ...prizePool, [key]: e.target.value })}
                      className="w-24 bg-white/10 border border-white/20 rounded px-3 py-1 text-right outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-indigo-400 font-bold w-24 text-right">{calculateAmount(val as string)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white/5 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold mb-4">Summary</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  You can enter percentages (e.g., 40%) or fixed amounts (e.g., ₹500). 
                  The amounts on the right are calculated based on the current total collection.
                </p>
              </div>
              <button
                onClick={updatePrizes}
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg mt-8"
              >
                Save & Apply Prizes
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {games.map(game => (
          <div key={game.id} className="bg-white rounded-2xl border border-zinc-200 p-6 flex flex-col md:flex-row md:items-center justify-between shadow-sm hover:border-indigo-200 transition-colors">
            <div className="flex items-center space-x-6">
              <div className="bg-indigo-100 p-4 rounded-2xl text-indigo-600">
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900">{game.name}</h3>
                <div className="flex space-x-4 mt-1">
                  <span className="text-sm text-zinc-500 flex items-center"><Calendar className="w-4 h-4 mr-1" /> {new Date(game.start_time).toLocaleString()}</span>
                  <span className="text-sm text-zinc-500 flex items-center"><Users className="w-4 h-4 mr-1" /> {game.max_players} Max</span>
                  <span className="text-sm font-bold text-indigo-600">₹{game.ticket_price} / Ticket</span>
                </div>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
              <button
                onClick={() => handleManagePrizes(game)}
                className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg font-bold flex items-center hover:bg-indigo-100 transition-colors"
              >
                <Settings2 className="w-4 h-4 mr-2" />
                Manage Prizes
              </button>
              <button
                onClick={() => callNumber(game.id)}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold flex items-center hover:bg-emerald-700 transition-colors"
              >
                <Play className="w-4 h-4 mr-2" />
                Call Number
              </button>
              <button className="bg-zinc-100 text-zinc-600 px-4 py-2 rounded-lg font-bold flex items-center hover:bg-red-50 hover:text-red-600 transition-colors">
                <Trash2 className="w-4 h-4 mr-2" />
                Cancel
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminGames;

