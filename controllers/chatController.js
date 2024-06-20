const Chat = require("../models/chatModel");
const User = require("./../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.getAllChats = catchAsync(async (req, res, next) => {
  const chats = await Chat.find();
  res.status(200).json({
    // status: "success",
    results: chats.length,
    data: {
      chats,
    },
  });
});

exports.createChat = catchAsync(async (req, res, next) => {
  //checking if chat is already exist
  const user = await User.findById(req.body.senderId);

  let chatExists = false;

  for (const chat of user.chats) {
    if (chat.userID === req.body.receiverId) {
      chatExists = true;
      break;
    }
  }

  if (!chatExists) {
    const newChat = new Chat({
      members: [req.body.senderId, req.body.receiverId],
    });
    const result = await newChat.save();

    //add the studentID to landlord chats array----
    user.chats.push({
      userID: req.body.receiverId,
      chatID: result._id,
    });
    await user.save();

    res.status(200).json(result);
  }

  // const newChat = new Chat({
  //   members: [req.body.senderId, req.body.receiverId],
  // });

  // const result = await newChat.save();
  res.status(200);
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
