const Apartment = require("./../models/apartmentModel");
const User = require("../models/userModel");
const APIFeatures = require("./../utils/apiFeatures");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

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

exports.createApartment = async (req, res) => {
  console.log(req.body);
  const data = req.body;
  data.startLocation = data.startLocation || {
    type: "Point",
    coordinates: [65.234556, 23.232323],
  };
  try {
    const newApartment = await Apartment.create(data);

    res.status(201).json({
      status: "success",
      data: {
        tour: newApartment,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.updateEditedApartment = async (req, res) => {
  try {
    // const { id } = req.params; // Get apartment ID from route params
    // const { userID, action, ...updateData } = req.body; // Destructure userID and action from request body, and store the rest in updateData
    const { id, ...updateData } = req.body; // Destructure userID and action from request body, and store the rest in updateData

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

exports.deleteApartment = async (req, res) => {
  try {
    await Apartment.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
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

  // Construct the geospatial filter
  const geoFilter = {
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  };

  // Create the query with the geospatial filter
  let query = Apartment.find(geoFilter);

  // Apply additional filters, sorting, limiting fields, and pagination
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
