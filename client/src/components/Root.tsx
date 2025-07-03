import { Outlet } from "@tanstack/react-router";

export const Root = () => {
  return (
    <div>
      {/* <Header/> */}
      <Outlet />
      {/* <Footer/> */}
    </div>
  );
};
