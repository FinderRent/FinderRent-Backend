//backend server
const express = require('express');

// const studentRouter = require('./routes/studentsRoutes.js');
// const landlordRouter = require('./routes/landlordsRoutes.js');
const userRouter = require('./routes/userRoutes.js');
const chatRouter = require('./routes/chatRoutes.js');
const messageRouter = require('./routes/messageRoutes.js');
const AppError = require('./utils/appError.js');
const globalErrorHandler = require('./controllers/errorController.js');

const app = express();

app.use(express.json());

//middleware
// app.use('/api/v1/students', studentRouter);
// app.use('/api/v1/landlords', landlordRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/chats', chatRouter);
app.use('/api/v1/messages', messageRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
