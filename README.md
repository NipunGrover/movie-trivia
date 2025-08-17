# Movie Trivia Game

A real-time movie trivia game built with React, Node.js, and Socket.IO.

## Project Structure

- `client/` - React frontend application
- `server/` - Node.js backend server
- `node-client/` - Test client for development

## Installation

Install all dependencies for the entire project:

```bash
npm install
```

This will install dependencies for the root project and all workspaces (client, server, node-client).

## Development

### Start both client and server in development mode:
```bash
npm run dev
```

### Start only the client:
```bash
npm run dev:client
```

### Start only the server:
```bash
npm run dev:server
```

## Build

Build the client for production:
```bash
npm run build
```

## Production

Start the server in production mode:
```bash
npm start
```

## Available Scripts

- `npm run dev` - Start both client and server in development mode
- `npm run dev:client` - Start only the client development server
- `npm run dev:server` - Start only the server in development mode
- `npm run build` - Build the client for production
- `npm start` - Start the server in production mode
- `npm run preview` - Preview the built client
- `npm run lint` - Run ESLint on the client code
- `npm test` - Run tests for the client
- `npm run clean` - Remove all node_modules directories

## Technologies Used

### Frontend (Client)
- React 19
- TypeScript
- Vite
- TailwindCSS
- Tanstack Router
- Socket.IO Client
- Zustand (State Management)

### Backend (Server)
- Node.js
- Express
- Socket.IO
- CORS

## Workspace Configuration

This project uses npm workspaces to manage dependencies across multiple packages. All dependencies are defined in the root `package.json`, and individual workspace packages only contain their specific scripts and configuration.
