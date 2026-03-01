const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authMiddleware } = require('./auth');

// GET /api/users — manager only, returns cashiers (never managers)
router.get('/', authMiddleware, (req, res) => {
  if (req.user.role !== 'manager') return res.status(403).json({ error: 'Forbidden' });
  const users = db.getUsers()
    .filter(u => u.role === 'cashier')
    .map(u => ({ id: u.id, username: u.username, name: u.name, role: u.role }));
  res.json(users);
});

// POST /api/users — create cashier
router.post('/', authMiddleware, async (req, res) => {
  if (req.user.role !== 'manager') return res.status(403).json({ error: 'Forbidden' });
  const { username, name, password } = req.body;
  if (!username || !name || !password) {
    return res.status(400).json({ error: 'username, name and password required' });
  }
  const users = db.getUsers();
  if (users.find(u => u.username === username)) {
    return res.status(409).json({ error: 'Username already exists' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = { id: uuidv4(), username, name, passwordHash, role: 'cashier' };
  users.push(user);
  db.saveUsers(users);
  res.status(201).json({ id: user.id, username: user.username, name: user.name, role: user.role });
});

// PUT /api/users/:id — update cashier name/password
router.put('/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'manager') return res.status(403).json({ error: 'Forbidden' });
  const users = db.getUsers();
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  if (users[idx].role !== 'cashier') return res.status(403).json({ error: 'Cannot edit manager accounts' });

  const { name, password, username } = req.body;
  if (name) users[idx].name = name;
  if (username) {
    const conflict = users.find(u => u.username === username && u.id !== req.params.id);
    if (conflict) return res.status(409).json({ error: 'Username already exists' });
    users[idx].username = username;
  }
  if (password) users[idx].passwordHash = await bcrypt.hash(password, 10);

  db.saveUsers(users);
  res.json({ id: users[idx].id, username: users[idx].username, name: users[idx].name, role: users[idx].role });
});

// DELETE /api/users/:id — remove cashier
router.delete('/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 'manager') return res.status(403).json({ error: 'Forbidden' });
  let users = db.getUsers();
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role !== 'cashier') return res.status(403).json({ error: 'Cannot delete manager accounts' });
  users = users.filter(u => u.id !== req.params.id);
  db.saveUsers(users);
  res.json({ ok: true });
});

module.exports = router;
