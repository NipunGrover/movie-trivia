import "@/index.css";
import {
  Users,
  Gamepad2,
  Lock,
  Globe,
  ArrowRight,
  Sparkles
} from "lucide-react";

export default function JoinRoomPage() {
  return (
    <div className="">
      <Gamepad2 className="text-room-cyan h-8 w-8" />
      <div className="from-room-purple to-room-cyan relative min-h-screen place-items-center overflow-hidden bg-gradient-to-br via-purple-700 p-4 text-center">
        <span className="text-4xl font-bold">Join Room</span>
      </div>
    </div>
  );
}
