const express = require("express");
const apartmentController = require("../controllers/apartmentController");

const router = express.Router();

router
  .route("/")
  .get(apartmentController.getAllApartments)
  .post(apartmentController.createApartment)
  .patch(apartmentController.updateEditedApartment);

router
  .route("/:id")
  .get(apartmentController.getApartment)
  .patch(apartmentController.updateApartment)
  .delete(apartmentController.deleteApartment);

router.route("/:apartmentID/:userID").get(apartmentController.isFavourite);

module.exports = router;
