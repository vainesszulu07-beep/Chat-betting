// server.cjs
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from /public
app.use(express.static(path.join(__dirname, "public")));

// Basic route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Realtime Tic-Tac-Toe logic
const rooms = {};

io.on("connection", (socket) => {
  console.log("✅ A user connected");

  socket.on("joinRoom", ({ username, room }) => {
    socket.join(room);
    console.log(`${username} joined ${room}`);

    if (!rooms[room]) rooms[room] = [];
    rooms[room].push(socket.id);

    if (rooms[room].length === 2) {
      io.to(room).emit("userJoined", { message: "Match ready!" });
    }
  });

  socket.on("ticTacToeMove", (data) => {
    io.to(data.room).emit("updateTicTacToe", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ A user disconnected");
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
