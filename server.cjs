import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Socket.IO logic
const rooms = {};

io.on("connection", (socket) => {
  console.log("🟢 Connected:", socket.id);

  socket.on("joinRoom", ({ username, room }) => {
    socket.join(room);
    if (!rooms[room]) rooms[room] = { players: [] };
    if (!rooms[room].players.includes(username)) {
      rooms[room].players.push(username);
    }

    io.to(room).emit("roomUpdate", rooms[room]);
    if (rooms[room].players.length === 2) {
      io.to(room).emit("startGame", { start: true });
    }
  });

  socket.on("sendMessage", (msg) => {
    io.emit("receiveMessage", msg);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ Running on port ${PORT}`));
