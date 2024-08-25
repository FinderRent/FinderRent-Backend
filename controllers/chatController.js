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
  // Checking if chat already exists
  const sender = await User.findById(req.body.senderId);
  const receiver = await User.findById(req.body.receiverId);

  let chatExists = false;

  for (const chat of sender.chats) {
    if (chat.userID === req.body.receiverId) {
      chatExists = true;
      break;
    }
  }

  // You can uncomment and use the receiver check if needed
  for (const chat of receiver.chats) {
    if (chat.userID === req.body.senderId) {
      chatExists = true;
      break;
    }
  }

  if (!chatExists) {
    const newChat = new Chat({
      members: [req.body.senderId, req.body.receiverId],
    });
    const result = await newChat.save();

    // Add the receiverID to sender's chats array
    sender.chats.push({
      userID: req.body.receiverId,
      chatID: result._id,
    });
    await sender.save();

    // Add the senderID to receiver's chats array
    receiver.chats.push({
      userID: req.body.senderId,
      chatID: result._id,
    });
    await receiver.save();

    res.status(200).json(result);
  } else {
    res.status(200).json({ message: "Chat already exists" });
  }
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

exports.deleteChat = catchAsync(async (req, res, next) => {
  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return next(new AppError("Chat not found", 404));
  }

  // Iterate over all members in the chat
  await Promise.all(
    chat.members.map(async (memberId) => {
      const user = await User.findById(memberId);

      if (user) {
        // Removing the chat from the user's chats array
        user.chats = user.chats.filter(
          (userChat) => !userChat.chatID.equals(chat._id)
        );

        await user.save();
      }
    })
  );

  await Chat.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});
