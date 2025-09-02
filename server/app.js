import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { nanoid } from "nanoid"; // Importing nanoid to generate unique room IDs
import fs from "fs";
import path from "path";
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

// Load questions from JSON file
let questionsData;
try {
  const questionsPath = path.join(process.cwd(), "data", "questions.json");
  questionsData = JSON.parse(fs.readFileSync(questionsPath, "utf8"));
} catch (error) {
  console.error("Error loading questions:", error);
  questionsData = {
    categories: { general: [] },
    settings: { questionsPerGame: 5, timePerQuestion: 30 },
  };
}

// Function to get random questions
function getRandomQuestions(count = 5, category = "general") {
  const questions = questionsData.categories[category] || [];
  console.log(`📚 Available questions in ${category}:`, questions.length);
  const shuffled = [...questions].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  console.log(`🎯 Selected ${selected.length} questions for game`);
  return selected;
}

// In-memory rooms store
const rooms = {};

app.post("/create-room", (req, res) => {
  const roomId = nanoid(6);
  const { hostName } = req.body;

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
    hostId: null, // will set when host idk even if i need this
    host: hostName,
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
  const player = Object.values(room.players).find(
    (p) => p.name.toLowerCase() === playerName.toLowerCase()
  );
  const inGame = !!player; // Player is in game regardless of online status
  return res.json({ inGame, online: player?.online || false });
});

