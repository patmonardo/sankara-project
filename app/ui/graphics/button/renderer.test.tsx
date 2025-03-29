import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ButtonRenderer } from "./renderer";
import { ButtonShape } from "../schema/button"; // Import the type
import { defineButton } from "../schema/button"; // Import the helper

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

describe("ButtonRenderer", () => {
  it("renders a link when href is provided", () => {
    // Use the helper function to ensure proper shape
    const shape = defineButton({
      variant: "primary",
      label: "Edit Item",
      href: "/edit/123",
      icon: "pencil",
    });

    render(<ButtonRenderer shape={shape} />);

    const link = screen.getByRole("link", { name: /Edit Item/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/edit/123");
  });

  it("renders a button when onClick is provided", () => {
    const handleClick = vi.fn();

    // Ensure proper typing of the onClick function
    const shape = defineButton({
      variant: "danger",
      label: "Delete",
      icon: "trash",
      onClick: handleClick,
    });

    render(<ButtonRenderer shape={shape} />);

    const button = screen.getByRole("button", { name: /Delete/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("shows confirmation dialog when confirmMessage is set", () => {
    const handleClick = vi.fn();
    const shape = defineButton({
      variant: "danger",
      label: "Delete",
      confirmMessage: "Are you sure?",
      onClick: handleClick,
    });

    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = vi.fn(() => false); // User clicks "Cancel"

    render(<ButtonRenderer shape={shape} />);
    const button = screen.getByRole("button", { name: /Delete/i });

    fireEvent.click(button);
    expect(window.confirm).toHaveBeenCalledWith("Are you sure?");
    expect(handleClick).not.toHaveBeenCalled(); // Click handler not called when canceled

    // Restore original
    window.confirm = originalConfirm;
  });

  it("applies the correct CSS classes based on variant", () => {
    const shape = defineButton({
      variant: "primary",
      label: "Submit",
    });

    render(<ButtonRenderer shape={shape} />);
    const button = screen.getByRole("button", { name: /Submit/i });

    // Check that it has the appropriate class for primary variant
    expect(button.className).toContain("rounded-md");
  });

  it("renders icon when provided", () => {
    const shape = defineButton({
      variant: "secondary",
      label: "Settings",
      icon: "cog",
    });

    render(<ButtonRenderer shape={shape} />);
    const button = screen.getByRole("button", { name: /Settings/i });

    // This is a simplified check - in reality you'd need to check for the specific icon element
    // The exact implementation depends on how icons are rendered in your ButtonRenderer

    const html = button.innerHTML;
    expect(html.includes("svg") || html.includes("icon")).toBe(true);
  });

  it("applies disabled state when specified", () => {
    const shape = defineButton({
      variant: "primary",
      label: "Submit",
      disabled: true,
    });

    render(<ButtonRenderer shape={shape} />);
    const button = screen.getByRole("button", { name: /Submit/i });

    expect(button).toBeDisabled();
  });
});
