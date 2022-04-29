const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const { JWT_TOKEN } = require('../../config');

class AuthService {
  static async generateToken(user) {
    return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_TOKEN);
  }

  static async validateToken(authHeader) {
    return promisify(jwt.verify)(authHeader, JWT_TOKEN);
  }
}

module.exports = AuthService;