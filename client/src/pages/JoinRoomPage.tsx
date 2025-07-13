import "@/index.css";
import { Lock, Sparkles, Gamepad2Icon } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function JoinRoomPage() {
  const [roomCode, setRoomCode] = useState<string>("");

  return (
    <div className="">
      {/* background */}
      <div className="from-room-purple to-room-cyan relative min-h-screen place-items-center overflow-hidden bg-gradient-to-br via-purple-700 p-4 text-center">
        {/* upper + lower part */}
        <div className="flex min-h-screen flex-col items-center gap-y-12">
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
          <Card className="animate-fade-in h-60 w-80 items-center border-white/20 bg-white/10 shadow-2xl backdrop-blur-md transition-all duration-300 hover:bg-white/15">
            <CardTitle className="text-header-secondary flex flex-col items-center gap-4">
              Enter Room Code <br /> Giggity Giggity:
              <Lock className="text-room-cyan h-8 w-8" />
            </CardTitle>
            <Input
              placeholder="Enter room code (e.g., ABC123)"
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
              className="letter-spacing max-w-60 border-white/30 bg-white/20 py-6 text-center font-mono text-lg text-white placeholder:text-white/50"
              maxLength={6}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
