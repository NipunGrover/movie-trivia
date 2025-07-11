import App from "./App";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const Root = () => {
  const queryClient = new QueryClient();

  return (
    <div>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </div>
  );
};
