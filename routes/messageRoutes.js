const express = require("express");
const messageController = require("../controllers/messageController");

const router = express.Router();

router.post("/", messageController.uploadImage, messageController.addMessage);
router.get("/:chatId", messageController.getMessage);
router.delete("/:id", messageController.deleteMessage);

router.route("/").get(messageController.getAllMessages);

module.exports = router;
