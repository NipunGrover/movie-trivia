import "@/index.css";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ErrorResponseSchema } from "@/lib/schemas";
import { joinRoom } from "@/lib/socket";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Gamepad2Icon, Lock, PlusCircle, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

/**
 *
 */
export default function JoinRoomPage() {
  const params = useParams({ strict: false });
  const setPlayerName = usePlayerStore(s => s.setPlayerName);

  /* Room States */

  // I am grabbing roomCode from the roomId from params if there is one
  const [roomCode, setRoomCode] = useState<string>(params.roomId || "");
  const [name, setName] = useState("");
  const navigate = useNavigate();

  /* Hover states */
  const [cardHovered, setCardHovered] = useState(false);
  const [buttonHovered, setButtonHovered] = useState(false);

  // Clean up any existing connections when component mounts
  useEffect(() => {
    // If user navigates back to join page, clean up any existing connections
    // This prevents issues with multiple connections
    return () => {
      // Only clean up on unmount, not on mount
    };
  }, []);

  /**
   * Handles joining a room with validation.
   */
  const handleJoin = async () => {
    // Client-side basic validation
    if (!validateInputFields()) return;
    try {
      // Server-side check if room exists
      const response = await fetch(
        `http://localhost:3000/validate-room/${roomCode}`
      );
      if (!response.ok) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const responseData = await response.json();
        const validatedError = ErrorResponseSchema.parse(responseData);
        toast.error(validatedError.message ?? "Room does not exist");
        return;
      }
      // Room exists, proceed to join
      setPlayerName(name);
      // Join the room via WebSocket before navigating
      try {
        await joinRoom(roomCode, name);
        // This is to persist roomId across refreshes
        localStorage.setItem("roomId", roomCode);
        navigate({ params: { roomId: roomCode }, to: "/waiting/$roomId" });
      } catch (socketError) {
        const errorMessage =
          socketError instanceof Error
            ? socketError.message
            : "Failed to join room";
        toast.error(errorMessage);
      }
    } catch (error) {
      // Handle both network errors and validation errors
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to validate room. Please try again.";
      toast.error(errorMessage);
    }
  };

  /**
   * Validates the input fields for room code and player name.
   */
  const validateInputFields = () => {
    if (roomCode.trim() === "") {
      toast.error("Room ID cannot be empty");
      return false;
    }
    if (name.trim() === "") {
      toast.error("Name cannot be empty");
      return false;
    }
    return true;
  };

  return (
    <div className="">
      {/* background */}
      <div className="from-room-purple to-room-cyan relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br via-purple-700 p-4 text-center">
        {/* upper + lower part */}
        <div className="xs:gap-y-20 lg:gap-y020 flex w-full flex-col items-center justify-center gap-y-6">
          {/* Upper part */}
          <div className="flex flex-col items-center justify-center text-center">
            {/* Title */}
            <div className="align-center flex gap-2">
              <Gamepad2Icon className="text-room-cyan h-8 w-8 -translate-y-1 duration-200 ease-in-out hover:scale-115" />
              <span className="text-header">Join Room</span>
              <Sparkles className="text-room-cyan h-8 w-8 -translate-y-1 duration-200 ease-in-out hover:scale-115" />
            </div>
            <span>
              Enter a room code and join the dungeons of Skibidi Rizzlers
            </span>
          </div>

          {/* Lower part */}
          {/* Blurred card  */}
          <Card
            className="animate-fade-in relative h-auto w-80 items-center border-white/20 bg-white/10 shadow-2xl backdrop-blur-md transition-all duration-300"
            onMouseEnter={() => {
              setCardHovered(true);
            }}
            onMouseLeave={() => {
              setCardHovered(false);
            }}>
            {/* Card background for hover effect, not covering button */}
            <div
              className={`pointer-events-none absolute inset-0 z-0 rounded-lg transition-all duration-300 ${cardHovered && !buttonHovered ? "bg-white/15" : ""}`}
            />
            <div
              className="relative z-10 flex w-full flex-col items-center gap-4 px-4 py-2"
              onKeyDown={e => {
                if (e.key === "Enter") {
                  void handleJoin();
                }
              }}>
              <CardTitle className="text-header-secondary flex h-full flex-col items-center gap-4">
                Enter Room Code <br /> Giggity Giggity:
                <Lock className="text-room-cyan h-8 w-8" />
              </CardTitle>
              <Input
                className="max-w-60 border-white/30 bg-white/20 py-4 text-center font-mono text-lg text-white placeholder:text-white/50"
                maxLength={6}
                onChange={e => {
                  setRoomCode(e.target.value);
                }}
                placeholder="Enter room code (e.g., ABC123)"
                value={roomCode}
              />
              {/* Input for player name */}
              <Input
                className="max-w-60 border-white/30 bg-white/20 py-4 text-center font-mono text-lg text-white placeholder:text-white/50"
                onChange={e => {
                  setName(e.target.value);
                }}
                placeholder="Enter your name"
                value={name}
              />
              <Button
                className="btn"
                onClick={() => {
                  void handleJoin();
                }}
                onMouseEnter={() => {
                  setButtonHovered(true);
                }}
                onMouseLeave={() => {
                  setButtonHovered(false);
                }}>
                Join Room
              </Button>
              <Button
                className="flex items-center gap-2 border-white/40 text-white hover:bg-white/20"
                onClick={() => {
                  void navigate({ to: "/create" });
                }}
                variant="outline">
                <PlusCircle className="h-4 w-4" /> Create a Room Instead
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
