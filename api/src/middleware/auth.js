const { getPrivyClient } = require('../lib/privyClient');

async function authMiddleware(req, res, next) {
  try {
    const header = req.headers['authorization'] || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return next();
    }
    try {
      const privy = getPrivyClient();
      const claims = await privy.verifyAuthToken(token);
      req.auth = claims;
    } catch (e) {
      // Non-fatal: proceed without auth context for simplicity
    }
    next();
  } catch (e) {
    // Allow through on unexpected errors to keep routes usable without tokens
    return next();
  }
}

module.exports = { authMiddleware };
