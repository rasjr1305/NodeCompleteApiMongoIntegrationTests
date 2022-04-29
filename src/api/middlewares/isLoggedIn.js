const AuthService = require('../services/AuthService');

async function isLoggedIn(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'missing auth token' });
  }

  try {
    const decoded = await AuthService.validateToken(authHeader);

    req.session.user = { id: decoded.id, role: decoded.role };

    return next();
  } catch (err) {
    return res.status(401).json({ message: 'jwt malformed' });
  }
}

module.exports = isLoggedIn;