import "@/index.css";
import { Lock, Sparkles, Gamepad2Icon } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/stores/usePlayerStore";

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

  const handleJoin = () => {
    setPlayerName(name);
    navigate({ to: "/waiting/$roomId", params: { roomId: roomCode } });
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
            onMouseEnter={() => setCardHovered(true)}
            onMouseLeave={() => setCardHovered(false)}>
            {/* Card background for hover effect, not covering button */}
            <div
              className={`pointer-events-none absolute inset-0 z-0 rounded-lg transition-all duration-300 ${cardHovered && !buttonHovered ? "bg-white/15" : ""}`}
            />
            <div className="relative z-10 flex w-full flex-col items-center gap-4 px-4 py-2">
              <CardTitle className="text-header-secondary flex h-full flex-col items-center gap-4">
                Enter Room Code <br /> Giggity Giggity:
                <Lock className="text-room-cyan h-8 w-8" />
              </CardTitle>
              <Input
                placeholder="Enter room code (e.g., ABC123)"
                value={roomCode}
                onChange={e => setRoomCode(e.target.value)}
                className="max-w-60 border-white/30 bg-white/20 py-4 text-center font-mono text-lg text-white placeholder:text-white/50"
                maxLength={6}
              />
              {/* Input for player name */}
              <Input
                placeholder="Enter your name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="max-w-60 border-white/30 bg-white/20 py-4 text-center font-mono text-lg text-white placeholder:text-white/50"
              />
              <Button
                onClick={handleJoin}
                onMouseEnter={() => setButtonHovered(true)}
                onMouseLeave={() => setButtonHovered(false)}
                className="btn">
                Join Room
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
