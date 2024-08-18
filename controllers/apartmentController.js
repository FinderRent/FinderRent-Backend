const Apartment = require("./../models/apartmentModel");
const User = require("../models/userModel");
const APIFeatures = require("./../utils/apiFeatures");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const multer = require("multer");
const cloudinary = require("cloudinary");

// const fs = require("fs");
// const FormData = require("form-data");

// const sharp = require("sharp");

// const multerStorage = multer.memoryStorage();

// const multerFilter = (req, file, cb) => {
//   if (file.mimetype.startWith("image")) {
//     cb(null, true);
//   } else {
//     cb(new AppError("Not an Image. Please updload only images", 400), false);
//   }
// };

// const upload = multer({
//   storage: multerStorage,
//   fileFilter: multerFilter,
// });

// exports.uploadApartmentImages = upload.fields([
//   { name: "imageCover", maxCount: 1 },
//   { name: "images", maxCount: 3 },
// ]);

// upload.single("image");
// upload.array("images", 5);

// exports.resizeApartmentImages = (req, res, next) => {
//   console.log(req.files);
//   next();
// };

//-----------------------------------------------------------------------------
const multerStorage = multer.memoryStorage({
  destination: (req, file, cb) => {
    cb(null, "public/img/apartment");
  },
  filename: (req, file, cb) => {
    // user-543gfgfgf-43656565.jpg
    const ext = file.mimetype.split("/")[1];
    cb(null, `user-${req.apartment.id}-${Date.now()}.${ext}`);
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

exports.uploadApartmentImages = upload.single("image");

//-----------------------------------------------------------------------------
exports.getAllApartments = async (req, res) => {
  try {
    //EXECUTE THE QUERY
    const features = new APIFeatures(Apartment.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const apartments = await features.query;

    //SEND RESPONSE
    res.status(200).json({
      status: "success",
      results: apartments.length,
      data: {
        apartments,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.getApartment = async (req, res) => {
  try {
    const apartment = await Apartment.findById(req.params.id);

    res.status(200).json({
      status: "success",
      data: { apartment },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.createApartment = catchAsync(async (req, res, next) => {
  // console.log(req.body);
  // exports.createApartment = async (req, res) => {
  // try {
  // console.log("1");

  // const filePath = req.body.images.url; // Ensure this is a local file path
  // console.log("Reading file from:", filePath);
  // console.log("2");

  // if (!fs.existsSync(filePath)) {
  //   throw new Error("File does not exist");
  // }
  // console.log("3");
  // const formData = new FormData();
  // formData.append("file", fs.createReadStream(filePath));
  // formData.append("upload_preset", "FindeRent");
  // formData.append("cloud_name", "finderent");

  // const cloudinaryResponse = await axios.post(
  //   "https://api.cloudinary.com/v1_1/finderent/image/upload",
  //   formData,
  //   {
  //     headers: formData.getHeaders(),
  //   }
  // );

  // const { data } = cloudinaryResponse;
  // if (data.secure_url) {
  //   req.body.images.url = data.secure_url; // Store the image URL in state
  // } else {
  //   throw new Error("Failed to get the image URL from Cloudinary");
  // }

  // const file = getDataUri(req.file);
  // if (req.apartment.images.public_id) {
  //   await cloudinary.v2.uploader.destroy(req.apartment.images.public_id);
  // }
  // const uploadToCloud = await cloudinary.v2.uploader.upload(file.content, {
  //   folder: "Apartments",
  // });
  // req.body.images = {
  //   public_id: uploadToCloud.public_id,
  //   url: uploadToCloud.secure_url,
  // };
  // const newApartment = await Apartment.create(req.body);

  const data = req.body;
  const { latitude, longitude } = req.body.address.coordinates;

  if (
    req.body.address.city &&
    req.body.address.street &&
    req.body.address.buildingNumber
  ) {
    data.startLocation = data.startLocation || {
      type: "Point",
      coordinates: [JSON.parse(longitude), JSON.parse(latitude)],
    };
  }
  const requiredFields = [
    "floor",
    "numberOfRooms",
    "price",
    "totalCapacity",
    "realTimeCapacity",
    "apartmentType",
    "about",
  ];

  const requiredAddressFields = [
    "country",
    "city",
    "street",
    "buildingNumber",
    "apartmentNumber",
    "coordinates.latitude",
    "coordinates.longitude",
  ];

  for (const field of requiredAddressFields) {
    const fieldParts = field.split(".");
    let value = req.body.address;

    for (const part of fieldParts) {
      if (value[part] === undefined) {
        return next(
          new AppError(`Field ${field} is required in address.`, 400)
        );
      }
      value = value[part];
    }
  }

  // Check for top-level required fields
  for (const field of requiredFields) {
    if (!req.body[field]) {
      return next(new AppError(`Field ${field} is required.`, 400));
    }
  }

  // Check for nested address fields
  if (!req.body.address) {
    return next(new AppError("Address field is required.", 400));
  }

  const newApartment = await Apartment.create(data);

  res.status(201).json({
    status: "success",
    data: {
      apartment: newApartment,
    },
  });
});

exports.updateEditedApartment = async (req, res) => {
  try {
    // const { id } = req.params; // Get apartment ID from route params
    // const { userID, action, ...updateData } = req.body; // Destructure userID and action from request body, and store the rest in updateData
    const { id, ...updateData } = req.body; // Destructure userID and action from request body, and store the rest in updateData
    const { latitude, longitude } = req.body.address.coordinates;

    updateData.startLocation = updateData.startLocation || {
      type: "Point",
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
    };

    let apartment = await Apartment.findById(id);

    if (!apartment) {
      return res.status(404).json({
        status: "fail",
        message: "Apartment not found",
      });
    }

    // Update apartment details if updateData is not empty
    if (Object.keys(updateData).length > 0) {
      apartment = await Apartment.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });
    }

    // Save the updated apartment object
    await apartment.save();

    res.status(200).json({
      status: "success",
      data: {
        apartment,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// api/v1/tours/tours-within/233/center/34.111745,-118.113491/unit/km
exports.getApartmentWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");

  const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    return next(
      new AppError(
        "Please provide latitude and longitude in the format lat,lng",
        400
      )
    );
  }

  const geoFilter = {
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  };

  let query = Apartment.find(geoFilter) || Apartment.find();

  const features = new APIFeatures(query, req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const apartments = await features.query;

  // Send response
  res.status(200).json({
    status: "success",
    results: apartments.length,
    data: {
      apartments,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  // console.log(req.params);
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");

  const muliplier = unit === "mi" ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        "Please provide latitur and longitude in the format lat,lng",
        400
      )
    );
  }

  const distances = await Apartment.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: "distance",
        distanceMultiplier: muliplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      data: distances,
    },
  });
});

exports.deleteApartment = catchAsync(async (req, res, next) => {
  const apartment = await Apartment.findById(req.params.id);

  // Extract the relevant part from each URL, excluding the ".jpg" extension
  const imagePaths = apartment.images.map((url) => {
    const match = url.match(/Apartments\/([^\/]+)\.jpg$/);
    return match ? match[1] : null;
  });

  // Delete each image from Cloudinary
  for (const image_id of imagePaths) {
    const public_id = `Apartments/${image_id}`;
    await cloudinary.v2.uploader.destroy(public_id);
  }

  console.log("Deleted images:", imagePaths);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

///////
exports.updateApartment = async (req, res) => {
  try {
    const { id } = req.params; // Get user ID from route params
    const { userID, action } = req.body;
    let user;
    let apartment;
    try {
      apartment = await Apartment.findById(id);
    } catch (err) {
      return res.status(404).json({
        status: "fail",
        message: "apartment not found",
      });
    }
    try {
      user = await User.findById(userID);
    } catch (err) {
      return res.status(404).json({
        status: "fail",
        message: "user not found",
      });
    }

    if (action === "add") {
      const isAlreadyInterested = apartment.interesteds.includes(user._id);
      if (isAlreadyInterested) {
        return res.status(400).json({
          status: "fail",
          message: "user is already interested in this apartment",
        });
      }
      apartment.interesteds.push(user);
    } else if (action === "remove") {
      const isAlreadyInterested = apartment.interesteds.includes(user._id);
      if (isAlreadyInterested) {
        apartment.interesteds = apartment.interesteds.filter(
          (interested) => interested.toString() !== userID
        );
      } else {
        return res.status(400).json({
          status: "fail",
          message: "user is not interested for this apartment",
        });
      }
    } else {
      return res.status(400).json({
        status: "fail",
        message: "Invalid action. Must be 'add' or 'remove'.",
      });
    }

    // Save the updated apartment object
    await apartment.save();

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

exports.isFavourite = async (req, res) => {
  const { apartmentID, userID } = req.params;
  let user;
  let apartment;
  try {
    apartment = await Apartment.findById(apartmentID);
  } catch (err) {
    return res.status(404).json({
      status: "fail",
      message: "apartment not found",
    });
  }
  try {
    user = await User.findById(userID);
  } catch (err) {
    return res.status(404).json({
      status: "fail",
      message: "user not found",
    });
  }

  const isAlreadyInterested = apartment.interesteds.includes(user._id);

  if (isAlreadyInterested) {
    res.status(200).json({
      status: "success",
      data: true,
    });
  } else {
    res.status(200).json({
      status: "success",
      data: false,
    });
  }
};
