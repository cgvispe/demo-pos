const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('./auth');

// GET /api/categories — public
router.get('/', (req, res) => {
  res.json(db.getCategories());
});

// PUT /api/categories — manager only, replaces full list
router.put('/', authMiddleware, (req, res) => {
  if (req.user.role !== 'manager') return res.status(403).json({ error: 'Forbidden' });
  const { categories } = req.body;
  if (!Array.isArray(categories)) return res.status(400).json({ error: 'categories must be an array' });
  const clean = categories.map(c => c.trim()).filter(Boolean);
  db.saveCategories(clean);
  res.json(clean);
});

// POST /api/categories — add one
router.post('/', authMiddleware, (req, res) => {
  if (req.user.role !== 'manager') return res.status(403).json({ error: 'Forbidden' });
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  const cats = db.getCategories();
  const clean = name.trim();
  if (cats.includes(clean)) return res.status(409).json({ error: 'Category already exists' });
  cats.push(clean);
  cats.sort();
  db.saveCategories(cats);
  res.status(201).json(cats);
});

// DELETE /api/categories/:name — remove one
router.delete('/:name', authMiddleware, (req, res) => {
  if (req.user.role !== 'manager') return res.status(403).json({ error: 'Forbidden' });
  const name = decodeURIComponent(req.params.name);
  let cats = db.getCategories();
  cats = cats.filter(c => c !== name);
  db.saveCategories(cats);
  res.json(cats);
});

module.exports = router;
