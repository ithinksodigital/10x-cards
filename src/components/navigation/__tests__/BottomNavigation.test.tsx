import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BottomNavigation } from "../BottomNavigation";

describe("BottomNavigation", () => {
  it("renders navigation items", () => {
    render(<BottomNavigation isAuthenticated={true} />);

    expect(screen.getByLabelText("Strona główna")).toBeInTheDocument();
    expect(screen.getByLabelText("Generuj")).toBeInTheDocument();
    expect(screen.getByLabelText("Zestawy")).toBeInTheDocument();
    expect(screen.getByLabelText("Nauka")).toBeInTheDocument();
  });

  it("hides authenticated items when not authenticated", () => {
    render(<BottomNavigation isAuthenticated={false} />);

    expect(screen.getByLabelText("Strona główna")).toBeInTheDocument();
    expect(screen.getByLabelText("Generuj")).toBeInTheDocument();
    expect(screen.queryByLabelText("Zestawy")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Nauka")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Profil")).toBeInTheDocument();
  });

  it("highlights active navigation item", () => {
    render(<BottomNavigation isAuthenticated={true} currentPath="/generate" />);

    const generateButton = screen.getByLabelText("Generuj");
    expect(generateButton).toHaveClass("text-primary");
  });

  it("has proper navigation structure", () => {
    render(<BottomNavigation isAuthenticated={true} />);

    const nav = screen.getByRole("navigation");
    expect(nav).toHaveClass("bottom-nav", "fixed", "bottom-0", "md:hidden");
  });

  it("shows correct labels for mobile", () => {
    render(<BottomNavigation isAuthenticated={true} />);

    expect(screen.getByText("Strona główna")).toBeInTheDocument();
    expect(screen.getByText("Generuj")).toBeInTheDocument();
    expect(screen.getByText("Zestawy")).toBeInTheDocument();
    expect(screen.getByText("Nauka")).toBeInTheDocument();
  });
});
