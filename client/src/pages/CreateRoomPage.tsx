import "@/index.css";

import { Button } from "@/components/ui/button";
import { CreateRoomResponseSchema } from "@/lib/schemas";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { createRoomRoute } from "../routes";

/**
 *
 */
export default function CreateRoomPage() {
  // Quick fix: Don't persist room IDs from previous sessions
  const [roomId, setRoomId] = useState<null | string>(null);
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate({ from: createRoomRoute.id });
  const { playerName, setPlayerName } = usePlayerStore();

  /**
   *
   */
  const goToJoin = () => {
    if (roomId) {
      navigate({
        params: { roomId },
        to: "/join/$roomId"
      });
    }
  };

  /**
   * Creates a new room and validates the API response.
   */
  const createRoom = async () => {
    setIsCreating(true);
    try {
      // Cleanup inactive rooms first
      await fetch("http://localhost:3000/cleanup-rooms", {
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });

      const res = await fetch("http://localhost:3000/create-room", {
        body: JSON.stringify({ hostName: playerName }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const responseData = await res.json();

      // Validate the response using Zod
      const validatedResponse = CreateRoomResponseSchema.parse(responseData);
      const { roomId: newRoomId } = validatedResponse;
      // Means:
      //const newRoomId = validatedResponse.roomId;

      setRoomId(newRoomId);
      localStorage.setItem("roomId", newRoomId);

      // Store that this user is the host of this room
      localStorage.setItem(`host_${newRoomId}`, "true");

      goToJoin();
    } catch (error) {
      console.error("Failed to create room:", error);
      // You might want to show a toast notification or error message here
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Creates a new room instead of using the existing one.
   */
  const createNewRoom = async () => {
    // Clear any existing room ID before creating a new one
    localStorage.removeItem("roomId");
    setRoomId(null);
    await createRoom();
  };

  return (
    <div className="from-room-purple to-room-cyan relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br via-purple-700 p-4 text-center">
      {!roomId ? (
        <button
          className="group red-btn"
          disabled={isCreating}
          onClick={() => {
            void createRoom();
          }}
          type="button">
          <span className="relative z-10">
            {isCreating ? "Creating Room..." : "Create New Room"}
          </span>

          <span className="absolute inset-0 -translate-x-full skew-x-[-20deg] bg-white opacity-0 transition-transform duration-500 ease-out group-hover:translate-x-full group-hover:opacity-20" />

          <span className="absolute bottom-0 left-0 h-1 w-0 bg-white transition-all duration-300 ease-out group-hover:w-full" />
        </button>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <p className="text-lg text-white">
            Your room ID is{" "}
            <strong className="text-yellow-300">{roomId}</strong>
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button className="red-btn" onClick={goToJoin}>
              Go to Join Room
            </Button>
            <Button
              className="border-white text-white hover:bg-white hover:text-purple-700"
              disabled={isCreating}
              onClick={() => {
                void createNewRoom();
              }}
              variant="outline">
              {isCreating ? "Creating..." : "Create New Room Instead"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
