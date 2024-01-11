const Chat = require("../models/chatModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.createChat = catchAsync(async (req, res, next) => {
  const newChat = new Chat({
    members: [req.body.senderId, req.body.receiverId],
  });

  const result = await newChat.save();
  res.status(200).json(result);
});

exports.userChats = catchAsync(async (req, res, next) => {
  const chat = await Chat.find({
    members: { $in: [req.params.userId] },
  });

  res.status(200).json({
    results: chat.length,
    chat,
  });
});

exports.findChat = catchAsync(async (req, res, next) => {
  const chat = await Chat.findOne({
    members: { $all: [req.params.firstId, req.params.secondId] },
  });
  res.status(200).json(chat);
});

exports.updateChat = catchAsync(async (req, res, next) => {
  const { chatId } = req.params;
  const { lastMessage } = req.body;

  const chat = await Chat.findOne({ _id: chatId });
  chat.lastMessage = lastMessage;

  const updateChat = await chat.save();

  if (!chat) {
    return next(new AppError("No document found with that ID", 404));
  }

  res.status(200).json(updateChat);
});
