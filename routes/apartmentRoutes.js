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

router
  .route("/apartments-within/:distance/center/:latlng/unit/:unit")
  .get(apartmentController.getApartmentWithin);

router
  .route("/distances/:latlng/unit/:unit")
  .get(apartmentController.getDistances);

module.exports = router;
