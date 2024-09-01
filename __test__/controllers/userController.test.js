const User = require("../../models/userModel");
const authController = require("../../controllers/authController");
const AppError = require("../../utils/appError");
const Email = require("../../utils/email");
jest.mock("../../models/userModel");
jest.mock("../../utils/appError");
jest.mock("../../utils/email");

// Mock the jwt sign function
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn().mockReturnValue("mock_token"),
}));

describe("signup function", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {
        userType: "student",
        firstName: "John",
        lastName: "Doe",
        country: "USA",
        age: "25",
        academic: "University",
        department: "Computer Science",
        yearbook: "2023",
        gender: "Male",
        email: "john@example.com",
        password: "password123",
        passwordConfirm: "password123",
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should create a new student user successfully", async () => {
    const mockUser = {
      ...req.body,
      _id: "mockUserId",
    };
    User.create.mockResolvedValue(mockUser);

    await authController.signup(req, res, next);

    expect(User.create).toHaveBeenCalledWith(expect.objectContaining(req.body));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "success",
        token: expect.any(String),
        data: { user: expect.objectContaining(mockUser) },
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("should create a new landlord user successfully", async () => {
    req.body.userType = "landlord";
    const mockUser = {
      ...req.body,
      _id: "mockUserId",
    };
    User.create.mockResolvedValue(mockUser);

    await authController.signup(req, res, next);

    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userType: "landlord",
        firstName: "John",
        lastName: "Doe",
        age: "25",
        gender: "Male",
        email: "john@example.com",
        password: "password123",
        passwordConfirm: "password123",
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "success",
        token: expect.any(String),
        data: { user: expect.objectContaining(mockUser) },
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("should return an error if required fields are missing for student", async () => {
    delete req.body.firstName;

    await authController.signup(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(AppError).toHaveBeenCalledWith("All fields must be filled.", 400);
  });

  test("should return an error if required fields are missing for landlord", async () => {
    req.body.userType = "landlord";
    delete req.body.email;

    await authController.signup(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(AppError).toHaveBeenCalledWith("All fields must be filled.", 400);
  });
});

describe("login function", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {
        email: "test@example.com",
        password: "password123",
        pushToken: "somePushToken",
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should login user successfully", async () => {
    const mockUser = {
      email: "test@example.com",
      password: "hashedPassword",
      correctPassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true), // Ensure save is mocked
    };

    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    await authController.login(req, res, next);

    expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
    expect(mockUser.correctPassword).toHaveBeenCalledWith(
      "password123",
      "hashedPassword"
    );

    expect(next).not.toHaveBeenCalled();
  });

  test("should return error if email is missing", async () => {
    delete req.body.email;

    await authController.login(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(AppError).toHaveBeenCalledWith(
      "Please provide email and password.",
      400
    );
  });

  test("should return error if password is missing or incorrect", async () => {
    delete req.body.password;

    await authController.login(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(AppError).toHaveBeenCalledWith(
      "Please provide email and password.",
      400
    );
  });

  test("should return error if user does not exist", async () => {
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    await authController.login(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(AppError).toHaveBeenCalledWith("Incorrect email or password.", 401);
  });
});

describe("forgotPassword", () => {
  let req, res, next, mockUser;

  beforeEach(() => {
    req = {
      body: { email: "test@example.com" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    mockUser = {
      email: "test@example.com",
      save: jest.fn(),
    };

    User.findOne.mockResolvedValue(mockUser);
  });

  it("should return error if email is not provided", async () => {
    req.body.email = "";

    await authController.forgotPassword(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(AppError).toHaveBeenCalledWith("Please enter your email", 400);
  });

  it("should return error if email format is invalid", async () => {
    req.body.email = "invalidEmailFormat";

    await authController.forgotPassword(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(AppError).toHaveBeenCalledWith("Please provide valid email", 400);
  });

  it("should return error if user does not exist", async () => {
    User.findOne.mockResolvedValue(null); // Simulate user not found

    await authController.forgotPassword(req, res, next);

    expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(AppError).toHaveBeenCalledWith(
      "There is no user with that email address",
      404
    );
  });

  it("should generate OTP, save it to the user, and send an email", async () => {
    Email.prototype.sendPasswordReset.mockResolvedValue(); // Mock successful email sending

    await authController.forgotPassword(req, res, next);

    expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
    expect(mockUser.save).toHaveBeenCalledWith({ validateBeforeSave: false });
  });
});
