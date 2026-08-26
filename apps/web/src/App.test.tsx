import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PROTOCOL_VERSION } from "@long-map/protocol";
import { DEVELOPMENT_SCENARIO } from "@long-map/game-core";
import { App } from "./App";
import { EvidenceCategory } from "./components/MissionActionPanel";
import {
  createLocalAuthority,
  LEGACY_LOCAL_RECORD_KEY,
  LEGACY_LOCAL_RECORD_KEY_V2,
  LEGACY_LOCAL_RECORD_KEY_V3,
  LOCAL_RECORD_KEY,
  LOCAL_RECORD_VERSION,
  type LocalAuthority,
  type StoragePort,
} from "./authority";

class MemoryStorage implements StoragePort {
  readonly values = new Map<string, string>();
  failWrites = false;
  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    if (this.failWrites) throw new Error("simulated storage failure");
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

const storageForSeed = (seed: number): MemoryStorage => {
  const storage = new MemoryStorage();
  storage.setItem(
    LOCAL_RECORD_KEY,
    JSON.stringify({
      version: LOCAL_RECORD_VERSION,
      protocolVersion: PROTOCOL_VERSION,
      scenarioVersion: DEVELOPMENT_SCENARIO.version,
      seed,
      commands: [],
    }),
  );
  return storage;
};

const chooseCommission = async (user: ReturnType<typeof userEvent.setup>): Promise<void> => {
  await user.click(screen.getByRole("radio", { name: /Recover Salvage/i }));
};

const startAndTravel = (authority: LocalAuthority): void => {
  authority.dispatch({
    kind: "start-expedition",
    instruments: ["sounding-line", "weather-glass"],
    commissionId: "commission-salvage",
    preparation: {
      extraProvisions: 0,
      reinforcedVesselIntegrity: false,
      extraChargeInstruments: [],
    },
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
  it("offers unselected Commissions with rewards, preparation costs, and compatibility guidance", async () => {
    const user = userEvent.setup();
    render(<App storage={new MemoryStorage()} />);
    expect(screen.getAllByRole("radio")).toHaveLength(4);
    expect(screen.getAllByRole("radio").every((radio) => !radio.hasAttribute("checked"))).toBe(
      true,
    );
    expect(screen.getAllByText("Reward: 3 Findings")).toHaveLength(2);
    expect(screen.getByLabelText("Extra Provisions")).toHaveDisplayValue("0");
    expect(within(screen.getByLabelText("Extra Provisions")).getAllByRole("option")).toHaveLength(
      3,
    );
    expect(screen.getByText("4. Total cost: 0 Findings")).toBeInTheDocument();
    const startButton = screen.getByRole("button", { name: "Start Expedition" });
    expect(startButton).toBeDisabled();
    await user.click(screen.getByRole("radio", { name: /Verify Report/i }));
    await user.click(screen.getByRole("checkbox", { name: /^Weather GlassMeasures/ }));
    await user.click(screen.getByRole("checkbox", { name: /^Field LensAssesses/ }));
    expect(screen.getByRole("alert")).toHaveTextContent("requires the Weather Glass");
    expect(startButton).toBeDisabled();
  });

  it("shows a completed result, spends earned Findings, and starts an upgraded second Expedition", async () => {
    const storage = new MemoryStorage();
    const authority = authorityFor(storage);
    startAndTravel(authority);
    authority.dispatch({ kind: "salvage", opportunityId: "shoal" });
    authority.dispatch({ kind: "travel", routeId: "r-hs" });
    authority.dispatch({ kind: "resolve-return" });
    authority.dispatch({ kind: "publish-reports", observationIds: [] });
    const user = userEvent.setup();
    render(<App storage={storage} />);
    expect(screen.getByLabelText("Previous Expedition Summary")).toHaveTextContent("Success");
    expect(screen.getByLabelText("Previous Expedition Summary")).toHaveTextContent(
      "2 of 2 Commission Findings granted",
    );
    await chooseCommission(user);
    await user.selectOptions(screen.getByLabelText("Extra Provisions"), "1");
    expect(screen.getByText("4. Total cost: 1 Findings")).toBeInTheDocument();
    expect(screen.getByText("Findings remaining: 1")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Start Expedition" }));
    expect(screen.getByLabelText("Expedition resources")).toHaveTextContent("9 / 9 Provisions");
    expect(screen.getByLabelText("Active Commission")).toHaveTextContent("Progress: Active");
  });

  it("leaves v1, v2, and v3 histories untouched until targeted confirmation", async () => {
    const storage = new MemoryStorage();
    storage.setItem(LEGACY_LOCAL_RECORD_KEY, "v1");
    storage.setItem(LEGACY_LOCAL_RECORD_KEY_V2, "v2");
    storage.setItem(LEGACY_LOCAL_RECORD_KEY_V3, "v3");
    storage.setItem("unrelated", "keep");
    const user = userEvent.setup();
    render(<App storage={storage} confirmReset={() => true} />);
    expect(storage.getItem(LEGACY_LOCAL_RECORD_KEY)).toBe("v1");
    expect(storage.getItem(LEGACY_LOCAL_RECORD_KEY_V2)).toBe("v2");
    expect(storage.getItem(LEGACY_LOCAL_RECORD_KEY_V3)).toBe("v3");
    await user.click(screen.getByRole("button", { name: "Reset local prototype" }));
    expect(storage.getItem(LEGACY_LOCAL_RECORD_KEY)).toBeNull();
    expect(storage.getItem(LEGACY_LOCAL_RECORD_KEY_V2)).toBeNull();
    expect(storage.getItem(LEGACY_LOCAL_RECORD_KEY_V3)).toBeNull();
    expect(storage.getItem("unrelated")).toBe("keep");
  });
  it("renders the title, six Reports, three instruments, safe map, and legitimately known hidden route", () => {
    const storage = new MemoryStorage();
    render(<App storage={storage} />);
    expect(screen.getByRole("heading", { name: "The Long Map", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("A world no one can see alone")).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(6);
    expect(screen.getAllByRole("checkbox")).toHaveLength(6);
    expect(screen.getAllByText("Pale Inlet ↔ Far Sound").length).toBeGreaterThan(0);
    expect(document.body).not.toHaveTextContent("Last Cairn");
    expect(document.body).not.toHaveTextContent("r-ol");
  });

  it("requires exactly two selected instruments and starts by keyboard interaction", async () => {
    const user = userEvent.setup();
    render(<App storage={new MemoryStorage()} />);
    const start = screen.getByRole("button", { name: "Start Expedition" });
    expect(start).toBeDisabled();
    await chooseCommission(user);
    expect(start).toBeEnabled();
    const line = screen.getByRole("checkbox", { name: /^Sounding LineVerifies/ });
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
    await chooseCommission(user);
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
    await chooseCommission(user);
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
    expect(screen.getAllByRole("article")).toHaveLength(10);
    expect(screen.getAllByText(/Published to Atlas/)).toHaveLength(3);
  });

  it("reports actual salvage effects without revealing exact values before salvage", async () => {
    const storage = new MemoryStorage();
    const user = userEvent.setup();
    render(<App storage={storage} />);
    await chooseCommission(user);
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

  it("preserves publication choices after an unpersisted command and clears setup only after retry succeeds", async () => {
    const storage = new MemoryStorage();
    const authority = authorityFor(storage);
    startAndTravel(authority);
    authority.dispatch({ kind: "salvage", opportunityId: "shoal" });
    authority.dispatch({ kind: "travel", routeId: "r-hs" });
    authority.dispatch({ kind: "resolve-return" });
    authority.dispatch({ kind: "publish-reports", observationIds: [] });

    const user = userEvent.setup();
    render(<App storage={storage} />);
    await chooseCommission(user);
    await user.selectOptions(screen.getByLabelText("Extra Provisions"), "1");
    await user.click(screen.getByRole("button", { name: "Start Expedition" }));
    await user.click(screen.getByRole("button", { name: "Travel toward Whisper Shoal" }));
    await user.click(
      screen.getByRole("button", { name: "Observe Route at Lantern Harbor ↔ Whisper Shoal" }),
    );
    await user.click(screen.getByRole("button", { name: "Travel toward Lantern Harbor" }));
    await user.click(screen.getByRole("button", { name: "Resolve safe return" }));
    const report = screen.getByRole("checkbox");
    await user.click(report);
    storage.failWrites = true;
    await user.click(screen.getByRole("button", { name: "Publish selected Reports" }));
    expect(
      screen.getByRole("heading", { name: "Choose Reports for the Atlas" }),
    ).toBeInTheDocument();
    expect(report).toBeChecked();
    expect(
      screen.getByText(/not saved or applied because local storage is unavailable/i),
    ).toBeInTheDocument();

    storage.failWrites = false;
    await user.click(screen.getByRole("button", { name: "Publish selected Reports" }));
    expect(screen.getByRole("button", { name: "Start Expedition" })).toBeDisabled();
    expect(screen.getByLabelText("Extra Provisions")).toHaveValue("0");
    expect(screen.getAllByRole("radio").every((radio) => !radio.hasAttribute("checked"))).toBe(
      true,
    );
  });

  it("states that a returned non-publication Commission is complete and publication is optional", async () => {
    const storage = new MemoryStorage();
    const authority = authorityFor(storage);
    startAndTravel(authority);
    authority.dispatch({ kind: "salvage", opportunityId: "shoal" });
    authority.dispatch({ kind: "travel", routeId: "r-hs" });
    authority.dispatch({ kind: "resolve-return" });
    render(<App storage={storage} />);
    expect(screen.getByLabelText("Active Commission")).toHaveTextContent(
      "Safe return completed. Commission completed; reward granted. Publication optional.",
    );
    expect(screen.getByLabelText("Active Commission")).not.toHaveTextContent(
      "Safe return outstanding",
    );
    expect(screen.getByLabelText("Return Summary")).toHaveTextContent(
      "Lantern Harbor → Whisper Shoal",
    );
    expect(screen.getByLabelText("Return Summary")).toHaveTextContent(
      "7 Provisions · 4 Vessel Integrity",
    );
    expect(screen.getByLabelText("Return Summary")).toHaveTextContent("1 recovered");
  });

  it("marks every matching Verify Report observation without selecting it and explains pending publication", async () => {
    const user = userEvent.setup();
    render(<App storage={new MemoryStorage()} />);
    await user.click(screen.getByRole("radio", { name: /Verify Report/i }));
    await user.click(screen.getByRole("button", { name: "Start Expedition" }));
    await user.click(screen.getByRole("button", { name: "Travel toward Whisper Shoal" }));
    await user.click(
      screen.getByRole("button", { name: "Observe Hazard at Whisper Shoal ↔ North Mark" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Observe Route at Lantern Harbor ↔ Whisper Shoal" }),
    );
    await user.click(screen.getByRole("button", { name: "Travel toward Lantern Harbor" }));
    await user.click(screen.getByRole("button", { name: "Resolve safe return" }));
    expect(screen.getByLabelText("Active Commission")).toHaveTextContent(
      "Return complete. Matching Observation recorded. Publication required and pending.",
    );
    expect(screen.getAllByText("✓ Satisfies Verify Report Commission")).toHaveLength(1);
    expect(screen.getAllByRole("checkbox").every((box) => !(box as HTMLInputElement).checked)).toBe(
      true,
    );
    expect(screen.getByLabelText("Return Summary")).toHaveTextContent(
      "3 Verify Findings remain pending",
    );
    await user.click(
      within(screen.getByText("✓ Satisfies Verify Report Commission").closest("label")!).getByRole(
        "checkbox",
      ),
    );
    await user.click(screen.getByRole("button", { name: "Publish selected Reports" }));
    expect(screen.getByLabelText("Previous Expedition Summary")).toHaveTextContent(
      "3 of 3 Commission Findings granted",
    );
    expect(screen.getByLabelText("Previous Expedition Summary")).toHaveTextContent(
      "1 Reports published · +1 contribution",
    );
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
    expect(
      screen.getByText(/Route evidence and Expedition outcome rules changed/i),
    ).toBeInTheDocument();
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
    expect(screen.getByRole("checkbox", { name: /^Sounding LineVerifies/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /^Weather GlassMeasures/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /^Field LensAssesses/ })).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Start Expedition" })).toBeDisabled();
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
    await chooseCommission(user);
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
    await chooseCommission(user);
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

  it("shows keyboard-operable route cards with explicit Unknown evidence and projected consequences", async () => {
    const user = userEvent.setup();
    render(<App storage={new MemoryStorage()} />);
    await chooseCommission(user);
    await user.click(screen.getByRole("button", { name: "Start Expedition" }));
    const shoal = screen.getByRole("article", { name: "Route decision to Whisper Shoal" });
    expect(shoal).toHaveTextContent("Travel cost1 Provision");
    expect(shoal).toHaveTextContent("Projected Provisions7");
    expect(shoal).toHaveTextContent("Known Return Reserve1");
    expect(shoal).toHaveTextContent("Projected margin6");
    expect(shoal).toHaveTextContent("Route status: Reported");
    expect(shoal).toHaveTextContent("Hazard: Unknown");
    expect(shoal).toHaveTextContent("Condition: Unknown");
    expect(
      screen.getByText(/projected margins are before unknown travel damage/i),
    ).toBeInTheDocument();
    const details = within(shoal).getByText("1 historical claim");
    expect(details).toBeInTheDocument();
    const travel = within(shoal).getByRole("button", { name: "Travel toward Whisper Shoal" });
    travel.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("heading", { name: "At Whisper Shoal" })).toBeInTheDocument();
  });

  it("renders conflicting route evidence with a non-color warning and every historical claim", () => {
    render(
      <EvidenceCategory
        label="Hazard"
        evidence={{
          state: "conflicting-values",
          claims: [
            {
              reportId: "report-safe",
              category: "hazard",
              reportedValue: "calm",
              age: 0,
              quality: "high",
              sourceClass: "player",
              independentCorroboration: 1,
              potentiallyStale: false,
              observedRevision: 2,
            },
            {
              reportId: "report-danger",
              category: "hazard",
              reportedValue: "dangerous",
              age: 1,
              quality: "low",
              sourceClass: "player",
              independentCorroboration: 1,
              potentiallyStale: true,
              observedRevision: 1,
            },
          ],
        }}
      />,
    );
    expect(screen.getByText("Hazard: ⚠ Conflicting Reports")).toBeInTheDocument();
    expect(screen.getByText("2 historical claims")).toBeInTheDocument();
  });

  it("marks Commission-target routes and required Observation actions without hiding alternatives", async () => {
    const user = userEvent.setup();
    render(<App storage={new MemoryStorage()} />);
    await chooseCommission(user);
    await user.click(screen.getByRole("button", { name: "Start Expedition" }));
    const target = screen.getByRole("article", { name: "Route decision to Whisper Shoal" });
    expect(target).toHaveTextContent("Commission target · Advances current Commission");
    expect(
      screen.getByRole("article", { name: "Route decision to Glass Cay" }),
    ).toBeInTheDocument();
    await user.click(within(target).getByRole("button", { name: "Travel toward Whisper Shoal" }));
    expect(screen.getAllByRole("button", { name: /Observe/ }).length).toBeGreaterThan(0);
  });

  it("explains a safely returned incomplete objective without saying return is outstanding", async () => {
    const storage = new MemoryStorage();
    const authority = authorityFor(storage);
    startAndTravel(authority);
    authority.dispatch({ kind: "travel", routeId: "r-hs" });
    authority.dispatch({ kind: "resolve-return" });
    render(<App storage={storage} />);
    const commission = screen.getByLabelText("Active Commission");
    expect(commission).toHaveTextContent("Safe return completed. Commission objective incomplete");
    expect(commission).not.toHaveTextContent(/return (outstanding|still required)/i);
    expect(screen.getByLabelText("Return Summary")).toHaveTextContent("Objective incomplete");
  });

  it("cleans up after automatic travel failure and presents an authoritative Failure Summary", async () => {
    const user = userEvent.setup();
    render(<App storage={storageForSeed(1)} />);
    await chooseCommission(user);
    await user.click(screen.getByRole("button", { name: "Start Expedition" }));
    for (const destination of [
      "Whisper Shoal",
      "North Mark",
      "Deep Spur",
      "Needle Rock",
      "Far Sound",
      "Needle Rock",
      "Deep Spur",
    ])
      await user.click(screen.getByRole("button", { name: `Travel toward ${destination}` }));
    expect(screen.getByLabelText("Failure Summary")).toHaveTextContent(
      "Failure reason: Vessel Integrity",
    );
    expect(screen.getByRole("button", { name: "Start Expedition" })).toBeDisabled();
    expect(
      screen.getAllByRole("radio").every((radio) => !(radio as HTMLInputElement).checked),
    ).toBe(true);
  });

  it("cleans up after explicit stranded failure and requires a new Commission", async () => {
    const user = userEvent.setup();
    render(<App storage={new MemoryStorage()} />);
    await chooseCommission(user);
    await user.click(screen.getByRole("button", { name: "Start Expedition" }));
    for (const destination of [
      "Whisper Shoal",
      "North Mark",
      "Whisper Shoal",
      "North Mark",
      "Whisper Shoal",
      "North Mark",
      "Whisper Shoal",
      "North Mark",
    ])
      await user.click(screen.getByRole("button", { name: `Travel toward ${destination}` }));
    await user.click(screen.getByRole("button", { name: "Resolve stranded failure" }));
    expect(screen.getByLabelText("Failure Summary")).toHaveTextContent("Failure reason: Stranded");
    expect(screen.getByRole("button", { name: "Start Expedition" })).toBeDisabled();
  });
});
