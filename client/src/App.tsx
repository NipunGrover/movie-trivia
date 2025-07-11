import { Outlet } from "@tanstack/react-router";

const App = () => {
  return (
    <div>
      {/* <Header/> */}
      <Outlet />
      {/* <Footer/> */}
    </div>
  );
};

export default App;
