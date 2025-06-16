import "./App.css";

import { useState } from "react";

const VITE_LOGO = `/images/vite.svg`;
const REACT_LOGO = `/images/react.svg`;

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
