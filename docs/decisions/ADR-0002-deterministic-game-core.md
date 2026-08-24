# ADR-0002: Deterministic Game Core

- **Status:** Accepted provisional architecture
- **Date:** 2026-08-23

## Context

The central mechanic depends on hidden Ground truth, seeded Drift, persistent consequences, bot participation, and evidence about balance. Debugging and validating those systems requires exact reproduction. UI frameworks, networks, databases, and wall clocks introduce nondeterminism and should not define game outcomes.

## Decision

Isolate game rules in a pure TypeScript core. Given canonical initial state, version, explicit logical time, seeded RNG state, and ordered commands, it emits the same ordered events and next state. The core has no dependency on rendering, network access, persistence, filesystem, ambient randomness, or wall-clock time. UI, API, persistence, and simulation interact through versioned commands, events, projections, and interfaces.

Bots use the same legal commands as human-controlled clients. Persistent meaningful actions are validated by an authoritative host; an early local host may run in process but keeps the same boundary.

## Importance

- **Replay:** reproduce a player session or defect and reconstruct state from a known input history.
- **Testing:** run unit, property, invariant, golden replay, and regression tests without a browser or server.
- **Simulation:** execute large seeded cohorts cheaply and compare strategies and tuning changes.
- **Balance analysis:** attribute outcome differences to rules or policies rather than incidental timing.
- **Server authority:** share one rules implementation while keeping hidden state and validation authoritative.

## Alternatives considered

- Rules embedded in React/UI code: faster for a throwaway interaction, but difficult to simulate, secure, and replay.
- Database-driven rules: convenient persistence, but couples outcomes to I/O and transaction details.
- Client-authoritative outcomes: simpler hosting, but exposes Ground truth and invites tampering.
- Recording random outcomes without seeded state discipline: partial replayability, but weak reproducibility and branching simulation.

## Consequences

Positive consequences include reproducible failures, headless execution, shared validation, safe simulation, clearer boundaries, and future event-based auditing. Costs include explicit state threading, canonical serialization, careful numeric/iteration rules, schema versioning, migration work, and discipline around logical time and side effects. Presentation animation may remain nondeterministic provided it cannot affect authoritative outcomes.

## Validation criteria

The same state, seed, logical inputs, and command stream must produce byte-equivalent canonical outputs across repeated supported-runtime runs. All MVP rules must execute without DOM, network, database, or wall clock. Bots and clients must share protocol commands; invalid commands must reject deterministically; an event log must reconstruct terminal state; and property/simulation tests must run headlessly. Failure to meet these criteria blocks persistent server work until the boundary is corrected or this record is explicitly superseded.
