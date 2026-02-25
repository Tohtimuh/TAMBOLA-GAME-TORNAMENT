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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-50 via-zinc-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block mb-4 px-4 py-1.5 bg-indigo-600/10 text-indigo-600 rounded-full text-sm font-bold tracking-wide uppercase"
          >
            Live Tournaments
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl font-black text-zinc-900 tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600"
          >
            Tambola Pro
          </motion.h1>
          <p className="text-xl text-zinc-600 max-w-2xl mx-auto leading-relaxed">
            Experience the thrill of live Tambola. Join tournaments, play with friends, and win exciting prizes in real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {games.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-indigo-100 transition-all group relative"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-violet-500" />
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    {game.status}
                  </div>
                  <div className="text-3xl font-black text-indigo-600">₹{game.ticket_price}</div>
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 mb-3 group-hover:text-indigo-600 transition-colors">{game.name}</h3>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center text-zinc-500 font-medium">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center mr-3">
                      <Calendar className="w-4 h-4 text-zinc-600" />
                    </div>
                    {new Date(game.start_time).toLocaleString()}
                  </div>
                  <div className="flex items-center text-zinc-500 font-medium">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center mr-3">
                      <Users className="w-4 h-4 text-zinc-600" />
                    </div>
                    Max {game.max_players} Players
                  </div>
                  <div className="flex items-center text-zinc-500 font-medium">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center mr-3">
                      <Trophy className="w-4 h-4 text-amber-500" />
                    </div>
                    Mega Prize Pool
                  </div>
                </div>
                <Link
                  to={`/game/${game.id}`}
                  className="w-full flex items-center justify-center bg-zinc-900 text-white px-6 py-4 rounded-2xl font-bold hover:bg-indigo-600 transition-all shadow-lg hover:shadow-indigo-200 group-hover:bg-indigo-600"
                >
                  Join Tournament
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* How to Play Section */}
        <div className="bg-zinc-900 rounded-[3rem] p-12 text-white mb-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600/20 blur-[100px] rounded-full" />
          
          <div className="relative z-10">
            <h2 className="text-4xl font-black mb-12 text-center">How to Play Tambola</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-xl font-black">1</div>
                <h3 className="text-xl font-bold">Buy Tickets</h3>
                <p className="text-zinc-400">Choose a tournament and buy your lucky tickets. You can buy multiple tickets to increase your chances.</p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center text-xl font-black">2</div>
                <h3 className="text-xl font-bold">Join Live Game</h3>
                <p className="text-zinc-400">Join the game room before the start time. Numbers will be called one by one in real-time.</p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-xl font-black">3</div>
                <h3 className="text-xl font-bold">Claim Prizes</h3>
                <p className="text-zinc-400">As numbers match your ticket, claim prizes like Early 5, Lines, or the Full House to win big!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats / Trust Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-24">
          {[
            { label: 'Active Players', value: '10k+' },
            { label: 'Daily Games', value: '50+' },
            { label: 'Total Prizes', value: '₹5L+' },
            { label: 'Safe & Secure', value: '100%' },
          ].map((stat, i) => (
            <div key={i} className="text-center p-8 bg-white rounded-3xl border border-zinc-100 shadow-sm">
              <div className="text-3xl font-black text-indigo-600 mb-1">{stat.value}</div>
              <div className="text-sm font-bold text-zinc-400 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
