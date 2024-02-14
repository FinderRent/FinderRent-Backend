const express = require("express");
const apartmentController = require("../controllers/apartmentController");

const router = express.Router();

router
  .route("/")
  .get(apartmentController.getAllApartments)
  .post(apartmentController.createApartment);

router
  .route("/:id")
  .get(apartmentController.getApartment)
  .patch(apartmentController.updateApartment)
  .delete(apartmentController.deleteApartment);

module.exports = router;
