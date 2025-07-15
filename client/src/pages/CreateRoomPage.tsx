import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { createRoomRoute } from "../routes";
import "@/index.css";
import { Button } from "@/components/ui/button";

export default function CreateRoomPage() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const navigate = useNavigate({ from: createRoomRoute.id });

  const createRoom = async () => {
    const res = await fetch("http://localhost:3000/create-room", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    const { roomId } = await res.json();
    setRoomId(roomId);
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
    <div>
      {!roomId ? (
        <Button className="cursor-pointer" onClick={createRoom}>
          Create New Room
        </Button>
      ) : (
        <>
          <p>
            Your room ID is <strong>{roomId}</strong>
          </p>
          <button onClick={goToJoin}>Invite a friend →</button>
        </>
      )}
    </div>
  );
}
