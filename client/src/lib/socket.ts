import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let roomId: string | null = null;

const connect = () => {
  if (!socket) {
    socket = io("http://localhost:3000");
  }
  return socket;
};

const joinRoom = (newRoomId: string, playerName: string): Promise<Socket> => {
  const currentSocket = connect();
  roomId = newRoomId;
  currentSocket.emit("joinRoom", { roomId: newRoomId, playerName });

  // Listen for errors and return them to the caller
  return new Promise((resolve, reject) => {
    const onError = (error: string) => {
      currentSocket.off("error", onError);
      reject(new Error(error));
    };

    const onRoomUpdate = () => {
      currentSocket.off("error", onError);
      currentSocket.off("roomUpdate", onRoomUpdate);
      resolve(currentSocket);
    };

    currentSocket.on("error", onError);
    currentSocket.on("roomUpdate", onRoomUpdate);
  });
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
  if (socket && roomId) {
    // Emit leave room event to server
    socket.emit("leaveRoom", { roomId });
    console.log(`Left room: ${roomId}`);
  }
  disconnect();
};

export { connect, joinRoom, getSocket, getRoomId, disconnect, leaveRoom };
