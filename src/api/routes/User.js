const router = require('express').Router();
const UserController = require('../controllers/UserController');
const isLoggedIn = require('../middlewares/isLoggedIn');
const isAdmin = require('../middlewares/isAdmin');

router.post('/users', UserController.create);
router.post('/users/admin', isLoggedIn, isAdmin, UserController.create);

module.exports = router;