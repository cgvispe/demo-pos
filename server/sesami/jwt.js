const crypto = require('crypto');

/**
 * Generates a custom JWT for Sesami RC5000 POS API authentication.
 * 
 * The Sesami JWT is NOT standard - it uses a custom format where:
 * - Header and payload are base64url encoded (not base64)
 * - Signed with HMAC-SHA256
 * - expiration in payload must be > current time + 5 min (device has 5 min margin)
 * - Amounts in the API are always in cents (integer)
 */
function base64url(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function generateLoginToken({ username, posId, secretKey }) {
  const header = { alg: 'HS256', typ: 'JWT' };
  
  // expiration must be > device current time + 5 min margin
  // We set it 10 min in the future to be safe
  const expiration = Math.floor(Date.now() / 1000) + 600;
  
  const payload = {
    username,
    pos: posId,
    expiration
  };

  const headerEncoded = base64url(JSON.stringify(header));
  const payloadEncoded = base64url(JSON.stringify(payload));
  const signingInput = `${headerEncoded}.${payloadEncoded}`;

  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(signingInput)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${signingInput}.${signature}`;
}

module.exports = { generateLoginToken };
