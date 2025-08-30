import { usePlayerStore } from "@/stores/usePlayerStore";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

interface PlayerInGameResponse {
  inGame: boolean;
  reason?: string;
}

interface RoomValidationResponse {
  exists: boolean;
  message?: string;
}

interface CanRejoinResponse {
  canRejoin: boolean;
  isOriginalHost: boolean;
  currentlyInRoom: boolean;
  roomExists: boolean;
  hasStarted: boolean;
  reason?: string;
}

/**
 * Decides where to send the user when they hit the site root.
 * Rules:
 *  - If we have both a playerName and a roomId in localStorage:
 *    - Check if the room exists and the player is still in it
 *    - If yes, send to waiting room
 *    - If no, clear the stored roomId and send to /join
 *  - Else => send to /join.
 */
export default function HomeRedirectPage() {
  const playerName = usePlayerStore(s => s.playerName);
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    const roomId =
      typeof window !== "undefined"
        ? window.localStorage?.getItem("roomId")
        : null;

    if (roomId && playerName) {
      setIsValidating(true);

      // Check if the player can rejoin their previous room
      fetch(`http://localhost:3000/can-rejoin/${roomId}/${encodeURIComponent(playerName)}`)
        .then(res => res.json() as Promise<CanRejoinResponse>)
        .then((rejoinData) => {
          if (rejoinData.canRejoin && rejoinData.roomExists) {
            if (rejoinData.hasStarted) {
              // Game has already started - redirect to game page
              void navigate({ params: { roomId }, to: "/game/$roomId" });
            } else {
              // Game hasn't started - redirect to waiting room
              void navigate({ params: { roomId }, to: "/waiting/$roomId" });
            }
          } else {
            // Can't rejoin - clear stored data and go to join page
            if (typeof window !== "undefined") {
              window.localStorage?.removeItem("roomId");
            }
            void navigate({ to: "/join" });
          }
        })
        .catch((_error: unknown) => {
          // On error, clear stored data and go to join page
          if (typeof window !== "undefined") {
            window.localStorage?.removeItem("roomId");
          }
          void navigate({ to: "/join" });
        })
        .finally(() => {
          setIsValidating(false);
        });
    } else {
      void navigate({ to: "/join" });
    }
  }, [navigate, playerName]);

  // Show a loading state while validating
  if (isValidating) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600" />
          <p className="text-gray-600">Checking room status...</p>
        </div>
      </div>
    );
  }

  return null; // nothing to render while redirecting
}
