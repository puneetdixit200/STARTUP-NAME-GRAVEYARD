import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import App from "./App";

describe("Startup Name Graveyard app", () => {
  test("renders the graveyard controls and generated tombstones", async () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /Startup Name Graveyard/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Generate New Graveyard/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Real Startup Graveyard/i })).toBeInTheDocument();

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
});
