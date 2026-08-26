import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";
import {
  createLocalAuthority,
  LEGACY_LOCAL_RECORD_KEY,
  LOCAL_RECORD_KEY,
  type LocalAuthority,
  type StoragePort,
} from "./authority";

class MemoryStorage implements StoragePort {
  readonly values = new Map<string, string>();
  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
  removeItem(key: string): void {
    this.values.delete(key);
  }
}

const authorityFor = (storage: MemoryStorage): LocalAuthority => {
  const result = createLocalAuthority(storage);
  if (!result.ok) throw new Error(result.message);
  return result.authority;
};

const startAndTravel = (authority: LocalAuthority): void => {
  authority.dispatch({
    kind: "start-expedition",
    instruments: ["sounding-line", "weather-glass"],
  });
  authority.dispatch({ kind: "travel", routeId: "r-hs" });
};

const finishLoop = (storage: MemoryStorage, observations = 0): void => {
  const authority = authorityFor(storage);
  startAndTravel(authority);
  for (let index = 0; index < observations; index += 1)
    authority.dispatch({ kind: "observe", subjectId: "r-hs", category: "route" });
  authority.dispatch({ kind: "travel", routeId: "r-hs" });
  authority.dispatch({ kind: "resolve-return" });
  authority.dispatch({ kind: "publish-reports", observationIds: [] });
};

