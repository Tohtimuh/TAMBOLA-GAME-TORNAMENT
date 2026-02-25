import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || "https://pimgdtpvrgdhuhjfdios.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpbWdkdHB2cmdkaHVoamZkaW9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MzM1OTksImV4cCI6MjA4NzUwOTU5OX0.NbTse3874yW8Cn8qz5nkY2gQV-1AA4MMJsd46YysI9c";

const supabase = createClient(supabaseUrl, supabaseKey);

// We'll keep the SQLite for now as a fallback or migration source, 
// but we'll start routing requests to Supabase.
import Database from "better-sqlite3";
const db = new Database("tambola.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    mobile TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    balance REAL DEFAULT 0,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    ticket_price REAL NOT NULL,
    prize_pool TEXT NOT NULL, -- JSON string for prize distribution
    start_time DATETIME NOT NULL,
    status TEXT DEFAULT 'upcoming', -- upcoming, live, finished
    called_numbers TEXT DEFAULT '[]', -- JSON array
    min_players INTEGER DEFAULT 2,
    max_players INTEGER DEFAULT 100,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER,
    user_id INTEGER,
    numbers TEXT NOT NULL, -- JSON 2D array
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(game_id) REFERENCES games(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    amount REAL NOT NULL,
    type TEXT NOT NULL, -- deposit, withdraw, buy_ticket, win
    status TEXT DEFAULT 'pending', -- pending, approved, rejected, completed
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER,
    ticket_id INTEGER,
    user_id INTEGER,
    claim_type TEXT NOT NULL, -- early5, top_line, middle_line, bottom_line, full_house
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(game_id) REFERENCES games(id),
    FOREIGN KEY(ticket_id) REFERENCES tickets(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  INSERT OR IGNORE INTO settings (key, value) VALUES ('deposit_qr_url', '');
`);

// Force reset admin on every startup for debugging
const adminMobile = "9999999999";
let adminPassword = "1234";
const hashedPassword = bcrypt.hashSync(adminPassword, 10);

async function resetAdmin() {
  console.log(`Resetting admin user in Supabase with password: ${adminPassword}...`);
  
  // Delete existing admin if any
  await supabase.from('users').delete().eq('mobile', adminMobile);
  
  // Insert new admin
  const { error } = await supabase.from('users').insert([{
    name: "Admin",
    mobile: adminMobile,
    password: hashedPassword,
    role: "admin",
    balance: 0
  }]);

  if (error) {
    console.error('Error resetting admin in Supabase:', JSON.stringify(error, null, 2));
  } else {
    console.log(`Admin reset in Supabase. Mobile: ${adminMobile}, Password: ${adminPassword}`);
  }

  // Also reset in SQLite for backward compatibility during migration
  db.prepare("DELETE FROM users WHERE mobile = ?").run(adminMobile);
  db.prepare("INSERT INTO users (name, mobile, password, role, balance) VALUES (?, ?, ?, ?, ?)").run(
    "Admin", adminMobile, hashedPassword, "admin", 0
  );
}

resetAdmin();

const app = express();
app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server });

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-tambola-key";

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

const isAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  next();
};

// --- API Routes ---

// Auth
app.post("/api/auth/register", async (req, res) => {
  const { name, mobile, password } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    // Insert into Supabase
    const { data, error } = await supabase
      .from('users')
      .insert([{ name, mobile, password: hashedPassword }])
      .select()
      .single();

    if (error) {
      console.error('Supabase Insert Error:', JSON.stringify(error, null, 2));
      throw error;
    }

    // Fallback to SQLite for now
    db.prepare("INSERT INTO users (name, mobile, password) VALUES (?, ?, ?)").run(
      name, mobile, hashedPassword
    );
    
    res.json({ id: data.id });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { mobile, password } = req.body;
  const trimmedMobile = mobile?.trim();
  console.log(`Login attempt for mobile: [${trimmedMobile}], password length: ${password?.length}`);
  
  // Try Supabase first
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('mobile', trimmedMobile)
    .single();

  if (error || !user) {
    console.log(`User not found in Supabase for mobile: [${trimmedMobile}]`);
    // Fallback to SQLite
    const sqliteUser: any = db.prepare("SELECT * FROM users WHERE mobile = ?").get(trimmedMobile);
    if (!sqliteUser) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    const isMatch = bcrypt.compareSync(password, sqliteUser.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: sqliteUser.id, mobile: sqliteUser.mobile, role: sqliteUser.role }, JWT_SECRET);
    return res.json({ token, user: { id: sqliteUser.id, name: sqliteUser.name, mobile: sqliteUser.mobile, role: sqliteUser.role, balance: sqliteUser.balance } });
  }

  const isMatch = bcrypt.compareSync(password, user.password);
  console.log(`Password match for [${trimmedMobile}]: ${isMatch}`);

  if (!isMatch) {
    console.log(`Password mismatch for [${trimmedMobile}]`);
    return res.status(401).json({ error: "Invalid credentials" });
  }
  
  const token = jwt.sign({ id: user.id, mobile: user.mobile, role: user.role }, JWT_SECRET);
  res.json({ token, user: { id: user.id, name: user.name, mobile: user.mobile, role: user.role, balance: user.balance } });
});

app.get("/api/user/profile", authenticate, async (req: any, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, mobile, balance, role')
    .eq('id', req.user.id)
    .single();
  
  if (error || !user) {
    // Fallback to SQLite
    const sqliteUser = db.prepare("SELECT id, name, mobile, balance, role FROM users WHERE id = ?").get(req.user.id);
    return res.json(sqliteUser);
  }
  res.json(user);
});

// Wallet
app.get("/api/wallet/history", authenticate, async (req: any, res) => {
  const { data: history, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    const sqliteHistory = db.prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
    return res.json(sqliteHistory);
  }
  res.json(history);
});

app.post("/api/wallet/deposit", authenticate, async (req: any, res) => {
  const { amount, details } = req.body;
  const { error } = await supabase
    .from('transactions')
    .insert([{ user_id: req.user.id, amount, type: 'deposit', status: 'pending', details }]);

  if (error) {
    db.prepare("INSERT INTO transactions (user_id, amount, type, status, details) VALUES (?, ?, 'deposit', 'pending', ?)").run(
      req.user.id, amount, details
    );
  }
  res.json({ success: true });
});

app.post("/api/wallet/withdraw", authenticate, async (req: any, res) => {
  const { amount, details } = req.body;
  
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('balance')
    .eq('id', req.user.id)
    .single();

  if (userError || !user) return res.status(400).json({ error: "User not found" });
  if (user.balance < amount) return res.status(400).json({ error: "Insufficient balance" });
  
  const { error } = await supabase
    .from('transactions')
    .insert([{ user_id: req.user.id, amount, type: 'withdraw', status: 'pending', details }]);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Games
app.get("/api/games/upcoming", async (req, res) => {
  const { data: games, error } = await supabase
    .from('games')
    .select('*')
    .or('status.eq.upcoming,status.eq.live')
    .order('start_time', { ascending: true });

  if (error) {
    const sqliteGames = db.prepare("SELECT * FROM games WHERE status = 'upcoming' OR status = 'live' ORDER BY start_time ASC").all();
    return res.json(sqliteGames);
  }
  res.json(games);
});

app.get("/api/games/:id", async (req, res) => {
  const { data: game, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) {
    const sqliteGame = db.prepare("SELECT * FROM games WHERE id = ?").get(req.params.id);
    return res.json(sqliteGame);
  }
  res.json(game);
});

app.post("/api/games/:id/book", authenticate, async (req: any, res) => {
  const { count } = req.body;
  
  // Get game details
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('*')
    .eq('id', req.params.id)
    .single();
  
  if (gameError || !game) return res.status(404).json({ error: "Game not found" });
  if (game.status !== 'upcoming') return res.status(400).json({ error: "Game has already started or finished" });

  // Check capacity
  const { count: ticketCount, error: countError } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('game_id', req.params.id);

  if (countError) return res.status(500).json({ error: "Error checking capacity" });
  if ((ticketCount || 0) + count > game.max_players) return res.status(400).json({ error: "Game is full" });

  // Check user balance
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('balance')
    .eq('id', req.user.id)
    .single();

  if (userError || !user) return res.status(400).json({ error: "User not found" });
  
  const totalCost = game.ticket_price * count;
  if (user.balance < totalCost) return res.status(400).json({ error: "Insufficient balance" });

  // Generate tickets
  const generateTicket = () => {
    const ticket = Array(3).fill(null).map(() => Array(9).fill(0));
    const usedNumbers = new Set();
    for (let row = 0; row < 3; row++) {
      let count = 0;
      const cols = [];
      while (count < 5) {
        const col = Math.floor(Math.random() * 9);
        if (!cols.includes(col)) { cols.push(col); count++; }
      }
      cols.forEach(col => {
        let num;
        do {
          const min = col * 10 + 1;
          const max = col === 8 ? 90 : (col + 1) * 10;
          num = Math.floor(Math.random() * (max - min + 1)) + min;
        } while (usedNumbers.has(num));
        usedNumbers.add(num);
        ticket[row][col] = num;
      });
    }
    return ticket;
  };

  try {
    // 1. Deduct balance
    const { error: updateError } = await supabase
      .from('users')
      .update({ balance: user.balance - totalCost })
      .eq('id', req.user.id);
    if (updateError) throw updateError;

    // 2. Record transaction
    await supabase.from('transactions').insert([{
      user_id: req.user.id,
      amount: totalCost,
      type: 'buy_ticket',
      status: 'completed',
      details: `Bought ${count} tickets for game ${game.name}`
    }]);

    // 3. Create tickets
    const ticketsToInsert = [];
    for (let i = 0; i < count; i++) {
      ticketsToInsert.push({
        game_id: game.id,
        user_id: req.user.id,
        numbers: JSON.stringify(generateTicket())
      });
    }
    const { error: ticketInsertError } = await supabase.from('tickets').insert(ticketsToInsert);
    if (ticketInsertError) throw ticketInsertError;

    res.json({ success: true });
  } catch (err: any) {
    console.error('Booking error:', err);
    res.status(500).json({ error: "Failed to complete booking" });
  }
});

app.get("/api/my-tickets/:gameId", authenticate, async (req: any, res) => {
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('game_id', req.params.gameId)
    .eq('user_id', req.user.id);

  if (error) {
    const sqliteTickets = db.prepare("SELECT * FROM tickets WHERE game_id = ? AND user_id = ?").all(req.params.gameId, req.user.id);
    return res.json(sqliteTickets);
  }
  res.json(tickets);
});

// Admin Routes
app.get("/api/admin/stats", authenticate, isAdmin, async (req, res) => {
  const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'user');
  const { count: totalGames } = await supabase.from('games').select('*', { count: 'exact', head: true });
  
  const { data: deposits } = await supabase.from('transactions').select('amount').eq('type', 'deposit').eq('status', 'approved');
  const { data: withdrawals } = await supabase.from('transactions').select('amount').eq('type', 'withdraw').eq('status', 'approved');

  const totalDeposits = deposits?.reduce((sum, tx) => sum + tx.amount, 0) || 0;
  const totalWithdrawals = withdrawals?.reduce((sum, tx) => sum + tx.amount, 0) || 0;

  res.json({ 
    totalUsers: { count: totalUsers }, 
    totalGames: { count: totalGames }, 
    totalDeposits: { total: totalDeposits }, 
    totalWithdrawals: { total: totalWithdrawals } 
  });
});

app.get("/api/admin/users", authenticate, isAdmin, async (req, res) => {
  const { data: users, error } = await supabase.from('users').select('id, name, mobile, balance, role');
  res.json(users || []);
});

app.post("/api/admin/games", authenticate, isAdmin, async (req, res) => {
  const { name, ticket_price, prize_pool, start_time, min_players, max_players } = req.body;
  const { data, error } = await supabase
    .from('games')
    .insert([{ name, ticket_price, prize_pool, start_time, min_players, max_players }])
    .select()
    .single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.json({ id: data.id });
});

app.get("/api/admin/transactions", authenticate, isAdmin, async (req, res) => {
  const { data: txs, error } = await supabase
    .from('transactions')
    .select(`
      *,
      users (name)
    `)
    .order('created_at', { ascending: false });

  // Flatten the user name
  const formattedTxs = txs?.map(tx => ({
    ...tx,
    user_name: (tx as any).users?.name
  }));

  res.json(formattedTxs || []);
});

app.get("/api/settings/deposit-qr", async (req, res) => {
  const { data, error } = await supabase.from('settings').select('value').eq('key', 'deposit_qr_url').single();
  res.json({ url: data?.value || "" });
});

app.post("/api/admin/settings/deposit-qr", authenticate, isAdmin, async (req, res) => {
  const { url } = req.body;
  await supabase.from('settings').upsert({ key: 'deposit_qr_url', value: url });
  res.json({ success: true });
});

app.post("/api/admin/transactions/:id/approve", authenticate, isAdmin, async (req, res) => {
  const { data: tx, error: txError } = await supabase.from('transactions').select('*').eq('id', req.params.id).single();
  if (txError || !tx) return res.status(404).json({ error: "Transaction not found" });
  if (tx.status !== 'pending') return res.status(400).json({ error: "Already processed" });

  try {
    // 1. Update transaction status
    await supabase.from('transactions').update({ status: 'approved' }).eq('id', req.params.id);
    
    // 2. Update user balance
    const { data: user } = await supabase.from('users').select('balance').eq('id', tx.user_id).single();
    if (user) {
      let newBalance = user.balance;
      if (tx.type === 'deposit') newBalance += tx.amount;
      else if (tx.type === 'withdraw') newBalance -= tx.amount;
      
      await supabase.from('users').update({ balance: newBalance }).eq('id', tx.user_id);
    }
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to approve transaction" });
  }
});

// WebSocket Logic for Live Game
const clients = new Map<number, Set<WebSocket>>();

wss.on("connection", async (ws, req) => {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const gameId = parseInt(url.searchParams.get("gameId") || "0");
  
  if (gameId) {
    if (!clients.has(gameId)) clients.set(gameId, new Set());
    clients.get(gameId)!.add(ws);
    
    // Send current state
    const { data: game } = await supabase.from('games').select('called_numbers').eq('id', gameId).single();
    const called = typeof game?.called_numbers === 'string' ? JSON.parse(game.called_numbers) : (game?.called_numbers || []);
    ws.send(JSON.stringify({ type: "INIT", calledNumbers: called }));
  }

  ws.on("close", () => {
    if (gameId && clients.has(gameId)) {
      clients.get(gameId)!.delete(ws);
    }
  });
});

app.get("/api/admin/games/:id/stats", authenticate, isAdmin, async (req, res) => {
  const { count: ticketCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('game_id', req.params.id);
  const { data: game } = await supabase.from('games').select('ticket_price').eq('id', req.params.id).single();
  
  res.json({ 
    ticketCount: ticketCount || 0, 
    totalCollection: (ticketCount || 0) * (game?.ticket_price || 0) 
  });
});

app.post("/api/admin/games/:id/update-prizes", authenticate, isAdmin, async (req, res) => {
  const { prize_pool } = req.body;
  await supabase.from('games').update({ prize_pool }).eq('id', req.params.id);
  res.json({ success: true });
});

// Admin manual number call
app.post("/api/admin/games/:id/call-number", authenticate, isAdmin, async (req, res) => {
  const { number } = req.body;
  const { data: game, error } = await supabase.from('games').select('called_numbers').eq('id', req.params.id).single();
  if (error || !game) return res.status(404).json({ error: "Game not found" });
  
  const called = typeof game.called_numbers === 'string' ? JSON.parse(game.called_numbers) : (game.called_numbers || []);
  if (called.includes(number)) return res.status(400).json({ error: "Number already called" });
  
  called.push(number);
  await supabase.from('games').update({ called_numbers: called, status: 'live' }).eq('id', req.params.id);
  
  // Broadcast to game room
  const gameClients = clients.get(parseInt(req.params.id));
  if (gameClients) {
    gameClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "NUMBER_CALLED", number }));
      }
    });
  }
  
  res.json({ success: true });
});

// Start Server
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
