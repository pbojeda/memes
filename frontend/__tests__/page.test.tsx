import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("Home Page", () => {
  it("should render the page title", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "MemeStore"
    );
  });

  it("should render the description", () => {
    render(<Home />);

    expect(
      screen.getByText("Meme Products E-commerce Platform")
    ).toBeInTheDocument();
  });
});
