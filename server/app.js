import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { nanoid } from "nanoid"; // Importing nanoid to generate unique room IDs
import {
  scheduleRoomCleanup,
  cancelRoomCleanup,
  clearAllCleanups,
} from "./utils/roomCleanup.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ["http://localhost:5173", "http://localhost:5174"] },
});

app.use(cors({ origin: ["http://localhost:5173", "http://localhost:5174"] }));
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
// This is just for testing purposes
// TODO: Fix the rooms not cleaning up issue until the server restarts
app.get("/rooms", (req, res) => {
  const activeRooms = Object.keys(rooms).filter(
    (roomId) => Object.keys(rooms[roomId].players).length > 0
  );
  res.json({
    rooms: Object.keys(rooms),
    activeRooms,
    totalRooms: Object.keys(rooms).length,
    emptyRooms: Object.keys(rooms).length - activeRooms.length,
  });
});

// Validate room existence by ID
app.get("/validate-room/:roomId", (req, res) => {
  const { roomId } = req.params;
  if (rooms[roomId]) {
    return res.json({ exists: true });
  }
  return res
    .status(404)
    .json({ exists: false, message: "Room does not exist" });
});

// NEW: Check if a given player (by name) is currently in a room
// Case-insensitive comparison on player names
app.get("/in-game/:roomId/:playerName", (req, res) => {
  const { roomId, playerName } = req.params;
  // object key
  const room = rooms[roomId];
  if (!room) {
    return res.json({ inGame: false, reason: "room-not-found" });
  }
  const inGame = Object.values(room.players).some(
    (p) => p.name.toLowerCase() === playerName.toLowerCase()
  );
  return res.json({ inGame });
});

// Cleanup inactive rooms (rooms with no players)
app.post("/cleanup-rooms", (req, res) => {
  const beforeCount = Object.keys(rooms).length;

  // Remove rooms with no players
  Object.keys(rooms).forEach((roomId) => {
    if (Object.keys(rooms[roomId].players).length === 0) {
      delete rooms[roomId];
    }
  });

  const afterCount = Object.keys(rooms).length;
  const cleanedUp = beforeCount - afterCount;

  res.json({
    message: `Cleaned up ${cleanedUp} inactive rooms`,
    roomsRemoved: cleanedUp,
    activeRooms: afterCount,
  });
});

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("joinRoom", ({ roomId, playerName }) => {
    const room = rooms[roomId];

    if (!room) {
      return socket.emit("error", "Room does not exist");
    }

    // Check if player name already exists in the room
    const existingPlayerEntry = Object.entries(room.players).find(
      ([socketId, player]) =>
        player.name.toLowerCase() === playerName.toLowerCase()
    );

    if (existingPlayerEntry) {
      const [oldSocketId, playerData] = existingPlayerEntry;

      // If it's the same socket, just update the room
      if (oldSocketId === socket.id) {
        cancelRoomCleanup(roomId);
        io.to(roomId).emit("roomUpdate", {
          players: room.players,
          hostId: room.hostId,
        });
        return;
      }

      // If it's a different socket but same name, this is likely a reconnection
      // Remove the old socket entry and let them rejoin with new socket
      console.log(
        `🔄 Player ${playerName} reconnecting with new socket ID: ${socket.id} (was: ${oldSocketId})`
      );
      delete room.players[oldSocketId];

      // If the old socket was the host, transfer host to new socket
      if (room.hostId === oldSocketId) {
        room.hostId = socket.id;
      }
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

    // Cancel any pending cleanup for this room since someone joined
    cancelRoomCleanup(roomId);

    io.to(roomId).emit("roomUpdate", {
      players: room.players,
      hostId: room.hostId,
    });
  });

  socket.on("getRoomState", ({ roomId }) => {
    const room = rooms[roomId];
    if (room) {
      socket.emit("roomUpdate", {
        players: room.players,
        hostId: room.hostId,
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected:", socket.id);

    // Find and remove player from all rooms
    Object.keys(rooms).forEach((roomId) => {
      const room = rooms[roomId];
      if (room.players[socket.id]) {
        delete room.players[socket.id];

        // If this was the host, assign a new host
        if (room.hostId === socket.id) {
          const remainingPlayers = Object.keys(room.players);
          room.hostId =
            remainingPlayers.length > 0 ? remainingPlayers[0] : null;
        }

        // Notify remaining players
        io.to(roomId).emit("roomUpdate", {
          players: room.players,
          hostId: room.hostId,
        });

        // Schedule cleanup for empty rooms with grace period
        if (Object.keys(room.players).length === 0) {
          scheduleRoomCleanup(roomId, rooms);
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(
    `SLURP SLURP THE HYPER TEXT PORTAL IS SCREECHING ON http://localhost:${PORT}`
  );
});

// Graceful shutdown - clear all pending cleanups
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  clearAllCleanups();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully...");
  clearAllCleanups();
  process.exit(0);
});
