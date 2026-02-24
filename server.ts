import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
`);

// Create initial admin if not exists
const adminMobile = "9999999999";
const adminExists = db.prepare("SELECT * FROM users WHERE mobile = ?").get(adminMobile);
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync(process.env.ADMIN_PASSWORD || "admin123", 10);
  db.prepare("INSERT INTO users (name, mobile, password, role, balance) VALUES (?, ?, ?, ?, ?)").run(
    "Admin", adminMobile, hashedPassword, "admin", 0
  );
}

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
app.post("/api/auth/register", (req, res) => {
  const { name, mobile, password } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare("INSERT INTO users (name, mobile, password) VALUES (?, ?, ?)").run(
      name, mobile, hashedPassword
    );
    res.json({ id: result.lastInsertRowid });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/auth/login", (req, res) => {
  const { mobile, password } = req.body;
  const user: any = db.prepare("SELECT * FROM users WHERE mobile = ?").get(mobile);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ id: user.id, mobile: user.mobile, role: user.role }, JWT_SECRET);
  res.json({ token, user: { id: user.id, name: user.name, mobile: user.mobile, role: user.role, balance: user.balance } });
});

app.get("/api/user/profile", authenticate, (req: any, res) => {
  const user = db.prepare("SELECT id, name, mobile, balance, role FROM users WHERE id = ?").get(req.user.id);
  res.json(user);
});

// Wallet
app.get("/api/wallet/history", authenticate, (req: any, res) => {
  const history = db.prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
  res.json(history);
});

app.post("/api/wallet/deposit", authenticate, (req: any, res) => {
  const { amount, details } = req.body;
  db.prepare("INSERT INTO transactions (user_id, amount, type, status, details) VALUES (?, ?, 'deposit', 'pending', ?)").run(
    req.user.id, amount, details
  );
  res.json({ success: true });
});

app.post("/api/wallet/withdraw", authenticate, (req: any, res) => {
  const { amount, details } = req.body;
  const user: any = db.prepare("SELECT balance FROM users WHERE id = ?").get(req.user.id);
  if (user.balance < amount) return res.status(400).json({ error: "Insufficient balance" });
  
  db.prepare("INSERT INTO transactions (user_id, amount, type, status, details) VALUES (?, ?, 'withdraw', 'pending', ?)").run(
    req.user.id, amount, details
  );
  res.json({ success: true });
});

// Games
app.get("/api/games/upcoming", (req, res) => {
  const games = db.prepare("SELECT * FROM games WHERE status = 'upcoming' OR status = 'live' ORDER BY start_time ASC").all();
  res.json(games);
});

app.get("/api/games/:id", (req, res) => {
  const game = db.prepare("SELECT * FROM games WHERE id = ?").get(req.params.id);
  res.json(game);
});

app.post("/api/games/:id/book", authenticate, (req: any, res) => {
  const { count } = req.body;
  const game: any = db.prepare("SELECT * FROM games WHERE id = ?").get(req.params.id);
  
  if (game.status !== 'upcoming') {
    return res.status(400).json({ error: "Game has already started or finished" });
  }

  const currentTickets: any = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE game_id = ?").get(req.params.id);
  if (currentTickets.count + count > game.max_players) {
    return res.status(400).json({ error: "Game is full" });
  }

  const user: any = db.prepare("SELECT balance FROM users WHERE id = ?").get(req.user.id);
  
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
        if (!cols.includes(col)) {
          cols.push(col);
          count++;
        }
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

  db.transaction(() => {
    db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").run(totalCost, req.user.id);
    db.prepare("INSERT INTO transactions (user_id, amount, type, status, details) VALUES (?, ?, 'buy_ticket', 'completed', ?)").run(
      req.user.id, totalCost, `Bought ${count} tickets for game ${game.name}`
    );
    
    for (let i = 0; i < count; i++) {
      const ticketNumbers = generateTicket();
      db.prepare("INSERT INTO tickets (game_id, user_id, numbers) VALUES (?, ?, ?)").run(
        game.id, req.user.id, JSON.stringify(ticketNumbers)
      );
    }
  })();

  res.json({ success: true });
});

app.get("/api/my-tickets/:gameId", authenticate, (req: any, res) => {
  const tickets = db.prepare("SELECT * FROM tickets WHERE game_id = ? AND user_id = ?").all(req.params.gameId, req.user.id);
  res.json(tickets);
});

// Admin Routes
app.get("/api/admin/stats", authenticate, isAdmin, (req, res) => {
  const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user'").get();
  const totalGames = db.prepare("SELECT COUNT(*) as count FROM games").get();
  const totalDeposits = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'deposit' AND status = 'approved'").get();
  const totalWithdrawals = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'withdraw' AND status = 'approved'").get();
  res.json({ totalUsers, totalGames, totalDeposits, totalWithdrawals });
});

app.get("/api/admin/users", authenticate, isAdmin, (req, res) => {
  const users = db.prepare("SELECT id, name, mobile, balance, role FROM users").all();
  res.json(users);
});

app.post("/api/admin/games", authenticate, isAdmin, (req, res) => {
  const { name, ticket_price, prize_pool, start_time, min_players, max_players } = req.body;
  const result = db.prepare("INSERT INTO games (name, ticket_price, prize_pool, start_time, min_players, max_players) VALUES (?, ?, ?, ?, ?, ?)").run(
    name, ticket_price, JSON.stringify(prize_pool), start_time, min_players, max_players
  );
  res.json({ id: result.lastInsertRowid });
});

app.get("/api/admin/transactions", authenticate, isAdmin, (req, res) => {
  const txs = db.prepare(`
    SELECT t.*, u.name as user_name 
    FROM transactions t 
    JOIN users u ON t.user_id = u.id 
    ORDER BY t.created_at DESC
  `).all();
  res.json(txs);
});

app.post("/api/admin/transactions/:id/approve", authenticate, isAdmin, (req, res) => {
  const tx: any = db.prepare("SELECT * FROM transactions WHERE id = ?").get(req.params.id);
  if (tx.status !== 'pending') return res.status(400).json({ error: "Already processed" });

  db.transaction(() => {
    db.prepare("UPDATE transactions SET status = 'approved' WHERE id = ?").run(req.params.id);
    if (tx.type === 'deposit') {
      db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(tx.amount, tx.user_id);
    } else if (tx.type === 'withdraw') {
      db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").run(tx.amount, tx.user_id);
    }
  })();
  res.json({ success: true });
});

// WebSocket Logic for Live Game
const clients = new Map<number, Set<WebSocket>>();

wss.on("connection", (ws, req) => {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const gameId = parseInt(url.searchParams.get("gameId") || "0");
  
  if (gameId) {
    if (!clients.has(gameId)) clients.set(gameId, new Set());
    clients.get(gameId)!.add(ws);
    
    // Send current state
    const game: any = db.prepare("SELECT called_numbers FROM games WHERE id = ?").get(gameId);
    ws.send(JSON.stringify({ type: "INIT", calledNumbers: JSON.parse(game.called_numbers) }));
  }

  ws.on("close", () => {
    if (gameId && clients.has(gameId)) {
      clients.get(gameId)!.delete(ws);
    }
  });
});

app.get("/api/admin/games/:id/stats", authenticate, isAdmin, (req, res) => {
  const ticketCount = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE game_id = ?").get(req.params.id);
  const game = db.prepare("SELECT ticket_price FROM games WHERE id = ?").get(req.params.id);
  res.json({ ticketCount: (ticketCount as any).count, totalCollection: (ticketCount as any).count * (game as any).ticket_price });
});

app.post("/api/admin/games/:id/update-prizes", authenticate, isAdmin, (req, res) => {
  const { prize_pool } = req.body;
  db.prepare("UPDATE games SET prize_pool = ? WHERE id = ?").run(JSON.stringify(prize_pool), req.params.id);
  res.json({ success: true });
});

// Admin manual number call
app.post("/api/admin/games/:id/call-number", authenticate, isAdmin, (req, res) => {
  const { number } = req.body;
  const game: any = db.prepare("SELECT called_numbers FROM games WHERE id = ?").get(req.params.id);
  const called = JSON.parse(game.called_numbers);
  
  if (called.includes(number)) return res.status(400).json({ error: "Number already called" });
  
  called.push(number);
  db.prepare("UPDATE games SET called_numbers = ?, status = 'live' WHERE id = ?").run(JSON.stringify(called), req.params.id);
  
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
