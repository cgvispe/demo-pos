const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authMiddleware } = require('./auth');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/items — public (cashier needs to see items)
router.get('/', (req, res) => {
  const items = db.getItems();
  res.json(items.filter(i => i.active));
});

// GET /api/items/all — manager only (includes inactive)
router.get('/all', authMiddleware, (req, res) => {
  if (req.user.role !== 'manager') return res.status(403).json({ error: 'Forbidden' });
  res.json(db.getItems());
});

// POST /api/items — manager only
router.post('/', authMiddleware, upload.single('image'), (req, res) => {
  if (req.user.role !== 'manager') return res.status(403).json({ error: 'Forbidden' });
  
  const { code, name, price, category, emoji } = req.body;
  if (!code || !name || !price) {
    return res.status(400).json({ error: 'code, name, price required' });
  }

  const item = {
    id: uuidv4(),
    code,
    name,
    price: parseFloat(price),
    category: category || 'General',
    imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
    emoji: emoji || '🛍️',
    active: true
  };

  const items = db.getItems();
  items.push(item);
  db.saveItems(items);
  res.status(201).json(item);
});

// PUT /api/items/:id — manager only
router.put('/:id', authMiddleware, upload.single('image'), (req, res) => {
  if (req.user.role !== 'manager') return res.status(403).json({ error: 'Forbidden' });

  const items = db.getItems();
  const idx = items.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Item not found' });

  const { code, name, price, category, emoji, active } = req.body;
  items[idx] = {
    ...items[idx],
    ...(code && { code }),
    ...(name && { name }),
    ...(price && { price: parseFloat(price) }),
    ...(category && { category }),
    ...(emoji && { emoji }),
    ...(active !== undefined && { active: active === 'true' || active === true }),
    ...(req.file && { imageUrl: `/uploads/${req.file.filename}` })
  };

  db.saveItems(items);
  res.json(items[idx]);
});

// DELETE /api/items/:id — manager only (soft delete)
router.delete('/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 'manager') return res.status(403).json({ error: 'Forbidden' });

  const items = db.getItems();
  const idx = items.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Item not found' });

  items[idx].active = false;
  db.saveItems(items);
  res.json({ ok: true });
});

module.exports = router;
