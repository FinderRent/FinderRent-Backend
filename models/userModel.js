const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const Apartment = require("./apartmentModel");

const userSchema = new mongoose.Schema({
  pushToken: {
    type: String,
  },
  userType: {
    type: String,
  },
  firstName: {
    type: String,
    required: [true, "Please fill in first name."],
  },
  lastName: {
    type: String,
    required: [true, "Please fill in last name."],
  },
  avatar: {
    public_id: { type: String, default: undefined },
    url: {
      type: String,
      default:
        "https://res.cloudinary.com/dtkpp77xw/image/upload/v1701189732/default_nk5c5h.png",
    },
  },
  age: {
    type: String,
    required: [true, "Please enter age."],
  },
  gender: {
    type: String,
  },
  phone: {
    type: String,
    validate: {
      validator: function (value) {
        // Define your regular expression for a valid mobile number
        const mobileNumberRegex = /^(?:\d{10})?$|^$|^(null|undefined)$/i;
        return mobileNumberRegex.test(value);
      },
      message: "Please enter valid phone number.",
    },
  },
  academic: {
    type: String,
  },
  department: {
    type: String,
  },
  yearbook: {
    type: String,
  },
  email: {
    type: String,
    required: [true, "Please provide email."],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email."],
  },
  password: {
    type: String,
    required: [true, "Please enter password."],
    minlength: [6, "The password must contain at least 6 characters."],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please enter password confirmation."],
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords do not match.",
    },
    select: false,
  },
  //an array of the favourite apartment that the student mark with
  favouriteApartments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "apartments",
    },
  ],
  otp: Number,
  otpExpire: Date,
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

userSchema.pre("save", async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified("password")) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