describe("player-facing browser prototype", () => {
  it("renders the title, six Reports, three instruments, safe map, and legitimately known hidden route", () => {
    const storage = new MemoryStorage();
    render(<App storage={storage} />);
    expect(screen.getByRole("heading", { name: "The Long Map", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("A world no one can see alone")).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(6);
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
    expect(screen.getAllByText("Pale Inlet ↔ Far Sound").length).toBeGreaterThan(0);
    expect(document.body).not.toHaveTextContent("Last Cairn");
    expect(document.body).not.toHaveTextContent("r-ol");
  });

  it("requires exactly two selected instruments and starts by keyboard interaction", async () => {
    const user = userEvent.setup();
    render(<App storage={new MemoryStorage()} />);
    const start = screen.getByRole("button", { name: "Start Expedition" });
    expect(start).toBeEnabled();
    const line = screen.getByRole("checkbox", { name: /Sounding Line/ });
    await user.click(line);
    expect(start).toBeDisabled();
    expect(screen.getByText("Select exactly two instruments to depart.")).toBeInTheDocument();
    await user.click(line);
    start.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("heading", { name: "At Lantern Harbor" })).toBeInTheDocument();
  });

  it("generates Observation and salvage controls only from legal player-safe affordances", async () => {
    const user = userEvent.setup();
    render(<App storage={new MemoryStorage()} />);
    await user.click(screen.getByRole("button", { name: "Start Expedition" }));
    expect(screen.getAllByText("Available after the Expedition gets underway.")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /Salvage opportunity/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Travel toward Whisper Shoal" }));
    expect(screen.getAllByRole("button", { name: /Observe/ }).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "Salvage Provision Cache at Whisper Shoal" }),
    ).toBeInTheDocument();
  });

  it("plays a complete round trip while Observations consume Charges, not Provisions", async () => {
    const user = userEvent.setup();
    render(<App storage={new MemoryStorage()} />);
    await user.click(screen.getByRole("button", { name: "Start Expedition" }));
    await user.click(screen.getByRole("button", { name: "Travel toward Whisper Shoal" }));
    const observe = screen.getByRole("button", {
      name: "Observe Route at Lantern Harbor ↔ Whisper Shoal",
    });
    await user.click(observe);
    await user.click(observe);
    await user.click(screen.getByRole("button", { name: "Travel toward Lantern Harbor" }));
    expect(screen.getByLabelText("Expedition resources")).toHaveTextContent("6 / 8 Provisions");
    expect(screen.getByText(/Charges:/)).toHaveTextContent("Sounding Line 0/2");
    expect(screen.getByRole("button", { name: "Resolve safe return" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /failure/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Resolve safe return" }));
    expect(
      screen.getByRole("heading", { name: "Choose Reports for the Atlas" }),
    ).toBeInTheDocument();
  });

  it("enforces the three-Report publication limit across four legal Observations", async () => {
    const storage = new MemoryStorage();
    const authority = authorityFor(storage);
    startAndTravel(authority);
    authority.dispatch({ kind: "observe", subjectId: "r-hs", category: "route" });
    authority.dispatch({ kind: "observe", subjectId: "r-sn", category: "route" });
    authority.dispatch({ kind: "observe", subjectId: "r-hs", category: "hazard" });
    authority.dispatch({ kind: "observe", subjectId: "r-hs", category: "condition" });
    authority.dispatch({ kind: "travel", routeId: "r-hs" });
    authority.dispatch({ kind: "resolve-return" });
    const user = userEvent.setup();
    render(<App storage={storage} />);
    const publication = screen.getByRole("heading", {
      name: "Choose Reports for the Atlas",
    }).parentElement!;
    const boxes = within(publication).getAllByRole("checkbox");
    expect(boxes).toHaveLength(4);
    await user.click(boxes[0]!);
    await user.click(boxes[1]!);
    await user.click(boxes[2]!);
    expect(boxes[3]).toBeDisabled();
    await user.click(boxes[0]!);
    expect(boxes[3]).toBeEnabled();
    await user.click(boxes[3]!);
    await user.click(screen.getByRole("button", { name: "Publish selected Reports" }));
    expect(screen.getAllByRole("article")).toHaveLength(9);
    expect(screen.getAllByText(/Published to Atlas/)).toHaveLength(3);
  });

  it("reports actual salvage effects without revealing exact values before salvage", async () => {
    const storage = new MemoryStorage();
    const user = userEvent.setup();
    render(<App storage={storage} />);
    await user.click(screen.getByRole("button", { name: "Start Expedition" }));
    await user.click(screen.getByRole("button", { name: "Travel toward Whisper Shoal" }));
    expect(
      screen.getByRole("button", { name: "Salvage Provision Cache at Whisper Shoal" }),
    ).not.toHaveTextContent(/\b2\b/);
    await user.click(
      screen.getByRole("button", { name: "Salvage Provision Cache at Whisper Shoal" }),
    );
    await user.click(screen.getByRole("tab", { name: "Activity" }));
    expect(
      screen.getAllByText("Provision cache: spent 1 Provision, recovered 2, net +1."),
    ).toHaveLength(2);
  });

  it("keeps Publish nothing legal", async () => {
    const storage = new MemoryStorage();
    const authority = authorityFor(storage);
    startAndTravel(authority);
    authority.dispatch({ kind: "travel", routeId: "r-hs" });
    authority.dispatch({ kind: "resolve-return" });
    const user = userEvent.setup();
    render(<App storage={storage} />);
    await user.click(screen.getByRole("button", { name: "Publish nothing" }));
    expect(screen.getByRole("button", { name: "Start Expedition" })).toBeInTheDocument();
  });

  it("shows Drift-required state, blocks starting, and renders stale warnings after advance", async () => {
    const storage = new MemoryStorage();
    finishLoop(storage);
    finishLoop(storage);
    finishLoop(storage);
    const user = userEvent.setup();
    render(<App storage={storage} />);
    expect(screen.queryByRole("button", { name: "Start Expedition" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Advance Drift" }));
    expect(screen.getByRole("button", { name: "Start Expedition" })).toBeInTheDocument();
    expect(screen.getAllByText("⚠ Potentially stale after Drift").length).toBeGreaterThan(0);
  });

  it("survives simulated reload and reconstructs the same location", () => {
    const storage = new MemoryStorage();
    startAndTravel(authorityFor(storage));
    const first = render(<App storage={storage} />);
    expect(screen.getByRole("heading", { name: "At Whisper Shoal" })).toBeInTheDocument();
    first.unmount();
    render(<App storage={storage} />);
    expect(screen.getByRole("heading", { name: "At Whisper Shoal" })).toBeInTheDocument();
  });

  it("offers safe recovery for corrupt data and reset clears only the prototype record", async () => {
    const storage = new MemoryStorage();
    storage.setItem("unrelated", "preserve-me");
    storage.setItem(LOCAL_RECORD_KEY, "corrupt");
    const user = userEvent.setup();
    render(<App storage={storage} confirmReset={() => true} />);
    expect(
      screen.getByRole("heading", { name: "The saved voyage cannot be loaded safely" }),
    ).toBeInTheDocument();
    expect(storage.getItem(LOCAL_RECORD_KEY)).toBe("corrupt");
    await user.click(screen.getByRole("button", { name: "Reset local prototype" }));
    expect(screen.getByRole("button", { name: "Start Expedition" })).toBeInTheDocument();
    expect(storage.getItem("unrelated")).toBe("preserve-me");
  });

  it("leaves a legacy version-1 record untouched until confirmed reset", async () => {
    const storage = new MemoryStorage();
    storage.setItem(LEGACY_LOCAL_RECORD_KEY, JSON.stringify({ version: 1, seed: 1, commands: [] }));
    storage.setItem("unrelated", "preserve-me");
    const user = userEvent.setup();
    render(<App storage={storage} confirmReset={() => true} />);
    expect(screen.getByText(/deterministic resource rules changed/i)).toBeInTheDocument();
    expect(storage.getItem(LEGACY_LOCAL_RECORD_KEY)).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Reset local prototype" }));
    expect(storage.getItem(LEGACY_LOCAL_RECORD_KEY)).toBeNull();
    expect(storage.getItem("unrelated")).toBe("preserve-me");
  });

  it("normal reset immediately installs a fresh visible authority and view", async () => {
    const storage = new MemoryStorage();
    storage.setItem("unrelated", "preserve-me");
    const authority = authorityFor(storage);
    startAndTravel(authority);
    authority.dispatch({ kind: "observe", subjectId: "r-hs", category: "route" });
    const user = userEvent.setup();
    render(<App storage={storage} confirmReset={() => true} />);
    expect(screen.getByRole("heading", { name: "At Whisper Shoal" })).toBeInTheDocument();
    expect(screen.getByText("A new Observation was recorded in the Logbook.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset local prototype…" }));

    expect(screen.getByRole("heading", { name: "Prepare a local Expedition" })).toBeInTheDocument();
    expect(screen.getByText(/Current:/).parentElement).toHaveTextContent("Lantern Harbor");
    expect(screen.getAllByRole("article")).toHaveLength(6);
    expect(screen.getByText("No personal Observations yet.", { exact: false })).toBeInTheDocument();
    expect(
      screen.getByText("The first accepted command will begin this local history."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Visible Traces" })).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Sounding Line/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Weather Glass/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Field Lens/ })).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Start Expedition" })).toBeEnabled();
    await user.click(screen.getByText("About and developer details"));
    expect(screen.getByText(/Accepted local commands: 0/)).toBeInTheDocument();
    expect(storage.getItem(LOCAL_RECORD_KEY)).toBeNull();
    expect(storage.getItem("unrelated")).toBe("preserve-me");
  });

  it("canceling normal reset preserves the active game and stored history", async () => {
    const storage = new MemoryStorage();
    startAndTravel(authorityFor(storage));
    const storedBefore = storage.getItem(LOCAL_RECORD_KEY);
    const user = userEvent.setup();
    render(<App storage={storage} confirmReset={() => false} />);

    await user.click(screen.getByRole("button", { name: "Reset local prototype…" }));

    expect(screen.getByRole("heading", { name: "At Whisper Shoal" })).toBeInTheDocument();
    expect(storage.getItem(LOCAL_RECORD_KEY)).toBe(storedBefore);
  });

  it("gives every actionable control an accessible name and never renders raw snapshots", () => {
    const storage = new MemoryStorage();
    startAndTravel(authorityFor(storage));
    render(<App storage={storage} />);
    for (const control of screen.getAllByRole("button")) expect(control).toHaveAccessibleName();
    for (const control of screen.queryAllByRole("checkbox")) expect(control).toHaveAccessibleName();
    const rendered = document.body.textContent ?? "";
    expect(rendered).not.toContain("canonicalState");
    expect(rendered).not.toContain("subjectLastChangedRevision");
    expect(rendered).not.toContain("processedCommandIds");
    expect(rendered).not.toContain("r-ol");
  });

  it("keeps reduced-motion CSS informationally equivalent", () => {
    render(<App storage={new MemoryStorage()} />);
    expect(screen.getByLabelText("Map legend")).toHaveTextContent("Current location");
    expect(screen.getByLabelText("Map legend")).toHaveTextContent("Visited");
    expect(
      screen.getAllByText("No later known Drift warning", { exact: false }).length,
    ).toBeGreaterThan(0);
  });

  it("renders the deliberate shell regions and three accessible tabs with Atlas selected", () => {
    render(<App storage={new MemoryStorage()} />);
    expect(screen.getByTestId("status-bar")).toBeInTheDocument();
    expect(screen.getByTestId("map-workspace")).toBeInTheDocument();
    expect(screen.getByTestId("mission-action-panel")).toBeInTheDocument();
    expect(screen.getByTestId("secondary-tabs")).toBeInTheDocument();
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);
    expect(tabs.map((tab) => tab.textContent)).toEqual(["Atlas", "Logbook", "Activity"]);
    expect(screen.getByRole("tab", { name: "Atlas" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "Atlas" })).toBeVisible();
    expect(screen.queryByRole("tabpanel", { name: "Activity" })).not.toBeInTheDocument();
  });

  it("activates one secondary panel at a time and supports arrow-key tab movement", async () => {
    const user = userEvent.setup();
    render(<App storage={new MemoryStorage()} />);
    const atlas = screen.getByRole("tab", { name: "Atlas" });
    atlas.focus();
    await user.keyboard("{ArrowRight}");
    const logbook = screen.getByRole("tab", { name: "Logbook" });
    expect(logbook).toHaveFocus();
    expect(logbook).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "Logbook" })).toBeVisible();
    expect(screen.queryByRole("tabpanel", { name: "Atlas" })).not.toBeInTheDocument();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Activity" })).toHaveFocus();
    expect(screen.getByRole("tabpanel", { name: "Activity" })).toBeVisible();
    await user.keyboard("{ArrowLeft}");
    expect(logbook).toHaveFocus();
  });

  it("keeps all Expedition action categories visible and puts safe Travel controls in the action panel", async () => {
    const user = userEvent.setup();
    render(<App storage={new MemoryStorage()} />);
    await user.click(screen.getByRole("button", { name: "Start Expedition" }));
    const panel = screen.getByTestId("mission-action-panel");
    for (const heading of ["Travel", "Observe", "Salvage", "Return"])
      expect(within(panel).getByRole("heading", { name: heading })).toBeInTheDocument();
    expect(
      within(panel).getByRole("button", { name: "Travel toward Whisper Shoal" }),
    ).toBeEnabled();
    expect(within(panel).getAllByText(/Available after the Expedition gets underway/)).toHaveLength(
      2,
    );
    expect(within(panel).getByText(/Depart and return to Lantern Harbor/)).toBeInTheDocument();
    expect(
      screen.getByText(/Equivalent ordinary Travel controls are in the mission action panel/),
    ).toBeInTheDocument();
  });

  it("updates safe actions after travel without revealing hidden topology anywhere", async () => {
    const user = userEvent.setup();
    render(<App storage={new MemoryStorage()} />);
    await user.click(screen.getByRole("button", { name: "Start Expedition" }));
    await user.click(screen.getByRole("button", { name: "Travel toward Whisper Shoal" }));
    const panel = screen.getByTestId("mission-action-panel");
    expect(
      within(panel).getByRole("button", { name: "Travel toward Lantern Harbor" }),
    ).toBeInTheDocument();
    expect(within(panel).getAllByRole("button", { name: /Observe/ }).length).toBeGreaterThan(0);
    expect(
      within(panel).getByRole("button", { name: "Salvage Provision Cache at Whisper Shoal" }),
    ).toBeInTheDocument();
    expect(within(panel).getByRole("heading", { name: "Return" })).toBeInTheDocument();
    const rendered = document.body.textContent ?? "";
    expect(rendered).not.toContain("Last Cairn");
    expect(rendered).not.toContain("r-ol");
  });
});
