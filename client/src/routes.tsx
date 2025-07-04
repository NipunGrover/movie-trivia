import { createRootRoute, createRoute } from "@tanstack/react-router";
import { Root } from "./components/Root";
import JoinRoomPage from "./pages/JoinRoomPage";
import GamePage from "./pages/GamePage";

const rootRoute = createRootRoute({
  component: Root
});

const joinRoomPageRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: JoinRoomPage
});

const gamePageRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/game",
  component: GamePage
});

export const routeTree = rootRoute.addChildren([
  joinRoomPageRoute,
  gamePageRoute
]);
