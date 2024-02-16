//backend server
const path = require("path");
const express = require("express");
const favicon = require("serve-favicon");

const userRouter = require("./routes/userRoutes.js");
const chatRouter = require("./routes/chatRoutes.js");
const messageRouter = require("./routes/messageRoutes.js");
const apartmentRouter = require("./routes/apartmentRoutes.js");

const AppError = require("./utils/appError.js");
const globalErrorHandler = require("./controllers/errorController.js");

const app = express();

app.use(express.json());

app.use(favicon(path.join(__dirname, "public", "favicon.ico")));

// pug views to style the sending mail
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => {
  res.render("serverView");
});

//middleware

// app.use('/api/v1/students', studentRouter);
// app.use('/api/v1/landlords', landlordRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/chats", chatRouter);
app.use("/api/v1/messages", messageRouter);
app.use("/api/v1/apartments", apartmentRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
