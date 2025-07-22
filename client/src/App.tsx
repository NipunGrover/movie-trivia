import { Outlet } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";

const App = () => {
  return (
    <div>
      <Toaster />
      {/* <Header/> */}
      <Outlet />
      {/* <Footer/> */}
    </div>
  );
};

export default App;
