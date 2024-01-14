const multer = require("multer");
const cloudinary = require("cloudinary");

const Message = require("../models/messageModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { getDataUri } = require("../utils/features");

const multerStorage = multer.memoryStorage({
  destination: (req, file, cb) => {
    cb(null, "public/img/users");
  },
  filename: (req, file, cb) => {
    // user-543gfgfgf-43656565.jpg
    const ext = file.mimetype.split("/")[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
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

exports.uploadImage = upload.single("image");

exports.addMessage = catchAsync(async (req, res, next) => {
  const { chatId, senderId, messageText, replyingTo, image } = req.body;

  const replyingToObject =
    typeof replyingTo === "string" ? JSON.parse(replyingTo) : replyingTo;

  const message = new Message({
    chatId,
    senderId,
    messageText,
    replyingTo: replyingToObject,
    image,
  });

  if (req.file) {
    const file = getDataUri(req.file);

    const uploadToCloud = await cloudinary.v2.uploader.upload(file.content, {
      folder: "Messages",
    });
    message.messageText = "image";
    message.image = {
      public_id: uploadToCloud.public_id,
      url: uploadToCloud.secure_url,
    };
  }
  const result = await message.save();
  res.status(200).json(result);
});

exports.getMessage = catchAsync(async (req, res, next) => {
  const { chatId } = req.params;

  const result = await Message.find({ chatId });

  if (!result) {
    return next(new AppError("Chat not found", 404));
  }

  res.status(200).json(result);
});
