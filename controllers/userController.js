const multer = require("multer");
const cloudinary = require("cloudinary");

const APIFeatures = require("./../utils/apiFeatures");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { getDataUri } = require("../utils/features");

const multerStorage = multer.memoryStorage({
  destination: (req, file, cb) => {
    cb(null, "public/img/users");
  },
  filename: (req, file, cb) => {
    // user-543gfgfgf-43656565.jpg
    const ext = file.mimetype.split("/")[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  },
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else cb(new AppError("Only images can be uploaded!", 400), false);
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserAvatar = upload.single("avatar");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
  try {
    //EXECUTE THE QUERY
    const features = new APIFeatures(User.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const users = await features.query;

    //SEND RESPONSE
    res.status(200).json({
      status: "success",
      results: users.length,
      data: {
        users,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  res.status(200).json({
    status: "success",
    data: user,
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log(req.body);

  // 1) Filtered out unwanted fields names that are not allowed to be updated
  const filterdedBody = filterObj(
    req.body,
    "firstName",
    "lastName",
    "country",
    "age",
    "phone",
    "academic",
    "department",
    "yearbook",
    "hobbies",
    "funFact",
    "email"
  );

  if (req.body.coordinates) {
    filterdedBody.coordinates = JSON.parse(req.body.coordinates);
  }

  if (req.file) {
    console.log(req.file);
    const file = getDataUri(req.file);

    if (req.user.avatar.public_id) {
      await cloudinary.v2.uploader.destroy(req.user.avatar.public_id);
    }

    const uploadToCloud = await cloudinary.v2.uploader.upload(file.content, {
      folder: "Users",
    });
    filterdedBody.avatar = {
      public_id: uploadToCloud.public_id,
      url: uploadToCloud.secure_url,
    };
  }

  // 2) Update student document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filterdedBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      updatedUser,
    },
  });
});

exports.getAllStudents = async (req, res) => {
  try {
    //EXECUTE THE QUERY
    const features = new APIFeatures(User.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const users = await features.query;

    //SEND RESPONSE
    res.status(200).json({
      status: "success",
      results: users.length,
      data: {
        users,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};
