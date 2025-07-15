import "@/index.css";
import { Lock, Sparkles, Gamepad2Icon } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useParams } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function JoinRoomPage() {
  const params = useParams({ strict: false });

  // I am grabbing roomCode from the roomId from params if there is one
  const [roomCode, setRoomCode] = useState<string>(params.roomId || "");
  const [cardHovered, setCardHovered] = useState(false);
  const [buttonHovered, setButtonHovered] = useState(false);

  return (
    <div className="">
      {/* background */}
      <div className="from-room-purple to-room-cyan relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br via-purple-700 p-4 text-center">
        {/* upper + lower part */}
        <div className="flex w-full flex-col items-center justify-center gap-y-12">
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
            className="animate-fade-in relative h-70 w-80 items-center border-white/20 bg-white/10 shadow-2xl backdrop-blur-md transition-all duration-300"
            onMouseEnter={() => setCardHovered(true)}
            onMouseLeave={() => setCardHovered(false)}>
            {/* Card background for hover effect, not covering button */}
            <div
              className={`pointer-events-none absolute inset-0 z-0 rounded-lg transition-all duration-300 ${cardHovered && !buttonHovered ? "bg-white/15" : ""}`}
            />
            <div className="relative z-10 flex w-full flex-col items-center gap-4 px-4 py-2">
              <CardTitle className="text-header-secondary flex flex-col items-center gap-4">
                Enter Room Code <br /> Giggity Giggity:
                <Lock className="text-room-cyan h-8 w-8" />
              </CardTitle>
              <Input
                placeholder="Enter room code (e.g., ABC123)"
                value={roomCode}
                onChange={e => setRoomCode(e.target.value)}
                className="letter-spacing max-w-60 border-white/30 bg-white/20 py-6 text-center font-mono text-lg text-white placeholder:text-white/50"
                maxLength={6}
              />
              <Button
                onClick={() => {}}
                onMouseEnter={() => setButtonHovered(true)}
                onMouseLeave={() => setButtonHovered(false)}
                className="hover: from-room-purple to-room-purple-light hover:from-room-purple-light hover:to-room-purple group w-full bg-gradient-to-r py-6 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl">
                Join Room
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
