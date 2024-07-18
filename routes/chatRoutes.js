const express = require("express");
const chatController = require("../controllers/chatController");

const router = express.Router();

router
  .route("/")
  .get(chatController.getAllChats)
  .post(chatController.createChat);

router.patch("/update/:chatId", chatController.updateChat);
router.delete("/:id", chatController.deleteChat);

router.get("/:userId", chatController.userChats);
router.get("/find/:firstId/:secondId", chatController.findChat);

module.exports = router;
