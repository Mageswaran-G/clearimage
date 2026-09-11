import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Logo } from "@/components/ui/logo";

describe("Logo", () => {
  it("renders the ClearImage wordmark as a link to the landing page", () => {
    render(<Logo />);

    const link = screen.getByRole("link", { name: "ClearImage" });
    expect(link).toHaveAttribute("href", "/");
  });
});
