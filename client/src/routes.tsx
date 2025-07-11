import { createRootRoute, createRoute } from "@tanstack/react-router";
import { Root } from "./Root";
import JoinRoomPage from "./pages/JoinRoomPage";
import GamePage from "./pages/GamePage";

const rootRoute = createRootRoute({
  component: Root
});

const joinRoomPageRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/join",
  component: JoinRoomPage
});

const gamePageRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: GamePage
});

export const routeTree = rootRoute.addChildren([
  joinRoomPageRoute,
  gamePageRoute
]);
