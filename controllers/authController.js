const jwt = require('jsonwebtoken');

const Student = require('./../models/studentModel');
const Landlord = require('./../models/landlordModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('./../utils/appError');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove the password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const { userType } = req.body;

  if (userType === 'student') {
    // Check if any of the required fields are empty
    const requiredFields = [
      'userType',
      'firstName',
      'lastName',
      'age',
      'academic',
      'department',
      'yearbook',
      'gender',
      'email',
      'password',
      'passwordConfirm',
    ];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        return next(new AppError('יש למלא את כל השדות', 400));
      }
    }

    const newStudent = await Student.create({
      userType: req.body.userType,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      age: req.body.age,
      academic: req.body.academic,
      department: req.body.department,
      yearbook: req.body.yearbook,
      gender: req.body.gender,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    });

    createSendToken(newStudent, 200, res);
  }
  // the user is landLord
  else {
    // Check if any of the required fields are empty
    const requiredFields = [
      'userType',
      'firstName',
      'lastName',
      'age',
      'gender',
      'email',
      'password',
      'passwordConfirm',
    ];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        return next(new AppError('יש למלא את כל השדות', 400));
      }
    }

    const newLandlord = await Landlord.create({
      userType: req.body.userType,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      age: req.body.age,
      gender: req.body.gender,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    });

    createSendToken(newLandlord, 200, res);
  }
});
