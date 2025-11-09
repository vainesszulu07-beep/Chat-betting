const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Tic-Tac-Toe room handling
const rooms = {};

io.on("connection", (socket) => {
  console.log("✅ User connected");

  socket.on("joinRoom", ({ username, room }) => {
    socket.join(room);
    console.log(`${username} joined room ${room}`);

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
    console.log("❌ User disconnected");
  });
});

// Use port 8000 for Koyeb (or fallback to local 3000)
const PORT = process.env.PORT || 8000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
