const mongoose = require('mongoose');
const validator = require('validator');

const landlordSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, "נא למלא שם פרטי"],
    },
    lastName: {
        type: String,
        required: [true, 'נא למלא שם משפחה'],
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
        required: [true, "נא למלא גיל"],
    },
    gender: {
        type: String,
    },
    email: {
        type: String,
        required: [true, "אנא ספק אימייל"],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, "אנא ספק אימייל חוקי"],
    },
    password: {
        type: String,
        required: [true, "נא למלא סיסמה"],
        minlength: [6, "הסיסמה צריכה להכיל 6 תווים לפחות"],
        select: false,
    },
    passwordConfirm: {
        type: String,
        required: [true, "נא למלא אישור סיסמה"],
        validate: {
            // This only works on CREATE and SAVE!!!
            validator: function (el) {
                return el === this.password;
            },
            message: "סיסמאות לא תואמות",
        },
        select: false,
    },
})

const Landlord = mongoose.model("Landlord", landlordSchema);

module.exports = Landlord;