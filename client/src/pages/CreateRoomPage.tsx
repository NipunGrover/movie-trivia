import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { createRoomRoute } from "../routes";
import "@/index.css";
import { Button } from "@/components/ui/button";

export default function CreateRoomPage() {
  const [roomId, setRoomId] = useState<string | null>(() =>
    localStorage.getItem("roomId")
  );
  const navigate = useNavigate({ from: createRoomRoute.id });

  const createRoom = async () => {
    const res = await fetch("http://localhost:3000/create-room", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    const { roomId: newRoomId } = await res.json();
    setRoomId(newRoomId);
    localStorage.setItem("roomId", newRoomId);
  };

  const goToJoin = () => {
    if (roomId) {
      navigate({
        to: "/join/$roomId",
        params: { roomId }
      });
    }
  };

  return (
    <div className="from-room-purple to-room-cyan relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br via-purple-700 p-4 text-center">
      {!roomId ? (
        <button onClick={createRoom} className="group red-btn">
          <span className="relative z-10">Create New Room</span>

          <span className="absolute inset-0 -translate-x-full skew-x-[-20deg] bg-white opacity-0 transition-transform duration-500 ease-out group-hover:translate-x-full group-hover:opacity-20"></span>

          <span className="absolute bottom-0 left-0 h-1 w-0 bg-white transition-all duration-300 ease-out group-hover:w-full"></span>
        </button>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <p>
            Your room ID is <strong>{roomId}</strong>
          </p>
          <Button className="red-btn" onClick={goToJoin}>
            Go to Join Room
          </Button>
        </div>
      )}
    </div>
  );
}
