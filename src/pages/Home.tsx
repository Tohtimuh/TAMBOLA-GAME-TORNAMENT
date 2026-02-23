import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Game } from '../types';
import { Trophy, Calendar, Users, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

const Home: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/games/upcoming')
      .then(res => res.json())
      .then(data => {
        setGames(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-extrabold text-zinc-900 tracking-tight mb-4"
        >
          Tambola Tournaments
        </motion.h1>
        <p className="text-xl text-zinc-600 max-w-2xl mx-auto">
          Join live games, claim your prizes, and become the Tambola champion.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {games.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:shadow-xl transition-shadow group"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {game.status}
                </div>
                <div className="text-2xl font-bold text-indigo-600">₹{game.ticket_price}</div>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">{game.name}</h3>
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-zinc-600 text-sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(game.start_time).toLocaleString()}
                </div>
                <div className="flex items-center text-zinc-600 text-sm">
                  <Users className="w-4 h-4 mr-2" />
                  Max {game.max_players} Players
                </div>
                <div className="flex items-center text-zinc-600 text-sm">
                  <Trophy className="w-4 h-4 mr-2 text-amber-500" />
                  Prize Pool: Custom
                </div>
              </div>
              <Link
                to={`/game/${game.id}`}
                className="w-full flex items-center justify-center bg-zinc-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-600 transition-colors group-hover:bg-indigo-600"
              >
                Join Game
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Home;
