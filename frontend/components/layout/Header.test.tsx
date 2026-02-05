import { render, screen, fireEvent } from "@testing-library/react";
import { Header } from "./Header";

// Mock next/link
jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

describe("Header", () => {
  it("should render the logo", () => {
    render(<Header />);
    expect(screen.getByText("MemeStore")).toBeInTheDocument();
  });

  it("should render navigation links on desktop", () => {
    render(<Header />);
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Products")).toBeInTheDocument();
    expect(screen.getByText("Cart")).toBeInTheDocument();
  });

  it("should have a mobile menu button", () => {
    render(<Header />);
    const menuButton = screen.getByRole("button", { name: /open menu/i });
    expect(menuButton).toBeInTheDocument();
  });

  it("should toggle mobile menu on button click", () => {
    render(<Header />);
    const menuButton = screen.getByRole("button", { name: /open menu/i });

    // Open menu
    fireEvent.click(menuButton);
    expect(screen.getByRole("button", { name: /close menu/i })).toBeInTheDocument();

    // Close menu
    fireEvent.click(menuButton);
    expect(screen.getByRole("button", { name: /open menu/i })).toBeInTheDocument();
  });

  it("should have correct href for logo", () => {
    render(<Header />);
    const logo = screen.getByText("MemeStore");
    expect(logo.closest("a")).toHaveAttribute("href", "/");
  });
});
