const axios = require('axios');
const { generateLoginToken } = require('./jwt');
const db = require('../db');

// In-memory session store (one active session at a time)
let activeSession = {
  token: null,
  expiresAt: null,
  ip: null,
  port: null,
  useHttps: null
};

function getBaseUrl(settings) {
  const { ip, port, useHttps } = settings.sesami;
  const protocol = useHttps ? 'https' : 'http';
  return `${protocol}://${ip}:${port}/api/pos/v3`;
}

function getClient(baseURL, bearerToken) {
  return axios.create({
    baseURL,
    timeout: 5000,
    headers: bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {},
    // Self-signed cert support for https
    httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
  });
}

async function login() {
  const settings = db.getSettings();
  const { ip, port, useHttps, posId, username, secretKey } = settings.sesami;
  const baseURL = getBaseUrl(settings);
  
  const loginToken = generateLoginToken({ username, posId, secretKey });
  
  const client = getClient(baseURL);
  const response = await client.post('/login', { token: loginToken });
  
  activeSession = {
    token: response.data.token,
    expiresAt: response.data.expiration,
    ip, port, useHttps
  };
  
  return response.data;
}

async function logout() {
  if (!activeSession.token) return;
  const settings = db.getSettings();
  const baseURL = getBaseUrl(settings);
  const client = getClient(baseURL, activeSession.token);
  
  try {
    await client.post('/logout');
  } finally {
    activeSession = { token: null, expiresAt: null, ip: null, port: null, useHttps: null };
  }
}

async function getStatus() {
  const settings = db.getSettings();
  const baseURL = getBaseUrl(settings);
  const client = getClient(baseURL);
  const response = await client.get('/status');
  return response.data;
}

async function getHeartbeat() {
  const settings = db.getSettings();
  const baseURL = getBaseUrl(settings);
  const client = getClient(baseURL);
  const response = await client.get('/heartbeat');
  return response.data;
}

/**
 * Start a PayIn Amount operation (type=10)
 * amount must be in CENTS (integer). E.g. €20.00 = 2000
 */
async function startPayinAmount(amountCents) {
  if (!activeSession.token) {
    await login();
  }
  const settings = db.getSettings();
  const baseURL = getBaseUrl(settings);
  const client = getClient(baseURL, activeSession.token);
  
  const response = await client.post('/operations/start', {
    type: 10,
    amount: Math.round(amountCents)
  });
  return response.data;
}

async function getOperationStatus(operationId) {
  if (!activeSession.token) throw new Error('No active session');
  const settings = db.getSettings();
  const baseURL = getBaseUrl(settings);
  const client = getClient(baseURL, activeSession.token);
  const response = await client.get(`/operations/status/${operationId}`);
  return response.data;
}

async function finishOperation() {
  if (!activeSession.token) throw new Error('No active session');
  const settings = db.getSettings();
  const baseURL = getBaseUrl(settings);
  const client = getClient(baseURL, activeSession.token);
  const response = await client.post('/operations/finish');
  return response.data;
}

async function cancelOperation() {
  if (!activeSession.token) throw new Error('No active session');
  const settings = db.getSettings();
  const baseURL = getBaseUrl(settings);
  const client = getClient(baseURL, activeSession.token);
  const response = await client.post('/operations/cancel');
  return response.data;
}

async function getDeviceConfiguration() {
  if (!activeSession.token) throw new Error('No active session');
  const settings = db.getSettings();
  const baseURL = getBaseUrl(settings);
  const client = getClient(baseURL, activeSession.token);
  const response = await client.get('/configuration');
  return response.data;
}

module.exports = {
  login,
  logout,
  getStatus,
  getHeartbeat,
  startPayinAmount,
  getOperationStatus,
  finishOperation,
  cancelOperation,
  getDeviceConfiguration,
  activeSession
};
