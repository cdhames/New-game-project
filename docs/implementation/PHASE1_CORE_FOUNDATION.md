# Phase 1 Core Foundation

## Status and proof

This branch establishes the first deterministic, headless implementation. It proves that a compact
versioned scenario can execute ordinary protocol commands, emit ordered replayable events, preserve
hidden Ground truth behind a player-safe projection, and run reproducible seeded bot cohorts.

It does not prove player comprehension, usability, accessibility, balance, persistent authority,
network security, scalability, or production readiness. Phase 1 is not declared complete.

## Package boundaries

- `packages/protocol` owns serializable identifiers, commands, events, rejections, Observation,
  Report, Trace, projection, and replay contracts. Zod validates protocol inputs at runtime.
- `packages/game-core` owns canonical mutable Ground truth initialized from the hidden scenario,
  injected xorshift32 RNG, command
  decisions, immutable-style evolution, replay, canonical serialization, checksums, and projections.
- `packages/sim` sees player-safe projections, enumerates ordinary commands, applies them through the
  same core boundary, retains replay data, and aggregates cohort metrics.

No package depends on React, browser or DOM APIs, a network, database, filesystem, environment
variables, wall-clock time, or ambient randomness for game outcomes.

## Command, event, RNG, and replay lifecycle

A command is schema-versioned and checked against the current phase, authorized knowledge, and
resources. A legal command advances explicit logical time, consumes only explicit RNG state when
needed, emits ordered fact events, and returns the next canonical state. Travel that reduces integrity
to zero emits `route-traversed` followed by `expedition-failed`. Rejections preserve the original state
and use a stable reason code. Events include a canonical post-event snapshot for this first replay
format; replay folds those snapshots. Consumers can identify domain outcomes from event kinds and
ordering, but snapshots remain intentionally broad and may be replaced by narrower versioned event
payloads later.

An Expedition records canonical traversal progress. Resolving a successful return requires at least
one departure traversal and a subsequent traversal back to the Waystation. An immediate return is
rejected without advancing logical time, command history, resolved-Expedition counters, Drift, or
rewards. Before that first traversal, Observation and salvage are likewise unavailable and rejected
without state change, preventing a player from consuming the resources required to depart. Once a
legitimate return is available it takes precedence over stranded failure, even at zero supply; the
return banks eligible findings and never creates a failure Trace. A returned Expedition is not a
complete loop until `publish-reports` succeeds; publishing an empty selection remains valid.

The RNG is xorshift32 with an unsigned 32-bit serializable state. Rules use integers, ordered arrays,
stable identifiers, locale-independent UTF-16 code-unit comparison, and recursive key-sorted JSON
serialization. Checksums use a stable FNV-1a summary for regression comparison, not cryptographic
security.

## Scenario and provisional tuning

Scenario `1.1.0` is an original compact archipelago with 12 nodes, 18 routes, one Waystation, two
hidden routes, route hazards and conditions, node opportunities, and six mixed-quality baseline
Reports with initial ages 6, 4, 3, 2, 1, and 0 logical steps. One hidden route is known through a
baseline route Report; the other remains unrevealed. Protocol 2 Expeditions choose two instruments,
begin with 8 Provisions, 4 Vessel Integrity, and 2 Charges for each selected instrument. Travel costs
1 Provision, Observation costs 1 matching Charge, and salvage costs 1 Provision before applying its
typed result. A Trace contains at most half of eligible lost unbanked Findings.

Return Reserve is a breadth-first shortest-path cost to Lantern Harbor over known route endpoints
only. It is null when no known path exists and does not inspect hazards, conditions, or unrevealed
routes. Provision margins map to comfortable (at least 2), caution (1), at-reserve (0), and
below-reserve (negative); the Waystation and unknown route cases are explicit.

