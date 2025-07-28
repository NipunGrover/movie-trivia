import "@/index.css";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useEffect } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { getSocket, leaveRoom, connect } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { LogOut, Users } from "lucide-react";
import { toast } from "sonner";

const WaitingRoomPage = () => {
  "use memo"; // Hint to React Compiler to optimize this component

  // This is for all players in the room
  const setPlayers = usePlayerStore(s => s.setPlayers);
  const players = usePlayerStore(s => s.players);
  const playerName = usePlayerStore(s => s.playerName);
  const clearPlayerName = usePlayerStore(s => s.clearPlayerName);
  const params = useParams({ strict: false });
  const navigate = useNavigate();
  const roomId = params.roomId;

  // Handle leaving the room
  /**
   *
   */
  const handleLeaveRoom = () => {
    if (window.confirm("Are you sure you want to leave the room?")) {
      console.log("✅ User confirmed leaving via leave button");
      leaveRoom();
      clearPlayerName(); // Clear persisted player name
      toast.success("Left the room");
      void navigate({ to: "/create" });
    }
  };

  // Handle browser back button
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      console.log("🔙 Back button pressed in waiting room");

      // Prevent the default navigation immediately
      event.preventDefault();

      const shouldLeave = window.confirm(
        "Are you sure you want to leave the room? You'll be disconnected from the game."
      );

      if (shouldLeave) {
        console.log("✅ User confirmed leaving via back button");
        leaveRoom();
        clearPlayerName(); // Clear persisted player name
        navigate({ to: "/create" });
      } else {
        console.log("❌ User cancelled leaving via back button");
        // Push the current state back to prevent navigation
        window.history.pushState(null, "", window.location.href);
      }
    };

    console.log("🎣 Setting up back button handler for waiting room");

    // Push an initial state to handle back button
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      console.log("🧹 Cleaning up back button handler for waiting room");
      window.removeEventListener("popstate", handlePopState);
    };
  }, [navigate]);

  // Handle browser refresh/close
  useEffect(() => {
    // Removed aggressive beforeunload handler that was calling leaveRoom()
    // Let the natural disconnect/reconnect flow handle page refreshes
    // Only clean up on explicit user actions (back button, leave button)
  }, []);

  useEffect(() => {
    if (!roomId) {
      console.log("No room ID, redirecting to create page");
      navigate({ to: "/create" });
      return;
    }

    if (!playerName) {
      console.log("No player name stored, redirecting to join page");
      navigate({ to: `/join/${roomId}` });
      return;
    }

    // Get the existing socket connection or create a new one
    let socket = getSocket();

    if (!socket) {
      console.log(
        "No existing socket, creating new connection for refresh/direct navigation"
      );
      socket = connect();
    }

    console.log("WaitingRoom: Setting up socket listeners");

    const handleRoomUpdate = (data: {
      players: Record<string, { name: string; score: number }>;
    }) => {
      console.log("Room update received:", data);
      const names = Object.values(data.players).map(p => p.name);
      console.log("Player names:", names);
      setPlayers(names);
    };

    // Listen for room updates
    socket.on("roomUpdate", handleRoomUpdate);

    // Auto-rejoin the room (handles page refresh/navigation)
    // This ensures the new socket connection is properly added to the room
    console.log("Auto-rejoining room with name:", playerName);
    socket.emit("joinRoom", { roomId, playerName });

    // Clean up the event listener when component unmounts
    return () => {
      socket.off("roomUpdate", handleRoomUpdate);
    };
  }, [roomId, setPlayers, playerName, navigate]);

  return (
    <div className="animate-gradient-bg min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500 bg-[length:400%_400%]">
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 text-white">
        {/* Header with room info and leave button */}
        <div className="flex w-full max-w-md items-center justify-between">
          <div className="text-center">
            <h1 className="text-header">Waiting Room</h1>
            <p className="text-sm text-white/80">Room ID: {roomId}</p>
          </div>
          <Button
            onClick={handleLeaveRoom}
            variant="outline"
            className="border-red-300 text-red-300 hover:bg-red-300 hover:text-red-900">
            <LogOut className="mr-2 h-4 w-4" />
            Leave
          </Button>
        </div>

        {/* Players list */}
        <div className="text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Users className="h-6 w-6" />
            <h2 className="text-xl font-semibold">
              Players ({players.length})
            </h2>
          </div>

          {players.length > 0 ? (
            <div className="space-y-2">
              {players.map((name, index) => (
                <div
                  key={name}
                  className="rounded-lg bg-white/10 px-4 py-2 text-lg font-medium backdrop-blur-sm">
                  {index + 1}. {name}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-white/10 px-6 py-4 text-lg backdrop-blur-sm">
              Waiting for players...
            </div>
          )}
        </div>

        {/* Status message */}
        <div className="text-center text-white/70">
          <p>Waiting for the game to start...</p>
          <p className="text-sm">Share the room ID with friends to join!</p>
        </div>
      </div>
    </div>
  );
};

export default WaitingRoomPage;
