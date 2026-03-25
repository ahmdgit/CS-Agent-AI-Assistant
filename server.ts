import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize SQLite database
const db = new Database('database.sqlite');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS macros (
    id TEXT PRIMARY KEY,
    summary TEXT NOT NULL,
    response TEXT NOT NULL,
    dateAdded TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS updates (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    dateAdded TEXT NOT NULL,
    severity TEXT,
    link TEXT,
    imageUrl TEXT
  );

  CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    fields TEXT NOT NULL,
    dateAdded INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS links (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    description TEXT NOT NULL,
    dateAdded TEXT NOT NULL
  );
`);

// Auth Routes
app.get('/api/auth/check', (req, res) => {
  res.json({ isSet: false }); // Client relies on PIN
});

app.post('/api/auth/login', (req, res) => {
  const { pin } = req.body;
  const correctPin = process.env.APP_PIN || '1234';
  if (pin === correctPin) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Invalid PIN' });
  }
});

// Macros Routes
app.get('/api/macros', (req, res) => {
  const macros = db.prepare('SELECT * FROM macros ORDER BY dateAdded DESC').all();
  res.json(macros);
});

app.post('/api/macros', (req, res) => {
  const { id, summary, response, dateAdded } = req.body;
  db.prepare('INSERT OR IGNORE INTO macros (id, summary, response, dateAdded) VALUES (?, ?, ?, ?)').run(id, summary, response, dateAdded);
  res.json({ success: true });
});

app.put('/api/macros/:id', (req, res) => {
  const { summary, response } = req.body;
  db.prepare('UPDATE macros SET summary = ?, response = ? WHERE id = ?').run(summary, response, req.params.id);
  res.json({ success: true });
});

app.delete('/api/macros/:id', (req, res) => {
  db.prepare('DELETE FROM macros WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Updates Routes
app.get('/api/updates', (req, res) => {
  const updates = db.prepare('SELECT * FROM updates ORDER BY dateAdded DESC').all();
  res.json(updates);
});

app.post('/api/updates', (req, res) => {
  const { id, title, content, dateAdded, severity, link, imageUrl } = req.body;
  db.prepare('INSERT OR IGNORE INTO updates (id, title, content, dateAdded, severity, link, imageUrl) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, title, content, dateAdded, severity, link, imageUrl);
  res.json({ success: true });
});

app.put('/api/updates/:id', (req, res) => {
  const { title, content, severity, link, imageUrl } = req.body;
  db.prepare('UPDATE updates SET title = ?, content = ?, severity = ?, link = ?, imageUrl = ? WHERE id = ?').run(title, content, severity, link, imageUrl, req.params.id);
  res.json({ success: true });
});

app.delete('/api/updates/:id', (req, res) => {
  db.prepare('DELETE FROM updates WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Templates Routes
app.get('/api/templates', (req, res) => {
  const templates = db.prepare('SELECT * FROM templates ORDER BY dateAdded DESC').all();
  const parsedTemplates = templates.map((t: any) => ({
    ...t,
    fields: JSON.parse(t.fields)
  }));
  res.json(parsedTemplates);
});

app.post('/api/templates', (req, res) => {
  const { id, name, fields, dateAdded } = req.body;
  db.prepare('INSERT OR IGNORE INTO templates (id, name, fields, dateAdded) VALUES (?, ?, ?, ?)').run(id, name, JSON.stringify(fields), dateAdded);
  res.json({ success: true });
});

app.put('/api/templates/:id', (req, res) => {
  const { name, fields } = req.body;
  db.prepare('UPDATE templates SET name = ?, fields = ? WHERE id = ?').run(name, JSON.stringify(fields), req.params.id);
  res.json({ success: true });
});

app.delete('/api/templates/:id', (req, res) => {
  db.prepare('DELETE FROM templates WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Links Routes
app.get('/api/links', (req, res) => {
  const links = db.prepare('SELECT * FROM links ORDER BY dateAdded DESC').all();
  res.json(links);
});

app.post('/api/links', (req, res) => {
  const { id, url, description, dateAdded } = req.body;
  db.prepare('INSERT OR IGNORE INTO links (id, url, description, dateAdded) VALUES (?, ?, ?, ?)').run(id, url, description, dateAdded);
  res.json({ success: true });
});

app.put('/api/links/:id', (req, res) => {
  const { url, description } = req.body;
  db.prepare('UPDATE links SET url = ?, description = ? WHERE id = ?').run(url, description, req.params.id);
  res.json({ success: true });
});

app.delete('/api/links/:id', (req, res) => {
  db.prepare('DELETE FROM links WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
