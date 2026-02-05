import { render, screen } from "@testing-library/react";
import { Footer } from "./Footer";

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

describe("Footer", () => {
  it("should render copyright notice", () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();
    expect(
      screen.getByText(`© ${currentYear} MemeStore. All rights reserved.`)
    ).toBeInTheDocument();
  });

  it("should render footer links", () => {
    render(<Footer />);
    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
    expect(screen.getByText("Terms")).toBeInTheDocument();
  });

  it("should have correct hrefs for footer links", () => {
    render(<Footer />);
    expect(screen.getByText("About").closest("a")).toHaveAttribute(
      "href",
      "/about"
    );
    expect(screen.getByText("Contact").closest("a")).toHaveAttribute(
      "href",
      "/contact"
    );
    expect(screen.getByText("Terms").closest("a")).toHaveAttribute(
      "href",
      "/terms"
    );
  });
});