// NEW: Check if a player can rejoin a room (even if currently disconnected)
app.get("/can-rejoin/:roomId/:playerName", (req, res) => {
  const { roomId, playerName } = req.params;
  const room = rooms[roomId];

  if (!room) {
    return res.json({ canRejoin: false, reason: "room-not-found" });
  }

  // Check if the player is currently in the room
  const currentlyInRoom = Object.values(room.players).some(
    (p) => p.name.toLowerCase() === playerName.toLowerCase()
  );

  // Allow rejoining if:
  // 1. They're currently in the room, OR
  // 2. The room hasn't started yet (allow anyone who was previously in)
  const canRejoin = currentlyInRoom || !room.hasStarted;

  return res.json({
    canRejoin,
    currentlyInRoom,
    roomExists: true,
    hasStarted: room.hasStarted,
  });
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

    // If the game has already started, only allow rejoining if the player was already in the room
    if (room.hasStarted) {
      const existingPlayer = Object.values(room.players).find(
        (p) => p.name.toLowerCase() === playerName.toLowerCase()
      );
      const isOriginalHost =
        room.host.toLowerCase() === playerName.toLowerCase();

      if (!existingPlayer && !isOriginalHost) {
        return socket.emit("error", "Game has already started");
      }

      // If game started and they're rejoining, send them to game page
      if (existingPlayer || isOriginalHost) {
        socket.emit("gameStarted");
        return;
      }
    }

    // Check if player name already exists in the room
    const existingPlayerEntry = Object.entries(room.players).find(
      ([socketId, player]) =>
        player.name.toLowerCase() === playerName.toLowerCase()
    );

    // We'll handle reconnections later, for now just check for immediate same-socket scenarios
    if (existingPlayerEntry) {
      const [oldSocketId, playerData] = existingPlayerEntry;

      // If it's the same socket, just mark as online and update room
      if (oldSocketId === socket.id) {
        cancelRoomCleanup(roomId);
        room.players[socket.id].online = true;

        // Send room update to all online players
        Object.keys(room.players).forEach((playerSocketId) => {
          const player = room.players[playerSocketId];
          if (player.online) {
            const playerIsHost = playerSocketId === room.hostId;
            io.to(playerSocketId).emit("roomUpdate", {
              players: room.players,
              hostId: room.hostId,
              isHost: playerIsHost,
            });
          }
        });
        return;
      }
    }

    // make the first player to join the room the host (only if no host exists)
    // You have to use Object.keys to get the length of the players object
    // since players is an object, not an array, it doesn't have a length property.
    // Object.keys grabs the keys of the object and returns them as an array and array has a length property.
    if (Object.keys(room.players).length === 0) {
      room.hostId = socket.id;
    }

    socket.join(roomId);

    // Check if this player already exists in the room (by name)
    const existingPlayer = Object.entries(room.players).find(
      ([socketId, player]) =>
        player.name.toLowerCase() === playerName.toLowerCase()
    );

    if (existingPlayer) {
      const [oldSocketId, playerData] = existingPlayer;
      if (oldSocketId !== socket.id) {
        // This is a reconnection with a new socket ID
        console.log(
          `🔄 Player ${playerName} reconnecting: ${oldSocketId} -> ${socket.id}`
        );
        delete room.players[oldSocketId];
        room.players[socket.id] = { ...playerData, online: true };

        // If the old socket was the host, transfer host to new socket
        if (room.hostId === oldSocketId) {
          room.hostId = socket.id;
          console.log(`👑 Host ${playerName} reconnected with new socket ID`);
        }
      } else {
        // Same socket, just mark as online
        room.players[socket.id].online = true;
      }
    } else {
      // Completely new player
      room.players[socket.id] = { name: playerName, score: 0, online: true };
    }

    // Cancel any pending cleanup for this room since someone joined
    cancelRoomCleanup(roomId);

    const isHost = socket.id === room.hostId;
    console.log(
      `📊 Player ${playerName} (${socket.id}) joined room ${roomId}. isHost: ${isHost}`
    );
    console.log(`📊 Room ${roomId} hostId: ${room.hostId}`);
    console.log(
      `📊 Room ${roomId} players:`,
      Object.keys(room.players).map((id) => ({
        id,
        name: room.players[id].name,
        online: room.players[id].online,
      }))
    );

    // Send room update to all players, each with their own isHost status
    Object.keys(room.players).forEach((socketId) => {
      const player = room.players[socketId];
      // Only send to online players
      if (player.online) {
        const playerIsHost = socketId === room.hostId;
        console.log(
          `📤 Sending roomUpdate to ${player.name} (${socketId}), isHost: ${playerIsHost}`
        );
        io.to(socketId).emit("roomUpdate", {
          players: room.players,
          hostId: room.hostId,
          isHost: playerIsHost,
        });
      } else {
        console.log(`📴 Skipping offline player ${player.name} (${socketId})`);
      }
    });
  });

  socket.on("getRoomState", ({ roomId }) => {
    const room = rooms[roomId];
    if (room) {
      socket.emit("roomUpdate", {
        players: room.players,
        hostId: room.hostId,
        isHost: socket.id === room.hostId,
      });
    }
  });

  socket.on("startGame", ({ roomId }) => {
    const room = rooms[roomId];

    if (!room) {
      return socket.emit("error", "Room does not exist");
    }

    // Only allow host to start the game
    if (socket.id !== room.hostId) {
      return socket.emit("error", "Only the host can start the game");
    }

    // Mark the game as started
    room.hasStarted = true;

    // Initialize game state
    room.gameState = {
      questions: getRandomQuestions(questionsData.settings.questionsPerGame),
      currentQuestionIndex: 0,
      questionStartTime: null,
      answers: {}, // Store player answers for current question
      isWaitingForAnswers: false,
    };

    console.log(`🎮 Game started in room ${roomId} by host ${socket.id}`);
    console.log(
      `📊 Game will have ${room.gameState.questions.length} questions`
    );

    // Notify all players in the room that the game has started
    io.to(roomId).emit("gameStarted");

    // Start the first question after a brief delay
    setTimeout(() => {
      startNextQuestion(roomId);
    }, 2000);
  });

  // Handle player answers
  socket.on("submitAnswer", ({ roomId, answerIndex, timeRemaining }) => {
    const room = rooms[roomId];
    if (!room || !room.gameState || !room.players[socket.id]) {
      return;
    }

    const { gameState } = room;
    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];

    if (!currentQuestion || !gameState.isWaitingForAnswers) {
      return socket.emit("error", "No active question");
    }

    // Check if player already answered
    if (gameState.answers[socket.id]) {
      return socket.emit("error", "Answer already submitted for this question");
    }

    // Store the answer
    gameState.answers[socket.id] = {
      answerIndex,
      timeRemaining,
      isCorrect: answerIndex === currentQuestion.correctAnswer,
    };

    const playerName = room.players[socket.id].name;
    console.log(
      `📝 ${playerName} answered question ${
        gameState.currentQuestionIndex + 1
      }: ${answerIndex}`
    );

    // Send confirmation to the player
    socket.emit("answerSubmitted", {
      isCorrect: answerIndex === currentQuestion.correctAnswer,
      answerIndex: answerIndex,
    });

    // Check if all online players have answered
    const onlinePlayers = Object.keys(room.players).filter(
      (id) => room.players[id].online
    );
    const answeredPlayers = Object.keys(gameState.answers);

    if (answeredPlayers.length === onlinePlayers.length) {
      // All players answered, show results immediately
      showQuestionResults(roomId);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected:", socket.id);

    // Don't remove players on disconnect - they might rejoin
    // Instead, mark them as offline and keep their spot in the room
    Object.keys(rooms).forEach((roomId) => {
      const room = rooms[roomId];
      if (room.players[socket.id]) {
        // Mark player as offline but keep them in the room
        room.players[socket.id].online = false;
        console.log(
          `📴 Player ${
            room.players[socket.id].name
          } went offline in room ${roomId}`
        );

        // If this was the host going offline, don't reassign host yet
        // They might come back. Only reassign if they explicitly leave.

        // Notify remaining online players about the disconnection
        Object.keys(room.players).forEach((playerSocketId) => {
          const player = room.players[playerSocketId];
          if (player.online) {
            const playerIsHost = playerSocketId === room.hostId;
            io.to(playerSocketId).emit("roomUpdate", {
              players: room.players,
              hostId: room.hostId,
              isHost: playerIsHost,
            });
          }
        });

        // Note: We don't schedule room cleanup here anymore since players are still in the room
      }
    });
  });

  // Handle explicit leave room (when user clicks Leave button)
  socket.on("leaveRoom", ({ roomId }, callback) => {
    console.log(`🚪 Player explicitly leaving room ${roomId}`);

    const room = rooms[roomId];
    if (room && room.players[socket.id]) {
      const playerName = room.players[socket.id].name;
      console.log(`🚪 Removing ${playerName} from room ${roomId}`);

      // Actually remove the player from the room
      delete room.players[socket.id];

      // If this was the host, assign a new host from remaining players
      if (room.hostId === socket.id) {
        const remainingPlayers = Object.keys(room.players);
        room.hostId = remainingPlayers.length > 0 ? remainingPlayers[0] : null;
        console.log(`👑 Host left, new host: ${room.hostId}`);
      }

      // Notify remaining players with individual isHost status
      Object.keys(room.players).forEach((playerSocketId) => {
        const player = room.players[playerSocketId];
        if (player.online) {
          const playerIsHost = playerSocketId === room.hostId;
          io.to(playerSocketId).emit("roomUpdate", {
            players: room.players,
            hostId: room.hostId,
            isHost: playerIsHost,
          });
        }
      });

      // Schedule cleanup for empty rooms with grace period
      if (Object.keys(room.players).length === 0) {
        scheduleRoomCleanup(roomId, rooms);
      }
    }

    // Send acknowledgment to client that leave was processed
    if (callback) {
      callback();
    }
  });
});

