const UploadService = require('../services/UploadService');

class RecipeController {
  static async upload(req, res, next) {
    UploadService.upload('image')(req, res, (err) => {
      if (err) {
        return res.status(500).json({ message: err.message });
      }

      next();
    });
  }
}

module.exports = RecipeController;