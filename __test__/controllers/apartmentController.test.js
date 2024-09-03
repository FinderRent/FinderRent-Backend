const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const Apartment = require("../../models/apartmentModel");
const APIFeatures = require("../../utils/apiFeatures");
const apartmentController = require("../../controllers/apartmentController");
const AppError = require("../../utils/appError");

let mongoServer;

jest.mock("../../utils/catchAsync", () => (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
});

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("getAllApartments", () => {
  beforeEach(async () => {
    await Apartment.deleteMany({});
  });

  const createValidApartment = (overrides = {}) => ({
    address: {
      street: "Test Street",
      city: "Test City",
      country: "Test Country",
      buildingNumber: 123,
      coordinates: {
        latitude: 40.7128,
        longitude: -74.006,
      },
    },
    distanceFromAcademy: 5,
    startLocation: {
      type: "Point",
      coordinates: [-74.006, 40.7128], // [longitude, latitude]
    },
    totalCapacity: 4,
    numberOfRooms: 2,
    apartmentContent: {},
    price: 1000,
    apartmentType: "Tower",
    ...overrides,
  });

  it("should get all apartments", async () => {
    // Createing some test apartments
    await Apartment.create([
      createValidApartment({
        address: { ...createValidApartment().address, street: "Test Street 1" },
        price: 1000,
        startLocation: { type: "Point", coordinates: [-74.006, 40.7128] },
      }),
      createValidApartment({
        address: { ...createValidApartment().address, street: "Test Street 2" },
        price: 1500,
        startLocation: { type: "Point", coordinates: [-73.9352, 40.7306] },
      }),
    ]);

    const req = {
      query: {},
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await apartmentController.getAllApartments(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "success",
        results: 2,
        data: {
          apartments: expect.arrayContaining([
            expect.objectContaining({
              address: expect.objectContaining({ street: "Test Street 1" }),
              price: 1000,
              startLocation: expect.objectContaining({
                type: "Point",
                coordinates: [-74.006, 40.7128],
              }),
            }),
            expect.objectContaining({
              address: expect.objectContaining({ street: "Test Street 2" }),
              price: 1500,
              startLocation: expect.objectContaining({
                type: "Point",
                coordinates: [-73.9352, 40.7306],
              }),
            }),
          ]),
        },
      })
    );
  });

  it("should handle errors", async () => {
    const req = {
      query: {},
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock Apartment.find to throw an error
    jest.spyOn(Apartment, "find").mockImplementationOnce(() => {
      throw new Error("Database error");
    });

    await apartmentController.getAllApartments(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      status: "fail",
      message: expect.any(Error),
    });
  });

  it("should apply filters", async () => {
    await Apartment.create([
      createValidApartment({
        address: { ...createValidApartment().address, street: "Test Street 1" },
        price: 1000,
        startLocation: { type: "Point", coordinates: [-74.006, 40.7128] },
      }),
      createValidApartment({
        address: { ...createValidApartment().address, street: "Test Street 2" },
        price: 1500,
        startLocation: { type: "Point", coordinates: [-73.9352, 40.7306] },
      }),
    ]);

    const req = {
      query: { price: { gte: "1200" } },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await apartmentController.getAllApartments(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "success",
        results: 1,
        data: {
          apartments: expect.arrayContaining([
            expect.objectContaining({
              address: expect.objectContaining({ street: "Test Street 2" }),
              price: 1500,
              startLocation: expect.objectContaining({
                type: "Point",
                coordinates: [-73.9352, 40.7306],
              }),
            }),
          ]),
        },
      })
    );
  });
});

describe("createApartment", () => {
  beforeEach(async () => {
    await Apartment.deleteMany({});
  });

  const validApartmentData = {
    address: {
      country: "Test Country",
      city: "Test City",
      street: "Test Street",
      buildingNumber: 123,
      apartmentNumber: 456,
      coordinates: {
        latitude: "40.7128",
        longitude: "-74.0060",
      },
    },
    numberOfRooms: 2,
    price: 1000,
    apartmentType: "studio",
    about: "Test apartment",
  };

  it("should create a new apartment with valid data", async () => {
    const req = {
      body: validApartmentData,
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    await apartmentController.createApartment(req, res, next);
  });

  it("should return an error if a required field is missing", async () => {
    const invalidData = { ...validApartmentData };
    delete invalidData.numberOfRooms;

    const req = {
      body: invalidData,
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    await apartmentController.createApartment(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next.mock.calls[0][0].message).toBe(
      "Field numberOfRooms is required."
    );
    expect(next.mock.calls[0][0].statusCode).toBe(400);
  });

  it("should return an error if a required address field is missing", async () => {
    const invalidData = {
      ...validApartmentData,
      address: { ...validApartmentData.address },
    };
    delete invalidData.address.city;

    const req = {
      body: invalidData,
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    await apartmentController.createApartment(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next.mock.calls[0][0].message).toBe(
      "Field city is required in address."
    );
    expect(next.mock.calls[0][0].statusCode).toBe(400);
  });
});

describe("getDistances", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: {
        latlng: "40.7128,-74.0060",
        unit: "km",
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();
    jest.spyOn(Apartment, "aggregate");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return distances of apartments in kilometers", async () => {
    // Mock the aggregate function to return dummy data
    Apartment.aggregate.mockResolvedValue([
      {
        distance: 1.5,
        name: "Test Apartment",
      },
    ]);

    await apartmentController.getDistances(req, res, next);

    expect(Apartment.aggregate).toHaveBeenCalledWith([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [-74.006, 40.7128], // lng, lat
          },
          distanceField: "distance",
          distanceMultiplier: 0.001, // For kilometers
        },
      },
      {
        $project: {
          distance: 1,
          name: 1,
        },
      },
    ]);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      data: {
        data: [
          {
            distance: 1.5,
            name: "Test Apartment",
          },
        ],
      },
    });
  });

  it("should handle missing latitude or longitude", async () => {
    req.params.latlng = "40.7128"; // Missing lng

    await apartmentController.getDistances(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.any(AppError) // Ensure it calls next with an AppError
    );

    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe(
      "Please provide latitur and longitude in the format lat,lng"
    );
  });
});
