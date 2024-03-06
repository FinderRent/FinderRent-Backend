const multer = require("multer");
const cloudinary = require("cloudinary");

const User = require("../models/userModel");
const Apartment = require("../models/apartmentModel");
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
  const users = await User.find();
  res.status(200).json({
    // status: "success",
    results: users.length,
    data: {
      users,
    },
  });
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
    "age",
    "phone",
    "academic",
    "department",
    "yearbook",
    "email"
  );

  if (req.file) {
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

exports.updateFavourite = async (req, res) => {
  try {
    const { id } = req.params; // Get user ID from route params
    const { apartmentID, action } = req.body;
    let user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "user not found",
      });
    }

    if (apartmentID && action) {
      let apartment = await Apartment.findById(apartmentID);

      if (!apartment) {
        return res.status(404).json({
          status: "fail",
          message: "apartment not found",
        });
      }

      if (action === "add") {
        // Check if the user ID is already in the interesteds array
        const isAlreadyFavourite = user.favouriteApartments.includes(
          apartment._id
        );

        if (isAlreadyFavourite) {
          return res.status(400).json({
            status: "fail",
            message: "apartment is already favourite for this user",
          });
        }
        console.log(apartment);
        user.favouriteApartments.push(apartment);
      } else if (action === "remove") {
        user.favouriteApartments = user.favouriteApartments.filter(
          (favourite) => favourite.toString() !== apartmentID
        );
      } else {
        return res.status(400).json({
          status: "fail",
          message: "Invalid action. Must be 'add' or 'remove'.",
        });
      }
    }
    // Save the updated apartment object
    await user.save();

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};
