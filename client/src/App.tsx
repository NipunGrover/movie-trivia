import "./App.css";

import { useState } from "react";

const VITE_LOGO = `/images/vite.svg`;
const REACT_LOGO = `/images/react.svg`;

// TODO
// IN PACAKGE JSON, there is still postcss plugin which is supposed to be a dev
// dependency, but it is in the dependencies section. FIX it later

/**
 * The main application component.
 */
function App() {
  const INITIAL_COUNT = 0;
  const [count, setCount] = useState(INITIAL_COUNT);

  return (
    <main>
      <div className="flex justify-center">hello world</div>
    </main>
  );
}

export default App;
