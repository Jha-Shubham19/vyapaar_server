import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();

// Use environment variables for CORS origin
const corsOrigin = "https://vyapaar-eosin.vercel.app";

// Set up CORS in the Express app
app.use(cors({
  origin: corsOrigin,
  methods: ["GET", "POST"],
  credentials: true
}));

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"],
    credentials: true
  }
});

const roomCounts = new Map();

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.emit("connection", { socketId: socket.id });
  console.log(socket.id);
  
  socket.on('join', ({ room, username }) => {
    socket.join(room);
    socket.room = room;  // Store the room in the socket instance
    if (!roomCounts.has(room)) {
      roomCounts.set(room, [{ username: username, playerNumber: 1, currentPosition: 1, cashAvailable: 1000, propertiesOwned: [], extraMoney: 0, housesCount: 0, bankrupt: false, socketId: socket.id }]); // Initialize count for the room if it doesn't exist
    } else {
      let prevAllPlayersData = roomCounts.get(room);
      roomCounts.set(room, [...prevAllPlayersData, { username: username, playerNumber: prevAllPlayersData.length + 1, currentPosition: 1, cashAvailable: 1000, propertiesOwned: [], extraMoney: 0, housesCount: 0, bankrupt: false, socketId: socket.id }]); // Increment count for the room
    }
    console.log(room, roomCounts.get(room));
    io.to(room).emit('newUserJoined', { allPlayersData: roomCounts.get(room) });
  });

  socket.on('randomDiceIs', ({ room, randomDice }) => {
    io.to(room).emit('makeDiceMovemet', { randomDice });
  });

  socket.on('buyOfProperty', (args) => {
    const room = socket.room;
    io.to(room).emit('buyOfProperty', args);
  });

  socket.on('switchToNextPlayerTurn', (args) => {
    const room = socket.room;
    io.to(room).emit('switchToNextPlayerTurn', args);
  });

  socket.on('payRent', ({ whosTurn, boughtBy, priceToPay }) => {
    const room = socket.room;
    io.to(room).emit('payRent', { whosTurn, boughtBy, priceToPay });
  });

  socket.on('giveSalary', ({ whosTurn, money }) => {
    const room = socket.room;
    io.to(room).emit('giveSalary', { whosTurn, money });
  });

  socket.on('buildNewHouse', ({ eleNo, whosTurn }) => {
    const room = socket.room;
    io.to(room).emit('buildNewHouse', { eleNo, whosTurn });
  });

  socket.on('sellOldHouse', ({ eleNo, whosTurn }) => {
    const room = socket.room;
    io.to(room).emit('sellOldHouse', { eleNo, whosTurn });
  });

  socket.on('sendToJail', ({ whosTurn }) => {
    const room = socket.room;
    io.to(room).emit('sendToJail', { whosTurn });
  });

  socket.on('chanceDikhado', ({ whosTurn, randomIndex, currPlayerCurrentLocation }) => {
    const room = socket.room;
    io.to(room).emit('chanceDikhado', { whosTurn, randomIndex, currPlayerCurrentLocation });
  });

  socket.on('message', (data) => {
    io.to(data.room).emit('message', data.message);
  });

  socket.on('disconnect', () => {
    const room = socket.room;
    let prevAllPlayersData = roomCounts.get(room);
    roomCounts.set(room, prevAllPlayersData.filter(({ socketId }) => socketId != socket.id).map((val, ind) => {
      val.playerNumber = ind + 1;
      return val;
    }));
    console.log('user disconnected');
    // roomCounts.clear()
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});