import "@/index.css";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import { joinRoom } from "@/lib/socket";

const WaitingRoomPage = () => {
  // This is for all players in the room
  const setPlayers = usePlayerStore(s => s.setPlayers);
  const players = usePlayerStore(s => s.players);
  const params = useParams({ strict: false });
  const roomId = params.roomId;

  useEffect(() => {
    if (!roomId) return;

    const playerName = usePlayerStore.getState().playerName;
    const socket = joinRoom(roomId, playerName);

    socket.on(
      "roomUpdate",
      (data: { players: Record<string, { name: string; score: number }> }) => {
        const names = Object.values(data.players).map(p => p.name);
        setPlayers(names);
      }
    );

    // Don't disconnect when component unmounts - keep connection alive
    return () => {
      // Only remove the specific event listener to avoid memory leaks
      socket.off("roomUpdate");
    };
  }, [roomId, setPlayers]);

  return (
    <div className="animate-gradient-bg min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500 bg-[length:400%_400%]">
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-2xl font-bold text-white">
        {players.length > 0 ? (
          <ul className="space-y-2">
            {players.map(name => (
              <li key={name} className="underline">
                {name}
              </li>
            ))}
          </ul>
        ) : (
          <div>Waiting for players...</div>
        )}
      </div>
    </div>
  );
};

export default WaitingRoomPage;
