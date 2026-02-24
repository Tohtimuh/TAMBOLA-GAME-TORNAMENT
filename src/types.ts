import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface User {
  id: number;
  name: string;
  email?: string;
  mobile: string;
  balance: number;
  role: 'user' | 'admin';
}

export interface Game {
  id: number;
  name: string;
  ticket_price: number;
  prize_pool: string; // JSON
  start_time: string;
  status: 'upcoming' | 'live' | 'finished';
  called_numbers: string; // JSON
  min_players: number;
  max_players: number;
}

export interface Ticket {
  id: number;
  game_id: number;
  user_id: number;
  numbers: string; // JSON 2D array
  status: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  amount: number;
  type: 'deposit' | 'withdraw' | 'buy_ticket' | 'win';
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  details: string;
  created_at: string;
  user_name?: string;
}
