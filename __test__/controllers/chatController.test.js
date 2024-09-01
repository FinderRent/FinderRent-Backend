const {
  createChat,
  userChats,
  findChat,
  updateChat,
  deleteChat,
  getAllChats,
} = require("../../controllers/chatController");
const Chat = require("../../models/chatModel");
const User = require("../../models/userModel");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");

jest.mock("../../models/chatModel");
jest.mock("../../models/userModel");
jest.mock("../../utils/appError");
jest.mock("../../utils/catchAsync", () => (fn) => fn);

describe("Chat Controller", () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createChat", () => {
    it("should create a new chat if it does not exist", async () => {
      const mockSender = {
        _id: "senderId",
        chats: [],
        save: jest.fn(),
      };
      const mockReceiver = {
        _id: "receiverId",
        chats: [],
        save: jest.fn(),
      };
      const mockChat = {
        _id: "chatId",
        members: ["senderId", "receiverId"],
        save: jest.fn().mockResolvedValue({ _id: "chatId" }),
      };

      User.findById
        .mockResolvedValueOnce(mockSender)
        .mockResolvedValueOnce(mockReceiver);
      Chat.mockImplementation(() => mockChat);

      req.body = { senderId: "senderId", receiverId: "receiverId" };

      await createChat(req, res, next);

      expect(Chat).toHaveBeenCalledWith({
        members: ["senderId", "receiverId"],
      });
      expect(mockChat.save).toHaveBeenCalled();
      expect(mockSender.save).toHaveBeenCalled();
      expect(mockReceiver.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ _id: "chatId" });
    });

    it("should return existing chat message if chat already exists", async () => {
      const mockSender = {
        _id: "senderId",
        chats: [{ userID: "receiverId" }],
      };
      const mockReceiver = {
        _id: "receiverId",
        chats: [],
      };

      User.findById
        .mockResolvedValueOnce(mockSender)
        .mockResolvedValueOnce(mockReceiver);

      req.body = { senderId: "senderId", receiverId: "receiverId" };

      await createChat(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Chat already exists" });
    });
  });

  describe("getAllChats", () => {
    it("should return all chats successfully", async () => {
      const mockChats = [
        { _id: "chat1", members: ["user1", "user2"] },
        { _id: "chat2", members: ["user2", "user3"] },
      ];

      Chat.find.mockResolvedValue(mockChats);

      await getAllChats(req, res, next);

      expect(Chat.find).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        results: mockChats.length,
        data: { chats: mockChats },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should handle errors and pass them to next middleware", async () => {
      const error = new Error("Database error");
      Chat.find.mockRejectedValue(error);

      await getAllChats(req, res, next);

      expect(Chat.find).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("userChats", () => {
    it("should return chats for a user", async () => {
      const mockChats = [{ _id: "chat1" }, { _id: "chat2" }];
      Chat.find.mockResolvedValue(mockChats);

      req.params.userId = "userId";

      await userChats(req, res, next);

      expect(Chat.find).toHaveBeenCalledWith({ members: { $in: ["userId"] } });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ results: 2, chat: mockChats });
    });
  });

  describe("findChat", () => {
    it("should find a chat between two users", async () => {
      const mockChat = { _id: "chatId" };
      Chat.findOne.mockResolvedValue(mockChat);

      req.params = { firstId: "user1", secondId: "user2" };

      await findChat(req, res, next);

      expect(Chat.findOne).toHaveBeenCalledWith({
        members: { $all: ["user1", "user2"] },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockChat);
    });
  });

  describe("updateChat", () => {
    it("should update the last message of a chat", async () => {
      const mockChat = {
        _id: "chatId",
        lastMessage: "",
        save: jest
          .fn()
          .mockResolvedValue({ _id: "chatId", lastMessage: "new message" }),
      };
      Chat.findOne.mockResolvedValue(mockChat);

      req.params = { chatId: "chatId" };
      req.body = { lastMessage: "new message" };

      await updateChat(req, res, next);

      expect(Chat.findOne).toHaveBeenCalledWith({ _id: "chatId" });
      expect(mockChat.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        _id: "chatId",
        lastMessage: "new message",
      });
    });
  });

  describe("deleteChat", () => {
    it("should delete a chat and update users", async () => {
      const mockChat = {
        _id: "chatId",
        members: ["user1", "user2"],
      };
      const mockUser1 = {
        _id: "user1",
        chats: [{ chatID: "chatId" }, { chatID: "otherChatId" }],
        save: jest.fn(),
      };
      const mockUser2 = {
        _id: "user2",
        chats: [{ chatID: "chatId" }],
        save: jest.fn(),
      };

      Chat.findById.mockResolvedValue(mockChat);
      Chat.findByIdAndDelete.mockResolvedValue(mockChat);

      req.params = { id: "chatId" };

      await deleteChat(req, res, next);

      expect(Chat.findById).toHaveBeenCalledWith("chatId");
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        data: null,
      });
    });

    it("should call next with an error if chat is not found", async () => {
      Chat.findById.mockResolvedValue(null);

      req.params = { id: "nonexistentId" };

      await deleteChat(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });
});
