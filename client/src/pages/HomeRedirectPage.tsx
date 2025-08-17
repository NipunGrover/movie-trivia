import { usePlayerStore } from "@/stores/usePlayerStore";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

/**
 * Decides where to send the user when they hit the site root.
 * Rules:
 *  - If we have both a playerName and a roomId in localStorage => send to waiting room
 *  - Else => send to /join.
 */
export default function HomeRedirectPage() {
  const playerName = usePlayerStore(s => s.playerName);
  const navigate = useNavigate();

  useEffect(() => {
    const roomId = localStorage.getItem("roomId");
    if (roomId && playerName) {
      navigate({ params: { roomId }, to: "/waiting/$roomId" });
    } else {
      navigate({ to: "/join" });
    }
  }, [navigate, playerName]);

  return null; // nothing to render while redirecting
}
