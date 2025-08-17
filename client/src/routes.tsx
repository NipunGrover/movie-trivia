import { createRootRoute, createRoute } from "@tanstack/react-router";
import { Root } from "./Root";
import JoinRoomPage from "./pages/JoinRoomPage";
import GamePage from "./pages/GamePage";
import CreateRoomPage from "./pages/CreateRoomPage";
import WaitingRoomPage from "./pages/WaitingRoomPage";
import HomeRedirectPage from "./pages/HomeRedirectPage";

const homeRedirectRoute = createRoute({
  component: HomeRedirectPage,
  /**
   *
   */
  // eslint-disable-next-line no-use-before-define
  getParentRoute: () => rootRoute,
  path: "/"
});

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

const waitingRoomRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/waiting/$roomId",
  component: WaitingRoomPage
});

const gamePageRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/game",
  component: GamePage
});

const gameRoomRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/game/$roomId",
  component: GamePage
});

export const routeTree = rootRoute.addChildren([
  homeRedirectRoute,
  joinRoomPageRoute,
  joinRoomWithIdRoute,
  waitingRoomRoute,
  gamePageRoute,
  gameRoomRoute,
  createRoomRoute
]);

export { createRoomRoute };
