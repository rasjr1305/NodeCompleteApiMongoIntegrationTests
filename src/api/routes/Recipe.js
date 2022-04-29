const router = require('express').Router();
const isLoggedIn = require('../middlewares/isLoggedIn');
const isValid = require('../middlewares/isValid');
const RecipeController = require('../controllers/RecipeController');
const UploadController = require('../controllers/UploadController');

router.post('/recipes', isLoggedIn, RecipeController.create);
router.get('/recipes', RecipeController.find);
router.get('/recipes/:id', isValid, RecipeController.findOne);
router.put('/recipes/:id', isValid, isLoggedIn, RecipeController.updateOne);
router.delete('/recipes/:id', isValid, isLoggedIn, RecipeController.deleteOne);
router.put(
  '/recipes/:id/image/',
  isValid,
  UploadController.upload,
  isLoggedIn,
  RecipeController.updateImage,
);

module.exports = router;