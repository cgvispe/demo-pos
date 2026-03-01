const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const sesami = require('../sesami/client');
const db = require('../db');
const { authMiddleware } = require('./auth');

// GET /api/sesami/heartbeat — check device reachability (no login needed)
router.get('/heartbeat', async (req, res) => {
  try {
    const data = await sesami.getHeartbeat();
    res.json(data);
  } catch (err) {
    res.status(503).json({ error: 'Device unreachable', detail: err.message });
  }
});

// GET /api/sesami/status — device status (no login needed)
router.get('/status', async (req, res) => {
  try {
    const data = await sesami.getStatus();
    res.json(data);
  } catch (err) {
    res.status(503).json({ error: 'Device unreachable', detail: err.message });
  }
});

/**
 * POST /api/sesami/payin
 * Body: { amount: number (in euros/unit), cartItems: [...], cartTotal: number }
 * Starts a full PayIn Amount transaction:
 *   1. Login to device
 *   2. Start operation type=10 with amount in CENTS
 * Returns { operationId, sessionStarted: true }
 */
router.post('/payin', authMiddleware, async (req, res) => {
  const { amount, cartItems, cartTotal } = req.body;
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    // Login to device
    await sesami.login();
    
    // Convert to cents (integer)
    const amountCents = Math.round(amount * 100);
    
    // Start PayIn Amount operation
    const result = await sesami.startPayinAmount(amountCents);
    
    if (result.result !== 0) {
      await sesami.logout();
      return res.status(409).json({ error: 'Could not start operation. Device may be busy.', result });
    }

    res.json({ 
      operationId: result.operationId,
      amountCents,
      sessionStarted: true
    });
  } catch (err) {
    try { await sesami.logout(); } catch {}
    res.status(503).json({ error: 'RC5000 error', detail: err.message });
  }
});

/**
 * GET /api/sesami/operation/:operationId — poll operation status
 * Returns the raw OperationStatus from device plus derived info
 */
router.get('/operation/:operationId', authMiddleware, async (req, res) => {
  try {
    const data = await sesami.getOperationStatus(req.params.operationId);
    
    // Extract totalIN and totalOUT from currencies array
    let totalIn = 0;
    let totalOut = 0;
    
    if (data.currencies && data.currencies.length > 0) {
      const currency = data.currencies[0]; // first currency
      if (currency.totals) {
        totalIn = (currency.totals.totalIN || 0) / 100; // cents to units
        totalOut = (currency.totals.totalOUT || 0) / 100;
      }
    }

    res.json({ ...data, totalIn, totalOut });
  } catch (err) {
    res.status(503).json({ error: 'RC5000 error', detail: err.message });
  }
});

/**
 * POST /api/sesami/operation/finish
 * Finishes current operation and logs out
 */
router.post('/operation/finish', authMiddleware, async (req, res) => {
  const { operationId, cartItems, cartTotal, amountReceived, change } = req.body;
  
  try {
    const finishResult = await sesami.finishOperation();
    await sesami.logout();
    
    // Record transaction
    const settings = db.getSettings();
    const tx = {
      id: uuidv4(),
      date: new Date().toISOString(),
      items: cartItems || [],
      total: cartTotal || 0,
      currency: settings.currency,
      amountReceived: amountReceived || cartTotal,
      change: change || 0,
      sesamiOperationId: operationId,
      status: 'completed',
      cashier: req.user.name
    };
    db.saveTransaction(tx);
    
    res.json({ ok: true, transaction: tx, finishResult });
  } catch (err) {
    try { await sesami.logout(); } catch {}
    res.status(503).json({ error: 'RC5000 error', detail: err.message });
  }
});

/**
 * POST /api/sesami/operation/cancel
 * Cancels current operation and logs out
 */
router.post('/operation/cancel', authMiddleware, async (req, res) => {
  try {
    const cancelResult = await sesami.cancelOperation();
    await sesami.logout();
    res.json({ ok: true, cancelResult });
  } catch (err) {
    try { await sesami.logout(); } catch {}
    res.status(503).json({ error: 'RC5000 error', detail: err.message });
  }
});

// GET /api/sesami/transactions — get transaction history
router.get('/transactions', authMiddleware, (req, res) => {
  const txs = db.getTransactions();
  res.json(txs.slice().reverse()); // newest first
});

module.exports = router;