Current route and node truth is a serializable part of canonical state. Travel, Observation, and
salvage resolve against that mutable copy rather than module-level scenario data. The player-safe
planning projection includes every legitimately known route as ID and endpoints, node IDs derived
from that known topology, current and visited locations, previous location, and structured current
action affordances. Affordances describe traversable routes, legal Observation pairs, salvageable
opportunities, return/failure eligibility, publication choices, Drift, and Expedition start. They are
derived from the same rule predicates used for command acceptance. Hidden values, hidden flags,
unrevealed topology, and future Drift remain absent; guessed unknown routes receive the same
non-oracular rejection as unavailable routes.

Every third resolved Expedition makes Drift due, and that requirement remains sticky until resolved.
Publication, including an empty selection, completes a returned Expedition before Drift; another
Expedition cannot start while Drift is due. An explicit Drift command uses seeded selection to choose
one or two unique routes, increments either condition or hazard with wraparound inside the integer
range 0–3, records each subject's change revision, and increments world revision. Historical
Observations and Reports remain immutable. The Atlas derives staleness from per-subject change
revisions without exposing changed values.

Corroboration is derived symmetrically from all current compatible Reports. It counts unique other
Expedition IDs at the same subject, category, value, and observed revision. Reports from sequential
logical times can corroborate the same unchanged revision; duplicate Reports from one Expedition and
claims from different values or revisions do not add evidence. Each Report retains its own timestamps
and age.

All names, rewards, costs, hazard thresholds, and instrument mappings are tuning parameters.

## Simulation policies

The smoke study runs 100 seeded Expeditions each for four simple infrastructure policies:

- cautious uses Return Reserve, Provision margin, Vessel Integrity, and known shortest paths back to the
  Waystation;
- aggressive prefers unvisited destinations with greater known graph distance, avoids immediate
  backtracking when possible, and accepts greater failure risk;
- random samples uniformly from currently legal commands using explicit seeded randomness;
- surveyor prioritizes new legal route, hazard, and condition Observations, preserves a return margin,
  uses Charges intentionally, and deliberately publishes eligible evidence.

Policies consume only the safe projection and issue commands validated by `PlayerCommandSchema`.
They are deterministic test heuristics, not models of human behavior. Output includes full-loop
completion, failure and timeout rates, rejected-command totals, decision steps, frontier depth, banked
Findings, terminal Provisions and Vessel Integrity, unbanked Findings, Charges consumed,
salvage-family outcomes, Return Reserve warnings, Observations, Reports, and checksum summaries. A command unexpectedly rejected from
an advertised affordance raises a structured invariant error with policy, seed, step, command, reason,
state checksum, and replay context. Reaching the step limit is explicitly classified as a timeout.
Contradictory return and failure affordances are rejected as a structured simulation invariant before
a policy can choose either command.
Every run retains seed, commands, events, RNG start, and terminal checksum. Retained command streams
are re-applied through `applyCommand`, while retained event streams are folded independently; both
must reconstruct the terminal checksum.

The study validates deterministic infrastructure only. It is not a balance conclusion.

## Validation

Run `pnpm validate` after `pnpm install --frozen-lockfile`. Standalone tests and simulation smoke runs
resolve workspace TypeScript sources through development-only configuration, so they do not depend on
stale or prebuilt package output; package production exports continue to target `dist`. Validation
performs formatting, lint, strict TypeScript checking, tests, builds, and the simulation smoke study.
CI repeats those checks on pushes
and pull requests using only GitHub-maintained checkout and Node setup actions. CI invokes the pinned
pnpm release through `npx`, avoiding a third-party package-manager setup action.

## Known limitations and deferred work

The scenario is a compact proof fixture. Events currently carry full post-event snapshots. The four
policies remain deliberately simple and smaller than the six-policy Phase 2 target. Trace recovery,
the Waystation contribution project,
multi-session identity/Logbook persistence, protocol migrations, a local authority host, and extensive
balance studies remain deferred. The browser-prototype task will add the first accessible player
interface while retaining these protocol and authority boundaries. No API or production service is
created here.
