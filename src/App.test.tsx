import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import App from "./App";

describe("Startup Name Graveyard app", () => {
  test("starts on real startup graves with generated mode available as an option", async () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /Startup Name Graveyard/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Generate New Graveyard/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Real Startup Graveyard/i })).toHaveClass("active");
    expect(screen.getByRole("button", { name: /Enter Mystery Soundscape/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Dig a grave/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("searchbox", { name: /Search the graveyard/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Media graves/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /GitHub puneetdixit200/i })).toHaveAttribute(
      "href",
      "https://github.com/puneetdixit200"
    );

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /Open eulogy for/i }).length).toBeGreaterThan(5);
    });
    expect(screen.getByRole("button", { name: /Open eulogy for Quibi/i })).toBeInTheDocument();
    expect(screen.getByText(/Reality mode has enough casualties/i)).toBeInTheDocument();
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

  test("keeps real startup graves without search or custom burial controls", async () => {
    render(<App />);

    expect(await screen.findByRole("button", { name: /Open eulogy for Quibi/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Dig a grave/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("searchbox", { name: /Search the graveyard/i })).not.toBeInTheDocument();
  });

  test("refreshes real startup graves with a skeleton loading skin", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Generate New Graveyard/i }));

    expect(screen.getByRole("button", { name: /Real Startup Graveyard/i })).toHaveClass("active");
    expect(await screen.findByText(/Exhuming live company data/i)).toBeInTheDocument();
    expect(screen.getByRole("status", { name: /Loading real startup graves/i })).toBeInTheDocument();
    expect(screen.getAllByTestId("loading-grave")).toHaveLength(20);
    expect(screen.queryByText(/Maximum 20 graves exhumed per graveyard/i)).not.toBeInTheDocument();
  });

  test("toggles the mystery soundscape control", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Enter Mystery Soundscape/i }));

    expect(screen.getByRole("button", { name: /Mute Soundscape/i })).toHaveAttribute("aria-pressed", "true");
  });
});
