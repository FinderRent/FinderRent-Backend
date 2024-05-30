const express = require("express");
const chatController = require("../controllers/chatController");

const router = express.Router();

router
  .route("/")
  .post(chatController.createChat)
  .get(chatController.getAllChats);
router.patch("/update/:chatId", chatController.updateChat);
router.get("/:userId", chatController.userChats);
router.get("/find/:firstId/:secondId", chatController.findChat);

module.exports = router;
