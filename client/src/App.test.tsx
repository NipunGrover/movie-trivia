import { fireEvent, render, waitFor } from "@testing-library/react";

import App from "./App";

describe("app", () => {
  test("renders the app", async () => {
    expect.assertions(3);

    const { container } = render(<App />);

    expect(container).toBeInTheDocument();

    const button = container.querySelector("button");

    expect(button).toBeInTheDocument();

    fireEvent.click(button!);
    await waitFor(() => {
      expect(button).toHaveTextContent("count is 1");
    });
  });
});
