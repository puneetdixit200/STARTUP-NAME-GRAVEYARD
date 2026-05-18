import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import App from "./App";

describe("Startup Name Graveyard app", () => {
  test("renders the graveyard controls and generated tombstones", async () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /Startup Name Graveyard/i })).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: /Search the graveyard/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Generate New Graveyard/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Real Startup Graveyard/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Enter Mystery Soundscape/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /GitHub puneetdixit200/i })).toHaveAttribute(
      "href",
      "https://github.com/puneetdixit200"
    );

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /Open eulogy for/i }).length).toBeGreaterThan(5);
    });
  });

  test("opens eulogy, resurrects a startup, and exposes share action", async () => {
    render(<App />);

    const firstGrave = await screen.findAllByRole("button", { name: /Open eulogy for/i });
    fireEvent.click(firstGrave[0]);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Resurrect/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Share Tombstone/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Resurrect/i }));
    expect((await screen.findAllByText(/Died again. This time as a DAO./i)).length).toBeGreaterThan(0);
  });

  test("lets a visitor bury a custom startup idea", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Dig a grave/i }));
    fireEvent.change(screen.getByLabelText(/^Startup name$/i), {
      target: { value: "PitchDeckOS" }
    });
    fireEvent.change(screen.getByLabelText(/^Fatal pitch$/i), {
      target: { value: "Investor-grade vibes for spreadsheet avoiders." }
    });
    fireEvent.click(screen.getByRole("button", { name: /Bury Startup/i }));

    expect(await screen.findByText("PitchDeckOS")).toBeInTheDocument();
  });

  test("searches and filters domain-specific graves", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Real Startup Graveyard/i }));
    fireEvent.change(screen.getByRole("searchbox", { name: /Search the graveyard/i }), {
      target: { value: "blood" }
    });

    expect(await screen.findByRole("button", { name: /Open eulogy for Theranos/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Open eulogy for Quibi/i })).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole("searchbox", { name: /Search the graveyard/i }), {
      target: { value: "" }
    });
    fireEvent.click(screen.getByRole("button", { name: /Media graves/i }));

    expect(await screen.findByRole("button", { name: /Open eulogy for Quibi/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Open eulogy for Vine/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Open eulogy for Theranos/i })).not.toBeInTheDocument();
  });

  test("toggles the mystery soundscape control", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Enter Mystery Soundscape/i }));

    expect(screen.getByRole("button", { name: /Mute Soundscape/i })).toHaveAttribute("aria-pressed", "true");
  });
});
