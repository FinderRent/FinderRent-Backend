const mongoose = require("mongoose");

//Defining apartment Content schema
const apartmentContentSchema = new mongoose.Schema({
  tv: {
    type: Boolean,
    default: false,
  },
  balcony: {
    type: Boolean,
    default: false,
  },
  bed: {
    type: Boolean,
    default: false,
  },
  wifi: {
    type: Boolean,
    default: false,
  },
  oven: {
    type: Boolean,
    default: false,
  },
  microwave: {
    type: Boolean,
    default: false,
  },
  couch: {
    type: Boolean,
    default: false,
  },
  coffeeTable: {
    type: Boolean,
    default: false,
  },
  waterHeater: {
    type: Boolean,
    default: false,
  },
  washer: {
    type: Boolean,
    default: false,
  },
  dryer: {
    type: Boolean,
    default: false,
  },
  iron: {
    type: Boolean,
    default: false,
  },
  refrigirator: {
    type: Boolean,
    default: false,
  },
  freezer: {
    type: Boolean,
    default: false,
  },
});

//define the apartment coordinates location
const coordinatesSchema = new mongoose.Schema({
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90,
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180,
  },
});

//Defining address schema
const addressSchema = new mongoose.Schema({
  street: {
    type: String,
    trim: true,
    required: [true, "An apartment must have a street"],
    maxlength: [40, "A street name must have less or equal than 40 characters"],
    minlength: [2, "A street name must have more or equal than 2 characters"],
  },
  city: {
    type: String,
    required: [true, "An apartment must have a city"],
  },
  country: {
    type: String,
    required: [true, "An apartment must have a country"],
  },
  buildingNumber: {
    type: Number,
    require: [true, "An apartment must have a number"],
  },
  apartmentNumber: { type: Number },
  coordinates: {
    type: coordinatesSchema,
    require: [true, "An apartment must have coordinates"],
  },
});

//Defining apartment schema
const apartmentSchema = new mongoose.Schema({
  address: {
    type: addressSchema,
    require: [true, "An apartment must have address"],
  },
  distanceFromAcademy: {
    type: Number,
    require: [true, "An apartment must have distance fron the academy"],
    min: [0, "Distance must be positive number"],
  },
  startLocation: {
    // GeoJSON
    type: {
      type: String,
      default: "Point",
      enum: ["Point"],
    },
    coordinates: [Number],
  },
  totalCapacity: {
    type: Number,
    require: [true, "An apartment must have a capacity"],
    min: [0, "Apartment capacity must be positive"],
    max: [10, "Apartment capacity must be bigger maximun 10"],
  },
  realTimeCapacity: {
    type: Number,
    require: [true, "An apartment must have a capacity"],
    min: [0, "Apartment capacity must be positive"],
    max: [10, "Apartment capacity must be bigger maximun 10"],
    default: 0,
  },
  about: {
    type: String,
    trim: true,
  },
  numberOfRooms: {
    type: Number,
    require: [true, "An apartment must have a rooms number"],
    min: [1, "Number of rooms must be bigger than 0"],
    max: [10, "Number of rooms must be lower than 11"],
  },
  apartmentContent: {
    type: apartmentContentSchema,
    require: [true, "An apartment must have content"],
  },
  rating: {
    type: Number,
    min: [0, "rating number equal or bigger than 0"],
    max: [5, "rating number equal or smaller than 5"],
  },
  price: {
    type: Number,
    required: [true, "An apartment must have a monthly price"],
  },
  // images: {
  //   public_id: { type: String, default: undefined },
  //   url: {
  //     type: String,
  //     default:
  //       "https://res.cloudinary.com/dxu8n16pa/image/upload/v1719410477/50819_xfwqdf.jpg",
  //   },
  // },
  images: [
    {
      type: String,
      default:
        "https://res.cloudinary.com/finderent/image/upload/v1722150375/home-insurance-cut-out-icon_ffdtpf.jpg",
    },
  ],
  //an array of the interested students that marks the apartment
  interesteds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
  ],
  floor: {
    type: Number,
    require: [true, "An apartment must have a floor number"],
  },
  owner: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
  ],
  apartmentType: {
    type: String,
    // trim: true,
    require: [true, "An apartment must have a type"],
  },
  tenants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
  ],
});
apartmentSchema.index({ startLocation: "2dsphere" });

//creating the schema in the DBs
const Apartment = new mongoose.model("Apartment", apartmentSchema);

module.exports = Apartment;
