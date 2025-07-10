import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "http://localhost:5173" } });

app.get("/", (req, res) => {
  res.send(
    "Hello fine shyts, I am skibidi rizzler from Ohio!, im using expresss + socket.io"
  );
});

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);
  socket.emit("welcome", "Welcome! You’re connected fine shyt.");

  socket.on("disconnect", () => {
    console.log(
      `Client bounced, no cap. Server's just chillin' solo now.`,
      socket.id
    );
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(
    `SLURP SLURP THE HYPER TEXT PORTAL IS SCREECHING ON http://localhost:${PORT}`
  );
});
