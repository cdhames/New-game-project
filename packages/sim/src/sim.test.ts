import { describe, expect, it } from "vitest";
import {
  replayEvents,
  createInitialState,
  serializeCanonicalState,
  checksum,
} from "@long-map/game-core";
import { legalCommands, runExpedition, smokeStudy } from "./index.js";

describe("headless simulation", () => {
  it("uses protocol commands visible from player-safe projections", () => {
    expect(legalCommands).toBeTypeOf("function");
    expect(runExpedition("cautious", 9).replay.commands.every((c) => c.protocolVersion === 1)).toBe(
      true,
    );
  });
  it("replays a retained run", () => {
    const run = runExpedition("random", 17);
    const replayed = replayEvents(createInitialState(run.replay.seed), run.replay.events);
    expect(checksum(serializeCanonicalState(replayed))).toBe(run.replay.terminalChecksum);
  });
  it("is deterministic across repeated cohorts", () => {
    expect(smokeStudy(10)).toEqual(smokeStudy(10));
  });
});
