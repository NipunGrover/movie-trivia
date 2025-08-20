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

      // Validate if the room exists and the player is still in it
      Promise.all([
        fetch(`http://localhost:3000/validate-room/${roomId}`).then(
          res => res.json() as Promise<RoomValidationResponse>
        ),
        fetch(
          `http://localhost:3000/in-game/${roomId}/${encodeURIComponent(playerName)}`
        ).then(res => res.json() as Promise<PlayerInGameResponse>)
      ])
        .then(([roomValidation, playerInGame]) => {
          if (roomValidation.exists && playerInGame.inGame) {
            // Room exists and player is still in it - redirect to waiting room
            void navigate({ params: { roomId }, to: "/waiting/$roomId" });
          } else {
            // Room doesn't exist or player is not in it - clear stored data and go to join
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
