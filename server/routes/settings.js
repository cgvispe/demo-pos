const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authMiddleware } = require('./auth');

const logoStorage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => cb(null, `logo-${uuidv4()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage: logoStorage, limits: { fileSize: 2 * 1024 * 1024 } });

// GET /api/settings — public (theme needed for all users)
router.get('/', (req, res) => {
  const settings = db.getSettings();
  // Don't expose secret key to frontend
  const safe = { ...settings, sesami: { ...settings.sesami, secretKey: undefined } };
  res.json(safe);
});

// PUT /api/settings — manager only
router.put('/', authMiddleware, upload.single('logo'), (req, res) => {
  if (req.user.role !== 'manager') return res.status(403).json({ error: 'Forbidden' });

  const current = db.getSettings();
  let body;
  try {
    body = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;
  } catch {
    body = req.body;
  }

  const updated = {
    ...current,
    ...body,
    sesami: { ...current.sesami, ...(body.sesami || {}) },
    theme: { ...current.theme, ...(body.theme || {}) }
  };

  if (req.file) {
    updated.theme.logoUrl = `/uploads/${req.file.filename}`;
  }

  db.saveSettings(updated);
  // Return safe version
  res.json({ ...updated, sesami: { ...updated.sesami, secretKey: undefined } });
});

// GET /api/settings/sesami-full — manager only (includes secret key for editing)
router.get('/sesami-full', authMiddleware, (req, res) => {
  if (req.user.role !== 'manager') return res.status(403).json({ error: 'Forbidden' });
  res.json(db.getSettings().sesami);
});

module.exports = router;
