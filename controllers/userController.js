const Student = require('../models/studentModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

exports.getAllStudents = catchAsync(async (req, res, next) => {
  const students = await Student.find();
  res.status(200).json({
    // status: "success",
    results: students.length,
    data: {
      students,
    },
  });
});

exports.getStudent = factory.getOne(Student);
