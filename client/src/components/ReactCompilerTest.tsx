import { useState } from "react";

// This component will be optimized by React Compiler

/**
 *
 */
const ReactCompilerTest = () => {
  "use memo"; // Explicit directive for React Compiler

  const [count, setCount] = useState(0);
  const [name, setName] = useState("React Compiler Test");

  // This expensive computation should be automatically memoized by React Compiler

  /**
   *
   */
  const expensiveComputation = () => {
    console.log("🧮 Expensive computation running...");
    let result = 0;
    for (let i = 0; i < 1000; i++) {
      result += i;
    }
    return result;
  };

  const result = expensiveComputation();

  return (
    <div
      style={{
        backgroundColor: "#f0f8f0",
        border: "2px solid green",
        borderRadius: "8px",
        margin: "1rem",
        padding: "1rem"
      }}>
      <h3>React Compiler Test Component</h3>
      <p>Component Name: {name}</p>
      <p>Count: {count}</p>
      <p>Expensive Result: {result}</p>

      <div style={{ marginTop: "1rem" }}>
        <button
          onClick={() => {
            setCount(c => c + 1);
          }}
          style={{ marginRight: "0.5rem", padding: "0.5rem" }}>
          Increment Count (should NOT recompute expensive)
        </button>

        <button
          onClick={() => {
            setName(n => `${n}!`);
          }}
          style={{ marginRight: "0.5rem", padding: "0.5rem" }}>
          Change Name (should NOT recompute expensive)
        </button>
      </div>

      <p style={{ color: "#666", fontSize: "0.8rem", marginTop: "1rem" }}>
        💡 If React Compiler is working: The expensive computation console log
        should only appear once on mount, not on every state change!
      </p>
    </div>
  );
};

export default ReactCompilerTest;
