const jwt = require("jsonwebtoken");
const { promisify } = require("util");

const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("./../utils/appError");
const Email = require("../utils/email");

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

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  // Remove the password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const { userType } = req.body;
  // console.log(req.body);

  if (userType === "student") {
    // Check if any of the required fields are empty
    const requiredFields = [
      "userType",
      "firstName",
      "lastName",
      "country",
      "age",
      "academic",
      "department",
      "yearbook",
      "gender",
      "email",
      "password",
      "passwordConfirm",
    ];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        return next(new AppError("All fields must be filled.", 400));
      }
    }

    const newStudent = await User.create({
      pushToken: req.body.pushToken,
      userType: req.body.userType,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      country: req.body.country,
      age: req.body.age,
      academic: req.body.academic,
      coordinates: req.body.coordinates,
      department: req.body.department,
      yearbook: req.body.yearbook,
      gender: req.body.gender,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      // socialNetworks: req.body.socialNetworks,
    });

    createSendToken(newStudent, 200, res);
  }
  // the user is landLord
  else {
    // Check if any of the required fields are empty
    const requiredFields = [
      "userType",
      "firstName",
      "lastName",
      "age",
      "gender",
      "email",
      "password",
      "passwordConfirm",
    ];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        return next(new AppError("All fields must be filled.", 400));
      }
    }

    const newLandlord = await User.create({
      pushToken: req.body.pushToken,
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

exports.login = catchAsync(async (req, res, next) => {
  const { email, password, pushToken } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password.", 400));
  }

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password.", 401));
  }

  // 3) change the pushToken
  user.pushToken = pushToken;
  await user.save({ validateBeforeSave: false });

  // 4) If everything ok, send token to client
  createSendToken(user, 200, res);
});

exports.contactUs = catchAsync(async (req, res, next) => {
  let { firstName, lastName, email, subject, message } = req.body;
  // console.log(req.body);

  const requiredFields = [
    "firstName",
    "lastName",
    "email",
    "subject",
    "message",
  ];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      return next(new AppError("All fields must be filled.", 400));
    }
  }

  let re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (!re.test(email)) {
    return next(new AppError("Please provide valid email", 400));
  }

  try {
    await new Email({
      firstName,
      lastName,
      email,
      subject,
      message,
    }).contactUs();

    res.status(200).json({
      status: "success",
      message: "message has been sent",
    });
  } catch (err) {
    return next(new AppError(err.message, 500));
  }
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const requiredFields = ["email"];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      return next(new AppError("Please enter your email", 400));
    }
  }

  let re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (!re.test(email)) {
    return next(new AppError("Please provide valid email", 400));
  }

  // 1) Get user based on POSTED email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with that email address", 404));
  }

  const randomNumber = Math.random() * (999999 - 100000) + 100000;
  const OTP = Math.floor(randomNumber);
  const otpExpire = 10 * 60 * 1000;

  user.otp = OTP;
  user.otpExpire = new Date(Date.now() + otpExpire);
  console.log("OTP: ", OTP);

  await user.save({ validateBeforeSave: false });
  try {
    await new Email({ user, OTP }).sendPasswordReset();

    res.status(200).json({
      status: "success",
      message: "OTP sent to email!",
    });
  } catch (err) {
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError(err.message, 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { otp, password } = req.body;

  const user = await User.findOne({
    otp,
    otpExpire: {
      $gt: Date.now(),
    },
  });

  if (!user) {
    return next(new AppError("Expired or invalid verification code", 400));
  }
  if (!password) {
    return next(new AppError("New password must be entered", 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.otp = undefined;
  user.otpExpire = undefined;
  await user.save();

  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    new AppError("You are not logged in! Please log in to get access.", 401);
  }
  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError("This user no longer exists!", 401));
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    new AppError("User recently changed password! Please log in again.", 401);
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select("+password");

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is incorrect", 401));
  }

  // 3) if so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});
