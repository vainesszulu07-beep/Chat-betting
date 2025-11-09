const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const ticTacRooms = {}; // roomName -> { board: [], turn: 'X' }

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Join room
  socket.on('joinRoom', ({ username, room }) => {
    socket.join(room);
    console.log(`${username} joined room ${room}`);

    // Initialize board if first player
    if (!ticTacRooms[room]) {
      ticTacRooms[room] = { board: ["","","","","","","","",""], turn: 'X', players: [] };
    }
    const roomData = ticTacRooms[room];
    roomData.players.push(username);

    // Assign symbol
    let symbol = roomData.players.length === 1 ? 'X' : 'O';
    socket.emit('symbolAssignment', symbol);

    // Notify others
    io.to(room).emit('updateBoard', roomData.board, roomData.turn);
  });

  // Handle move
  socket.on('ticTacToeMove', ({ room, board, turn }) => {
    if (!ticTacRooms[room]) return;
    ticTacRooms[room].board = board;
    ticTacRooms[room].turn = turn;
    io.to(room).emit('updateBoard', board, turn);
  });

  // Disconnect
  socket.on('disconnect', () => console.log('User disconnected:', socket.id));
});

server.listen(3000, () => console.log('Server running on http://localhost:3000'));
