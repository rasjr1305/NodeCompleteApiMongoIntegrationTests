const { Types } = require('mongoose');

function isValid(req, res, next) {
  const { id } = req.params;

  if (!Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: 'recipe not found' });
  }

  return next();
}

module.exports = isValid;