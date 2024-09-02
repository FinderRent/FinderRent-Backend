const httpMocks = require("node-mocks-http");

const Message = require("../../models/messageModel");
const messageController = require("../../controllers/messageController");
const { getAllMessages } = require("../../controllers/messageController");
const AppError = require("../../utils/appError");

// Mock dependencies
jest.mock("../../models/messageModel");
jest.mock("cloudinary", () => ({
  v2: {
    uploader: {
      destroy: jest.fn(),
      upload: jest.fn(),
    },
  },
}));

// Helper functions to mock Express req, res, next
const mockRequest = (params = {}, body = {}) => ({
  params,
  body,
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

jest.mock("../../models/messageModel");

describe("Message Controller - getAllMessages", () => {
  let req, res, next;

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    next = jest.fn();
  });

  it("should return 200 and all messages", async () => {
    // Mock data with date strings
    const mockMessages = [
      {
        _id: "messageId1",
        chatId: "chatId1",
        senderId: "senderId1",
        messageText: "Hello",
        replyingTo: null,
        image: { public_id: "img1", url: "http://example.com/img1.jpg" },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        _id: "messageId2",
        chatId: "chatId2",
        senderId: "senderId2",
        messageText: "World",
        replyingTo: null,
        image: { public_id: "img2", url: "http://example.com/img2.jpg" },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    Message.find.mockResolvedValue(mockMessages);

    await getAllMessages(req, res, next);

    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual({
      results: mockMessages.length,
      data: {
        messages: mockMessages,
      },
    });
    expect(Message.find).toHaveBeenCalledTimes(1);
  });
});

describe("Message Controller - getMessage", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 200 and the chat messages when found", async () => {
    const req = mockRequest({ chatId: "chatId1" });
    const res = mockResponse();
    const messages = [{ _id: "msg1", chatId: "chatId1", messageText: "Hello" }];

    Message.find.mockResolvedValue(messages);

    await messageController.getMessage(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(messages);
  });

  it("should call next with a 404 error if chat is not found", async () => {
    const req = mockRequest({ chatId: "chatId1" });
    const res = mockResponse();

    Message.find.mockResolvedValue(null);

    await messageController.getMessage(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    expect(mockNext.mock.calls[0][0].message).toBe("Chat not found");
    expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
  });
});

describe("Message Controller - deleteMessage", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should delete the message and return 204", async () => {
    const req = mockRequest({ id: "msg1" });
    const res = mockResponse();
    const message = { _id: "msg1", messageText: "text" };

    Message.findByIdAndDelete.mockResolvedValue(message);

    await messageController.deleteMessage(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      data: null,
    });
  });
});

describe("Message Controller - addMessage", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should add a new message and return 200", async () => {
    const req = mockRequest(
      {},
      {
        chatId: "chatId1",
        senderId: "senderId1",
        messageText: "Hello",
        replyingTo: null,
        image: { public_id: "img1", url: "http://example.com/img1.jpg" },
      }
    );
    const res = mockResponse();

    const savedMessage = {
      _id: "newMessageId",
      chatId: "chatId1",
      senderId: "senderId1",
      messageText: "Hello",
      replyingTo: null,
      image: { public_id: "img1", url: "http://example.com/img1.jpg" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    Message.prototype.save = jest.fn().mockResolvedValue(savedMessage);

    await messageController.addMessage(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(savedMessage);
  });
});
