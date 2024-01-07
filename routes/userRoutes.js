const express = require('express');
const authController = require('./../controllers/authController');
const userController = require('./../controllers/userController');

//middleware
const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.route('/').get(userController.getAllUsers);
router.route('/:id').get(userController.getUser);

module.exports = router;
