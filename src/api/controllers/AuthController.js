const User = require('../models/User');
const AuthService = require('../services/AuthService');

class AuthController {
  static async login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(401).json({ message: 'All fields must be filled' });
    }

    const user = await User
      .findOne({ email })
      .select('email password role');

    if (!user || password !== user.password) {
      return res.status(401).json({ message: 'Incorrect username or password' });
    }

    const token = await AuthService.generateToken(user);

    return res.json({ token });
  }
}

module.exports = AuthController;