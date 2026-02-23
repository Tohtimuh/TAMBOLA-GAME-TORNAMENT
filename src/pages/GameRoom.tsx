import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Game, Ticket } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Users, Bell, CheckCircle2 } from 'lucide-react';

const GameRoom: React.FC = () => {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [lastCalled, setLastCalled] = useState<number | null>(null);
  const [bookingCount, setBookingCount] = useState(1);
  const [booking, setBooking] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/games/${id}`)
      .then(res => res.json())
      .then(setGame);

    if (token) {
      fetch(`/api/my-tickets/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(setTickets);
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}?gameId=${id}`);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'INIT') {
        setCalledNumbers(data.calledNumbers);
        if (data.calledNumbers.length > 0) {
          setLastCalled(data.calledNumbers[data.calledNumbers.length - 1]);
        }
      } else if (data.type === 'NUMBER_CALLED') {
        setCalledNumbers(prev => [...prev, data.number]);
        setLastCalled(data.number);
      }
    };

    return () => {
      socket.close();
    };
  }, [id, token]);

  const handleBook = async () => {
    if (!token) return navigate('/login');
    setBooking(true);
    try {
      const res = await fetch(`/api/games/${id}/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ count: bookingCount })
      });
      if (res.ok) {
        const newTickets = await fetch(`/api/my-tickets/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json());
        setTickets(newTickets);
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } finally {
      setBooking(false);
    }
  };

  if (!game) return <div className="p-8 text-center">Loading game...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Game Info & Numbers */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-zinc-900">{game.name}</h1>
                <p className="text-zinc-500">Starts: {new Date(game.start_time).toLocaleString()}</p>
              </div>
              <div className="text-center">
                <div className="text-sm text-zinc-500 uppercase font-bold tracking-widest mb-1">Last Number</div>
                <motion.div 
                  key={lastCalled}
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center text-3xl font-bold shadow-lg"
                >
                  {lastCalled || '--'}
                </motion.div>
              </div>
            </div>

            <div className="grid grid-cols-10 gap-2">
              {Array.from({ length: 90 }, (_, i) => i + 1).map(num => (
                <div
                  key={num}
                  className={`aspect-square flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
                    calledNumbers.includes(num)
                      ? 'bg-indigo-600 text-white scale-105 shadow-md'
                      : 'bg-zinc-100 text-zinc-400'
                  }`}
                >
                  {num}
                </div>
              ))}
            </div>
          </div>

          {/* Tickets Section */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-zinc-900 flex items-center">
                <Trophy className="w-6 h-6 mr-2 text-amber-500" />
                Your Tickets ({tickets.length})
              </h2>
              {game.status === 'upcoming' && (
                <div className="flex items-center space-x-3 bg-white p-2 rounded-xl border border-zinc-200 shadow-sm">
                  <input 
                    type="number" 
                    min="1" 
                    max="10" 
                    value={bookingCount}
                    onChange={(e) => setBookingCount(parseInt(e.target.value))}
                    className="w-16 px-2 py-1 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                  />
                  <button
                    onClick={handleBook}
                    disabled={booking}
                    className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {booking ? 'Booking...' : `Buy More (₹${(game.ticket_price * bookingCount).toFixed(2)})`}
                  </button>
                </div>
              )}
            </div>
            
            {tickets.length === 0 ? (
              <div className="bg-indigo-50 rounded-2xl p-12 text-center border border-indigo-100">
                <p className="text-indigo-900 font-bold text-lg mb-6">Ready to play? Book your tickets now!</p>
                <div className="flex items-center justify-center space-x-4">
                  <input 
                    type="number" 
                    min="1" 
                    max="10" 
                    value={bookingCount}
                    onChange={(e) => setBookingCount(parseInt(e.target.value))}
                    className="w-24 px-4 py-3 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xl font-bold text-center"
                  />
                  <button
                    onClick={handleBook}
                    disabled={booking}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200 disabled:opacity-50"
                  >
                    {booking ? 'Booking...' : `Book Tickets (₹${(game.ticket_price * bookingCount).toFixed(2)})`}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tickets.map((ticket) => {
                  const numbers = JSON.parse(ticket.numbers);
                  return (
                    <div key={ticket.id} className="bg-white border-2 border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-zinc-50 px-4 py-2 border-b border-zinc-200 flex justify-between items-center">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Ticket #{ticket.id}</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="p-4 grid grid-rows-3 gap-1 bg-white">
                        {numbers.map((row: number[], rIdx: number) => (
                          <div key={rIdx} className="grid grid-cols-9 gap-1">
                            {row.map((num, cIdx) => (
                              <div
                                key={cIdx}
                                className={`aspect-square flex items-center justify-center rounded text-sm font-bold border ${
                                  num === 0 
                                    ? 'bg-zinc-50 border-transparent' 
                                    : calledNumbers.includes(num)
                                      ? 'bg-emerald-500 border-emerald-600 text-white'
                                      : 'bg-white border-zinc-200 text-zinc-700'
                                }`}
                              >
                                {num !== 0 ? num : ''}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-8">
          <div className="bg-zinc-900 text-white rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Bell className="w-5 h-5 mr-2 text-indigo-400" />
              Live Updates
            </h3>
            <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {calledNumbers.slice().reverse().map((num, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                  <span className="text-zinc-400 text-sm">Number Called</span>
                  <span className="bg-white/10 px-3 py-1 rounded-lg font-bold text-indigo-400">{num}</span>
                </div>
              ))}
              {calledNumbers.length === 0 && (
                <p className="text-zinc-500 text-center py-4 italic">Waiting for game to start...</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-zinc-900 mb-4">Prize Distribution</h3>
            <div className="space-y-3">
              {game.prize_pool ? Object.entries(JSON.parse(game.prize_pool)).map(([key, val], i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-zinc-100 last:border-0">
                  <span className="text-zinc-600 capitalize">{key.replace('_', ' ')}</span>
                  <span className="font-bold text-indigo-600">{val as string}</span>
                </div>
              )) : (
                <p className="text-zinc-400 text-sm italic">No prize pool defined</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameRoom;
