const User = require('../models/User');

class UserController {
  static async create(req, res) {
    const { email, name, password } = req.body;
    let role;

    if (req.path === '/users/admin') {
      role = 'admin';
    }

    try {
      const createdUser = await User
        .create({ email, name, password, role });

      return res.status(201).json({ user: createdUser.toJSON() });
    } catch (err) {
      if (err.code && err.code === 11000) {
        return res.status(409).json({ message: 'Email already registered' });
      }

      return res.status(400).json({ message: 'Invalid entries. Try again.' });
    }
  }
}

module.exports = UserController;