// Function to start the next question
function startNextQuestion(roomId) {
  const room = rooms[roomId];
  if (!room || !room.gameState) return;

  const { gameState } = room;

  console.log(
    `🔄 Starting question ${gameState.currentQuestionIndex + 1} of ${
      gameState.questions.length
    }`
  );

  if (gameState.currentQuestionIndex >= gameState.questions.length) {
    // Game over, show final results
    console.log(`🏁 All questions completed, ending game`);
    endGame(roomId);
    return;
  }

  const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
  gameState.questionStartTime = Date.now();
  gameState.answers = {};
  gameState.isWaitingForAnswers = true;

  // Send question to all players (without the correct answer)
  const questionForClient = {
    id: currentQuestion.id,
    question: currentQuestion.question,
    options: currentQuestion.options,
    questionNumber: gameState.currentQuestionIndex + 1,
    totalQuestions: gameState.questions.length,
    timeLimit: questionsData.settings.timePerQuestion,
  };

  io.to(roomId).emit("newQuestion", questionForClient);

  // Set timer for question
  setTimeout(() => {
    if (room.gameState && room.gameState.isWaitingForAnswers) {
      showQuestionResults(roomId);
    }
  }, questionsData.settings.timePerQuestion * 1000);
}

// Function to show question results and update scores
function showQuestionResults(roomId) {
  const room = rooms[roomId];
  if (!room || !room.gameState) return;

  const { gameState } = room;
  const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
  gameState.isWaitingForAnswers = false;

  // Calculate scores and prepare results
  const results = {};
  Object.keys(gameState.answers).forEach((socketId) => {
    const answer = gameState.answers[socketId];
    if (answer.isCorrect) {
      // Award points based on time remaining (bonus for faster answers)
      const timeBonus = Math.floor(
        (answer.timeRemaining / questionsData.settings.timePerQuestion) * 50
      );
      const points = questionsData.settings.pointsCorrect + timeBonus;
      room.players[socketId].score += points;
      results[socketId] = { correct: true, points };
    } else {
      results[socketId] = { correct: false, points: 0 };
    }
  });

  // Send results to all players
  io.to(roomId).emit("questionResult", {
    correctAnswer: currentQuestion.correctAnswer,
    explanation: currentQuestion.explanation || null,
    results,
    scores: Object.fromEntries(
      Object.entries(room.players).map(([id, player]) => [
        id,
        { name: player.name, score: player.score },
      ])
    ),
  });

  // Move to next question after showing results
  setTimeout(() => {
    gameState.currentQuestionIndex++;
    startNextQuestion(roomId);
  }, 5000); // Show results for 5 seconds
}

// Function to end the game
function endGame(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  // Calculate final rankings
  const finalScores = Object.entries(room.players)
    .map(([socketId, player]) => ({
      name: player.name,
      score: player.score,
      socketId,
    }))
    .sort((a, b) => b.score - a.score);

  io.to(roomId).emit("gameEnded", {
    finalScores,
    winner: finalScores[0],
  });

  // Reset game state
  room.hasStarted = false;
  room.gameState = null;

  // Reset all player scores
  Object.keys(room.players).forEach((socketId) => {
    room.players[socketId].score = 0;
  });

  console.log(`🏁 Game ended in room ${roomId}`);
}

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
