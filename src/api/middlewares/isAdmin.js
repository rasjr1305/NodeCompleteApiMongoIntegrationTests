function isAdmin(req, res, next) {
  if (req.session.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({ message: 'Only admins can register new admins' });
}

module.exports = isAdmin;