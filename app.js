//backend server
const express = require('express');

const studentRouter = require('./routes/studentsRoutes');
const landlordRouter = require('./routes/landlordsRoutes');
const AppError = require('./utils/appError.js');
const globalErrorHandler = require('./controllers/errorController.js');

const app = express();

app.use(express.json());

//middleware
app.use('/api/v1/students', studentRouter);
app.use('/api/v1/landlord', landlordRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
