const express = require('express');
const authController = require('./../controllers/authController');

//middleware
const router = express.Router();
router.post('/signup', authController.signup);

module.exports = router;
