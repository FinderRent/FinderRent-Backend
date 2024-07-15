const express = require("express");
const authController = require("./../controllers/authController");
const userController = require("./../controllers/userController");

//middleware
const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/contactUs", authController.contactUs);

router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword", authController.resetPassword);

router.patch(
  "/updateMyPassword",
  authController.protect,
  authController.updatePassword
);
router.patch(
  "/updateMe",
  authController.protect,
  userController.uploadUserAvatar,
  userController.updateMe
);

router
  .route("/")
  .get(userController.getAllUsers)
  .get(userController.getAllStudents);
router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateFavourite);

// router.route("/students").get(userController.getAllStudents);

module.exports = router;
