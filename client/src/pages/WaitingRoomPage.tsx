import "@/index.css";
/* eslint-disable no-console */

import { Button } from "@/components/ui/button";
import { connect, getSocket, leaveRoom } from "@/lib/socket";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useNavigate, useParams } from "@tanstack/react-router";
import { LogOut, Users } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

const EMPTY_COUNT = 0;

// Dev storage helpers (wrapped in try/catch to avoid SSR or security errors)

/**
 * @param key
 */
function storageGet(key: string) {
  try {
    return typeof window !== "undefined"
      ? window.localStorage.getItem(key)
      : null;
  } catch {
    return null;
  }
}

/**
 * @param key
 */
function storageRemove(key: string) {
  try {
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    if (typeof window !== "undefined") window.localStorage.removeItem(key);
  } catch {
    () => {};
  }
}

/**
 * @param key
 * @param val
 */
function storageSet(key: string, val: string) {
  try {
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    if (typeof window !== "undefined") window.localStorage.setItem(key, val);
  } catch {}
}

// WaitingRoomPage – dev version with verbose logging & inline explanatory comments

/**
 *
 */
function WaitingRoomPage() {
  "use memo"; // React Compiler hint remains

  const setPlayers = usePlayerStore(s => s.setPlayers);
  const players = usePlayerStore(s => s.players);
  const playerName = usePlayerStore(s => s.playerName);
  const clearPlayerName = usePlayerStore(s => s.clearPlayerName);
  const { roomId } = useParams({ strict: false });
  const navigate = useNavigate();

  // User clicks Leave button (explicit leave – clear storage and player state)

  /**
   *
   */
  function handleLeaveRoom() {
    console.log("[WaitingRoom] Leave button clicked");
    if (window.confirm("Are you sure you want to leave the room?")) {
      console.log("[WaitingRoom] Confirmed leave");
      leaveRoom();
      clearPlayerName();
      storageRemove("roomId");
      toast.success("Left the room");
      void navigate({ to: "/create" });
    } else {
      console.log("[WaitingRoom] Leave cancelled");
    }
  }

  // Intercept browser back button so accidental navigation doesn’t silently drop user
  useEffect(() => {
    /**
     * @param event
     */
    function handlePopState(event: PopStateEvent) {
      console.log("[WaitingRoom] popstate (back) detected", event);
      event.preventDefault();
      const shouldLeave = window.confirm(
        "Are you sure you want to leave the room? You'll be disconnected from the game."
      );
      if (shouldLeave) {
        console.log("[WaitingRoom] Back confirm -> leaving room");
        leaveRoom();
        clearPlayerName();
        storageRemove("roomId");
        void navigate({ to: "/create" });
      } else {
        console.log("[WaitingRoom] Back cancelled – restoring state");
        window.history.pushState(null, "", window.location.href);
      }
    }

    console.log("[WaitingRoom] Installing popstate handler");
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    return () => {
      console.log("[WaitingRoom] Removing popstate handler");
      window.removeEventListener("popstate", handlePopState);
    };
  }, [navigate, clearPlayerName]);

  // (Reserved for future beforeunload handling if needed – intentionally empty now)
  useEffect(() => {
    console.log("[WaitingRoom] Mount placeholder effect (no beforeunload)");
  }, []);

  // Core lifecycle: validate presence of room + player, persist roomId, (re)join socket, subscribe to updates
  useEffect(() => {
    console.log("[WaitingRoom] Main effect run", { playerName, roomId });

    if (!roomId) {
      console.log("[WaitingRoom] Missing roomId -> redirect /create");
      void navigate({ to: "/create" });
      return;
    }
    if (!playerName) {
      console.log("[WaitingRoom] Missing playerName -> redirect join page");
      void navigate({ to: `/join/${roomId}` });
      return;
    }

    if (storageGet("roomId") !== roomId) {
      console.log("[WaitingRoom] Persisting roomId to localStorage", roomId);
      storageSet("roomId", roomId);
    } else {
      console.log("[WaitingRoom] roomId already persisted");
    }

    let socket = getSocket();
    if (!socket) {
      console.log(
        "[WaitingRoom] No existing socket – establishing new connection"
      );
      socket = connect();
    } else {
      console.log("[WaitingRoom] Using existing socket", socket.id);
    }

    // Transform server player map into ordered name list and update store

    /**
     * @param data
     * @param data.players
     */
    function handleRoomUpdate(data: {
      players: Record<string, { name: string; score: number }>;
    }) {
      console.log("[WaitingRoom] roomUpdate payload", data);
      const names = Object.values(data.players).map(p => p.name);
      console.log("[WaitingRoom] Player list", names);
      setPlayers(names);
    }

    socket.on("roomUpdate", handleRoomUpdate);
    console.log("[WaitingRoom] Emitting joinRoom", { playerName, roomId });
    socket.emit("joinRoom", { playerName, roomId });

    return () => {
      console.log("[WaitingRoom] Cleanup: removing roomUpdate listener");
      socket.off("roomUpdate", handleRoomUpdate);
    };
  }, [roomId, setPlayers, playerName, navigate]);

  return (
    <div className="animate-gradient-bg min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500 bg-[length:400%_400%]">
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 text-white">
        {/* Header */}
        <div className="flex w-full max-w-md items-center justify-between">
          <div className="text-center">
            <h1 className="text-header">Waiting Room</h1>
            <p className="text-sm text-white/80">Room ID: {roomId}</p>
          </div>
          <Button
            className="border-red-300 text-red-300 hover:bg-red-300 hover:text-red-900"
            onClick={handleLeaveRoom}
            variant="outline">
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

          {players.length > EMPTY_COUNT ? (
            <div className="space-y-2">
              {players.map((name, index) => (
                <div
                  className="rounded-lg bg-white/10 px-4 py-2 text-lg font-medium backdrop-blur-sm"
                  key={name}>
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

        {/* Status footer */}
        <div className="text-center text-white/70">
          <p>Waiting for the game to start...</p>
          <p className="text-sm">Share the room ID with friends to join!</p>
        </div>
      </div>
    </div>
  );
}

export default WaitingRoomPage;
