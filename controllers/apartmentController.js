const Apartment = require("./../models/apartmentModel");
const User = require("../models/userModel");
const APIFeatures = require("./../utils/apiFeatures");

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
  try {
    const newApartment = await Apartment.create(req.body);

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

// exports.updateApartment = async (req, res) => {
//   try {
//     const { id } = req.params; // Get apartment ID from route params
//     const { userID, action, ...updateData } = req.body; // Destructure userID and action from request body, and store the rest in updateData
//     let apartment = await Apartment.findById(id);

//     if (!apartment) {
//       return res.status(404).json({
//         status: "fail",
//         message: "Apartment not found",
//       });
//     }

//     if (userID && action) {
//       let user = await User.findById(userID);

//       if (!user) {
//         return res.status(404).json({
//           status: "fail",
//           message: "User not found",
//         });
//       }

//       if (action === "add") {
//         // Check if the user ID is already in the interesteds array
//         const isAlreadyInterested = apartment.interesteds.includes(user._id);
//         if (isAlreadyInterested) {
//           return res.status(400).json({
//             status: "fail",
//             message: "User is already interested in this apartment",
//           });
//         }
//         // Add user reference to the interesteds array
//         apartment.interesteds.push(user);
//       } else if (action === "remove") {
//         // Remove user reference from the interesteds array
//         apartment.interesteds = apartment.interesteds.filter(
//           (interested) => interested.toString() !== userID
//         );
//       } else {
//         return res.status(400).json({
//           status: "fail",
//           message: "Invalid action. Must be 'add' or 'remove'.",
//         });
//       }
//     }

//     // Update apartment details if updateData is not empty
//     if (Object.keys(updateData).length > 0) {
//       apartment = await Apartment.findByIdAndUpdate(id, updateData, {
//         new: true,
//         runValidators: true,
//       });
//     }

//     // Save the updated apartment object
//     await apartment.save();

//     res.status(200).json({
//       status: "success",
//       data: {
//         apartment,
//       },
//     });
//   } catch (err) {
//     res.status(500).json({
//       status: "error",
//       message: err.message,
//     });
//   }
// };

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
