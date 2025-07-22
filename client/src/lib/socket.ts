import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let roomId: string | null = null;

const connect = () => {
  if (!socket) {
    socket = io("http://localhost:3000");
  }
  return socket;
};

const joinRoom = (newRoomId: string, playerName: string) => {
  const currentSocket = connect();
  roomId = newRoomId;
  currentSocket.emit("joinRoom", { roomId: newRoomId, playerName });
  return currentSocket;
};

const getSocket = () => socket;

const getRoomId = () => roomId;

const disconnect = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    roomId = null;
  }
};

// Only disconnect when explicitly leaving the game/room
const leaveRoom = () => {
  disconnect();
};

export { connect, joinRoom, getSocket, getRoomId, disconnect, leaveRoom };
