const express = require('express');
const authController = require('./../controllers/authController');
const userController = require('./../controllers/userController');

//middleware
const router = express.Router();

router.post('/signup', authController.signup);

router.route('/').get(userController.getAllStudents);
router.route('/:id').get(userController.getStudent);

module.exports = router;
