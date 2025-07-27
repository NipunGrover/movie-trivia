import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PlayerState {
  playerName: string;
  setPlayerName: (name: string) => void;
  clearPlayerName: () => void;
  players: string[];
  setPlayers: (names: string[]) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    set => ({
      playerName: "",
      setPlayerName: (name: string) => set({ playerName: name }),
      clearPlayerName: () => set({ playerName: "" }),
      players: [],
      setPlayers: (names: string[]) => set({ players: names })
    }),
    {
      name: "movie-trivia-player", // localStorage key
      // Only persist playerName, not the players list (that should be fresh from server)
      partialize: state => ({ playerName: state.playerName })
    }
  )
);
