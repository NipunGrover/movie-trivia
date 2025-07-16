import { createRootRoute, createRoute } from "@tanstack/react-router";
import { Root } from "./Root";
import JoinRoomPage from "./pages/JoinRoomPage";
import GamePage from "./pages/GamePage";
import CreateRoomPage from "./pages/CreateRoomPage";
const createRoomRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/create",
  component: CreateRoomPage
});

const rootRoute = createRootRoute({
  component: Root
});

const joinRoomPageRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/join",
  component: JoinRoomPage
});

const joinRoomWithIdRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/join/$roomId",
  component: JoinRoomPage
});

const gamePageRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: GamePage
});

const gameRoomRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/game/$roomId",
  component: GamePage
});

export const routeTree = rootRoute.addChildren([
  joinRoomPageRoute,
  joinRoomWithIdRoute,
  gamePageRoute,
  gameRoomRoute,
  createRoomRoute
]);

export { createRoomRoute };
