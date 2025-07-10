import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

socket.on("welcome", (msg) => {
  console.log("👋", msg);
  socket.disconnect();
});
