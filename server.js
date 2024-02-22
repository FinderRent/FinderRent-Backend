const mongoos = require("mongoose");
const http = require("http");
const socketio = require("socket.io");
const dotenv = require("dotenv");
const cloudinary = require("cloudinary");

const app = require("./app");

dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoos.connect(DB).then(() => {
  console.log("DB connected successfuly!");
});

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const server = http.createServer(app);
const io = new socketio.Server(server, {
  cors: {
    origin: "https://finder-rent-backend.vercel.app",
    credentials: true,
  },
});

let activeUsers = [];

io.on("connection", (socket) => {
  // add new User
  socket.on("new-user-add", (newUserId) => {
    // if user is not added previously
    if (!activeUsers.some((user) => user.userId === newUserId)) {
      activeUsers.push({
        userId: newUserId,
        socketId: socket.id,
      });
    }
    // console.log("Connected Users", activeUsers);
    io.emit("get-users", activeUsers);
  });

  // send message
  socket.on("send-message", (data) => {
    const { ouid } = data;
    const user = activeUsers.find((user) => user.userId === ouid);
    // console.log("Data", data);
    // console.log(user);
    if (user) {
      io.to(user.socketId).emit("receive-message", data);
    }
  });

  socket.on("disconnect", () => {
    activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
    // console.log("User Disconnected", activeUsers);
    io.emit("get-users", activeUsers);
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`listen on port: ${port}`);
});
