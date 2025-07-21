import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { nanoid } from "nanoid"; // Importing nanoid to generate unique room IDs

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "http://localhost:5173" } });

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// In-memory rooms store
const rooms = {};

app.post("/create-room", (req, res) => {
  const roomId = nanoid(6);

  // This threw me off because conventionally i've only ever
  // seen arr[index] but, this is basically obj[key] and not arr[index]
  // rooms is an object mapping room‑IDs (strings) -> room data. for example:
  /*const rooms = {
  "aB3dE1" : {
    players: {
      "XyZ123": { name: "Alice", score: 0 },
      "QwR456": { name: "Bob",   score: 0 }
    },
    round: 0
  },
  "fG7hJ8": {
    players: {somePlayerId: { name: "Charlie", score: 0 }},
    round: 2
  }
  rooms is the object, key is roomId, and it contains player and round, player is an object
  with socket id as key and player data as value, round is a number.
  so lets say you want to access XyZ123's score in room aB3dE1, you would do:
  rooms["aB3dE1"].players["XyZ123"].score; 
  very similar to json, but in javascript object notation.
} */

  rooms[roomId] = {
    players: {},
    round: 0,
    hostId: null, // will set when host joins
    maxPlayers: 10, // or pull from req.body
    hasStarted: false,
  };
  res.json({ roomId });
});

app.get("/", (req, res) => {
  res.send(
    "Hello fine shyts, I am skibidi rizzler from Ohio!, im using expresss + socket.io"
  );
});

// List all active rooms
app.get("/rooms", (req, res) => {
  res.json({ rooms: Object.keys(rooms) });
});

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);
  socket.on("joinRoom", ({ roomId, playerName }) => {
    const room = rooms[roomId];

    if (!room) {
      return socket.emit("error", "Room does not exist");
    }

    // make the first player to join the room the host
    // You have to use Object.keys to get the length of the players object
    // since players is an object, not an array, it doesn't have a length property.
    // Object.keys grabs the keys of the object and returns them as an array and array has a length property.
    if (Object.keys(room.players).length === 0) {
      room.hostId = socket.id;
    }

    socket.join(roomId);
    room.players[socket.id] = { name: playerName, score: 0 };
    io.to(roomId).emit("roomUpdate", {
      players: room.players,
      hostId: room.hostId,
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(
    `SLURP SLURP THE HYPER TEXT PORTAL IS SCREECHING ON http://localhost:${PORT}`
  );
});
